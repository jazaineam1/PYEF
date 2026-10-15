import {readdirSync,readFileSync,statSync} from 'node:fs'
import {join} from 'node:path'

const root='src/v2/dean'
const walk=dir=>readdirSync(dir).sort().flatMap(name=>{
 const path=join(dir,name)
 return statSync(path).isDirectory()?walk(path):[path]
})

// Concatenated text of every source under src/v2/dean/** (the Copa was one file before T0.1).
export const deanFiles=(ext=/\.(jsx?|mjs)$/)=>walk(root).filter(p=>ext.test(p))
export const readDeanSources=(ext)=>deanFiles(ext).map(p=>readFileSync(p,'utf8')).join('\n')
export const readDeanStyles=()=>readDeanSources(/\.css$/)
