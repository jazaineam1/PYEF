const n=x=>Number(x||0)

const safeR1=rows=>(rows||[]).map(c=>({
  id:String(c.id||''),
  cliente:String(c.name||c.id||''),
  segmento:String(c.segment||''),
  prob_renovacion:n(c.score)
}))

const safeR2=rows=>(rows||[]).map(c=>({
  id:String(c.id||''),
  riesgo:n(c.risk),
  tratado:Boolean(c.treated),
  renovo:Boolean(c.outcome),
  prob_renovacion:n(c.score)
}))

const safeR3=tools=>(tools?.precision_curve||[]).map(x=>({
  n:n(x.n),
  mde_pp:n(x.mde_pp),
  semi_amplitud_ic_pp:n(x.ci_half_pp)
}))

const safeR4=rows=>(rows||[]).map(s=>({
  segmento:String(s.name||s.id||''),
  audiencia:n(s.audience),
  efecto_pp:n(s.effect??s.effect_pp),
  ci_bajo:n(s.ci_low),
  ci_alto:n(s.ci_high),
  riesgo:String(s.risk||'')
}))

export function buildPythonLab(round,state={},analysis={}){
  const tools=analysis?.team_tools||{}
  if(round===1)return{
    title:'¿Qué está ordenando realmente el modelo?',
    question:'Inspecciona con Python la probabilidad predicha. ¿Esto alcanza para afirmar quién cambiará por la intervención?',
    instruction:'Ejecuta el código y discute qué información causal todavía falta.',
    context:{rows:safeR1(state.team_pool||[])},
    code:`import pandas as pd

df = pd.DataFrame(payload["rows"])
df["prob_renovacion"] = (100 * df["prob_renovacion"]).round(1)

print("Ranking por probabilidad predicha (%)")
print(df.sort_values("prob_renovacion", ascending=False).to_string(index=False))

print("\nPregunta causal:")
print("¿Este ranking dice quién cambiará POR la intervención?")`
  }
  if(round===2)return{
    title:'¿Estamos comparando grupos equivalentes?',
    question:'Calcula primero la diferencia cruda y luego mira el resultado dentro de niveles de riesgo previo.',
    instruction:'No busques “la respuesta correcta”; busca señales de selección y falta de comparabilidad.',
    context:{rows:safeR2(state.team_pool||[])},
    code:`import pandas as pd

df = pd.DataFrame(payload["rows"])
df["tratado"] = df["tratado"].astype(bool)
df["renovo"] = df["renovo"].astype(int)

tasas = df.groupby("tratado")["renovo"].mean().mul(100).round(1)
print("Renovación observada por grupo (%)")
print(tasas.to_string())

if True in tasas.index and False in tasas.index:
    print("\nDiferencia cruda (tratado - control):",
          round(tasas.loc[True] - tasas.loc[False], 1), "pp")

print("\nRenovación dentro de cada nivel de riesgo (%)")
estratos = (df.groupby(["riesgo","tratado"])["renovo"]
              .mean().mul(100).round(1).unstack())
print(estratos.to_string())

print("\nPregunta causal:")
print("¿La asignación del tratamiento parece independiente del riesgo previo?")`
  }
  if(round===3)return{
    title:'¿Más muestra arregla cualquier diseño?',
    question:'Explora cómo cambia la precisión cuando aumenta N y separa precisión de identificación.',
    instruction:'Encuentra el primer tamaño muestral que cruza el umbral de negocio.',
    context:{
      rows:safeR3(tools),
      umbral_pp:n(tools.business_threshold_pp||2)
    },
    code:`import pandas as pd

df = pd.DataFrame(payload["rows"]).sort_values("n")
umbral = payload["umbral_pp"]

print("Precisión esperada por tamaño de muestra")
print(df.to_string(index=False))

candidatos = df[df["mde_pp"] <= umbral]
if len(candidatos):
    fila = candidatos.iloc[0]
    print(f"\nPrimer N que alcanza MDE <= {umbral} pp: {int(fila['n'])}")
else:
    print(f"\nNingún tamaño mostrado alcanza MDE <= {umbral} pp")

print("\nPregunta causal:")
print("¿Aumentar N corrige una asignación sistemáticamente sesgada?")`
  }
  if(round===4)return{
    title:'¿El promedio alcanza para definir una política?',
    question:'Inspecciona heterogeneidad e incertidumbre sin convertir automáticamente una estimación positiva en una orden de tratar.',
    instruction:'Distingue efecto estimado, intervalo e incertidumbre antes de proponer una política.',
    context:{rows:safeR4(state.team_pool||[])},
    code:`import pandas as pd

df = pd.DataFrame(payload["rows"])
df["signo_robusto"] = df["ci_bajo"].apply(
    lambda x: "positivo" if x > 0 else ("negativo" if x < 0 else "incierto")
)

print("Efectos heterogéneos por segmento")
print(df[["segmento","audiencia","efecto_pp","ci_bajo","ci_alto","signo_robusto"]]
      .sort_values("efecto_pp", ascending=False)
      .to_string(index=False))

print("\nPregunta causal:")
print("¿Qué segmentos requieren más evidencia antes de convertir el CATE en política?")`
  }
  return null
}

export function pythonLabPayloadKeys(round,state={},analysis={}){
  const lab=buildPythonLab(round,state,analysis)
  return lab?Object.keys(lab.context):[]
}
