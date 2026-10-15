import fs from 'node:fs/promises'
import path from 'node:path'

export default async function teardown() {
  const root = path.resolve('artifacts/visual')
  const files = []
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) await walk(full)
      else if (entry.name.endsWith('.png')) files.push(full)
    }
  }
  await walk(root)
  const rows = files.sort().map((file) => {
    const rel = path.relative(root, file).replaceAll(path.sep, '/')
    const metric = rel.replace(/\.png$/, '.metrics.json')
    return `<figure><a href="${rel}"><img loading="lazy" src="${rel}" alt="${rel}"></a><figcaption>${rel}<br><a href="${metric}">metrics</a></figcaption></figure>`
  }).join('\n')
  await fs.mkdir(root, { recursive: true })
  await fs.writeFile(path.join(root, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Copa V3 · hoja de contactos</title><style>body{font:14px system-ui;background:#101827;color:#eef;padding:20px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}figure{margin:0;background:#1d2b40;padding:8px;border-radius:8px}img{display:block;width:100%;height:auto}a{color:#9ff}figcaption{padding:8px 2px;word-break:break-word}</style><h1>Arnés visual Copa del Decano V3</h1><p>${files.length} capturas · fixtures locales · sin red</p><main>${rows}</main>\n`, 'utf8')
}
