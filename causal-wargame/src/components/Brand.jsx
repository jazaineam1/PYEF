import { GitBranch } from 'lucide-react'
export function Brand({subtitle='Causal Decision Simulation'}){
  return <div className="brand"><div className="brand-mark"><GitBranch size={22}/></div><div><h1>DOS FUTUROS</h1><small>{subtitle}</small></div></div>
}
