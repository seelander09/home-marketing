import Image from 'next/image'

export function LogoCarousel({ logos }: { logos: string[] }) {
  return (
    <section className="section bg-surface-subtle">
      <div className="container">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-brand-navy/60">
          Trusted by top-performing teams
        </p>
        <div className="mt-8 grid grid-cols-2 items-center gap-8 opacity-80 sm:grid-cols-3 lg:grid-cols-5">
          {logos.map((logo) => (
            <div key={logo} className="relative mx-auto h-12 w-36">
              <Image src={logo} alt="Client logo" fill className="object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
