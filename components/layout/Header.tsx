import { Logo } from '@/components/layout/Logo'
import { MainNav } from '@/components/layout/MainNav'
import { SmartLink } from '@/components/ui/SmartLink'
import type { CTA } from '@/lib/cms/types'

export function Header({ navigation, cta }: { navigation: CTA[]; cta: CTA }) {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="container flex items-center justify-between py-6">
        <Logo />
        <div className="flex items-center gap-6">
          <MainNav items={navigation} cta={cta} />
          <SmartLink href={cta.href} className="btn btn-primary hidden lg:inline-flex">
            {cta.label}
          </SmartLink>
        </div>
      </div>
    </header>
  )
}
