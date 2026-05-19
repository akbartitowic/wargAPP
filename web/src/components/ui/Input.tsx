import type { InputHTMLAttributes } from 'react'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name ?? label.replace(/\s+/g, '-').toLowerCase()
  return (
    <div className="flex w-full flex-col gap-1 text-left">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-royal/90"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`min-h-12 w-full rounded-xl border bg-surface px-3 text-royal placeholder:text-muted/70 focus-visible:border-royal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-royal/40 ${
          error ? 'border-danger' : 'border-royal/15'
        } ${className}`.trim()}
        {...props}
      />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
