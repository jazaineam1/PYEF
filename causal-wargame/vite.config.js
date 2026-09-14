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
        '#play': page(secure ? 'SecurePlayV6.jsx' : 'DemoPlay.jsx'),
        '#facilitator': page(secure ? 'SecureFacilitatorLearning.jsx' : 'DemoFacilitator.jsx'),
        '#wall': page(secure ? 'SecureWallLearning.jsx' : 'DemoWall.jsx'),
      }
    },
    build:{
      rollupOptions:{
        input:{
          index:'index.html',
          play:'play.html',
          facilitator:'facilitator.html',
          roleInspector:'role-inspector.html',
          wall:'wall.html',
          systemCheck:'system-check.html'
        }
      }
    }
  }
})
