import type { ReactNode } from 'react'

type Props = {
  children?: ReactNode
  [key: string]: unknown
}

export const MapContainer = ({ children }: Props) => <div data-storybook="map">{children}</div>
export const TileLayer = () => null
export const CircleMarker = ({ children }: Props) => <div data-storybook="circle">{children}</div>
export const Tooltip = ({ children }: Props) => <div data-storybook="tooltip">{children}</div>
