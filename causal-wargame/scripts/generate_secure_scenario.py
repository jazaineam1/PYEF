#!/usr/bin/env python3
"""Generate uncommitted scenario SQL for DOS FUTUROS.
Exact ground truth is generated at deployment time so it is not present in the public repo/bundle.
"""
from __future__ import annotations
import argparse, random, secrets
from pathlib import Path

NAMES=[
('C01','Laura','Patrimonio alto',.96),('C02','Felipe','Patrimonio alto',.93),('C03','Mariana','Tradicional',.90),('C04','Samuel','Tradicional',.87),
('C05','Nicolás','Jóvenes digitales',.84),('C06','Valentina','Jóvenes digitales',.82),('C07','Camilo','Ingreso medio',.79),('C08','Diana','Ingreso medio',.77),
('C09','Sara','Jóvenes digitales',.73),('C10','Andrés','Ingreso medio',.69),('C11','Mateo','Ingreso medio',.64),('C12','Paula','Jóvenes digitales',.61),
('C13','Juliana','Tradicional',.59),('C14','Daniel','Tradicional',.56),('C15','Tomás','Mora alta',.51),('C16','Lucía','Mora alta',.48),
('C17','Santiago','Ingreso medio',.47),('C18','Carolina','Jóvenes digitales',.45),('C19','Juan','Patrimonio alto',.43),('C20','Mónica','Tradicional',.41),
('C21','Esteban','Mora alta',.36),('C22','Natalia','Jóvenes digitales',.35),('C23','Alejandro','Ingreso medio',.33),('C24','Gabriela','Mora alta',.29)]

def clamp(x): return max(.02,min(.98,x))
def esc(s): return s.replace("'","''")

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--code',default=None)
    ap.add_argument('--pin',default=None)
    ap.add_argument('--output',default='scenario-private.sql')
    ap.add_argument('--seed',type=int,default=None,help='Optional for reproducible rehearsals. Omit for live games.')
    a=ap.parse_args()
    rng=random.Random(a.seed if a.seed is not None else secrets.randbits(64))
    pin=a.pin or secrets.token_urlsafe(12)
    code=(a.code or ('FUT-'+secrets.token_hex(3))).upper()
    rows=[]
    for cid,name,seg,score in NAMES:
        p1=score
        if seg=='Patrimonio alto': p0=clamp(p1-rng.uniform(.005,.025))
        elif seg=='Tradicional': p0=clamp(p1-rng.uniform(.015,.055))
        elif seg=='Jóvenes digitales': p0=clamp(p1-rng.uniform(.18,.30))
        elif seg=='Ingreso medio': p0=clamp(p1-rng.uniform(.16,.28))
        else: p0=clamp(p1+rng.uniform(.04,.08))
        risk=3 if seg=='Mora alta' else 1
        rows.append(f"('{cid}','{esc(name)}','{esc(seg)}',{score:.4f},{p0:.4f},{p1:.4f},1,{risk})")
    segs=[
      ('digital','Jóvenes digitales',rng.randint(13,17),92,1),
      ('middle','Ingreso medio',rng.randint(9,13),84,1),
      ('traditional','Tradicional',rng.randint(1,3),42,1),
      ('wealth','Patrimonio alto',rng.randint(0,2),35,1),
      ('arrears','Mora alta',-rng.randint(4,7),12,5)]
    naive=-rng.randint(12,17); causal=rng.randint(4,7); control=rng.randint(23,27); ate=rng.randint(5,7); treatment=control+ate
    sql=f"""-- PRIVATE GENERATED SCENARIO. DO NOT COMMIT.\n-- Game code: {code}\n-- Facilitator PIN: {pin}\n\nbegin;\n\ntruncate table public.cw_ground_truth_customers, public.cw_ground_truth_segments, public.cw_role_cards, public.cw_answer_keys, public.cw_scenario_parameters restart identity;\n\ninsert into public.cw_role_cards(round_number,role_code,content) values\n(2,'business','Cobranza prioriza a los clientes con mayor dificultad de pago.'),\n(2,'data','La mora previa promedio de los llamados es aproximadamente el doble de la de los no llamados.'),\n(2,'context','Antes de esta estrategia, los clientes con mayor mora ya pagaban menos.'),\n(2,'risk','Por política operativa, los clientes con más de 90 días de mora casi siempre reciben llamada.'),\n(2,'integrator','Dirección exige recomendar: cancelar, mantener tal cual o rediseñar la estrategia.');\n\ninsert into public.cw_answer_keys(round_number,correct_answer,concept) values\n(1,'B','Predicción vs impacto causal'),\n(2,'Los grupos no son comparables desde antes','Confusión'),\n(3,'6 puntos porcentuales','ATE'),\n(4,'Priorizar segmentos con efecto positivo y evitar el segmento negativo','Heterogeneidad');\n\ninsert into public.cw_ground_truth_customers(customer_id,name,segment,predictive_score,p0,p1,cost,risk) values\n{',\n'.join(rows)};\n\ninsert into public.cw_ground_truth_segments(segment_id,name,effect_pp,value_score,risk) values\n{',\n'.join(f"('{i}','{esc(n)}',{e},{v},{r})" for i,n,e,v,r in segs)};\n\ninsert into public.cw_scenario_parameters(key,value) values\n('round2',jsonb_build_object('naive_effect_pp',{naive},'causal_effect_pp',{causal})),\n('round3',jsonb_build_object('treatment',{treatment},'control',{control},'ate_pp',{ate}));\n\nselect public.cw_bootstrap_game('{esc(code)}','{esc(pin)}') as game_id;\n\ncommit;\n"""
    Path(a.output).write_text(sql,encoding='utf-8')
    print(f"Generated {a.output}")
    print(f"Game code: {code}")
    print(f"Facilitator PIN: {pin}")
    print('Keep the generated SQL private and execute it once after migrations.')

if __name__=='__main__': main()
