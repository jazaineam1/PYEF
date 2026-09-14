import React,{Suspense,lazy}from'react';import{createRoot}from'react-dom/client';import'./styles.css';
const Secure=lazy(()=>import('./pages/SecureFacilitator.jsx'));const Demo=lazy(()=>import('./pages/DemoFacilitator.jsx'));const isSecure=import.meta.env.VITE_GAME_MODE==='secure';
function App(){const C=isSecure?Secure:Demo;return <Suspense fallback={<div style={{padding:30,color:'white'}}>Cargando consola…</div>}><C/></Suspense>}
createRoot(document.getElementById('root')).render(<App/>);
