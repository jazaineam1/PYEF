import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const page = (name) => fileURLToPath(new URL(`./src/pages/${name}`, import.meta.url))

export default defineConfig(({ mode }) => {
  const secure = mode === 'secure'
  return {
    plugins:[react()],
    base:'./',
    resolve:{
      alias:{
        '#play': page(secure ? 'SecurePlayLearning.jsx' : 'DemoPlay.jsx'),
        '#facilitator': page(secure ? 'SecureFacilitator.jsx' : 'DemoFacilitator.jsx'),
        '#wall': page(secure ? 'SecureWall.jsx' : 'DemoWall.jsx'),
      }
    },
    build:{
      rollupOptions:{
        input:{
          index:'index.html',
          play:'play.html',
          facilitator:'facilitator.html',
          wall:'wall.html',
          systemCheck:'system-check.html'
        }
      }
    }
  }
})
