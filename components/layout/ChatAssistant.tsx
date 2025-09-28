"use client"

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'

const answers: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ['territory', 'availability'],
    response: 'SmartLead maintains exclusivity limits in each ZIP. Use the territory checker above or request a custom analysis and our strategists will confirm availability within one business day.'
  },
  {
    keywords: ['pricing', 'cost'],
    response: 'Plans start at /mo for SmartTargeting, ,299/mo for Reach Omnichannel, and enterprise pricing for Insights+. We scope exact pricing after territory and media mix reviews.'
  },
  {
    keywords: ['crm', 'integrations'],
    response: 'We integrate with HubSpot, Salesforce, Follow Up Boss, BoomTown, Chime, and 40+ more platforms via native connectors and webhooks.'
  },
  {
    keywords: ['guides', 'resources', 'playbook'],
    response: 'You can unlock the 2025 Seller Playbook from the guide section or subscribe to the Listing Intelligence Brief for weekly campaign templates.'
  }
]

function resolveAnswer(message: string) {
  const normalized = message.toLowerCase()
  const match = answers.find((candidate) => candidate.keywords.some((kw) => normalized.includes(kw)))
  return match?.response ?? "Thanks for reaching out! Share a few details and I'll route this to a SmartLead strategist who will reply shortly."
}

export function ChatAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<{ from: 'user' | 'bot'; text: string }>>([
    { from: 'bot', text: 'Hi there! Want help scoping SmartLead for your market?' }
  ])

  const toggle = () => setOpen((prev) => !prev)

  const handleSend = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim()) return
    const userMessage = input.trim()
    const botMessage = resolveAnswer(userMessage)
    setMessages((prev) => [...prev, { from: 'user', text: userMessage }, { from: 'bot', text: botMessage }])
    setInput('')
  }

  const containerClass = useMemo(
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
        {open ? 'Close concierge' : 'Ask SmartLead' }
      </button>
      <div
        className={mt-4 w-80 rounded-3xl border border-brand-navy/10 bg-white p-4 shadow-card transition-all duration-200 }
      >
        <div className="max-h-64 space-y-3 overflow-y-auto pr-2 text-sm text-brand-navy/80">
          {messages.map((message, index) => (
            <div key={index} className={message.from === 'bot' ? 'rounded-2xl bg-surface-subtle p-3' : 'rounded-2xl bg-brand-turquoise/10 p-3 text-brand-navy'}>
              {message.text}
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="mt-3 space-y-2">
          <Textarea
            rows={2}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about pricing, territories, integrations…"
          />
          <Button type="submit" className="w-full">
            Send
          </Button>
        </form>
        <p className="mt-2 text-xs text-brand-navy/50">
          Live chat escalates to a strategist when you request a demo or territory analysis.
        </p>
      </div>
    </div>
  )
}
