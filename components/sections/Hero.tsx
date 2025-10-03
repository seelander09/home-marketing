"use client"

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import CountUp from 'react-countup'
import { SmartLink } from '@/components/ui/SmartLink'
import { VideoModal } from '@/components/shared/VideoModal'
import type { HeroSection, Metric } from '@/lib/cms/types'
import { cn } from '@/lib/utils'

type HeroProps = {
  content: HeroSection
  metrics?: Metric[]
}

export function Hero({ content, metrics = [] }: HeroProps) {
  const [open, setOpen] = useState(false)
  const { eyebrow, heading, subheading, primaryCta, secondaryCta, video, backgroundImage } = content

  const metricGroups = useMemo(() => metrics.slice(0, 3), [metrics])

  return (
    <section className="relative overflow-hidden bg-brand-navy text-white">
      <div className="gradient-hero absolute inset-0" aria-hidden="true" />
      {backgroundImage ? (
        <Image src={backgroundImage} alt="Background" fill className="object-cover opacity-20" priority />
      ) : null}
      <div className="relative container flex flex-col gap-16 pb-24 pt-32 lg:flex-row lg:items-center">
        <div className="max-w-2xl space-y-6">
          <motion.span
            className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white/80"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {eyebrow}
          </motion.span>
          <motion.h1
            className="text-balance text-4xl font-bold leading-tight text-white sm:text-5xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {heading}
          </motion.h1>
          <motion.p
            className="text-lg text-white/80"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {subheading}
          </motion.p>
          <motion.div
            className="flex flex-col gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <SmartLink href={primaryCta.href} className="btn btn-primary">
              {primaryCta.label}
            </SmartLink>
            {secondaryCta ? (
              <SmartLink
                href={secondaryCta.href}
                className={cn(
                  'btn',
                  secondaryCta.variant === 'secondary'
                    ? 'btn-secondary'
                    : 'btn-secondary bg-white/15 text-white hover:bg-white/25'
                )}
              >
                {secondaryCta.label}
              </SmartLink>
            ) : null}
            {video ? (
              <button
                type="button"
                className="btn btn-secondary shrink-0 border border-white/40 bg-white/10 text-white hover:bg-white/20"
                onClick={() => setOpen(true)}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.5 5.5l7 4.5-7 4.5v-9z" />
                </svg>
                Watch overview
              </button>
            ) : null}
          </motion.div>
        </div>
        {metricGroups.length > 0 ? (
          <motion.div
            className="grid w-full max-w-lg grid-cols-1 gap-6 rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {metricGroups.map((metric) => (
              <div key={metric.label} className="rounded-2xl bg-white/5 p-6">
                <p className="text-sm uppercase tracking-wide text-white/60">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold">
                  {metric.prefix}
                  <CountUp
                    end={metric.value}
                    duration={2.1}
                    suffix={metric.suffix}
                    decimals={Number.isInteger(metric.value) ? 0 : 1}
                  />
                </p>
                {metric.description ? <p className="mt-2 text-sm text-white/70">{metric.description}</p> : null}
              </div>
            ))}
          </motion.div>
        ) : null}
      </div>
      {video ? <VideoModal open={open} onClose={() => setOpen(false)} video={video} /> : null}
    </section>
  )
}
