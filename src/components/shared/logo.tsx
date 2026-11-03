interface LogoProps {
  variant?: 'main' | 'minor'
  className?: string
}

export function Logo({ variant = 'main', className = '' }: LogoProps) {
  const src = variant === 'main' ? '/main-logo.png' : '/minor-logo.png'
  return <img src={src} alt="SmartTech Lab" className={className} />
}
