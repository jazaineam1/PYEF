#!/usr/bin/env python3
"""Fit actual EconML on student-level synthetic data from the Copa's ZIP structural DGP.
The structural coefficients match simulation_parameters.toml; NumPy noise differs from
PostgreSQL Box-Muller draws. No attendees, tokens or historical FUTUROS data are used.
"""
from __future__ import annotations
import hashlib, json
from pathlib import Path
import numpy as np

SEED=20261015
N_STUDENTS=1200
N_EXAMS=15
COMPLEXITY=np.array([9,8.5,8,7.5,7,6,4.5,4,3.5,3,2.5,9,8.5,8,7.5],dtype=float)
ARCHETYPES=['over','balanced','risk','pragmatic']
PGA_BOUNDS=np.array([[3.8,4.8],[3.4,4.3],[2,3],[3,3.6]])
STUDY_BOUNDS=np.array([[8,14],[4,8],[2,5.5],[.5,3.5]])
SLEEP_BOUNDS=np.array([[2,5],[6.5,8.5],[4.5,7],[7,9.5]])
WELL_BOUNDS=np.array([[0,1.5],[1.5,3.5],[1.5,4],[3.5,6]])
BASE_STUDY=np.array([11.5,6,3.5,1.5])
BASE_SLEEP=np.array([3.5,7.5,6,8.5])
BASE_WELL=np.array([.6,2.5,2.5,4.8])

def make_data():
 rng=np.random.default_rng(SEED)
 profile=np.arange(N_STUDENTS)%4
 pga=rng.uniform(PGA_BOUNDS[profile,0],PGA_BOUNDS[profile,1])
 base_well=np.clip(BASE_WELL[profile]+rng.normal(0,.3,N_STUDENTS),
  WELL_BOUNDS[profile,0],WELL_BOUNDS[profile,1])
 T=rng.binomial(1,.5,N_STUDENTS)
 study_noise=rng.normal(0,.5,(N_STUDENTS,N_EXAMS))
 sleep_noise=rng.normal(0,.4,(N_STUDENTS,N_EXAMS))
 shared_noise=rng.normal(0,1,(N_STUDENTS,N_EXAMS))
 complexity=np.broadcast_to(COMPLEXITY,(N_STUDENTS,N_EXAMS))
 def world(B):
  b=np.full((N_STUDENTS,1),B,dtype=float)
  basew=base_well[:,None]
  study=np.clip(
    BASE_STUDY[profile,None]+.3*(complexity-5.5)-.7*(b-basew)+study_noise,
    STUDY_BOUNDS[profile,0,None],STUDY_BOUNDS[profile,1,None])
  sleep=np.clip(
    BASE_SLEEP[profile,None]-.25*(study-BASE_STUDY[profile,None])
    +.2*(b-basew)+sleep_noise,
    SLEEP_BOUNDS[profile,0,None],SLEEP_BOUNDS[profile,1,None])
  fatigue=np.clip(10+60/(1+np.exp(np.clip((sleep-4)*1.2,-40,40)))
    +2*np.maximum(0,study-3)+np.where((sleep<4)&(study>8),15,0)
    +1.5*np.maximum(0,complexity-5)-4.5*np.minimum(b,6)
    +2*shared_noise,0,100)
  penalty=.15*np.maximum(0,fatigue-20)+.12*np.maximum(0,fatigue-60)**1.25
  y=np.clip(30+10*(pga[:,None]-3.5)-1.8*(complexity-5.5)
     +2.6*(study-4)+.8*(sleep-7.5)+.5*np.minimum(b,6)
     -penalty+1.6*shared_noise,0,50)
  return np.round(y,1).mean(axis=1)
 y0,y1=world(0),world(4)
 truth=y1-y0
 Y=np.where(T==1,y1,y0)
 X=np.column_stack([pga,base_well]+[(profile==i).astype(float) for i in range(4)])
 digest=hashlib.sha256(np.column_stack([X,T,Y,truth]).astype('<f8').tobytes()).hexdigest()
 return X,T,Y,truth,profile,digest

def run():
 import econml,sklearn
 from econml.metalearners import TLearner
 from econml.dr import DRLearner
 from econml.dml import CausalForestDML
 from sklearn.ensemble import RandomForestRegressor
 from sklearn.linear_model import LogisticRegression
 from sklearn.model_selection import train_test_split
 X,T,Y,truth,profile,sha=make_data()
 tr,te=train_test_split(np.arange(N_STUDENTS),test_size=.25,random_state=SEED,
  stratify=np.array([str(p)+'_'+str(t) for p,t in zip(profile,T)]))
 def rf(seed,leaf=12):
  return RandomForestRegressor(n_estimators=65,max_depth=11,
    min_samples_leaf=leaf,random_state=seed,n_jobs=1)
 model_specs={
  't_learner':TLearner(models=rf(SEED)),
  'dr_learner':DRLearner(model_propensity=LogisticRegression(max_iter=1600),
   model_regression=rf(SEED+1),model_final=rf(SEED+2,20),cv=3,random_state=SEED),
  'causal_forest':CausalForestDML(model_y=rf(SEED+3),model_t=LogisticRegression(max_iter=1600),
   discrete_treatment=True,cv=3,n_estimators=120,subforest_size=4,
   min_samples_leaf=12,max_depth=11,random_state=SEED,n_jobs=1)}
 predictions={}
 for name,model in model_specs.items():
  model.fit(Y[tr],T[tr],X=X[tr])
  pred=np.asarray(model.effect(X[te]),dtype=float).reshape(-1)
  assert pred.shape==(len(te),) and np.all(np.isfinite(pred)),name
  predictions[name]=pred
  print('FIT',name,'holdout rmse',np.sqrt(np.mean((pred-truth[te])**2)),flush=True)
 segments=[]
 for idx,label in enumerate(ARCHETYPES):
  mask=profile[te]==idx
  segments.append({'segment':label,'n_holdout':int(mask.sum()),
   'true_cate_synthetic':round(float(truth[te][mask].mean()),3),
   **{k:round(float(v[mask].mean()),3) for k,v in predictions.items()}})
 metrics={name:{
   'cate_rmse_points':round(float(np.sqrt(np.mean((pred-truth[te])**2))),4),
   'ate_error_points':round(float(abs(pred.mean()-truth[te].mean())),4)
  } for name,pred in predictions.items()}
 out={'schema_version':1,'status':'verified','provenance':{
  'engine':'EconML','dgp':'zip_dgp_2026','structural_source':'chapter-causalidad-master/config/simulation_parameters.toml',
  'noise_note':'NumPy simulation uses same structural coefficients but is not bitwise equivalent to PostgreSQL deterministic Box-Muller.',
  'n_students':N_STUDENTS,'exams_per_student':N_EXAMS,'observations_for_model':N_STUDENTS,
  'train_students':len(tr),'holdout_students':len(te),'randomized_at':'student','seed':SEED,
  'data_sha256':sha,'econml_version':econml.__version__,
  'sklearn_version':sklearn.__version__,'numpy_version':np.__version__,
  'source':'causal-wargame/scripts/precompute_econml_dean.py',
  'execution':'CPython GitHub Actions — PRECOMPUTED BENCHMARK',
  'methods':['TLearner','DRLearner','CausalForestDML'],
  'study_design':'T=1 B=4h vs T=0 B=0h, shared noise across potential outcomes'},
  'segments':segments,'metrics':metrics,
  'note':'Resultados de simulación científica de referencia, NO estimaciones de participantes ni causalidad fuera del mundo sintético.'}
 dest=Path(__file__).resolve().parents[1]/'src/v2/econml-dean-verified.json'
 dest.write_text(json.dumps(out,ensure_ascii=False,indent=2,sort_keys=True)+'\n',encoding='utf8')
 print('DEAN_ECONML_VERIFIED',sha,flush=True)

if __name__=='__main__':run()
