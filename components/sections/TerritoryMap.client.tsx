"use client"

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import type { TerritoryDatasetEntry } from '@/lib/cms/types'
import 'leaflet/dist/leaflet.css'

const defaultCenter = { lat: 38, lng: -97 }

function scoreToColor(score: number) {
  if (score >= 90) return '#FF564F'
  if (score >= 85) return '#0BADD5'
  return '#4DD4AC'
}

export function TerritoryMapClient({ dataset }: { dataset: TerritoryDatasetEntry[] }) {
  const latitudes = dataset.map((entry) => entry.latitude).filter((value): value is number => typeof value === 'number')
  const longitudes = dataset.map((entry) => entry.longitude).filter((value): value is number => typeof value === 'number')

  const center = latitudes.length && longitudes.length
    ? { lat: latitudes.reduce((acc, value) => acc + value, 0) / latitudes.length, lng: longitudes.reduce((acc, value) => acc + value, 0) / longitudes.length }
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
          center={[entry.latitude ?? defaultCenter.lat, entry.longitude ?? defaultCenter.lng]}
          radius={12}
          weight={2}
          color={scoreToColor(entry.score)}
          fillOpacity={0.6}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            <div className="space-y-1">
              <p className="font-semibold">{entry.city}, {entry.state} {entry.zip}</p>
              <p>Seller intent score: {entry.score}</p>
              <p>Median home value: </p>
              <p>Turnover: {(entry.turnoverRate * 100).toFixed(1)}%</p>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
