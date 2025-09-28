"use client"

import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import type { ProofExplorerConfig, ProofMarket } from '@/lib/cms/types'
import 'leaflet/dist/leaflet.css'

const inventoryColor: Record<string, string> = {
  Tight: '#FF564F',
  Balanced: '#0BADD5',
  'High turnover': '#4DD4AC'
}

const defaultCenter = { lat: 38, lng: -97 }

function getColor(level: string) {
  return inventoryColor[level] || '#0BADD5'
}

export function CustomerProofExplorerClient({ config }: { config: ProofExplorerConfig }) {
  const [marketType, setMarketType] = useState<string>('All')
  const [inventoryLevel, setInventoryLevel] = useState<string>('All')

  const filteredMarkets = useMemo(() => {
    return config.markets.filter((market) => {
      const matchesType = marketType === 'All' || market.marketType === marketType
      const matchesInventory = inventoryLevel === 'All' || market.inventoryLevel === inventoryLevel
      return matchesType && matchesInventory
    })
  }, [config.markets, marketType, inventoryLevel])

  const center = useMemo(() => {
    if (!filteredMarkets.length) {
      return defaultCenter
    }
    const lat = filteredMarkets.reduce((acc, market) => acc + market.latitude, 0) / filteredMarkets.length
    const lng = filteredMarkets.reduce((acc, market) => acc + market.longitude, 0) / filteredMarkets.length
    return { lat, lng }
  }, [filteredMarkets])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <FilterGroup
          label="Market type"
          options={['All', ...config.marketTypes]}
          active={marketType}
          onSelect={setMarketType}
        />
        <FilterGroup
          label="Inventory"
          options={['All', ...config.inventoryLevels]}
          active={inventoryLevel}
          onSelect={setInventoryLevel}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
        <div className="h-[420px] overflow-hidden rounded-3xl border border-brand-navy/10 shadow-card">
          <MapContainer
            key={${marketType}-}
            center={[center.lat, center.lng]}
            zoom={filteredMarkets.length > 1 ? 5 : 7}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredMarkets.map((market) => (
              <CircleMarker
                key={${market.city}-}
                center={[market.latitude, market.longitude]}
                radius={12}
                weight={2}
                color={getColor(market.inventoryLevel)}
                fillOpacity={0.65}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <div className="space-y-1">
                    <p className="font-semibold">{market.name}</p>
                    <p className="text-sm text-brand-navy/70">
                      {market.city}, {market.state} · {market.marketType}
                    </p>
                    <p className="text-xs text-brand-navy/60">
                      Seller intent score {market.sellerIntentScore} · Avg days on market {market.avgDaysOnMarket}
                    </p>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        <div className="space-y-4">
          {filteredMarkets.map((market) => (
            <MarketCard key={${market.name}-} market={market} />
          ))}
          {!filteredMarkets.length ? (
            <p className="rounded-3xl border border-brand-navy/10 bg-surface-subtle p-5 text-sm text-brand-navy/70">
              No territories match those filters yet. Try a different combination or request a custom market analysis.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function FilterGroup({
  label,
  options,
  active,
  onSelect
}: {
  label: string
  options: string[]
  active: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={ounded-full px-4 py-2 text-xs font-semibold transition }
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function MarketCard({ market }: { market: ProofMarket }) {
  return (
    <div className="rounded-3xl border border-brand-navy/10 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-navy">{market.name}</p>
          <p className="text-xs text-brand-navy/50">
            {market.city}, {market.state} · {market.marketType}
          </p>
        </div>
        <span className="rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-semibold text-brand-orange">
          {market.inventoryLevel}
        </span>
      </div>
      <ul className="mt-3 grid gap-1 text-xs text-brand-navy/70">
        <li>Seller intent score {market.sellerIntentScore}</li>
        <li>Avg. days on market {market.avgDaysOnMarket}</li>
        <li>Closed volume M</li>
      </ul>
      {market.caseStudySummary ? (
        <p className="mt-3 text-sm text-brand-navy/80">{market.caseStudySummary}</p>
      ) : null}
      {market.pdfAssetId ? (
        <a className="btn btn-secondary mt-4 inline-flex" href={/downloads/.pdf} download>
          Download case study
        </a>
      ) : null}
    </div>
  )
}
