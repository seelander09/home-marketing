import type { GuideOffer } from '@/lib/cms/types'
import { GuideDownloadForm } from '@/components/forms/GuideDownloadForm'

export function GuideOfferSection({ guide }: { guide: GuideOffer }) {
  return (
    <section className="section">
      <div className="container grid gap-12 rounded-3xl bg-brand-navy px-8 py-16 text-white shadow-card lg:grid-cols-[1.5fr,1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Gated guide</p>
          <h2 className="mt-4 text-3xl font-semibold">{guide.title}</h2>
          <p className="mt-4 text-lg text-white/75">{guide.description}</p>
          <p className="mt-6 text-sm text-white/70">Unlock instant access by completing the short form.</p>
        </div>
        <div className="rounded-3xl border border-white/20 bg-white/10 p-6 text-sm text-white/80">
          <p className="font-semibold uppercase tracking-wide text-white">Unlock the guide</p>
          <GuideDownloadForm assetId={guide.assetId} />
          <hr className="my-6 border-white/10" />
          <p className="font-semibold uppercase tracking-wide text-white">Inside the playbook</p>
          <ul className="mt-4 space-y-3">
            <li>- Territory intelligence formulas for 2025 markets</li>
            <li>- Seller nurture templates from top-performing agents</li>
            <li>- Attribution dashboard to track ROI</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
