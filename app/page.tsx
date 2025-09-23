import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { PropertyGrid } from '@/components/PropertyGrid'
import { ContactForm } from '@/components/ContactForm'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <PropertyGrid />
      <ContactForm />
    </main>
  )
}
