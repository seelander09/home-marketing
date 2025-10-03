"use client"

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import type { TerritoryDatasetEntry } from '@/lib/cms/types'
import 'leaflet/dist/leaflet.css'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

const defaultCenter: LatLngExpression = [38, -97]

function scoreToColor(score: number) {
  if (score >= 90) return '#FF564F'
  if (score >= 85) return '#0BADD5'
  return '#4DD4AC'
}

function formatCurrency(value: number) {
  return currencyFormatter.format(Math.max(0, Math.round(value)))
}

function formatTurnover(value: number | undefined) {
  if (typeof value !== 'number') {
    return 'N/A'
  }
  return `${(value * 100).toFixed(1)}%`
}

export function TerritoryMapClient({ dataset }: { dataset: TerritoryDatasetEntry[] }) {
  const latitudes = dataset.map((entry) => entry.latitude).filter((value): value is number => typeof value === 'number')
  const longitudes = dataset.map((entry) => entry.longitude).filter((value): value is number => typeof value === 'number')

  const center: LatLngExpression = latitudes.length && longitudes.length
    ? [
        latitudes.reduce((acc, value) => acc + value, 0) / latitudes.length,
        longitudes.reduce((acc, value) => acc + value, 0) / longitudes.length
      ]
    : defaultCenter

  return (
    <MapContainer center={center} zoom={4} scrollWheelZoom={false} style={{ height: '100%', width: '100%', borderRadius: '24px' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {dataset.map((entry) => (
        <CircleMarker
          key={entry.zip}
          center={[entry.latitude ?? (defaultCenter as [number, number])[0], entry.longitude ?? (defaultCenter as [number, number])[1]] as LatLngExpression}
          radius={12}
          weight={2}
          color={scoreToColor(entry.score)}
          fillOpacity={0.6}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            <div className="space-y-1">
              <p className="font-semibold">{entry.city}, {entry.state} {entry.zip}</p>
              <p>Seller intent score: {entry.score}</p>
              <p>Median home value: {formatCurrency(entry.medianHomeValue)}</p>
              <p>Turnover: {formatTurnover(entry.turnoverRate)}</p>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
