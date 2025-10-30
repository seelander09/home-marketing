"use client"

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import L from 'leaflet'
import type { PropertyOpportunity } from '@/lib/insights/properties'
import type { TerritoryDatasetEntry } from '@/lib/cms/types'
import { MapControls, type MapViewMode } from './MapControls'
import { MapLegend } from './MapLegend'
import { PropertyClusterMarker } from './PropertyClusterMarker'
import { PropertyHeatmap, type HeatmapMetric } from './PropertyHeatmap'
import { TerritoryChoropleth } from './TerritoryChoropleth'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER: LatLngExpression = [38, -97]

type OpportunityMapProps = {
  properties: PropertyOpportunity[]
  territories: TerritoryDatasetEntry[]
  minScore: number
  minEquity: number
  height?: number
  className?: string
}

const markerIconRetina = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString()
const markerIcon = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString()
const markerShadow = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString()

function computeCenter(properties: PropertyOpportunity[], territories: TerritoryDatasetEntry[]): LatLngExpression {
  if (properties.length) {
    const latitudes = properties.map((property) => property.latitude).filter((value): value is number => typeof value === 'number')
    const longitudes = properties.map((property) => property.longitude).filter((value): value is number => typeof value === 'number')
    if (latitudes.length && longitudes.length) {
      return [
        latitudes.reduce((acc, value) => acc + value, 0) / latitudes.length,
        longitudes.reduce((acc, value) => acc + value, 0) / longitudes.length
      ]
    }
  }

  if (territories.length) {
    const latitudes = territories
      .map((territory) => territory.latitude)
      .filter((value): value is number => typeof value === 'number')
    const longitudes = territories
      .map((territory) => territory.longitude)
      .filter((value): value is number => typeof value === 'number')
    if (latitudes.length && longitudes.length) {
      return [
        latitudes.reduce((acc, value) => acc + value, 0) / latitudes.length,
        longitudes.reduce((acc, value) => acc + value, 0) / longitudes.length
      ]
    }
  }

  return DEFAULT_CENTER
}

export function OpportunityMap({
  properties,
  territories,
  minScore,
  minEquity,
  height = 480,
  className
}: OpportunityMapProps) {
  const [viewMode, setViewMode] = useState<MapViewMode>('clusters')
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('listingScore')
  const [sizeMetric, setSizeMetric] = useState<'listingScore' | 'estimatedEquity'>('listingScore')
  const [activePriorities, setActivePriorities] = useState<Record<PropertyOpportunity['priority'], boolean>>({
    'High Priority': true,
    'Medium Priority': true,
    'Low Priority': false
  })
  const [scoreRange, setScoreRange] = useState<[number, number]>([minScore, 100])
  const [equityRange, setEquityRange] = useState<[number, number]>(() => {
    const maxEquity = properties.reduce((acc, property) => Math.max(acc, property.estimatedEquity), minEquity)
    return [minEquity, maxEquity || minEquity]
  })
  const [showMarketRadius, setShowMarketRadius] = useState(true)
  const [showOwnerConnections, setShowOwnerConnections] = useState(false)

  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIconRetina,
      iconUrl: markerIcon,
      shadowUrl: markerShadow
    })
  }, [])

  useEffect(() => {
    setScoreRange(([, max]) => [minScore, Math.max(minScore, max)])
  }, [minScore])

  useEffect(() => {
    const maxEquity = properties.reduce((acc, property) => Math.max(acc, property.estimatedEquity), minEquity)
    setEquityRange(([, currentMax]) => {
      const fallbackMax = Math.max(minEquity, maxEquity)
      const nextMax = Math.max(minEquity, Math.min(currentMax, fallbackMax))
      return [minEquity, nextMax]
    })
  }, [properties, minEquity])

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      if (!activePriorities[property.priority]) return false
      if (property.listingScore < scoreRange[0] || property.listingScore > scoreRange[1]) return false
      if (property.estimatedEquity < equityRange[0]) return false
      if (equityRange[1] && property.estimatedEquity > equityRange[1]) return false
      return true
    })
  }, [properties, activePriorities, scoreRange, equityRange])

  const mapCenter = useMemo(
    () => computeCenter(filteredProperties, territories),
    [filteredProperties, territories]
  )

  const handleTogglePriority = (priority: PropertyOpportunity['priority']) => {
    setActivePriorities((previous) => {
      const next = {
        ...previous,
        [priority]: !previous[priority]
      }
      if (!Object.values(next).some(Boolean)) {
        return previous
      }
      return next
    })
  }

  const mapHeight = typeof height === 'number' ? `${height}px` : height

  const legendScoreRange: [number, number] = [scoreRange[0], scoreRange[1]]
  const legendEquityRange: [number, number] = [equityRange[0], equityRange[1]]

  return (
    <div className={['relative', className].filter(Boolean).join(' ')}>
      <MapContainer
        center={mapCenter}
        zoom={6}
        minZoom={3}
        maxZoom={18}
        scrollWheelZoom
        className="rounded-3xl"
        style={{ height: mapHeight, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PropertyHeatmap properties={filteredProperties} metric={heatmapMetric} enabled={viewMode === 'heatmap'} />
        <PropertyClusterMarker
          properties={filteredProperties}
          enabled={viewMode === 'clusters'}
          sizeMetric={sizeMetric}
          showMarketRadius={showMarketRadius}
          showOwnerConnections={showOwnerConnections}
        />
        <TerritoryChoropleth territories={territories} properties={filteredProperties} enabled={viewMode === 'choropleth'} />
      </MapContainer>
      <div className="pointer-events-none absolute inset-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="pointer-events-none flex flex-col gap-4 lg:flex-row">
          <div className="pointer-events-auto">
            <MapControls
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              activePriorities={activePriorities}
              onTogglePriority={handleTogglePriority}
              heatmapMetric={heatmapMetric}
              onHeatmapMetricChange={setHeatmapMetric}
              sizeMetric={sizeMetric}
              onSizeMetricChange={setSizeMetric}
              scoreRange={scoreRange}
              onScoreRangeChange={setScoreRange}
              equityRange={equityRange}
              onEquityRangeChange={setEquityRange}
              showMarketRadius={showMarketRadius}
              onToggleMarketRadius={setShowMarketRadius}
              showOwnerConnections={showOwnerConnections}
              onToggleOwnerConnections={setShowOwnerConnections}
            />
          </div>
        </div>
        <MapLegend viewMode={viewMode} scoreRange={legendScoreRange} equityRange={legendEquityRange} />
      </div>
    </div>
  )
}
