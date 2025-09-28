import type { AboutPagePayload } from '@/lib/cms/types'
import { formatNumber } from '@/lib/utils'

export function StorySection({ story }: { story: AboutPagePayload['story'] }) {
  return (
    <section className="section bg-white">
      <div className="container grid gap-12 lg:grid-cols-[1.5fr,1fr]">
        <div>
          <h1 className="text-3xl font-semibold text-brand-navy">{story.heading}</h1>
          <p className="mt-6 text-lg text-brand-navy/75">{story.body}</p>
        </div>
        <div className="grid gap-6 rounded-3xl border border-brand-navy/10 bg-surface-subtle p-8">
          {story.stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl font-bold text-brand-navy">{formatNumber(stat.value)}</p>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-navy/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
