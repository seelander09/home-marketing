"use client"

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type SellerRadarMapPoint = {
  id: string
  label: string
  averageScore: number
  scoreRange: {
    min: number
    max: number
  }
  sampleSize: number
  latitude: number
  longitude: number
}

const defaultCenter: LatLngExpression = [38, -97]

function scoreToColor(score: number) {
  if (score >= 90) return '#146356'
  if (score >= 80) return '#26867c'
  if (score >= 70) return '#3ba495'
  if (score >= 60) return '#6ec1ad'
  return '#a2d9c5'
}

function scoreToRadius(score: number, sampleSize: number) {
  const base = Math.max(0, score - 50) / 4
  const sampleBoost = Math.min(sampleSize, 20) / 2
  return 8 + base + sampleBoost
}

export default function SellerRadarMapClient({ points }: { points: SellerRadarMapPoint[] }) {
  const validPoints = points.filter(
    (point): point is SellerRadarMapPoint =>
      typeof point.latitude === 'number' && typeof point.longitude === 'number'
  )

  const center: LatLngExpression =
    validPoints.length > 0
      ? [
          validPoints.reduce((acc, point) => acc + point.latitude, 0) / validPoints.length,
          validPoints.reduce((acc, point) => acc + point.longitude, 0) / validPoints.length
        ]
      : defaultCenter

  return (
    <MapContainer
      center={center}
      zoom={4}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%', borderRadius: '24px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validPoints.map((point) => (
        <CircleMarker
          key={point.id}
          center={[point.latitude, point.longitude] as LatLngExpression}
          radius={scoreToRadius(point.averageScore, point.sampleSize)}
          weight={1.5}
          color={scoreToColor(point.averageScore)}
          fillOpacity={0.65}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            <div className="space-y-1">
              <p className="font-semibold text-brand-navy">{point.label}</p>
              <p>Avg seller score: {Math.round(point.averageScore)}</p>
              <p>
                Score range: {Math.round(point.scoreRange.min)} - {Math.round(point.scoreRange.max)}
              </p>
              <p>Sample size: {point.sampleSize}</p>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
