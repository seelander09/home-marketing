'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { CTA } from '@/lib/cms/types'
import { cn } from '@/lib/utils'

export function MainNav({ items, cta }: { items: CTA[]; cta: CTA }) {
  const [open, setOpen] = useState(false)

  return (
    <nav className="relative">
      <button
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white lg:hidden"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="mobile-nav"
      >
        <span className="sr-only">Toggle navigation</span>
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
        </svg>
      </button>
      <div
        id="mobile-nav"
        className={cn(
          'absolute right-0 top-16 z-30 flex w-[280px] flex-col gap-4 rounded-3xl border border-white/10 bg-brand-navy/95 p-6 shadow-2xl backdrop-blur-lg transition-all lg:hidden',
          open ? 'visible opacity-100' : 'pointer-events-none invisible opacity-0'
        )}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-lg font-semibold text-white hover:text-brand-orange"
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <Link href={cta.href} className="btn btn-primary" onClick={() => setOpen(false)}>
          {cta.label}
        </Link>
      </div>
      <ul className="hidden items-center gap-8 text-sm font-semibold text-white lg:flex">
        {items.map((item) => (
          <li key={item.href}>
            <Link className="hover:text-brand-orange focus-ring" href={item.href}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
