import React from'react'
import{createRoot}from'react-dom/client'
import'./v2/styles.css'
import'./v2/academic.css'
import V2Wall from'./v2/V2Wall.jsx'
import DeanModeGate from './v2/DeanModeGate.jsx'
createRoot(document.getElementById('root')).render(<DeanModeGate role="wall"><V2Wall/></DeanModeGate>)
