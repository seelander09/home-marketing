import Link from 'next/link'
import type { ProductPagePayload } from '@/lib/cms/types'
import { Card } from '@/components/ui/Card'

export function ProductPackages({ packages }: { packages: ProductPagePayload['packages'] }) {
  return (
    <section id="packages" className="section bg-white">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold text-brand-navy">Choose the program built for your growth stage</h2>
          <p className="mt-4 text-base text-brand-navy/70">
            SmartLead packages mirror SmartZip offerings with deeper automation, analytics, and partner enablement.
          </p>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {packages.map((pack) => (
            <Card key={pack.name} className="flex h-full flex-col bg-white p-8">
              <h3 className="text-2xl font-semibold text-brand-navy">{pack.name}</h3>
              <p className="mt-3 text-sm uppercase tracking-wide text-brand-orange">{pack.priceHint}</p>
              <p className="mt-4 text-base text-brand-navy/70">{pack.description}</p>
              <ul className="mt-6 space-y-3 text-sm text-brand-navy/70">
                {pack.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-turquoise" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={pack.cta.href} className="btn btn-primary mt-auto inline-flex">
                {pack.cta.label}
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
