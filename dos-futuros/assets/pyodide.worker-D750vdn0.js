(function(){let e=null,t=`https://cdn.jsdelivr.net/pyodide/v0.27.7/full/`;async function n(){e||(importScripts(t+`pyodide.js`),e=await self.loadPyodide({indexURL:t}),await e.loadPackage([`numpy`,`pandas`,`scipy`,`scikit-learn`,`matplotlib`]),await e.runPythonAsync(`import matplotlib; matplotlib.use('Agg')`))}self.onmessage=async t=>{let r=t.data||{};try{if(r.type===`init`){await n(),self.postMessage({type:`ready`});return}if(r.type===`run`){await n(),e.globals.set(`payload_json`,JSON.stringify(r.context||{})),e.globals.set(`_user_code`,String(r.code||``));let t=await e.runPythonAsync(`
import io, json, sys, traceback, base64
payload = json.loads(payload_json)
_buffer = io.StringIO()
_old_stdout, _old_stderr = sys.stdout, sys.stderr
sys.stdout = _buffer
sys.stderr = _buffer
_image = None
try:
    exec(_user_code, globals())
except Exception:
    traceback.print_exc()
finally:
    sys.stdout = _old_stdout
    sys.stderr = _old_stderr
try:
    import matplotlib.pyplot as plt
    if plt.get_fignums():
        _img = io.BytesIO()
        plt.gcf().savefig(_img, format="png", dpi=120, bbox_inches="tight")
        _image = "data:image/png;base64," + base64.b64encode(_img.getvalue()).decode("ascii")
        plt.close("all")
except Exception:
    pass
json.dumps({"output": _buffer.getvalue(), "image": _image})
`);e.globals.delete(`payload_json`),e.globals.delete(`_user_code`);let i=JSON.parse(String(t||`{}`));self.postMessage({type:`result`,requestId:r.requestId||null,output:i.output||`Sin salida. Usa print(...) para mostrar resultados.`,image:i.image||null})}}catch(e){self.postMessage({type:`error`,requestId:t.data?.requestId||null,error:e?.message||String(e)})}}})();