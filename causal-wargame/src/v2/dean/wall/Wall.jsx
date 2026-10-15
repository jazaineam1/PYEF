import React from 'react';
import DeanCausalAtlas from '../../DeanCausalAtlas.jsx';
import{useBoard}from'../useBoard.js';
import DeanShell from'../Shell.jsx';
import Board from'../Board.jsx';
import CupQuiz from'../CupQuiz.jsx';
import DeanGuidance from'../Guidance.jsx';
import'./wall.css';

export default function Wall(){const {value,error}=useBoard();return <DeanShell role="wall" kind="WALL · PROYECCIÓN" phase={value?.phase} groups={value?.groups} className="dean-wall">{value?.available?<main><h2>¿Qué sala dominará el semestre?</h2><Board groups={value.groups}/>{value.dgp_version==='zip_dgp_2026'&&['rector','survey','causal'].includes(value.phase)?<DeanCausalAtlas phase={value.phase}/>:<DeanGuidance phase={value.phase} role="wall"/>}{value.phase==='final'&&<CupQuiz role="wall"/>}</main>:<main className="dean-hero"><h2>🎓 Esperando la Copa del Decano</h2></main>}{error&&<p className="dean-error">{error}</p>}</DeanShell>}
