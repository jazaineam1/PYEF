#!/usr/bin/env python3
"""CAMPUS V2 ONLY: fit actual EconML estimators on reproducible academic experiment."""
import hashlib,json
from pathlib import Path
import numpy as np
SEED=20261014
GROUPS=('arrears','digital','middle','traditional','wealth')
LABELS={'arrears':'Sin señal clara','digital':'Alta fatiga','middle':'Equilibrado','traditional':'Sueño insuficiente','wealth':'Sobreexigido'}
EFFECT={'arrears':-1.5,'digital':10.4,'middle':7.8,'traditional':3.1,'wealth':1.2}
def generator():
 r=np.arange(1,2001,dtype=np.int64); z=r%100
 s=np.select([z<28,z<58,z<76,z<86],['digital','middle','traditional','wealth'],default='arrears')
 T=((((r*43+11)%997)/997.)<.5).astype(int)
 study=5+((r*7)%10); tenure=280+((r*13)%151)
 sleep=4+((r*3)%5); fatigue=1+((r*5)%8); complexity=4+((r*7)%6)
 baseline=15+4*(tenure/100.)+.75*study+.45*sleep-.65*fatigue-.45*complexity+((r*17)%7)-3
 tau=np.array([EFFECT[g] for g in s])
 y0=np.floor(np.clip(baseline,0,50)*10+.5000001)/10
 y1=np.floor(np.clip(baseline+tau,0,50)*10+.5000001)/10
 Y=np.where(T==1,y1,y0)
 X=np.column_stack([tenure/100.,study,sleep,fatigue,complexity]+[(s==g).astype(float) for g in GROUPS]).astype(float)
 sha=hashlib.sha256(np.column_stack([r,X,T,Y]).astype('<f8').tobytes()).hexdigest()
 assert int(T.sum())==1004 and abs(np.mean(y1-y0)-5.7042)<.002
 assert abs(np.mean(Y[T==1])-np.mean(Y[T==0])-5.7443)<.002
 return X,T,Y,y1-y0,s,sha
def run():
 import econml,sklearn
 from sklearn.ensemble import RandomForestRegressor
 from sklearn.linear_model import LogisticRegression
 from sklearn.model_selection import train_test_split
 from econml.metalearners import TLearner
 from econml.dr import DRLearner
 from econml.dml import CausalForestDML
 X,T,Y,truth,segments,sha=generator()
 strata=np.array([str(s)+'-'+str(t) for s,t in zip(segments,T)])
 tr,te=train_test_split(np.arange(2000),test_size=.25,random_state=SEED,stratify=strata)
 def rf(seed,leaf=12):return RandomForestRegressor(n_estimators=80,max_depth=10,min_samples_leaf=leaf,random_state=seed,n_jobs=1)
 models={
 't_learner':TLearner(models=rf(SEED)),
 'dr_learner':DRLearner(model_propensity=LogisticRegression(max_iter=1200,random_state=SEED),model_regression=rf(SEED+1),model_final=rf(SEED+2,20),cv=3,random_state=SEED),
 'causal_forest':CausalForestDML(model_y=rf(SEED+3),model_t=LogisticRegression(max_iter=1200,random_state=SEED+4),discrete_treatment=True,cv=3,n_estimators=120,subforest_size=4,min_samples_leaf=12,max_depth=10,random_state=SEED,n_jobs=1)}
 preds={}
 for name,model in models.items():
  model.fit(Y[tr],T[tr],X=X[tr])
  pred=np.asarray(model.effect(X[te]),dtype=float).reshape(-1)
  assert pred.shape==(500,) and np.all(np.isfinite(pred)),name
  preds[name]=pred
  print('FITTED',name,round(float(pred.mean()),4),flush=True)
 rows=[]
 for s in GROUPS:
  mask=segments[te]==s
  rows.append({'segment':s,'name':LABELS[s],'n_holdout':int(mask.sum()),**{k:round(float(v[mask].mean()),3) for k,v in preds.items()}})
 metrics={k:{'cate_rmse_points':round(float(np.sqrt(np.mean((v-truth[te])**2))),4),'ate_error_points':round(float(abs(v.mean()-truth[te].mean())),4)} for k,v in preds.items()}
 best=min(metrics,key=lambda k:metrics[k]['cate_rmse_points'])
 out={'schema_version':1,'status':'verified','provenance':{
  'engine':'EconML','dataset':'campus-academic-experiment-v2','n':2000,'train_rows':1500,'holdout_rows':500,'seed':SEED,'data_sha256':sha,
  'econml_version':econml.__version__,'sklearn_version':sklearn.__version__,'numpy_version':np.__version__,
  'source':'causal-wargame/scripts/precompute_econml_v2.py',
  'generator_sql':'202610140001_v2_academic_causal_curriculum.sql',
  'methods':['TLearner','DRLearner','CausalForestDML'],'execution':'CPython GitHub Actions (no Pyodide)',
  'description':'Entrenamiento efectivo sobre datos academicos sinteticos de CAMPUS V2; sin datos personales.'},
  'segments':rows,'metrics':metrics,'best_holdout_rmse':best,
  'note':'El menor error del holdout sintetico no prueba identificacion causal externa.'}
 assert sum(x['n_holdout'] for x in rows)==500
 dest=Path(__file__).resolve().parents[1]/'src/v2/econml-v2-verified.json'
 dest.write_text(json.dumps(out,ensure_ascii=False,sort_keys=True,indent=2)+'\n',encoding='utf8')
 print('CAMPUS_V2_ECONML_VERIFIED',sha,best,flush=True)
if __name__=='__main__':run()
