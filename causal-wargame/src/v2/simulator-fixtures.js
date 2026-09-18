export const SIM_PLAYERS=[
  {id:'ana',name:'Ana'},
  {id:'luis',name:'Luis'},
  {id:'camila',name:'Camila'},
  {id:'juan',name:'Juan'}
]

export const SIM_ECONOMY={
  renewal_value_cop:200000,
  intervention_cost_cop:8000,
  cohort_size:1000,
  capacity:15000
}

export const SIM_CUSTOMERS=Array.from({length:24},(_,i)=>{
  const n=i+1,score=Math.min(.93,.34+((n*11)%56)/100)
  return{
    id:`S${String(n).padStart(2,'0')}`,
    name:`Cohorte ${String(n).padStart(2,'0')}`,
    segment:['Digital','Mixto','Tradicional','Premium'][n%4],
    score,
    usage:20+((n*13)%76),
    bugs:(n*3)%8,
    discount:(n*7)%31,
    tenure:6+((n*5)%48),
    cohort_size:1000,
    shap:[
      {feature:'Uso',impact:((n*3)%8)-2},
      {feature:'Incidentes',impact:((n*5)%7)-2},
      {feature:'Descuento',impact:2-((n*4)%6)}
    ]
  }
})

export const SIM_SEGMENTS=[
  {id:'digital',name:'Digitales',audience:7000,risk:'Bajo',value:200000,cost:8000},
  {id:'middle',name:'Ingreso medio',audience:8000,risk:'Medio',value:200000,cost:8000},
  {id:'traditional',name:'Tradicionales',audience:5000,risk:'Medio',value:200000,cost:8000},
  {id:'wealth',name:'Patrimonio alto',audience:2500,risk:'Bajo',value:200000,cost:8000},
  {id:'arrears',name:'Mora alta',audience:4000,risk:'Alto',value:200000,cost:8000}
]

const trueSegments=[
  {...SIM_SEGMENTS[0],effect_pp:13.5,ci_low:9,ci_high:18,incremental_value_cop:133000000},
  {...SIM_SEGMENTS[1],effect_pp:9,ci_low:5,ci_high:13,incremental_value_cop:80000000},
  {...SIM_SEGMENTS[2],effect_pp:3,ci_low:-2,ci_high:8,incremental_value_cop:-10000000},
  {...SIM_SEGMENTS[3],effect_pp:1,ci_low:-3,ci_high:4,incremental_value_cop:-15000000},
  {...SIM_SEGMENTS[4],effect_pp:-5,ci_low:-9,ci_high:-1,incremental_value_cop:-72000000}
]

const mlTraining=Array.from({length:300},(_,k)=>{
  const i=k+1,usage=10+((i*37)%86),bugs=(i*7)%9,discount=(i*11)%31,tenure=3+((i*13)%60)
  const z=-3.4+.045*usage-.16*bugs+.035*discount+.025*tenure
  const p=1/(1+Math.exp(-z)),u=((i*97+31)%991)/991
  return{usage,bugs,discount,tenure,renewed:u<p?1:0}
})

const observational=Array.from({length:800},(_,k)=>{
  const i=k+1,risk=1+((i*7)%4),usage=15+((i*19)%80),tenure=4+((i*23)%55)
  const tp=[0,.18,.35,.72,.90][risk],treated=((i*37+17)%997)/997<tp
  const p0=Math.max(.08,Math.min(.82,.68-.12*risk+.0015*usage+.001*tenure))
  const y=((i*101+53)%991)/991<Math.min(.95,p0+(treated?.10:0))
  return{risk,usage,tenure,treated,renewed:y?1:0}
})

const experiment=Array.from({length:900},(_,k)=>{
  const i=k+1,z=(i%100)/100
  let segment,effect,pbase
  if(z<.28){segment='digital';effect=.135;pbase=.38}
  else if(z<.58){segment='middle';effect=.09;pbase=.43}
  else if(z<.76){segment='traditional';effect=.03;pbase=.49}
  else if(z<.85){segment='wealth';effect=.01;pbase=.62}
  else{segment='arrears';effect=-.05;pbase=.25}
  const usage=15+((i*17)%80),tenure=4+((i*23)%55)
  const p0=Math.max(.05,Math.min(.9,pbase+.0007*(usage-50)+.0005*(tenure-25)))
  const treated=((i*43+11)%997)/997<.5
  const y=((i*137+71)%991)/991<Math.min(.95,Math.max(.02,p0+(treated?effect:0)))
  return{segment,usage,tenure,treated,renewed:y?1:0}
})

export const SIM_ANALYSIS={
  1:{
    team_tools:{
      feature_summary:[
        {feature:'Uso',mean_abs:2.6},
        {feature:'Incidentes reportados',mean_abs:1.7},
        {feature:'Descuento',mean_abs:1.2}
      ],
      ml_training:mlTraining
    },
    reveal_tools:{
      score_uplift:SIM_CUSTOMERS.map((c,i)=>{
        const uplift=[.14,.04,.20,-.05,.09,.02,.12,.01][i%8]
        const p0=Math.min(.76,.25+((i*7)%40)/100)
        return{...c,p0,p1:Math.max(.02,Math.min(.96,p0+uplift)),uplift_pp:uplift*100,incremental_value_cop:(uplift*200000-8000)*1000}
      })
    }
  },
  2:{
    team_tools:{
      observational_rows:observational,
      dag:{
        nodes:[
          {id:'risk',label:'Riesgo previo'},
          {id:'treat',label:'Bono'},
          {id:'outcome',label:'Renovación'}
        ],
        edges:[
          {from:'risk',to:'treat',kind:'confounding'},
          {from:'risk',to:'outcome',kind:'confounding'},
          {from:'treat',to:'outcome',kind:'causal'}
        ],
        adjust_options:[
          {id:'none',label:'No separar por riesgo',good:false,highlights:[],explanation:'La comparación mezcla perfiles distintos.'},
          {id:'risk',label:'Comparar dentro del mismo riesgo',good:true,highlights:['risk'],explanation:'Compara perfiles más parecidos antes de interpretar el resultado.'}
        ]
      }
    }
  },
  3:{
    team_tools:{
      experiment_rows:experiment,
      segments:SIM_SEGMENTS.map(s=>({id:s.id,name:s.name,audience:s.audience,risk:s.risk,value_per_result:200000,unit_cost:8000})),
      economy:SIM_ECONOMY,
      precision_curve:[
        {n:200,mde_pp:12.2,ci_half_pp:8.6},
        {n:500,mde_pp:7.7,ci_half_pp:5.5},
        {n:1000,mde_pp:5.5,ci_half_pp:3.9},
        {n:2000,mde_pp:3.9,ci_half_pp:2.8},
        {n:5000,mde_pp:2.5,ci_half_pp:1.8}
      ],
      econml:[
        {segment:'digital',name:'Digitales',t_learner:12.8,dr_learner:13.4,causal_forest:13.7},
        {segment:'middle',name:'Ingreso medio',t_learner:8.4,dr_learner:9.1,causal_forest:9.5},
        {segment:'traditional',name:'Tradicionales',t_learner:2.1,dr_learner:3.2,causal_forest:4.0},
        {segment:'wealth',name:'Patrimonio alto',t_learner:.5,dr_learner:1.2,causal_forest:1.5},
        {segment:'arrears',name:'Mora alta',t_learner:-4.2,dr_learner:-5.1,causal_forest:-5.6}
      ],
      placebo:{effect_pp:4.7,ci_low:1.5,ci_high:7.9,message:'Un resultado medido antes de la campaña no debería responder a una intervención futura.'}
    },
    reveal_tools:{
      experiment:{treatment_rate:49,control_rate:43,ate_pp:6},
      segments:trueSegments
    }
  }
}

export const SIM_PATHS={
  ana:{
    1:{initial:{selected:['S05','S10']},revision:{selected:['S03','S09']},noteInitial:'Elegí quienes parecían más probables de renovar.',noteRevision:'Después del laboratorio dejé de tratar la probabilidad como si fuera impacto.'},
    2:{initial:{recommendation:'cancel'},revision:{recommendation:'redesign'},noteInitial:'Con bono renovaron menos; cancelaría.',noteRevision:'Ahora veo que los grupos eran distintos desde antes. Pediría una comparación mejor.'},
    3:{initial:{choices:{digital:'treat',middle:'treat',traditional:'treat',wealth:'observe',arrears:'observe'}},revision:{choices:{digital:'treat',middle:'treat',traditional:'observe',wealth:'avoid',arrears:'avoid'}},noteInitial:'Si funciona en promedio, traté varios grupos.',noteRevision:'Después de mirar el cambio por grupo y el costo, concentré el presupuesto.'}
  },
  luis:{
    1:{initial:{selected:['S02','S07']},revision:{selected:['S01','S03']},noteInitial:'Seguí el ranking del modelo.',noteRevision:'Busqué señales de cambio, no sólo nivel esperado.'},
    2:{initial:{recommendation:'keep'},revision:{recommendation:'redesign'},noteInitial:'Pensé que el histórico era suficiente.',noteRevision:'La asignación del bono estaba sesgada hacia alto riesgo.'},
    3:{initial:{choices:{digital:'treat',middle:'observe',traditional:'treat',wealth:'treat',arrears:'avoid'}},revision:{choices:{digital:'treat',middle:'treat',traditional:'observe',wealth:'avoid',arrears:'avoid'}},noteInitial:'Usé intuición comercial.',noteRevision:'La política final usa efecto y valor, no sólo segmento.'}
  },
  camila:{
    1:{initial:{selected:['S06','S14']},revision:{selected:['S03','S17']},noteInitial:'Priorizaba probabilidad alta.',noteRevision:'Entendí que renovar de todas formas no crea valor incremental.'},
    2:{initial:{recommendation:'cancel'},revision:{recommendation:'redesign'},noteInitial:'La diferencia cruda parecía negativa.',noteRevision:'Comparé dentro de niveles de riesgo antes de concluir.'},
    3:{initial:{choices:{digital:'treat',middle:'treat',traditional:'observe',wealth:'observe',arrears:'treat'}},revision:{choices:{digital:'treat',middle:'treat',traditional:'observe',wealth:'avoid',arrears:'avoid'}},noteInitial:'No esperaba daño en mora alta.',noteRevision:'El promedio escondía respuestas distintas.'}
  },
  juan:{
    1:{initial:{selected:['S12','S21']},revision:{selected:['S03','S11']},noteInitial:'Tomé los scores literalmente.',noteRevision:'Ahora separo predicción y efecto.'},
    2:{initial:{recommendation:'keep'},revision:{recommendation:'redesign'},noteInitial:'Preferí no cambiar la campaña.',noteRevision:'La comparación necesita grupos parecidos.'},
    3:{initial:{choices:{digital:'observe',middle:'treat',traditional:'treat',wealth:'treat',arrears:'avoid'}},revision:{choices:{digital:'treat',middle:'treat',traditional:'observe',wealth:'avoid',arrears:'avoid'}},noteInitial:'Priorizaba tamaño y valor bruto.',noteRevision:'Usé el cambio atribuible al bono y su costo.'}
  }
}

export const SIM_TEAM_DECISIONS={
  1:{selected:['S01','S03','S04','S09','S11','S12','S17','S18','S20','S23']},
  2:{recommendation:'redesign'},
  3:{treat:['digital','middle'],avoid:['wealth','arrears'],observe:['traditional']}
}

export const SIM_REVEALS={
  1:{incremental_value_cop:188000000,best_possible_value_cop:226000000,value_gap_cop:38000000},
  2:{true_effect_pp:10,campaign_potential_value_cop:120000000},
  3:{incremental_value_cop:213000000,treated_audience:15000,capacity:15000}
}
