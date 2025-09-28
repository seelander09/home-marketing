"use client"

import { useEffect, useMemo, useState } from 'react'
import type { FAQItem, RoiScenario } from '@/lib/cms/types'
import { Textarea } from '@/components/ui/Input'\nimport { Button } from '@/components/ui/Button'\nimport { formatNumber } from '@/lib/utils'

const ROI_STORAGE_KEY = 'smartlead-roi-result'

type ChatMessage = {
  from: 'user' | 'bot'
  text: string
}

type ChatContext = {
  faqs: FAQItem[]
  caseStudies: Array<{ title: string; summary?: string; market?: string; pdfAssetId?: string }>
  markets: Array<{ name: string; marketType: string; inventoryLevel: string; caseStudyTitle?: string; pdfAssetId?: string }>
  roiScenarios: RoiScenario[]
}

type StoredRoi = {
  scenarioLabel: string
  monthlyBudget: number
  households: number
  revenue: number
  influencedDeals: number
  adjustedWinRate: number
  roi: number
}

const defaultContext: ChatContext = {
  faqs: [],
  caseStudies: [],
  markets: [],
  roiScenarios: []
}

export function ChatAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [context, setContext] = useState<ChatContext>(defaultContext)
  const [roiSnapshot, setRoiSnapshot] = useState<StoredRoi | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: 'bot',
      text: 'Hi there! I can highlight ROI benchmarks, featured territories, or connect you with a strategist.'
    }
  ])

  useEffect(() => {
    fetch('/api/chat/context')
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then((data: ChatContext) => {
        setContext({
          faqs: data.faqs ?? [],
          caseStudies: data.caseStudies ?? [],
          markets: data.markets ?? [],
          roiScenarios: data.roiScenarios ?? []
        })
      })
      .catch(() => {
        setContext(defaultContext)
      })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const hydrate = () => {
      try {
        const raw = window.localStorage.getItem(ROI_STORAGE_KEY)
        if (!raw) {
          setRoiSnapshot(null)
          return
        }
        setRoiSnapshot(JSON.parse(raw) as StoredRoi)
      } catch (error) {
        setRoiSnapshot(null)
      }
    }

    hydrate()
    const onStorage = (event: StorageEvent) => {
      if (event.key === ROI_STORAGE_KEY) {
        hydrate()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggle = () => setOpen((prev) => !prev)

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim()) return

    const userText = input.trim()
    const response = buildResponse(userText.toLowerCase(), context, roiSnapshot)
    setMessages((prev) => [...prev, { from: 'user', text: userText }, { from: 'bot', text: response }])
    setInput('')
  }

  const containerClasses = useMemo(
    () =>
      open
        ? 'translate-y-0 opacity-100 pointer-events-auto'
        : 'translate-y-6 opacity-0 pointer-events-none',
    [open]
  )

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        type="button"
        className="btn btn-primary shadow-card"
        onClick={toggle}
        aria-expanded={open}
      >
        {open ? 'Close concierge' : 'Ask SmartLead'}
      </button>
      <div
        className={mt-4 w-80 rounded-3xl border border-brand-navy/10 bg-white p-4 shadow-card transition-all duration-200 }
      >
        <div className="max-h-64 space-y-3 overflow-y-auto pr-2 text-sm text-brand-navy/80">
          {messages.map((message, index) => (
            <div
              key={${message.from}-}
              className={
                message.from === 'bot'
                  ? 'rounded-2xl bg-surface-subtle p-3'
                  : 'rounded-2xl bg-brand-turquoise/10 p-3 text-brand-navy'
              }
            >
              {message.text}
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="mt-3 space-y-2">
          <Textarea
            rows={2}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about ROI, proof points, or next steps…"
          />
          <div className="flex items-center justify-between text-xs text-brand-navy/40">
            <span>{roiSnapshot ? 'ROI data synced' : 'ROI data not yet captured'}</span>
            <Button type="submit" className="px-4 py-2 text-sm" variant="primary">
              Send
            </Button>
          </div>
        </form>
        <p className="mt-2 text-xs text-brand-navy/50">
          Need a human? Mention “handoff” and I’ll schedule time with a strategist.
        </p>
      </div>
    </div>
  )
}

function buildResponse(message: string, context: ChatContext, roiSnapshot: StoredRoi | null) {
  if (message.includes('handoff') || message.includes('call') || message.includes('demo')) {
    return 'I can loop in a strategist right away. Share your territory and preferred time on the demo form and we will confirm within one business day.'
  }

  if (message.includes('case') || message.includes('proof') || message.includes('success')) {
    const highlights = context.caseStudies.slice(0, 2)
    if (highlights.length) {
      const details = highlights
        .map((item) => {
          const link = item.pdfAssetId ?  — download at /downloads/.pdf : ''
          return •  () 
        })
        .join('\n')
      return Here are a couple of SmartLead wins you might like:\n
    }
  }

  if (roiSnapshot && (message.includes('roi') || message.includes('return') || message.includes('budget'))) {
    return Based on your  scenario,  listings a year translate to ~{formatNumber(roiSnapshot.revenue)} in influenced revenue and a x return. Ready for a tailored walkthrough?
  }

  const marketMatch = context.markets.find((market) => message.includes(market.marketType.toLowerCase()) || message.includes(market.inventoryLevel.toLowerCase()))
  if (marketMatch) {
    const extra = marketMatch.pdfAssetId ? You can grab the full case study at /downloads/.pdf. : ''
    return ${marketMatch.name} is a  partner thriving in a  inventory environment. 
  }

  const faq = context.faqs.find((item) => item.question.toLowerCase().includes(message))
  if (faq) {
    return ${faq.answer}\nWant to dig deeper? I can share dashboards or schedule a strategist.
  }

  if (context.faqs.length) {
    return ${context.faqs[0].answer}\nAsk about ROI, case studies, or request a strategist whenever you're ready.
  }

  return 'Happy to help! Ask about ROI, market proof, or say “handoff” when you want to speak with a strategist.'
}

