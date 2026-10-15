import React from 'react';
import{bannerContent}from'./content.js';
import DeanHud from'./hud/DeanHud.jsx';
import'./banner.css';
import'./shell.css';

export function Banner({kind,phase}){return <header className="dean-banner"><div><small>{bannerContent.brand}</small><h1>{bannerContent.title}</h1></div><div className="dean-banner-meta"><span>{kind}</span><b>{phase||bannerContent.defaultPhase}</b><small>{bannerContent.footnote}</small></div></header>}

// Single-screen grid: hud / stage / actions / drawer. Content still stacks inside stage (provisional scroll).
export default function DeanShell({role='student',kind,phase,groups,me,actions=null,drawer=null,className='',children}){
 return <div className={'dean-page dean-shell '+className} data-dean-role={role}>
  <div className="dean-shell-hud" data-dean-zone="hud"><Banner kind={kind} phase={phase}/><DeanHud groups={groups} me={me}/></div>
  <div className="dean-shell-stage" data-dean-zone="stage" data-dean-scroll="allowed">{children}</div>
  <div className="dean-shell-actions" data-dean-zone="actions">{actions}</div>
  <aside className="dean-shell-drawer" data-dean-zone="drawer">{drawer}</aside>
 </div>
}
