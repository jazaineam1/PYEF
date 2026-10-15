export const endpoint=(import.meta.env.VITE_FUNCTIONS_BASE_URL||'').replace(/\/$/,'')+'/v2-dean-cup';
export const code=new URLSearchParams(location.search).get('game')?.trim().toUpperCase()||'FUTUROS';
export const storageKey='cw-dean-v2-'+code;
export const hexToken=()=>{const b=new Uint8Array(32);crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('')};
export async function call(action,payload={},student='',teacher=''){
 const h={'content-type':'application/json'};
 if(student)h['x-game-token']=student;
 if(teacher)h['x-facilitator-token']=teacher;
 if(!endpoint.startsWith('https://'))throw Error('Backend seguro no configurado');
 const r=await fetch(endpoint,{method:'POST',headers:h,body:JSON.stringify({action,...payload}),cache:'no-store'});
 if(['export','teacher_truth','ab_download','ab_truth'].includes(action)&&r.ok)return r.blob();
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(data.error||'Fallo de conexión');
 return data;
}
