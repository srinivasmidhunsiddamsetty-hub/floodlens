import { AlertTriangle, Loader2, MapPinOff } from 'lucide-react'

interface Props {
  ready: boolean
  fatal: string | null
  warning: string | null
  loading: boolean
  errors: string[]
  scenarioLabel: string
}

/** Loading, warning and error states for the map — announced politely to screen readers. */
export function MapStatus({ ready, fatal, warning, loading, errors, scenarioLabel }: Props) {
  if (fatal) {
    return (
      <div className="absolute inset-0 z-20 grid place-items-center bg-canvas p-6" role="alert">
        <div className="max-w-sm text-center">
          <MapPinOff className="mx-auto mb-3 size-8 text-fg-subtle" aria-hidden />
          <p className="text-sm font-medium text-fg">The map couldn’t load</p>
          <p className="mt-1 text-sm text-fg-muted">{fatal}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {!ready && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-canvas/80" role="status" aria-live="polite">
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <Loader2 className="size-4 animate-spin text-accent" aria-hidden />
            Loading the map and flood data…
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex flex-col items-center gap-2 px-14">
        <div role="status" aria-live="polite" className="contents">
          {ready && loading && (
            <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/95 px-3 py-1 text-xs text-fg-muted shadow-panel animate-fade-in">
              <Loader2 className="size-3.5 animate-spin text-accent" aria-hidden />
              Loading {scenarioLabel}…
            </span>
          )}
        </div>
        {(warning || errors.length > 0) && (
          <div
            role="alert"
            className="pointer-events-auto max-w-lg rounded-lg border border-compare/40 bg-surface/95 px-3 py-2 text-xs text-fg shadow-panel"
          >
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-compare-strong" aria-hidden />
              <div className="space-y-1">
                {warning && <p>{warning}</p>}
                {errors.map((e) => (
                  <p key={e}>{e} We’d rather leave it off the map than guess.</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
