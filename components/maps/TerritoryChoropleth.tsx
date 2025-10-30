"use client"

import { useCallback, useMemo } from 'react'
import { GeoJSON } from 'react-leaflet'
import type { Feature, FeatureCollection, Geometry, Polygon } from 'geojson'
import type { Layer, Path } from 'leaflet'
import type { PropertyOpportunity } from '@/lib/insights/properties'
import type { TerritoryDatasetEntry } from '@/lib/cms/types'

type ChoroplethFeatureProperties = {
  zip: string
  city: string
  state: string
  score: number
  medianHomeValue: number
  turnoverRate: number
  propertyCount: number
}

type TerritoryChoroplethProps = {
  territories: TerritoryDatasetEntry[]
  properties: PropertyOpportunity[]
  enabled: boolean
}

const dollarFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1
})

function scoreToFill(score: number) {
  if (score >= 90) return '#FF564F'
  if (score >= 80) return '#FF8A7E'
  if (score >= 70) return '#36C9E9'
  if (score >= 60) return '#4DD4AC'
  return '#C1EDE2'
}

function fallbackPolygon(entry: TerritoryDatasetEntry): Polygon | null {
  if (typeof entry.latitude !== 'number' || typeof entry.longitude !== 'number') {
    return null
  }

  const delta = 0.18
  const lat = entry.latitude
  const lng = entry.longitude

  return {
    type: 'Polygon',
    coordinates: [
      [
        [lng - delta, lat - delta],
        [lng + delta, lat - delta],
        [lng + delta, lat + delta],
        [lng - delta, lat + delta],
        [lng - delta, lat - delta]
      ]
    ]
  }
}

function parseGeometry(entry: TerritoryDatasetEntry): Geometry | null {
  if (entry.geojson) {
    try {
      const parsed = JSON.parse(entry.geojson) as Geometry | Feature
      if ('type' in parsed && parsed.type === 'Feature') {
        return parsed.geometry ?? null
      }
      return parsed as Geometry
    } catch (error) {
      console.warn(`Unable to parse GeoJSON for ZIP ${entry.zip}`, error)
    }
  }

  return fallbackPolygon(entry)
}

export function TerritoryChoropleth({ territories, properties, enabled }: TerritoryChoroplethProps) {
  const propertyCounts = useMemo(() => {
    const counts = new Map<string, number>()
    properties.forEach((property) => {
      const key = property.zip
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })
    return counts
  }, [properties])

  const featureCollection = useMemo<FeatureCollection<Geometry, ChoroplethFeatureProperties>>(() => {
    const features: Feature<Geometry, ChoroplethFeatureProperties>[] = []

    territories.forEach((territory) => {
      const geometry = parseGeometry(territory)
      if (!geometry) return

      features.push({
        type: 'Feature',
        geometry,
        properties: {
          zip: territory.zip,
          city: territory.city,
          state: territory.state,
          score: territory.score,
          medianHomeValue: territory.medianHomeValue,
          turnoverRate: territory.turnoverRate,
          propertyCount: propertyCounts.get(territory.zip) ?? 0
        }
      })
    })

    return {
      type: 'FeatureCollection',
      features
    }
  }, [territories, propertyCounts])

  const style = useCallback((feature?: Feature<Geometry, ChoroplethFeatureProperties>) => {
    const score = feature?.properties?.score ?? 0
    return {
      color: '#051B35',
      weight: 1.2,
      fillOpacity: 0.6,
      fillColor: scoreToFill(score)
    }
  }, [])

  const onEachFeature = useCallback((_feature: Feature<Geometry, ChoroplethFeatureProperties>, layer: Layer) => {
    const properties = _feature.properties
    if (!properties) return

    const tooltipMarkup = `
      <div class="space-y-1">
        <p class="font-semibold text-brand-navy">${properties.city}, ${properties.state} ${properties.zip}</p>
        <p class="text-sm text-brand-navy/70">Seller intent score: <span class="font-semibold">${properties.score}</span></p>
        <p class="text-sm text-brand-navy/70">Median value: ${dollarFormatter.format(properties.medianHomeValue)}</p>
        <p class="text-sm text-brand-navy/70">Turnover: ${percentFormatter.format(properties.turnoverRate)}</p>
        <p class="text-sm text-brand-navy/70">Opportunities: ${properties.propertyCount}</p>
      </div>
    `

    layer.bindTooltip(tooltipMarkup, {
      sticky: true,
      direction: 'top',
      opacity: 0.95
    })

    const pathLayer = layer as Path

    layer.on({
      mouseover: () => {
        pathLayer.setStyle({
          weight: 2,
          fillOpacity: 0.75
        })
      },
      mouseout: () => {
        pathLayer.setStyle({
          weight: 1.2,
          fillOpacity: 0.6
        })
      }
    })
  }, [])

  if (!enabled || !featureCollection.features.length) {
    return null
  }

  return <GeoJSON data={featureCollection} style={style} onEachFeature={onEachFeature} />
}
