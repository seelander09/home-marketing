import Link from 'next/link'

export function Logo({ className = 'text-white' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 font-display text-xl font-bold ${className}`}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-turquoise text-sm text-white">SL</span>
      <span>SmartLead</span>
    </Link>
  )
}
