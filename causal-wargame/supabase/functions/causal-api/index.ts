import { createClient } from 'npm:@supabase/supabase-js@2'

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type,x-player-token,x-facilitator-key","Access-Control-Allow-Methods":"POST,OPTIONS"};
const roles=['negocio','datos','contexto','riesgo','integrador'];
const teamNames=['Cóndor','Jaguar','Puma','Águila'];

function secretKey(){
  const modern=Deno.env.get('SUPABASE_SECRET_KEYS');
  if(modern){try{return JSON.parse(modern).default}catch{}}
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''
}

const db=createClient(Deno.env.get('SUPABASE_URL')||'',secretKey(),{auth:{persistSession:false}});
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
const err=(m:string,s=400)=>json({error:m},s);

async function hash(s:string){
  const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')
}

async function player(req:Request){
  const tok=req.headers.get('x-player-token');
  if(!tok)return null;
  const h=await hash(tok);
  const {data}=await db.from('cg_players').select('*,cg_teams(name)').eq('token_hash',h).maybeSingle();
  return data
}

function admin(req:Request){
  const got=req.headers.get('x-facilitator-key')||'';
  const want=Deno.env.get('CAUSAL_FACILITATOR_KEY')||'';
  return !!want&&got===want
}

async function gameByCode(code:string){
  const {data,error}=await db.from('cg_games').select('*').eq('code',code.toUpperCase()).maybeSingle();
  if(error)throw error;
  return data
}

async function ensureGame(code='FUTUROS'){
  let g=await gameByCode(code);
  if(g)return g;
  const {data,error}=await db.from('cg_games').insert({code:code.toUpperCase()}).select().single();
  if(error)throw error;
  g=data;
  const teams=teamNames.map((name,ordinal)=>({game_id:g.id,name,ordinal}));
  const {data:td,error:te}=await db.from('cg_teams').insert(teams).select();
  if(te)throw te;
  await db.from('cg_scores').insert(td.map((t:any)=>({game_id:g.id,team_id:t.id})));
  return g
}

async function stateFor(p:any){
  const {data:g}=await db.from('cg_games').select('*').eq('id',p.game_id).single();
  const {data:players}=await db.from('cg_players').select('id,display_name,role_code,team_id,cg_teams(name)').eq('game_id',p.game_id);
  const {data:dec}=await db.from('cg_decisions').select('round_no,team_id,locked_at,submitted_by').eq('game_id',p.game_id);
  const {data:teams}=await db.from('cg_teams').select('*').eq('game_id',p.game_id);
  const {data:scores}=await db.from('cg_scores').select('*').eq('game_id',p.game_id);
  const {data:checks}=await db.from('cg_checks').select('round_no,player_id,answer').eq('game_id',p.game_id);
  let roleCard=null,reveal=null;
  if(g.current_round===2){
    const {data:c}=await db.from('cg_role_cards').select('content').eq('game_id',p.game_id).eq('round_no',2).eq('role_code',p.role_code).maybeSingle();
    roleCard=c?.content||null
  }
  if(g.phase==='reveal')reveal=await buildReveal(g,teams||[]);
  const teamMap=Object.fromEntries((teams||[]).map((t:any)=>[t.id,t.name]));
  const decisions:any={};
  for(const d of dec||[])decisions[`${d.round_no}:${teamMap[d.team_id]}`]={locked:true,by:'equipo'};
  const scoreObj:any={};
  for(const t of teams||[]){
    const s=(scores||[]).find((x:any)=>x.team_id===t.id)||{};
    const v={impact:s.impact||0,evidence:s.evidence||0,design:s.design||0,risk:s.risk||0,adaptation:s.adaptation||0};
    scoreObj[t.name]={...v,total:Object.values(v).reduce((a:any,b:any)=>a+b,0)}
  }
  return {
    game:{id:g.id,code:g.code,status:g.status,round:g.current_round,phase:g.phase,closesAt:g.closes_at?Date.parse(g.closes_at):null},
    players:(players||[]).map((x:any)=>({id:x.id,name:x.display_name,role:x.role_code,team:x.cg_teams?.name||teamMap[x.team_id]})),
    player:{id:p.id,name:p.display_name,role:p.role_code,team:p.cg_teams?.name||teamMap[p.team_id]},
    decisions,
    checks:Object.fromEntries((checks||[]).map((c:any)=>[`${c.round_no}:${c.player_id}`,c])),
    scores:scoreObj,
    leaderboard:Object.entries(scoreObj).map(([team,v]:any)=>({team,...v})).sort((a:any,b:any)=>b.total-a.total),
    roleCard,reveal,serverTime:Date.now()
  }
}

async function buildReveal(g:any,teams:any[]){
  if(g.current_round===1){
    const {data:decs}=await db.from('cg_decisions').select('*').eq('game_id',g.id).eq('round_no',1);
    const {data:gt}=await db.from('cg_ground_truth').select('customer_id,effect,p1').eq('game_id',g.id);
    const map=Object.fromEntries((gt||[]).map((x:any)=>[x.customer_id,x]));
    const rows:any={};
    for(const t of teams){
      const d=(decs||[]).find((x:any)=>x.team_id===t.id);
      const ids=d?.payload?.customers||[];
      rows[t.name]={effect:ids.reduce((a:number,id:string)=>a+Number(map[id]?.effect||0),0),observed:ids.length?ids.reduce((a:number,id:string)=>a+Number(map[id]?.p1||0),0)/ids.length:0}
    }
    return {type:'futures',rows}
  }
  if(g.current_round===2)return {type:'confounding',naive:-.15,adjusted:.05};
  if(g.current_round===3)return {type:'experiment',ate:.06,treatment:.31,control:.25};
  const {data:sg}=await db.from('cg_segment_truth').select('*').eq('game_id',g.id);
  return {type:'heterogeneity',effects:Object.fromEntries((sg||[]).map((x:any)=>[x.segment_id,Number(x.effect)]))}
}

async function scoreDecision(g:any,p:any,payload:any){
  const {data:s}=await db.from('cg_scores').select('*').eq('game_id',g.id).eq('team_id',p.team_id).single();
  const patch:any={};
  if(g.current_round===1){
    const ids=payload.customers||[];
    const {data:gt}=await db.from('cg_ground_truth').select('customer_id,effect').eq('game_id',g.id);
    const map=Object.fromEntries((gt||[]).map((x:any)=>[x.customer_id,Number(x.effect)]));
    const eff=ids.reduce((a:number,id:string)=>a+(map[id]||0),0);
    const max=Object.values(map).sort((a:any,b:any)=>b-a).slice(0,10).reduce((a:any,b:any)=>a+b,0) as number;
    patch.impact=Math.max(s.impact,Math.round(35*eff/max));
    patch.evidence=s.evidence+((payload.reason||'').length>30?4:1)
  }
  if(g.current_round===2){
    patch.evidence=s.evidence+(payload.confounder==='mora'?12:0)+(payload.recommendation==='redisenar'?8:0)+((payload.reason||'').toLowerCase().includes('compar')?5:0)
  }
  if(g.current_round===3){
    patch.design=s.design+(payload.design==='azar'?20:0);
    patch.evidence=s.evidence+(payload.design==='azar'?5:0)
  }
  if(g.current_round===4){
    const picks=payload.segments||[];
    const good=picks.filter((x:string)=>['digital','medio'].includes(x)).length;
    patch.impact=s.impact+good*6;
    patch.risk=s.risk+(picks.includes('mora')?0:10);
    patch.adaptation=s.adaptation+(good===2?10:good*4)
  }
  if(Object.keys(patch).length)await db.from('cg_scores').update(patch).eq('game_id',g.id).eq('team_id',p.team_id)
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return err('Método no permitido',405);
  try{
    const body=await req.json();
    const action=body.action;
    if(action==='health')return json({ok:true,mode:'live'});
    if(action==='join'){
      const name=String(body.name||'').trim().slice(0,50),code=String(body.gameCode||'FUTUROS').trim().toUpperCase();
      if(!name)return err('Nombre requerido');
      const g=await ensureGame(code);
      const {data:teams}=await db.from('cg_teams').select('*').eq('game_id',g.id).order('ordinal');
      const {data:players}=await db.from('cg_players').select('*').eq('game_id',g.id);
      if((players||[]).length>=20)return err('La partida está completa',409);
      const idx=(players||[]).length,team=teams[Math.floor(idx/5)%4],role=roles[idx%5];
      const token=crypto.randomUUID()+crypto.randomUUID(),tokenHash=await hash(token);
      const {data:p,error}=await db.from('cg_players').insert({game_id:g.id,team_id:team.id,display_name:name,role_code:role,token_hash:tokenHash}).select('*,cg_teams(name)').single();
      if(error)throw error;
      return json({token,player:{id:p.id,name:p.display_name,role:p.role_code,team:p.cg_teams.name},state:await stateFor(p)})
    }
    const p=await player(req);
    if(action==='state'){
      if(!p)return err('No autorizado',401);
      await db.from('cg_players').update({last_seen_at:new Date().toISOString()}).eq('id',p.id);
      return json(await stateFor(p))
    }
    if(action==='submitDecision'){
      if(!p)return err('No autorizado',401);
      const {data:g}=await db.from('cg_games').select('*').eq('id',p.game_id).single();
      if(g.phase!=='round')return err('La ronda no está abierta',409);
      const key=`${g.id}:${g.current_round}:${p.team_id}`;
      const {error}=await db.from('cg_decisions').insert({game_id:g.id,team_id:p.team_id,round_no:g.current_round,payload:body.payload||{},submitted_by:p.id,idempotency_key:key});
      if(error&&error.code!=='23505')throw error;
      if(!error)await scoreDecision(g,p,body.payload||{});
      return json({ok:true})
    }
    if(action==='submitCheck'){
      if(!p)return err('No autorizado',401);
      const {data:g}=await db.from('cg_games').select('*').eq('id',p.game_id).single();
      await db.from('cg_checks').upsert({game_id:g.id,player_id:p.id,round_no:g.current_round,answer:String(body.answer||'')},{onConflict:'game_id,player_id,round_no'});
      return json({ok:true})
    }
    if(action==='admin'){
      if(!admin(req))return err('Clave de facilitador inválida',403);
      const command=body.command,data=body.data||{};
      let g=await ensureGame(String(data.gameCode||'FUTUROS'));
      if(command==='reset'){
        await db.from('cg_decisions').delete().eq('game_id',g.id);
        await db.from('cg_checks').delete().eq('game_id',g.id);
        await db.from('cg_players').delete().eq('game_id',g.id);
        await db.from('cg_scores').update({impact:0,evidence:0,design:0,risk:0,adaptation:0}).eq('game_id',g.id);
        await db.from('cg_games').update({status:'lobby',current_round:1,phase:'lobby',closes_at:null}).eq('id',g.id);
        return json({ok:true})
      }
      const patch:any={updated_at:new Date().toISOString()};
      if(command==='open'){patch.status='active';patch.phase='round';patch.closes_at=new Date(Date.now()+480000).toISOString()}
      if(command==='reveal'){patch.phase='reveal';patch.closes_at=null}
      if(command==='teach')patch.phase='teach';
      if(command==='check')patch.phase='check';
      if(command==='next'){
        if(g.current_round<4){patch.current_round=g.current_round+1;patch.phase='briefing';patch.closes_at=null}
        else{patch.phase='finished';patch.status='finished'}
      }
      if(command==='lobby'){patch.phase='lobby';patch.status='lobby'}
      if(command==='addTime'&&g.closes_at)patch.closes_at=new Date(Date.parse(g.closes_at)+Number(data.seconds||60)*1000).toISOString();
      await db.from('cg_games').update(patch).eq('id',g.id);
      return json({ok:true})
    }
    return err('Acción desconocida',404)
  }catch(e){console.error(e);return err(e instanceof Error?e.message:'Error interno',500)}
})
