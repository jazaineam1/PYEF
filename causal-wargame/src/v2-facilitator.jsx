import React from'react'
import{createRoot}from'react-dom/client'
import'./v2/styles.css'
import'./v2/academic.css'
import V2Facilitator from'./v2/V2Facilitator.jsx'
import DeanModeGate from './v2/DeanModeGate.jsx'
createRoot(document.getElementById('root')).render(<DeanModeGate role="teacher">
 <div style={{padding:'12px 18px',background:'#113f42',color:'#effff8',fontFamily:'system-ui',
  display:'flex',gap:15,justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'}}>
  <strong>🏆 CAMPUS V2 · LA COPA DEL DECANO · 30 PERSONAS</strong>
  <a style={{color:'#a5ffdd',fontWeight:800,fontSize:16}}
    href={'./dean-teacher.html?game='+encodeURIComponent(new URLSearchParams(location.search).get('game')||sessionStorage.getItem('df_facilitator_game_code')||'FUTUROS')}>
    Crear o gestionar Copa del Decano →
  </a>
 </div>
 <V2Facilitator/>
 </DeanModeGate>)
