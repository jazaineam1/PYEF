#!/usr/bin/env python3
"""Generate deterministic offline CATE outputs for Causal Quest.

This script is intentionally NOT executed in the browser. It trains three real
EconML estimators on a synthetic banking scenario, scores 24 fixed profiles and
writes only the resulting exploration table used by React.

Pedagogical contract:
- prediction P(Y|X) is estimated separately from treatment effect;
- T-Learner, DRLearner and CausalForestDML may disagree;
- agreement between estimators is never presented as proof of identification.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import econml
from econml.dml import CausalForestDML
from econml.dr import DRLearner
from econml.metalearners import TLearner
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LogisticRegression

SEED = 20260914
N = 8000
OUT = Path(__file__).resolve().parents[1] / "src" / "data" / "econml-precomputed.json"
FEATURES = ["age_z", "arrears", "digital", "premium", "engagement"]


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


def training_data():
    rng = np.random.default_rng(SEED)
    age = np.clip(rng.normal(42, 13, N), 18, 78)
    age_z = (age - 42) / 13
    arrears = np.clip(rng.beta(2.2, 2.8, N), 0, 1)
    digital = rng.binomial(1, sigmoid(0.35 - 0.55 * age_z))
    premium = rng.binomial(1, sigmoid(-0.8 + 0.35 * age_z - 0.45 * arrears))
    engagement = np.clip(rng.normal(0.0, 1.0, N), -2.5, 2.5)
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


def target_profiles():
    # Fixed profiles: deterministic classroom evidence, no hidden production data.
    rows = [
        (29,.18,1,0, 1.00,"Digital"),(55,.25,0,1, .70,"Premium"),(36,.82,0,0,-.10,"Mora alta"),
        (48,.40,0,0, .15,"Tradicional"),(31,.30,1,0, .55,"Digital"),(24,.22,1,0, .80,"Joven"),
        (60,.20,0,1, 1.20,"Premium"),(39,.35,1,0, .20,"Digital"),(45,.88,0,0, .65,"Mora alta"),
        (52,.50,0,0, .50,"Tradicional"),(27,.45,1,0, .10,"Joven"),(63,.28,0,1,-.10,"Premium"),
        (34,.15,1,0, 1.35,"Digital"),(46,.58,0,0, .85,"Tradicional"),(23,.55,1,0,-.20,"Joven"),
        (58,.12,0,1, 1.60,"Premium"),(33,.42,1,0, .95,"Digital"),(50,.76,0,0, 1.10,"Mora alta"),
        (30,.60,1,0, .45,"Joven"),(43,.32,0,0, 1.40,"Tradicional"),(66,.18,0,1, .40,"Premium"),
        (37,.52,1,0,-.35,"Digital"),(41,.46,0,0, .30,"Tradicional"),(26,.36,1,0, 1.25,"Joven")
    ]
    X=[]; meta=[]
    for i,(age,arrears,digital,premium,engagement,segment) in enumerate(rows,1):
        X.append([(age-42)/13,arrears,digital,premium,engagement])
        meta.append({"id":f"C{i:02d}","name":f"Cliente {chr(64+i)}","segment":segment})
    return np.asarray(X,float), meta


def model_outputs(X, T, Y, Xt):
    score_model = RandomForestRegressor(
        n_estimators=350, min_samples_leaf=25, random_state=SEED, n_jobs=-1
    ).fit(X, Y)
    score = np.clip(score_model.predict(Xt), 0, 1)

    tlearner = TLearner(models=RandomForestRegressor(
        n_estimators=280, min_samples_leaf=22, random_state=SEED, n_jobs=-1
    ))
    tlearner.fit(Y, T, X=X)
    eff_t = np.asarray(tlearner.effect(Xt)).reshape(-1)

    dr = DRLearner(
        model_propensity=LogisticRegression(max_iter=1000, random_state=SEED),
        model_regression=RandomForestRegressor(
            n_estimators=260, min_samples_leaf=22, random_state=SEED + 1, n_jobs=-1
        ),
        model_final=RandomForestRegressor(
            n_estimators=260, min_samples_leaf=8, random_state=SEED + 2, n_jobs=-1
        ),
        cv=3,
        random_state=SEED,
    )
    dr.fit(Y, T, X=X)
    eff_dr = np.asarray(dr.effect(Xt)).reshape(-1)

    forest = CausalForestDML(
        model_y=RandomForestRegressor(
            n_estimators=220, min_samples_leaf=18, random_state=SEED + 3, n_jobs=-1
        ),
        model_t=LogisticRegression(max_iter=1000, random_state=SEED),
        discrete_treatment=True,
        n_estimators=320,
        min_samples_leaf=18,
        max_depth=12,
        random_state=SEED,
        n_jobs=-1,
    )
    forest.fit(Y, T, X=X)
    eff_forest = np.asarray(forest.effect(Xt)).reshape(-1)
    return score, eff_t, eff_dr, eff_forest


def main():
    X, T, Y = training_data()
    Xt, meta = target_profiles()
    score, t, dr, forest = model_outputs(X, T, Y, Xt)
    clients=[]
    for i,m in enumerate(meta):
        clients.append({
            **m,
            "score": round(float(score[i]), 6),
            "tlearner": round(float(t[i]), 6),
            "drlearner": round(float(dr[i]), 6),
            "forest": round(float(forest[i]), 6),
        })
    payload={
        "provenance":{
            "verified":True,
            "engine":"EconML",
            "econml_version":econml.__version__,
            "seed":SEED,
            "train_rows":N,
            "dataset":"synthetic-banking-causal-scenario",
            "features":FEATURES,
            "estimators":["TLearner(RandomForestRegressor)","DRLearner", "CausalForestDML"],
            "note":"Generated offline. Estimator agreement does not establish identification."
        },
        "clients":clients,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(f"Wrote {len(clients)} verified EconML profiles to {OUT}")


if __name__ == "__main__":
    main()
