let pyodide=null
let initPromise=null
let plottingReady=false
const PYODIDE_VERSION='0.27.7'
const PYODIDE_BASE=`https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

// Share boot work across simultaneous messages; ready only once packages are loaded.
function boot(){
  if(pyodide)return Promise.resolve(pyodide)
  if(initPromise)return initPromise
  initPromise=(async()=>{
    self.postMessage({type:'runtime_progress',stage:'core'})
    importScripts(PYODIDE_BASE+'pyodide.js')
    const runtime=await self.loadPyodide({indexURL:PYODIDE_BASE})
    self.postMessage({type:'runtime_progress',stage:'packages'})
    await runtime.loadPackage(['numpy','pandas','scikit-learn'])
    pyodide=runtime
    return runtime
  })().catch(err=>{initPromise=null;pyodide=null;throw err})
  return initPromise
}
async function ensurePlotting(code){
  if(plottingReady||!/(?:matplotlib|plt\.)/.test(code))return
  await pyodide.loadPackage('matplotlib')
  await pyodide.runPythonAsync("import matplotlib; matplotlib.use('Agg')")
  plottingReady=true
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
      await ensurePlotting(String(msg.code||''))
      pyodide.globals.set('payload_json',JSON.stringify(msg.context||{}))
      pyodide.globals.set('_user_code',String(msg.code||''))
      const raw=await pyodide.runPythonAsync(`
import io, json, sys, traceback, base64
payload = json.loads(payload_json)
_buffer = io.StringIO()
_old_stdout, _old_stderr = sys.stdout, sys.stderr
sys.stdout = _buffer
sys.stderr = _buffer
_image = None
_ok = True
_error = None
try:
    exec(_user_code, globals())
except Exception:
    _ok = False
    _error = traceback.format_exc()
finally:
    sys.stdout = _old_stdout
    sys.stderr = _old_stderr
try:
    if 'matplotlib.pyplot' in sys.modules:
        import matplotlib.pyplot as plt
        if plt.get_fignums():
            _img = io.BytesIO()
            plt.gcf().savefig(_img, format="png", dpi=120, bbox_inches="tight")
            _image = "data:image/png;base64," + base64.b64encode(_img.getvalue()).decode("ascii")
            plt.close("all")
except Exception:
    pass
json.dumps({"ok": _ok, "output": _buffer.getvalue(), "error": _error, "image": _image})
`)
      pyodide.globals.delete('payload_json')
      pyodide.globals.delete('_user_code')
      const parsed=JSON.parse(String(raw||'{}'))
      if(parsed.ok===false){
        self.postMessage({
          type:'execution_error',
          requestId:msg.requestId||null,
          output:parsed.output||'',
          error:parsed.error||'Error ejecutando el código Python.'
        })
      }else{
        self.postMessage({
          type:'result',
          requestId:msg.requestId||null,
          output:parsed.output||'Sin salida. Usa print(...) para mostrar resultados.',
          image:parsed.image||null
        })
      }
    }
  }catch(error){
    self.postMessage({type:'error',requestId:event.data?.requestId||null,error:error?.message||String(error)})
  }
}
