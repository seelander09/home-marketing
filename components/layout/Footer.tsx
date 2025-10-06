import { Logo } from '@/components/layout/Logo'
import { SmartLink } from '@/components/ui/SmartLink'
import type { CTA } from '@/lib/cms/types'

export function Footer({
  headline,
  description,
  cta,
  social,
  legal
}: {
  headline: string
  description: string
  cta: CTA
  social: CTA[]
  legal: CTA[]
}) {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-brand-midnight text-white">
      <div className="container grid gap-12 py-16 lg:grid-cols-[2fr,1fr,1fr]">
        <div className="space-y-6">
          <Logo />
          <h2 className="text-2xl font-semibold text-white">{headline}</h2>
          <p className="max-w-xl text-base text-white/70">{description}</p>
          <SmartLink href={cta.href} className="btn btn-primary inline-flex">
            {cta.label}
          </SmartLink>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Connect</h3>
          <ul className="mt-4 space-y-2 text-white/70">
            {social.map((item) => (
              <li key={item.href}>
                <SmartLink className="hover:text-brand-orange" href={item.href}>
                  {item.label}
                </SmartLink>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Legal</h3>
          <ul className="mt-4 space-y-2 text-white/60">
            {legal.map((item) => (
              <li key={item.href}>
                <SmartLink className="hover:text-brand-orange" href={item.href}>
                  {item.label}
                </SmartLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6">
        <div className="container flex flex-col gap-2 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} SmartLead Marketing. All rights reserved.</p>
          <SmartLink href="/accessibility" className="hover:text-brand-orange">
            Accessibility Statement
          </SmartLink>
        </div>
      </div>
    </footer>
  )
}
