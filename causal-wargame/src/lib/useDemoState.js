import { useEffect, useState } from 'react'
import { readState, subscribe } from '../demo/store'

export function useDemoState() {
  const [state, setState] = useState(() => readState())
  useEffect(() => subscribe(setState), [])
  return state
}
