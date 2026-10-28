import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react'
import type { AreaUnit } from '../lib/format'
import { initialState, reducer, type Action, type AppState } from './reducer'

const UNIT_KEY = 'floodlens.areaUnit'

const readUnit = (): AreaUnit => {
  try {
    const v = localStorage.getItem(UNIT_KEY)
    return v === 'acres' || v === 'km2' ? v : initialState.areaUnit
  } catch {
    return initialState.areaUnit
  }
}

const StateCtx = createContext<AppState | null>(null)
const DispatchCtx = createContext<Dispatch<Action> | null>(null)

export function AppStateProvider({ children, initial }: { children: ReactNode; initial?: Partial<AppState> }) {
  const [state, dispatch] = useReducer(reducer, null, () => ({ ...initialState, areaUnit: readUnit(), ...initial }))

  useEffect(() => {
    try {
      localStorage.setItem(UNIT_KEY, state.areaUnit)
    } catch {
      /* storage unavailable (private mode): the unit just isn't remembered */
    }
  }, [state.areaUnit])

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  )
}

export function useAppState(): AppState {
  const s = useContext(StateCtx)
  if (!s) throw new Error('useAppState must be used inside <AppStateProvider>')
  return s
}

export function useAppDispatch(): Dispatch<Action> {
  const d = useContext(DispatchCtx)
  if (!d) throw new Error('useAppDispatch must be used inside <AppStateProvider>')
  return d
}
