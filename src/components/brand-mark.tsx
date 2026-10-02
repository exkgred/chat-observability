interface BrandMarkProps {
  size?: number
  className?: string
  wordmark?: boolean
}

export function BrandMark({ size = 32, className, wordmark = true }: BrandMarkProps) {
  return (
    <span className={['inline-flex items-center gap-2 font-semibold tracking-tight', className].filter(Boolean).join(' ')}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id="obs-mark" x1="6" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4f8ef7" />
            <stop offset="1" stopColor="#7c5af7" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="10" fill="url(#obs-mark)" />
        <path
          d="M8.5 11.2c0-1.7 1.4-3.1 3.1-3.1h8.8c1.7 0 3.1 1.4 3.1 3.1v7.2c0 1.7-1.4 3.1-3.1 3.1h-4.2L11 24.2v-2.7h-.4c-1.7 0-3.1-1.4-3.1-3.1v-7.2Z"
          fill="white"
        />
        <circle cx="13.2" cy="14.4" r="1.15" fill="#4f8ef7" />
        <circle cx="16.4" cy="14.4" r="1.15" fill="#7c5af7" />
        <circle cx="19.6" cy="14.4" r="1.15" fill="#4f8ef7" />
      </svg>
      {wordmark ? <span>Chat Observability</span> : null}
    </span>
  )
}
