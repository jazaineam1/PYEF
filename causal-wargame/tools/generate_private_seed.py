#!/usr/bin/env python3
"""Genera SQL PRIVADO para una partida. No se debe commitear el resultado."""
import argparse, hashlib, json, pathlib, random
ROOT=pathlib.Path(__file__).resolve().parents[1]
PUB=json.loads((ROOT/'scenario/nexo-v1/public.json').read_text(encoding='utf-8'))
CARDS={
'negocio':'Cobranza prioriza deliberadamente a los clientes que parecen más difíciles.',
'datos':'La mora previa promedio es aproximadamente el doble entre los clientes llamados.',
'contexto':'Incluso antes de la campaña, mayor mora estaba asociada con menor probabilidad de pago.',
'riesgo':'Por política, los clientes con más de 90 días de mora casi siempre reciben llamada.',
'integrador':'Debes recomendar cancelar, mantener o rediseñar. Tu explicación vale más que la palabra técnica.'}
def effect(seed,c):
    r=random.Random(hashlib.sha256(f"{seed}:{c['id']}".encode()).hexdigest())
    if c['segment']=='Mora alta': return round(r.uniform(-.09,-.03),3)
    if c['pred']>.85: return round(r.uniform(0,.025),3)
    if c['pred']>.75: return round(r.uniform(.03,.10),3)
    return round(r.uniform(.12,.26),3)
def q(s): return "'"+str(s).replace("'","''")+"'"
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--game-code',default='FUTUROS');ap.add_argument('--seed',required=True);ap.add_argument('--out',default=str(ROOT/'supabase/.private/seed_ground_truth.sql'));a=ap.parse_args();out=pathlib.Path(a.out);out.parent.mkdir(parents=True,exist_ok=True)
    lines=["-- PRIVADO: no commitear. Generado por generate_private_seed.py",f"do $$ declare g uuid; begin select id into g from public.cg_games where code={q(a.game_code.upper())}; if g is null then raise exception 'Cree la partida primero'; end if;"]
    for c in PUB['customers']:
        eff=effect(a.seed,c);p1=max(.02,min(.98,c['pred']));p0=max(.01,min(.97,p1-eff));lines.append(f"insert into public.cg_ground_truth(game_id,customer_id,p0,p1,risk) values(g,{q(c['id'])},{p0:.3f},{p1:.3f},{0.1 if c['segment']=='Mora alta' else 0}) on conflict(game_id,customer_id) do update set p0=excluded.p0,p1=excluded.p1,risk=excluded.risk;")
    seg={'digital':.16,'medio':.11,'tradicional':.02,'premium':.01,'mora':-.05}
    for k,v in seg.items():lines.append(f"insert into public.cg_segment_truth(game_id,segment_id,effect) values(g,{q(k)},{v}) on conflict(game_id,segment_id) do update set effect=excluded.effect;")
    for role,text in CARDS.items():lines.append(f"insert into public.cg_role_cards(game_id,round_no,role_code,content) values(g,2,{q(role)},{q(text)}) on conflict(game_id,round_no,role_code) do update set content=excluded.content;")
    lines.append('end $$;');out.write_text('\n'.join(lines)+'\n',encoding='utf-8');print(out)
if __name__=='__main__': main()
