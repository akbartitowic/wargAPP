import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

const base =
  'inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50'

const variants = {
  primary:
    'bg-royal text-beige hover:bg-royal/90 focus-visible:outline-royal active:bg-royal/80',
  secondary:
    'border-2 border-royal bg-transparent text-royal hover:bg-royal/5 focus-visible:outline-royal',
  ghost: 'bg-transparent text-royal hover:bg-royal/10 focus-visible:outline-royal',
  danger: 'bg-danger text-white hover:bg-danger/90 focus-visible:outline-danger',
  success: 'bg-success text-white hover:bg-success/90 focus-visible:outline-success',
} as const

export type ButtonVariant = keyof typeof variants

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  children: ReactNode
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`.trim()}
      {...props}
    />
  )
}

export type ButtonLinkProps = Omit<LinkProps, 'className'> & {
  variant?: ButtonVariant
  className?: string
  children: ReactNode
}

export function ButtonLink({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={`${base} ${variants[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </Link>
  )
}
