import { Brand } from './Brand'
import { runtimeMode } from '../lib/api'
export function Layout({children,subtitle,actions}){
  return <div className="app"><div className="shell"><div className="topbar"><Brand subtitle={subtitle}/><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><span className="pill">Modo <strong>{runtimeMode.toUpperCase()}</strong></span>{actions}</div></div>{children}<div className="footer">DOS FUTUROS · MVP v0.1 · Datos 100% sintéticos · Ningún dato real de cliente</div></div></div>
}
