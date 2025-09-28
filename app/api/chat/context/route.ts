import { NextResponse } from 'next/server'
import { getHomePage, getContactPage } from '@/lib/cms/getContent'

export async function GET() {
  try {
    const [home, contact] = await Promise.all([getHomePage(), getContactPage()])

    const faqs = [...(home.faqs ?? []), ...(contact?.faqs ?? [])]
    const caseStudies = home.caseStudies?.items?.map((item) => ({
      title: item.title,
      summary: item.summary,
      market: item.market,
      pdfAssetId: item.pdfAssetId
    })) ?? []

    const markets = home.proofExplorer?.markets?.map((market) => ({
      name: market.name,
      city: market.city,
      state: market.state,
      marketType: market.marketType,
      inventoryLevel: market.inventoryLevel,
      sellerIntentScore: market.sellerIntentScore,
      caseStudyTitle: market.caseStudyTitle,
      pdfAssetId: market.pdfAssetId
    })) ?? []

    return NextResponse.json({
      faqs,
      caseStudies,
      markets,
      roiScenarios: home.roiCalculator?.scenarios ?? []
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load chat context' }, { status: 500 })
  }
}
