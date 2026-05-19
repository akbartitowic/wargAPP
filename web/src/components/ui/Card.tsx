import type { HTMLAttributes, ReactNode } from 'react'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  /** Padding ringan vs default */
  dense?: boolean
}

export function Card({
  children,
  className = '',
  dense,
  ...props
}: CardProps) {
  const pad = dense ? 'p-3' : 'p-4 sm:p-5'
  return (
    <div
      className={`surface-card ${pad} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}
