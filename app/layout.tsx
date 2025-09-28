import type { Metadata } from 'next'
import { Nunito, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { getGlobalSettings } from '@/lib/cms/getContent'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { siteConfig } from '@/lib/config/site'
import { CookieConsent } from '@/components/layout/CookieConsent'
import { ExitIntentModal } from '@/components/layout/ExitIntentModal'
import { ChatAssistant } from '@/components/layout/ChatAssistant'
import { TagManager } from '@/components/layout/TagManager'
import { getConsentFromCookies } from '@/lib/analytics/consent'

const nunito = Nunito({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display', display: 'swap' })

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getGlobalSettings()
  const title = settings.seo?.title || siteConfig.name
  const description = settings.seo?.description || siteConfig.description

  return {
    metadataBase: new URL('https://smartlead.example.com'),
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`
    },
    description,
    keywords: settings.seo?.keywords,
    openGraph: {
      title,
      description,
      url: 'https://smartlead.example.com',
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.defaultOgImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  }
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const settings = await getGlobalSettings()
  const navigation = settings.navigation?.length ? settings.navigation : siteConfig.navigation
  const cta = settings.primaryCta || siteConfig.ctas.primary
  const consent = getConsentFromCookies()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${nunito.variable} ${plusJakarta.variable} bg-surface text-brand-midnight`}>
        <TagManager consent={consent} />
        <div className="flex min-h-screen flex-col">
          <Header navigation={navigation} cta={cta} />
          <main className="flex-1 pt-24">{children}</main>
          <Footer
            headline={settings.footer.headline}
            description={settings.footer.description}
            cta={settings.footer.cta}
            social={settings.footer.social}
            legal={settings.footer.legal}
          />
        </div>
        <CookieConsent />
        <ExitIntentModal />
        <ChatAssistant />
      </body>
    </html>
  )
}
