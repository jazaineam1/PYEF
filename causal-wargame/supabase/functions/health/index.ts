import { cors, json, options } from '../_shared/http.ts'
Deno.serve((req)=>{const pre=options(req);if(pre)return pre;return json({ok:true,service:'dos-futuros',time:new Date().toISOString()})})
