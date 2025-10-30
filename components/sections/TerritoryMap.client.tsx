"use client"

import { useMemo } from 'react'
import type { TerritoryDatasetEntry } from '@/lib/cms/types'
import { OpportunityMap } from '@/components/maps'
import { listAllPropertyOpportunities } from '@/lib/insights/properties'

const DEFAULT_MIN_SCORE = 60
const DEFAULT_MIN_EQUITY = 200000

export function TerritoryMapClient({ dataset }: { dataset: TerritoryDatasetEntry[] }) {
  const properties = useMemo(() => listAllPropertyOpportunities(), [])

  return (
    <OpportunityMap
      properties={properties}
      territories={dataset}
      minScore={DEFAULT_MIN_SCORE}
      minEquity={DEFAULT_MIN_EQUITY}
      height={420}
      className="overflow-hidden rounded-3xl border border-brand-navy/10 shadow-card"
    />
  )
}
