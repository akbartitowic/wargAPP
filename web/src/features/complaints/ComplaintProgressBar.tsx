import type { ComplaintDetail, ComplaintProgress, ComplaintProgressStep } from '@/config/api/endpoints'

export function ComplaintProgressBar({
  progress,
  steps,
  statusLabel,
}: {
  progress: ComplaintProgress
  steps: ComplaintProgressStep[]
  statusLabel: string
}) {
  const barPercent = progress.is_rejected
    ? Math.max(
        8,
        (steps.filter((s) => s.reached).length / steps.length) * 100,
      )
    : progress.percent

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-royal">Status: {statusLabel}</span>
        {!progress.is_rejected && !progress.is_complete ? (
          <span className="text-muted">{progress.percent}%</span>
        ) : null}
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-royal/10"
        role="progressbar"
        aria-valuenow={barPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            progress.is_rejected
              ? 'bg-danger'
              : progress.is_complete
                ? 'bg-success'
                : 'bg-royal'
          }`}
          style={{ width: `${barPercent}%` }}
        />
      </div>

      <ol className="grid grid-cols-4 gap-1">
        {steps.map((step) => (
          <li key={step.status} className="flex flex-col items-center text-center">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                progress.is_rejected && step.current
                  ? 'bg-danger text-white'
                  : step.reached || step.current
                    ? 'bg-royal text-beige'
                    : 'bg-royal/10 text-royal/40'
              }`}
            >
              {progress.is_rejected && step.current ? '!' : step.reached || step.current ? '✓' : '·'}
            </span>
            <span
              className={`mt-1 text-[9px] font-semibold leading-tight ${
                step.current ? 'text-royal' : 'text-muted'
              }`}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      {progress.is_rejected ? (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
          Komplain ditolak pengurus.
        </p>
      ) : null}
    </div>
  )
}

export function ComplaintHistoryTimeline({
  history,
}: {
  history: ComplaintDetail['status_history']
}) {
  if (history.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-royal">Riwayat status</h3>
      <ul className="space-y-2 border-l-2 border-royal/15 pl-3">
        {history.map((h, i) => (
          <li key={`${h.status}-${h.created_at}-${i}`} className="relative">
            <span className="absolute -left-[0.9rem] top-1.5 h-2 w-2 rounded-full bg-royal" />
            <p className="text-xs font-semibold text-royal">{h.status_label}</p>
            <p className="text-[10px] text-muted">
              {new Intl.DateTimeFormat('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(h.created_at))}
            </p>
            {h.note ? <p className="mt-0.5 text-xs text-muted">{h.note}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
