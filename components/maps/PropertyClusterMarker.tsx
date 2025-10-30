"use client"

import { Fragment, useMemo } from 'react'
import { Circle, LayerGroup, Marker, Popup, Polyline } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import type { LatLngTuple, LeafletMouseEvent, MarkerCluster, MarkerOptions } from 'leaflet'
import L from 'leaflet'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import type { PropertyOpportunity } from '@/lib/insights/properties'

const PRIORITY_COLORS: Record<PropertyOpportunity['priority'], string> = {
  'High Priority': '#FF564F',
  'Medium Priority': '#0BADD5',
  'Low Priority': '#4DD4AC'
}

const PRIORITY_TOKENS: PropertyOpportunity['priority'][] = ['High Priority', 'Medium Priority', 'Low Priority']

type SizeMetric = 'listingScore' | 'estimatedEquity'

type PropertyClusterMarkerProps = {
  properties: PropertyOpportunity[]
  enabled: boolean
  sizeMetric: SizeMetric
  showMarketRadius: boolean
  showOwnerConnections: boolean
  onPropertyFocus?: (property: PropertyOpportunity, event: LeafletMouseEvent) => void
}

function createPropertyIcon(
  property: PropertyOpportunity,
  diameter: number
) {
  const priorityColor = PRIORITY_COLORS[property.priority]
  const label = property.listingScore.toFixed(0)

  return L.divIcon({
    html: `<div style="
      width:${diameter}px;
      height:${diameter}px;
      border-radius:9999px;
      background:${priorityColor};
      box-shadow:0 0 0 3px rgba(5,27,53,0.18);
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:600;
      font-size:${Math.max(11, diameter * 0.32)}px;
      color:#fff;
    ">${label}</div>`,
    iconSize: [diameter, diameter],
    className: 'sl-property-marker'
  })
}

function computeDiameter(value: number, min: number, max: number, base = 24, range = 28) {
  if (!Number.isFinite(value) || max - min <= 0) {
    return base
  }
  return Math.round(base + ((value - min) / (max - min)) * range)
}

function priorityGradient(counts: Record<PropertyOpportunity['priority'], number>) {
  const total = PRIORITY_TOKENS.reduce((acc, priority) => acc + counts[priority], 0)
  if (!total) {
    return '#0BADD5'
  }

  let cumulative = 0
  const segments: string[] = []

  PRIORITY_TOKENS.forEach((priority) => {
    const value = counts[priority]
    if (!value) return
    const start = cumulative / total
    cumulative += value
    const end = cumulative / total
    segments.push(`${PRIORITY_COLORS[priority]} ${start * 100}% ${end * 100}%`)
  })

  return `conic-gradient(${segments.join(',')})`
}

function createClusterIcon(cluster: MarkerCluster) {
  const counts: Record<PropertyOpportunity['priority'], number> = {
    'High Priority': 0,
    'Medium Priority': 0,
    'Low Priority': 0
  }

  cluster.getAllChildMarkers().forEach((marker) => {
    const priority = marker.options.title as PropertyOpportunity['priority'] | undefined
    if (priority && counts[priority] !== undefined) {
      counts[priority] += 1
    }
  })

  const total = cluster.getChildCount()
  const size = Math.min(72, 36 + Math.sqrt(total) * 6)
  const gradient = priorityGradient(counts)

  const dominantPriority =
    PRIORITY_TOKENS.find((priority) => counts[priority] === Math.max(counts['High Priority'], counts['Medium Priority'], counts['Low Priority'])) ??
    'Medium Priority'

  const outlineColor = PRIORITY_COLORS[dominantPriority]

  return L.divIcon({
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:9999px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:700;
      color:#051B35;
      background:${gradient};
      border:3px solid ${outlineColor};
      box-shadow:0 12px 25px rgba(5,27,53,0.18);
    " aria-hidden="true">
      ${total}
    </div>`,
    className: 'sl-cluster-marker',
    iconSize: [size, size]
  })
}

function buildOwnerConnections(properties: PropertyOpportunity[]) {
  const groups = new Map<string, PropertyOpportunity[]>()

  properties.forEach((property) => {
    if (!property.owner) return
    if (!groups.has(property.owner)) {
      groups.set(property.owner, [])
    }
    groups.get(property.owner)?.push(property)
  })

  return [...groups.values()].filter((items) => items.length > 1)
}

export function PropertyClusterMarker({
  properties,
  enabled,
  sizeMetric,
  showMarketRadius,
  showOwnerConnections,
  onPropertyFocus
}: PropertyClusterMarkerProps) {
  const geocoded = useMemo(
    () =>
      properties.filter(
        (property) => typeof property.latitude === 'number' && typeof property.longitude === 'number'
      ),
    [properties]
  )

  const metricRange = useMemo(() => {
    if (!geocoded.length) {
      return { min: 0, max: 0 }
    }
    const values = geocoded.map((property) =>
      sizeMetric === 'estimatedEquity' ? property.estimatedEquity : property.listingScore
    )
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    }
  }, [geocoded, sizeMetric])

  const ownerGroups = useMemo(() => {
    if (!showOwnerConnections) return []
    return buildOwnerConnections(geocoded)
  }, [geocoded, showOwnerConnections])

  const marketCenter = useMemo<LatLngTuple | null>(() => {
    if (!showMarketRadius || !geocoded.length) return null
    const averageLat =
      geocoded.reduce((acc, property) => acc + (property.latitude as number), 0) / geocoded.length
    const averageLng =
      geocoded.reduce((acc, property) => acc + (property.longitude as number), 0) / geocoded.length
    return [averageLat, averageLng]
  }, [geocoded, showMarketRadius])

  if (!enabled || !geocoded.length) {
    return null
  }

  return (
    <MarkerClusterGroup
      chunkedLoading
      iconCreateFunction={createClusterIcon}
      spiderfyOnMaxZoom
      removeOutsideVisibleBounds={false}
      disableClusteringAtZoom={15}
    >
      {geocoded.map((property) => {
        const metricValue = sizeMetric === 'estimatedEquity' ? property.estimatedEquity : property.listingScore
        const diameter = computeDiameter(metricValue, metricRange.min, metricRange.max)
        const icon = createPropertyIcon(property, diameter)
        const position: LatLngTuple = [property.latitude as number, property.longitude as number]
        const markerOptions: MarkerOptions = {
          title: property.priority,
          riseOnHover: true
        }

        return (
          <Marker
            key={property.id}
            position={position}
            icon={icon}
            {...markerOptions}
            eventHandlers={{
              click: (event) => onPropertyFocus?.(property, event)
            }}
          >
            <Popup>
              <div className="min-w-[220px] space-y-3 rounded-2xl">
                <div>
                  <p className="text-sm font-semibold text-brand-navy">{property.address}</p>
                  <p className="text-xs text-brand-navy/60">
                    {property.city}, {property.state} {property.zip}
                  </p>
                </div>
                <div className="grid gap-1 text-xs text-brand-navy/70">
                  <span className="font-semibold text-brand-orange">
                    {property.priority} - {property.listingScore}/100 score
                  </span>
                  <span>Equity: ${property.estimatedEquity.toLocaleString()}</span>
                  <span>Market value: ${property.marketValue.toLocaleString()}</span>
                  <span>Years in home: {property.yearsInHome}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-brand-navy/20 px-3 py-1 text-xs font-semibold text-brand-navy"
                  >
                    View profile
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-brand-turquoise px-3 py-1 text-xs font-semibold text-white"
                  >
                    Contact
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
      {marketCenter ? (
        <LayerGroup>
          {[1, 3, 5].map((radius) => (
            <Circle
              key={radius}
              center={marketCenter}
              radius={radius * 1609.34}
              pathOptions={{
                color: '#0BADD5',
                fillOpacity: 0,
                weight: radius === 1 ? 2 : 1,
                dashArray: radius === 5 ? '6 8' : '2 6'
              }}
            />
          ))}
        </LayerGroup>
      ) : null}
      {ownerGroups.length ? (
        <LayerGroup>
          {ownerGroups.map((group) => {
            const positions = group.map((property) => [property.latitude as number, property.longitude as number] as LatLngTuple)
            return (
              <Fragment key={group[0].owner}>
                <Polyline
                  positions={positions}
                  pathOptions={{
                    color: '#FF564F',
                    weight: 2,
                    opacity: 0.7,
                    dashArray: '8 6'
                  }}
                />
              </Fragment>
            )
          })}
        </LayerGroup>
      ) : null}
    </MarkerClusterGroup>
  )
}
