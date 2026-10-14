import React from'react'
import{createRoot}from'react-dom/client'
import'./v2/styles.css'
import'./v2/academic.css'
import V2Play from'./v2/V2Play.jsx'
import DeanModeGate from './v2/DeanModeGate.jsx'
createRoot(document.getElementById('root')).render(<DeanModeGate role="student"><V2Play/></DeanModeGate>)
