// CAMPUS V2 ONLY. Optional real Python demonstrations; never required for game progression.
export const WORKSHOP_PYTHON={
  "2": {
    "title": "Un predictor excelente no es un efecto causal",
    "idea": "Ejecuta Python con datos sintéticos: Y es muy predecible aunque el apoyo tenga efecto cero.",
    "code": "import numpy as np\nfrom sklearn.ensemble import RandomForestRegressor\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.metrics import mean_absolute_error,r2_score\nrng=np.random.default_rng(20261014)\nn=900\ngpa=rng.uniform(2.1,4.8,n)\nhoras=rng.normal(9,2,n)\napoyo=rng.binomial(1,.5,n)\nnota=4+7*gpa+.65*horas+rng.normal(0,.8,n)\nX=np.column_stack([gpa,horas])\na,b=train_test_split(np.arange(n),test_size=.3,random_state=17)\nmodel=RandomForestRegressor(n_estimators=35,min_samples_leaf=5,random_state=17,n_jobs=1)\nmodel.fit(X[a],nota[a])\npred=model.predict(X[b])\nprint(\"MAE:\",round(mean_absolute_error(nota[b],pred),2),\"puntos\")\nprint(\"R²:\",round(r2_score(nota[b],pred),3))\nprint(\"Efecto VERDADERO del apoyo sintético:\",0,\"puntos\")\nprint(\"WOW: predecir casi perfecto no prueba una ganancia por intervenir.\")"
  },
  "3": {
    "title": "Controlar todo también puede sesgar",
    "idea": "Dos experimentos sintéticos separados muestran mediación y collider con resultados calculados.",
    "code": "import numpy as np\nrng=np.random.default_rng(143)\nn=3000\nt=rng.binomial(1,.5,n)\nu=rng.normal(size=n)\nm=.9*t+.6*u+rng.normal(size=n)\ny=4.8*t+2*m+u+rng.normal(size=n)\ndef coef(y,*xs): return np.linalg.lstsq(np.column_stack([np.ones(n),*xs]),y,rcond=None)[0][1]\nprint(\"Efecto total verdadero:\",round(4.8+2*.9,2))\nprint(\"Sin ajustar mediador:\",round(coef(y,t),2))\nprint(\"Ajustando mediador (NO es efecto total):\",round(coef(y,t,m),2))\nc=.85*t+.8*u+rng.normal(size=n)\ny2=4.8*t+2*u+rng.normal(size=n)\nprint(\"Segunda simulación: efecto verdadero\",4.8)\nprint(\"Sin condicionar collider:\",round(coef(y2,t),2))\nprint(\"Condicionando collider:\",round(coef(y2,t,c),2))"
  },
  "4": {
    "title": "A/B, DML y CATE — cálculo real",
    "idea": "Compara un experimento aleatorio y un DML observacional sintético con tres particiones.",
    "code": "import numpy as np\nfrom sklearn.model_selection import KFold\nfrom sklearn.ensemble import RandomForestClassifier,RandomForestRegressor\nrng=np.random.default_rng(20261014)\nn=900\nx=rng.normal(size=n)\ntau=4.8+1.2*(x>0)\nt_ab=rng.binomial(1,.5,n)\ny0=26+3*x+rng.normal(0,2,n)\ny_ab=y0+tau*t_ab\nv1=y_ab[t_ab==1]\nv0=y_ab[t_ab==0]\nate=v1.mean()-v0.mean()\nse=np.sqrt(v1.var(ddof=1)/len(v1)+v0.var(ddof=1)/len(v0))\nprint(\"A/B, diferencia observada:\",round(ate,2))\nprint(\"IC 95% aproximado:\",round(ate-1.96*se,2),round(ate+1.96*se,2))\nprint(\"ATE verdadero sintético:\",round(tau.mean(),2))\np=1/(1+np.exp(-(.2+.8*x)))\nt=(rng.random(n)<p).astype(int)\ny=26+3*x+tau*t+rng.normal(0,2,n)\nrt=np.empty(n)\nry=np.empty(n)\nfor a,b in KFold(n_splits=3,shuffle=True,random_state=42).split(x):\n    mt=RandomForestClassifier(n_estimators=30,min_samples_leaf=10,random_state=15,n_jobs=1)\n    my=RandomForestRegressor(n_estimators=30,min_samples_leaf=10,random_state=16,n_jobs=1)\n    mt.fit(x[a,None],t[a]);my.fit(x[a,None],y[a])\n    rt[b]=t[b]-mt.predict_proba(x[b,None])[:,1]\n    ry[b]=y[b]-my.predict(x[b,None])\ndml=(rt*ry).sum()/(rt*rt).sum()\nprint(\"DML con cross-fitting:\",round(dml,2))\nprint(\"CATE verdadero por perfil:\",round(tau[x<=0].mean(),2),\"/\",round(tau[x>0].mean(),2))\nprint(\"Requiere ignorabilidad, soporte común y diseño válido.\")"
  }
}
