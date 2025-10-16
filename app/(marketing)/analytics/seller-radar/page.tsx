import type { Metadata } from 'next'
import { SellerRadarDashboard } from '@/components/sections/SellerRadarDashboard'

export const metadata: Metadata = {
  title: 'Seller Radar Dashboard'
}

export default function SellerRadarPage() {
  return <SellerRadarDashboard />
}
