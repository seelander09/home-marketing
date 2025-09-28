import Image from 'next/image'
import type { AboutPagePayload } from '@/lib/cms/types'

export function LeadershipGrid({ leaders }: { leaders: AboutPagePayload['leadership'] }) {
  return (
    <section className="section bg-surface-subtle">
      <div className="container">
        <h2 className="text-3xl font-semibold text-brand-navy">Leadership team</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {leaders.map((leader) => (
            <div key={leader.name} className="rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card">
              <div className="relative h-48 w-full overflow-hidden rounded-3xl">
                {leader.image ? (
                  <Image src={leader.image} alt={leader.name} fill className="object-cover" />
                ) : (
                  <div className="h-full w-full bg-brand-sand" />
                )}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-brand-navy">{leader.name}</h3>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-orange">{leader.title}</p>
              <p className="mt-3 text-sm text-brand-navy/70">{leader.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
