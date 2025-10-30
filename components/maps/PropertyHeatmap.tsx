"use client"

import { useEffect, useMemo, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { PropertyOpportunity } from '@/lib/insights/properties'
import 'leaflet.heat'

export type HeatmapMetric = 'listingScore' | 'estimatedEquity'

const HEAT_LAYER_OPTIONS = {
  radius: 22,
  blur: 18,
  maxZoom: 12,
  gradient: {
    0.0: '#F0F5F8',
    0.35: '#4DD4AC',
    0.6: '#0BADD5',
    0.85: '#FF564F'
  }
} as const

type HeatLatLngTuple = [number, number, number?]

type PropertyHeatmapProps = {
  properties: PropertyOpportunity[]
  metric: HeatmapMetric
  enabled: boolean
}

function getWeight(property: PropertyOpportunity, metric: HeatmapMetric, maxScore: number, maxEquity: number) {
  if (metric === 'estimatedEquity') {
    if (!maxEquity) return 0.4
    return Math.min(1, Math.max(0.1, property.estimatedEquity / maxEquity))
  }

  if (!maxScore) return 0.4
  return Math.min(1, Math.max(0.1, property.listingScore / maxScore))
}

export function PropertyHeatmap({ properties, metric, enabled }: PropertyHeatmapProps) {
  const map = useMap()
  const heatLayerRef = useRef<L.Layer | null>(null)

  const heatPoints = useMemo<HeatLatLngTuple[]>(() => {
    const filtered = properties.filter((property) => typeof property.latitude === 'number' && typeof property.longitude === 'number')
    if (!filtered.length) {
      return []
    }

    const maxScore = filtered.reduce((acc, property) => Math.max(acc, property.listingScore), 0)
    const maxEquity = filtered.reduce((acc, property) => Math.max(acc, property.estimatedEquity), 0)

    return filtered.map((property) => {
      const latitude = property.latitude as number
      const longitude = property.longitude as number
      const weight = getWeight(property, metric, maxScore, maxEquity)
      return [latitude, longitude, weight] satisfies HeatLatLngTuple
    })
  }, [properties, metric])

  useEffect(() => {
    if (!map) {
      return
    }

    if (!enabled || heatPoints.length === 0) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
        heatLayerRef.current = null
      }
      return
    }

    const heatFactory = (L as typeof L & {
      heatLayer: (points: HeatLatLngTuple[], options?: typeof HEAT_LAYER_OPTIONS) => L.Layer
    }).heatLayer
    const layer = heatFactory(heatPoints, HEAT_LAYER_OPTIONS)

    layer.addTo(map)
    heatLayerRef.current = layer

    return () => {
      map.removeLayer(layer)
      heatLayerRef.current = null
    }
  }, [map, heatPoints, enabled])

  return null
}
