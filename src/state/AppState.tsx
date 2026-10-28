import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import { initialState, reducer, type Action, type AppState } from './reducer'

const StateCtx = createContext<AppState | null>(null)
const DispatchCtx = createContext<Dispatch<Action> | null>(null)

export function AppStateProvider({ children, initial }: { children: ReactNode; initial?: Partial<AppState> }) {
  const [state, dispatch] = useReducer(reducer, { ...initialState, ...initial })
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
