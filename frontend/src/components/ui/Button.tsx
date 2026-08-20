import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'cta' | 'ghost' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-white text-black font-semibold shadow-lg shadow-black/25 hover:opacity-90',
  cta: 'border border-white/10 bg-white/5 text-white backdrop-blur-xl hover:bg-white/10',
  ghost: 'bg-transparent border border-outline-variant text-white hover:bg-white/5',
  danger: 'bg-error text-on-error hover:bg-error/90 shadow-lg',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-label-md transition-all disabled:opacity-50 ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
