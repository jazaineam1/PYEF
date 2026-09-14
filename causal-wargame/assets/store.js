const CFG=window.CAUSAL_CONFIG;
const LS='dos_futuros_demo_v1'; const SESSION='dos_futuros_session_v1';
export async function loadScenario(){return fetch('scenario/nexo-v1/public.json',{cache:'no-store'}).then(r=>r.json())}
export function fmtPct(v){return `${Math.round(v*100)}%`}
export function fmtPP(v){const n=Math.round(v*1000)/10;return `${n>0?'+':''}${n} pp`}
function uid(){return crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)}
function now(){return Date.now()}
function defaultState(s){return {game:{id:'demo',code:'FUTUROS',status:'lobby',round:1,phase:'lobby',closesAt:null,title:s.title},players:[],decisions:{},checks:{},scores:Object.fromEntries(s.teams.map(t=>[t,{impact:0,evidence:0,design:0,risk:0,adaptation:0,total:0}])),events:[],updatedAt:now()}}
class DemoStore{
  constructor(s){this.s=s;this.bc=new BroadcastChannel('dos-futuros-demo')}
  read(){const v=localStorage.getItem(LS);return v?JSON.parse(v):defaultState(this.s)}
  write(st){st.updatedAt=now();localStorage.setItem(LS,JSON.stringify(st));this.bc.postMessage({type:'state'});return st}
  async health(){return {ok:true,mode:'demo'}}
  async reset(){const st=defaultState(this.s);this.write(st);localStorage.removeItem(SESSION);return st}
  async join({name}){const st=this.read();let sess=JSON.parse(localStorage.getItem(SESSION)||'null');if(sess){const p=st.players.find(x=>x.id===sess.playerId);if(p)return {token:sess.token,player:p,state:await this.state(sess.token)}}
    const idx=st.players.length;const team=this.s.teams[Math.floor(idx/5)%this.s.teams.length];const role=this.s.roles[idx%5].code;const p={id:uid(),name:name||`Jugador ${idx+1}`,team,role,joinedAt:now()};st.players.push(p);const token=uid();localStorage.setItem(SESSION,JSON.stringify({token,playerId:p.id}));this.write(st);return {token,player:p,state:await this.state(token)}}
  player(){const sess=JSON.parse(localStorage.getItem(SESSION)||'null');const st=this.read();return sess?st.players.find(p=>p.id===sess.playerId):null}
  async state(){const st=this.read();const p=this.player();let roleCard=null,reveal=null;const priv=await fetch('scenario/nexo-v1/demo-private.json',{cache:'no-store'}).then(r=>r.json());if(p&&st.game.round===2)roleCard=priv.roleCards?.['2']?.[p.role]||null;if(st.game.phase==='reveal')reveal=this.revealFor(st,priv);return {...st,player:p,roleCard,reveal,leaderboard:this.board(st)}}
  revealFor(st,priv){const r=st.game.round;if(r===1){const rows={};for(const t of this.s.teams){const ids=st.decisions[`1:${t}`]?.payload?.customers||[];const observed=ids.length?ids.reduce((a,id)=>a+(this.s.customers.find(c=>c.id===id)?.pred||0),0)/ids.length:0;const effect=ids.reduce((a,id)=>a+(priv.effects[id]||0),0);rows[t]={observed,effect}}return {type:'futures',rows}}
    if(r===2)return {type:'confounding',naive:priv.round2.naive,adjusted:priv.round2.adjusted};if(r===3)return {type:'experiment',...priv.round3};if(r===4)return {type:'heterogeneity',effects:priv.round4.effects};return null}
  board(st){return Object.entries(st.scores).map(([team,v])=>({team,...v})).sort((a,b)=>b.total-a.total)}
  async submitDecision(payload){const st=this.read(),p=this.player();if(!p)throw Error('No hay sesión');if(st.game.phase!=='round')throw Error('La ronda no está abierta');const key=`${st.game.round}:${p.team}`;if(st.decisions[key]?.locked)throw Error('La decisión ya está bloqueada');st.decisions[key]={payload,by:p.name,at:now(),locked:true};await this.score(st,p.team,st.game.round,payload);this.write(st);return {ok:true}}
  async score(st,team,r,payload){const priv=await fetch('scenario/nexo-v1/demo-private.json',{cache:'no-store'}).then(r=>r.json());const s=st.scores[team];if(r===1){const ids=payload.customers||[];const eff=ids.reduce((a,id)=>a+(priv.effects[id]||0),0);const max=[...Object.values(priv.effects)].sort((a,b)=>b-a).slice(0,10).reduce((a,b)=>a+b,0);s.impact=Math.max(s.impact,Math.round(35*eff/max));s.evidence+=(payload.reason||'').length>30?4:1}
    if(r===2){if(payload.confounder===priv.round2.correctConfounder)s.evidence+=12;if(payload.recommendation===priv.round2.correctRecommendation)s.evidence+=8;if((payload.reason||'').toLowerCase().includes('compar'))s.evidence+=5}
    if(r===3){if(payload.design===priv.round3.correctDesign){s.design+=20;s.evidence+=5}}
    if(r===4){const pick=payload.segments||[];const good=pick.filter(x=>priv.round4.best.includes(x)).length;const bad=pick.includes('mora');s.impact+=good*6;s.risk+=bad?0:10;s.adaptation+=good===2?10:good*4}
    s.total=s.impact+s.evidence+s.design+s.risk+s.adaptation}
  async submitCheck(answer){const st=this.read(),p=this.player();if(!p)throw Error('No sesión');const k=`${st.game.round}:${p.id}`;st.checks[k]={answer,at:now()};this.write(st);return {ok:true}}
  async admin(action,data={}){const st=this.read();if(action==='reset')return this.reset();if(action==='open'){st.game.phase='round';st.game.status='active';const sec=this.s.rounds[st.game.round-1]?.seconds||480;st.game.closesAt=now()+sec*1000}
    if(action==='reveal'){st.game.phase='reveal';st.game.closesAt=null}if(action==='teach'){st.game.phase='teach'}if(action==='check'){st.game.phase='check'}if(action==='next'){if(st.game.round<4){st.game.round++;st.game.phase='briefing';st.game.closesAt=null}else{st.game.phase='finished';st.game.status='finished'}}if(action==='lobby'){st.game.phase='lobby';st.game.status='lobby'}if(action==='addTime'&&st.game.closesAt)st.game.closesAt+=Number(data.seconds||60)*1000;this.write(st);return st}
  subscribe(cb){this.bc.addEventListener('message',()=>cb());window.addEventListener('storage',e=>{if(e.key===LS)cb()});return()=>{}}
}
class ApiStore{
  constructor(s){this.s=s;this.base=CFG.apiUrl.replace(/\/$/,'');this.token=localStorage.getItem(SESSION)||''}
  async req(action,payload={},adminKey=''){const h={'content-type':'application/json'};if(this.token)h['x-player-token']=this.token;if(adminKey)h['x-facilitator-key']=adminKey;const r=await fetch(this.base,{method:'POST',headers:h,body:JSON.stringify({action,...payload})});const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||`HTTP ${r.status}`);return j}
  async health(){return this.req('health')}
  async join({name,gameCode}){const j=await this.req('join',{name,gameCode});this.token=j.token;localStorage.setItem(SESSION,j.token);return j}
  async state(){return this.req('state')}
  async submitDecision(payload){return this.req('submitDecision',{payload})}
  async submitCheck(answer){return this.req('submitCheck',{answer})}
  async admin(action,data={},key=''){return this.req('admin',{command:action,data},key)}
  async reset(key=''){return this.admin('reset',{},key)}
  subscribe(cb){const id=setInterval(cb,CFG.pollMs||3000);return()=>clearInterval(id)}
}
export async function makeStore(){const s=await loadScenario();return CFG.mode==='live'&&CFG.apiUrl?new ApiStore(s):new DemoStore(s)}
export function countdown(ts){if(!ts)return '—';const d=Math.max(0,ts-Date.now()),m=Math.floor(d/60000),sec=Math.floor((d%60000)/1000);return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
