"use client"

import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import type { ProofExplorerConfig, ProofMarket } from '@/lib/cms/types'
import { cn, formatNumber } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

const inventoryColor: Record<string, string> = {
  Tight: '#FF564F',
  Balanced: '#0BADD5',
  'High turnover': '#4DD4AC'
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

const defaultCenter: LatLngExpression = [38, -97]

function getColor(level: string) {
  return inventoryColor[level] || '#0BADD5'
}

function formatCurrency(value: number) {
  return currencyFormatter.format(Math.max(0, Math.round(value)))
}

function getAssetHref(assetId?: string) {
  return assetId ? `/downloads/${assetId}.pdf` : null
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

  const mapCenter = useMemo<LatLngExpression>(() => {
    if (!filteredMarkets.length) {
      return defaultCenter
    }
    const lat = filteredMarkets.reduce((acc, market) => acc + market.latitude, 0) / filteredMarkets.length
    const lng = filteredMarkets.reduce((acc, market) => acc + market.longitude, 0) / filteredMarkets.length
    return [lat, lng]
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
            key={`${marketType}-${inventoryLevel}`}
            center={mapCenter}
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
                key={`${market.name}-${market.city}`}
                center={[market.latitude, market.longitude] as LatLngExpression}
                radius={12}
                weight={2}
                color={getColor(market.inventoryLevel)}
                fillOpacity={0.65}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <div className="space-y-1">
                    <p className="font-semibold">{market.name}</p>
                    <p className="text-sm text-brand-navy/70">
                      {market.city}, {market.state} - {market.marketType}
                    </p>
                    <p className="text-xs text-brand-navy/60">
                      Seller intent score {market.sellerIntentScore} - Avg days on market {market.avgDaysOnMarket}
                    </p>
                    <p className="text-xs text-brand-navy/60">Closed volume {formatCurrency(market.closedVolume * 1_000_000)}</p>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        <div className="space-y-4">
          {filteredMarkets.map((market) => (
            <MarketCard key={`${market.name}-${market.city}`} market={market} />
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
            className={cn(
              'rounded-full border border-brand-navy/10 px-4 py-2 text-xs font-semibold text-brand-navy/70 transition hover:border-brand-turquoise hover:text-brand-navy',
              option === active && 'border-brand-turquoise bg-brand-turquoise/10 text-brand-navy'
            )}
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
  const assetHref = getAssetHref(market.pdfAssetId)

  return (
    <div className="rounded-3xl border border-brand-navy/10 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-navy">{market.name}</p>
          <p className="text-xs text-brand-navy/50">
            {market.city}, {market.state} - {market.marketType}
          </p>
        </div>
        <span className="rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-semibold text-brand-orange">
          {market.inventoryLevel}
        </span>
      </div>
      <ul className="mt-3 grid gap-1 text-xs text-brand-navy/70">
        <li>Seller intent score {market.sellerIntentScore}</li>
        <li>Avg. days on market {market.avgDaysOnMarket}</li>
        <li>Closed volume {formatNumber(market.closedVolume)}M</li>
      </ul>
      {market.caseStudySummary ? (
        <p className="mt-3 text-sm text-brand-navy/80">{market.caseStudySummary}</p>
      ) : null}
      {assetHref ? (
        <a className="btn btn-secondary mt-4 inline-flex" href={assetHref} download>
          Download case study
        </a>
      ) : null}
    </div>
  )
}
