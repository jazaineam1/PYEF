(function(){let e=null,t=`https://cdn.jsdelivr.net/pyodide/v0.27.7/full/`;async function n(){e||(importScripts(t+`pyodide.js`),e=await self.loadPyodide({indexURL:t}),await e.loadPackage([`pandas`]))}self.onmessage=async t=>{let r=t.data||{};try{if(r.type===`init`){await n(),self.postMessage({type:`ready`});return}if(r.type===`run`){await n(),e.globals.set(`payload_json`,JSON.stringify(r.context||{})),e.globals.set(`_user_code`,String(r.code||``));let t=await e.runPythonAsync(`
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
`);e.globals.delete(`payload_json`),e.globals.delete(`_user_code`),self.postMessage({type:`result`,output:String(t||`Sin salida. Usa print(...) para mostrar resultados.`)})}}catch(e){self.postMessage({type:`error`,error:e?.message||String(e)})}}})();