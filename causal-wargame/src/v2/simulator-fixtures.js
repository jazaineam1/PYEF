export const SIM_PLAYERS=[
  {id:'ana',name:'Ana'},
  {id:'luis',name:'Luis'},
  {id:'camila',name:'Camila'},
  {id:'juan',name:'Juan'}
]

export const SIM_ECONOMY={capacity:1500}

const archetypes=['Sobreexigido','Equilibrado','Sueño insuficiente','Alta fatiga']

export const SIM_CUSTOMERS=Array.from({length:24},(_,i)=>{
  const n=i+1
  return{
    id:`E${String(n).padStart(2,'0')}`,
    name:`Estudiante ${String(n).padStart(2,'0')}`,
    segment:archetypes[(n-1)%4],
    score:Math.min(.94,.43+((n*11)%49)/100),
    usage:5+((n*7)%10),
    bugs:1+((n*5)%9),
    discount:4+((n*3)%5),
    tenure:280+((n*13)%151),
    cohort_size:100
  }
})

export const SIM_SEGMENTS=[
  {id:'digital',name:'Alta fatiga',audience:700,risk:'Alto',effect_pp:10.4,ci_low:7.2,ci_high:13.6},
  {id:'middle',name:'Equilibrado',audience:800,risk:'Medio',effect_pp:7.8,ci_low:5.0,ci_high:10.6},
  {id:'traditional',name:'Sueño insuficiente',audience:600,risk:'Medio',effect_pp:3.1,ci_low:.4,ci_high:5.8},
  {id:'wealth',name:'Sobreexigido',audience:400,risk:'Bajo',effect_pp:1.2,ci_low:-1.1,ci_high:3.5},
  {id:'arrears',name:'Sin señal clara',audience:500,risk:'Alto',effect_pp:-1.5,ci_low:-4.3,ci_high:1.3}
]

const gradeRow=(i,treated=false,segment='Equilibrado')=>{
  const pga=2.7+((i*13)%150)/100
  const study=5+((i*7)%10)
  const sleep=4+((i*3)%5)
  const fatigue=1+((i*5)%8)
  const complexity=4+((i*11)%6)
  const effect={Sobreexigido:1.2,Equilibrado:7.8,'Sueño insuficiente':3.1,'Alta fatiga':10.4,'Sin señal clara':-1.5}[segment]||4.8
  const grade=Math.max(0,Math.min(50,15+4*pga+.70*study+.45*sleep-.70*fatigue-.55*complexity+(treated?effect:0)+((i*19)%7-3)))
  return{pga_prev:pga,study_hours:study,sleep_hours:sleep,fatigue,complexity,treated,grade,passed:grade>=30?1:0,segment}
}

const mlTraining=Array.from({length:500},(_,k)=>gradeRow(k+1,(k%2)===0,archetypes[k%4]))

const observational=Array.from({length:800},(_,k)=>{
  const i=k+1,base=gradeRow(i,false,archetypes[i%4])
  const treated=base.pga_prev<3.2||base.fatigue>=6
  const row=gradeRow(i,treated,archetypes[i%4])
  return{...row,treated,risk:Math.min(4,Math.max(1,Math.round(row.fatigue/2)))}
})

const experiment=Array.from({length:900},(_,k)=>{
  const i=k+1
  const seg=SIM_SEGMENTS[i%SIM_SEGMENTS.length]
  const treated=((i*43+11)%997)/997<.5
  const row=gradeRow(i,treated,seg.name)
  return{...row,segment:seg.name,treated}
})

export const SIM_ANALYSIS={
  1:{team_tools:{ml_training:mlTraining}},
  2:{team_tools:{
    observational_rows:observational,
    dag:{
      nodes:[
        {id:'risk',label:'PGA previo'},
        {id:'treat',label:'Apoyo académico'},
        {id:'outcome',label:'Nota final'},
        {id:'mediator',label:'Estudio posterior'},
        {id:'collider',label:'Tutorías posteriores'}
      ],
      edges:[
        {from:'risk',to:'treat',kind:'confounding'},
        {from:'risk',to:'outcome',kind:'confounding'},
        {from:'treat',to:'outcome',kind:'causal'},
        {from:'treat',to:'mediator',kind:'causal'},
        {from:'mediator',to:'outcome',kind:'causal'},
        {from:'treat',to:'collider',kind:'warning'}
      ],
      adjust_options:[
        {id:'none',label:'No ajustar',good:false,highlights:[],explanation:'La comparación conserva confusión.'},
        {id:'risk',label:'PGA previo + complejidad',good:true,highlights:['risk'],explanation:'Bloquea causas previas sin controlar el mecanismo posterior.'},
        {id:'post',label:'Variables posteriores',good:false,highlights:['mediator','collider'],explanation:'Puede borrar efecto o introducir sesgo.'}
      ]
    }
  }},
  3:{team_tools:{
    experiment_rows:experiment,
    segments:SIM_SEGMENTS,
    economy:SIM_ECONOMY,

  }}
}

const pathsFor=(variant=0)=>({
  1:{
    initial:{selected:[`E0${1+variant}`,`E0${5+variant}`]},
    revision:{selected:['E03','E08']},
    checkAnswer:'b',checkPoints:30,
    noteInitial:'Priorizó a quienes parecían más probables de aprobar.',
    noteRevision:'Separó probabilidad de aprobar de cambio causado por el apoyo.'
  },
  2:{
    initial:{choice:variant%2?'prediction':'randomized'},
    revision:{choice:'randomized'},
    checkAnswer:'a',checkPoints:30,
    noteInitial:'Todavía mezclaba predicción con diseño experimental.',
    noteRevision:'Reconoció que la aleatorización permite interpretar causalmente la diferencia media.'
  },
  3:{
    initial:{selected:['pga_previo','horas_estudio_post','tutorias_post']},
    revision:{selected:['pga_previo','complejidad']},
    checkAnswer:'b',checkPoints:30,
    noteInitial:'Quería controlar todas las variables disponibles.',
    noteRevision:'Bloqueó confusión previa y evitó mediador y collider.'
  },
  4:{
    initial:{choice:variant%2?'predict-y':'raw'},
    revision:{choice:'dml'},
    checkAnswer:'b',checkPoints:30,
    noteInitial:'Pensaba que el mejor predictor bastaba para causalidad.',
    noteRevision:'Entendió los dos modelos auxiliares, residuos y efecto residual de DML.'
  },
  5:{
    initial:{choices:{digital:'treat',middle:'observe',traditional:'treat',wealth:'treat',arrears:'observe'}},
    revision:{choices:{digital:'treat',middle:'treat',traditional:'observe',wealth:'avoid',arrears:'avoid'}},
    checkAnswer:'b',checkPoints:30,
    noteInitial:'Partió del efecto promedio.',
    noteRevision:'Usó CATE y heterogeneidad para priorizar perfiles.'
  },
  6:{
    initial:{choice:['t-learner','causal-forest','dr-learner'][variant%3]},
    revision:{choice:'depends'},
    checkAnswer:'c',checkPoints:30,
    noteInitial:'Buscó un algoritmo ganador.',
    noteRevision:'Terminó escogiendo según diseño, identificación, datos, objetivo y supuestos.'
  }
})

export const SIM_PATHS={
  ana:pathsFor(0),
  luis:pathsFor(1),
  camila:pathsFor(2),
  juan:pathsFor(3)
}

export const SIM_TEAM_DECISIONS={
  1:{selected:['E01','E03','E04','E08','E09','E11','E14','E17','E20','E23']},
  2:{choice:'randomized'},
  3:{selected:['pga_previo','complejidad']},
  4:{choice:'dml'},
  5:{treat:['digital','middle'],avoid:['wealth','arrears'],observe:['traditional']},
  6:{choice:'depends'}
}

export const SIM_REVEALS={
  1:{impact_students:86,best_impact_students:104},
  2:{true_effect_points:5.704},
  3:{adjustment_set:['pga_previo','complejidad']},
  4:{true_effect_points:4.8,dml_estimate:4.9},
  5:{impact_students:135,best_impact_students:135},
  6:{message:'Primero identifica; después estima; luego valida; al final decide.'}
}

export const SIM_TEAM_POINTS={1:25,2:30,3:30,4:30,5:30,6:30}
