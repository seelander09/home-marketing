import type { Feature } from '@/lib/cms/types'
import { Card } from '@/components/ui/Card'

const iconMap: Record<string, string> = {
  target: 'M12 19.5a7.5 7.5 0 1 0-7.5-7.5',
  spark: 'M12 3v4m0 10v4m7.07-10h-4m-6 0H4m10.607-6.607l-2.828 2.829m0 8.485 2.829 2.828m-8.486 0 2.829-2.828m0-8.485L5.515 5.515',
  workflow: 'M6 4.5h12M6 9.75h12m-12 5.25h7.5'
}

function Icon({ name }: { name: string }) {
  const path = iconMap[name] || iconMap.target
  return (
    <svg className="h-12 w-12 text-brand-turquoise" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

export function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <section className="section bg-white">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-brand-navy">Everything you need to own your market</h2>
          <p className="mt-4 text-lg text-brand-navy/70">
            Built from the SmartZip playbook with modern automation and predictive intelligence layered in.
          </p>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="h-full bg-white p-8">
              <Icon name={feature.icon} />
              <h3 className="mt-6 text-2xl font-semibold text-brand-navy">{feature.title}</h3>
              <p className="mt-4 text-base text-brand-navy/70">{feature.description}</p>
              {feature.bullets ? (
                <ul className="mt-6 space-y-2 text-sm text-brand-navy/70">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-[6px] inline-flex h-1.5 w-1.5 rounded-full bg-brand-orange" aria-hidden />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
