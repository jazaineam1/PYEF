#!/usr/bin/env python3
"""Generate deterministic offline CATE outputs for Causal Quest.

Nothing is trained in the browser. This script trains real EconML estimators on
one synthetic banking scenario, scores 24 fixed classroom profiles and writes a
small JSON artifact consumed by React.

Pedagogical contract:
- prediction P(Y|X) is estimated separately from treatment effect;
- T-Learner, DRLearner and CausalForestDML may disagree;
- estimator agreement is never presented as proof of causal identification;
- no individual counterfactual ground truth is shipped to the browser.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import econml
import numpy as np
import sklearn
from econml.dml import CausalForestDML
from econml.dr import DRLearner
from econml.metalearners import TLearner
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LogisticRegression

DEFAULT_SEED = 20260914
DEFAULT_N = 8000
DEFAULT_OUT = Path(__file__).resolve().parents[1] / "src" / "data" / "econml-precomputed.json"
FEATURES = ["age_z", "arrears", "digital", "premium", "engagement"]


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


def training_data(seed: int, n: int):
    rng = np.random.default_rng(seed)
    age = np.clip(rng.normal(42, 13, n), 18, 78)
    age_z = (age - 42) / 13
    arrears = np.clip(rng.beta(2.2, 2.8, n), 0, 1)
    digital = rng.binomial(1, sigmoid(0.35 - 0.55 * age_z))
    premium = rng.binomial(1, sigmoid(-0.8 + 0.35 * age_z - 0.45 * arrears))
    engagement = np.clip(rng.normal(0.0, 1.0, n), -2.5, 2.5)
    X = np.column_stack([age_z, arrears, digital, premium, engagement])

    # Historical treatment is intentionally confounded by risk and profile.
    p_t = sigmoid(-0.4 + 1.8 * arrears - 0.55 * digital + 0.25 * engagement)
    T = rng.binomial(1, p_t)

    # Baseline conversion and heterogeneous incremental treatment effect.
    p0 = sigmoid(-0.55 - 1.25 * arrears + 0.45 * premium + 0.50 * engagement + 0.18 * digital)
    tau = (
        0.015
        + 0.145 * digital
        + 0.075 * (age < 35)
        + 0.055 * (engagement > 0.45)
        - 0.115 * (arrears > 0.72)
        - 0.030 * premium
    )
    tau = np.clip(tau, -0.08, 0.30)
    p1 = np.clip(p0 + tau, 0.01, 0.99)
    Y = rng.binomial(1, np.where(T == 1, p1, p0)).astype(float)
    return X, T, Y


def target_profiles(limit: int = 24):
    rows = [
        (29,.18,1,0, 1.00,"Digital"),(55,.25,0,1, .70,"Premium"),(36,.82,0,0,-.10,"Mora alta"),
        (48,.40,0,0, .15,"Tradicional"),(31,.30,1,0, .55,"Digital"),(24,.22,1,0, .80,"Joven"),
        (60,.20,0,1, 1.20,"Premium"),(39,.35,1,0, .20,"Digital"),(45,.88,0,0, .65,"Mora alta"),
        (52,.50,0,0, .50,"Tradicional"),(27,.45,1,0, .10,"Joven"),(63,.28,0,1,-.10,"Premium"),
        (34,.15,1,0, 1.35,"Digital"),(46,.58,0,0, .85,"Tradicional"),(23,.55,1,0,-.20,"Joven"),
        (58,.12,0,1, 1.60,"Premium"),(33,.42,1,0, .95,"Digital"),(50,.76,0,0, 1.10,"Mora alta"),
        (30,.60,1,0, .45,"Joven"),(43,.32,0,0, 1.40,"Tradicional"),(66,.18,0,1, .40,"Premium"),
        (37,.52,1,0,-.35,"Digital"),(41,.46,0,0, .30,"Tradicional"),(26,.36,1,0, 1.25,"Joven")
    ][:limit]
    X, meta = [], []
    for i, (age, arrears, digital, premium, engagement, segment) in enumerate(rows, 1):
        X.append([(age - 42) / 13, arrears, digital, premium, engagement])
        meta.append({"id": f"C{i:02d}", "name": f"Cliente {i:02d}", "segment": segment})
    return np.asarray(X, float), meta


def model_outputs(X, T, Y, Xt, seed: int):
    # Predictive score is intentionally a different target from CATE.
    score_model = RandomForestRegressor(
        n_estimators=350, min_samples_leaf=25, random_state=seed, n_jobs=-1
    ).fit(X, Y)
    score = np.clip(score_model.predict(Xt), 0, 1)

    tlearner = TLearner(models=RandomForestRegressor(
        n_estimators=280, min_samples_leaf=22, random_state=seed, n_jobs=-1
    ))
    tlearner.fit(Y, T, X=X)
    eff_t = np.asarray(tlearner.effect(Xt)).reshape(-1)

    dr = DRLearner(
        model_propensity=LogisticRegression(max_iter=1000, random_state=seed),
        model_regression=RandomForestRegressor(
            n_estimators=260, min_samples_leaf=22, random_state=seed + 1, n_jobs=-1
        ),
        model_final=RandomForestRegressor(
            n_estimators=260, min_samples_leaf=8, random_state=seed + 2, n_jobs=-1
        ),
        cv=3,
        random_state=seed,
    )
    dr.fit(Y, T, X=X)
    eff_dr = np.asarray(dr.effect(Xt)).reshape(-1)

    forest = CausalForestDML(
        model_y=RandomForestRegressor(
            n_estimators=220, min_samples_leaf=18, random_state=seed + 3, n_jobs=-1
        ),
        model_t=LogisticRegression(max_iter=1000, random_state=seed),
        discrete_treatment=True,
        n_estimators=320,
        min_samples_leaf=18,
        max_depth=12,
        random_state=seed,
        n_jobs=-1,
    )
    forest.fit(Y, T, X=X)
    eff_forest = np.asarray(forest.effect(Xt)).reshape(-1)
    return score, eff_t, eff_dr, eff_forest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--clients", type=int, default=24)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--train-rows", type=int, default=DEFAULT_N)
    args = parser.parse_args()
    if not 1 <= args.clients <= 24:
        raise SystemExit("--clients must be between 1 and 24")

    X, T, Y = training_data(args.seed, args.train_rows)
    Xt, meta = target_profiles(args.clients)
    score, t, dr, forest = model_outputs(X, T, Y, Xt, args.seed)

    clients = []
    for i, m in enumerate(meta):
        clients.append({
            **m,
            "score": round(float(score[i]), 6),
            "tlearner": round(float(t[i]), 6),
            "drlearner": round(float(dr[i]), 6),
            "forest": round(float(forest[i]), 6),
        })

    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    methods = [
        {"key": "tlearner", "label": "T-Learner", "source": "econml", "estimator": "TLearner(RandomForestRegressor)"},
        {"key": "drlearner", "label": "DR-Learner", "source": "econml", "estimator": "DRLearner"},
        {"key": "forest", "label": "CausalForestDML", "source": "econml", "estimator": "CausalForestDML"},
    ]
    payload = {
        "schema_version": 2,
        "artifact_status": "verified",
        "generated_at": generated_at,
        "seed": args.seed,
        "methods": methods,
        "provenance": {
            "verified": True,
            "engine": "EconML",
            "econml_version": econml.__version__,
            "sklearn_version": sklearn.__version__,
            "seed": args.seed,
            "train_rows": args.train_rows,
            "profile_rows": len(clients),
            "dataset": "synthetic-banking-causal-scenario",
            "features": FEATURES,
            "estimators": [m["estimator"] for m in methods],
            "browser_runtime": "static-precomputed",
            "deterministic": True,
            "contains_hidden_counterfactual_truth": False,
            "note": "Generado offline. La concordancia entre estimadores no establece identificación causal."
        },
        "clients": clients,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(clients)} verified EconML profiles to {args.output}")


if __name__ == "__main__":
    main()
