import { cache } from 'react'
import { sanityClient, sanityEnabled } from '@/lib/cms/client'
import { mockContent } from '@/lib/cms/mock'
import {
  ABOUT_PAGE_QUERY,
  CONTACT_PAGE_QUERY,
  GLOBAL_SETTINGS_QUERY,
  HOME_PAGE_QUERY,
  PRODUCTS_PAGE_QUERY,
  RESOURCE_BY_SLUG_QUERY,
  RESOURCES_PAGE_QUERY
} from '@/cms/queries'
import type {
  AboutPagePayload,
  ContactPagePayload,
  GlobalSettings,
  HomePagePayload,
  ProductPagePayload,
  ResourceItem,
  ResourcePagePayload
} from '@/lib/cms/types'

async function fetchOrFallback<T>(query: string, fallback: T, params: Record<string, unknown> = {}): Promise<T> {
  if (!sanityEnabled || !sanityClient) {
    return fallback
  }

  try {
    const result = await sanityClient.fetch<T>(query, params, {
      cache: process.env.NODE_ENV === 'production' ? 'force-cache' : 'no-store'
    })
    return result || fallback
  } catch (error) {
    console.warn('Falling back to mock content due to CMS error', error)
    return fallback
  }
}

export const getGlobalSettings = cache((): Promise<GlobalSettings> => {
  return fetchOrFallback(GLOBAL_SETTINGS_QUERY, mockContent.global as GlobalSettings)
})

export const getHomePage = cache((): Promise<HomePagePayload> => {
  return fetchOrFallback(HOME_PAGE_QUERY, mockContent.home as HomePagePayload)
})

export const getProductsPage = cache((): Promise<ProductPagePayload> => {
  return fetchOrFallback(PRODUCTS_PAGE_QUERY, mockContent.products as ProductPagePayload)
})

export const getResourcesPage = cache((): Promise<ResourcePagePayload> => {
  return fetchOrFallback(RESOURCES_PAGE_QUERY, mockContent.resources as ResourcePagePayload)
})

export const getAboutPage = cache((): Promise<AboutPagePayload> => {
  return fetchOrFallback(ABOUT_PAGE_QUERY, mockContent.about as AboutPagePayload)
})

export const getContactPage = cache((): Promise<ContactPagePayload> => {
  return fetchOrFallback(CONTACT_PAGE_QUERY, mockContent.contact as ContactPagePayload)
})

export async function getResourceBySlug(slug: string): Promise<ResourceItem & { body?: string }> {
  if (!slug) {
    throw new Error('Slug is required')
  }

  if (!sanityEnabled || !sanityClient) {
    const fallback = mockContent.posts.find((post) => post.slug === slug) as (ResourceItem & { body?: string }) | undefined
    if (!fallback) {
      throw new Error(`Resource with slug '${slug}' not found in mock content`)
    }
    return fallback
  }

  try {
    const result = await sanityClient.fetch<ResourceItem & { body?: string }>(RESOURCE_BY_SLUG_QUERY, { slug }, {
      cache: process.env.NODE_ENV === 'production' ? 'force-cache' : 'no-store'
    })
    if (!result) {
      throw new Error(`Resource with slug '${slug}' not found in CMS`)
    }
    return result
  } catch (error) {
    console.warn('Falling back to mock content due to CMS error', error)
    const fallback = mockContent.posts.find((post) => post.slug === slug) as (ResourceItem & { body?: string }) | undefined
    if (!fallback) {
      throw error
    }
    return fallback
  }
}

