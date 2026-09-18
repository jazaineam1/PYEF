let pyodide=null
const PYODIDE_VERSION='0.27.7'
const PYODIDE_BASE=`https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

async function boot(){
  if(pyodide)return
  importScripts(PYODIDE_BASE+'pyodide.js')
  pyodide=await self.loadPyodide({indexURL:PYODIDE_BASE})
  await pyodide.loadPackage(['pandas'])
}

self.onmessage=async event=>{
  const msg=event.data||{}
  try{
    if(msg.type==='init'){
      await boot()
      self.postMessage({type:'ready'})
      return
    }
    if(msg.type==='run'){
      await boot()
      pyodide.globals.set('payload_json',JSON.stringify(msg.context||{}))
      pyodide.globals.set('_user_code',String(msg.code||''))
      const output=await pyodide.runPythonAsync(`
import io
import json
import sys
import traceback

payload = json.loads(payload_json)
_buffer = io.StringIO()
_old_stdout, _old_stderr = sys.stdout, sys.stderr
sys.stdout = _buffer
sys.stderr = _buffer
try:
    exec(_user_code, globals())
except Exception:
    traceback.print_exc()
finally:
    sys.stdout = _old_stdout
    sys.stderr = _old_stderr
_buffer.getvalue()
`)
      pyodide.globals.delete('payload_json')
      pyodide.globals.delete('_user_code')
      self.postMessage({type:'result',output:String(output||'Sin salida. Usa print(...) para mostrar resultados.')})
    }
  }catch(error){
    self.postMessage({type:'error',error:error?.message||String(error)})
  }
}
