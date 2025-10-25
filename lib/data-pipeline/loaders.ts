import fs from 'node:fs/promises'
import path from 'node:path'

import {
  EngagementEventSchema,
  ListingEventSchema,
  TransactionEventSchema
} from '@/lib/data-pipeline/validation-schemas'
import type {
  EngagementEvent,
  IngestionBundle,
  ListingEvent,
  TransactionEvent
} from '@/lib/data-pipeline/types'

async function readJsonFile<T>(filePath: string): Promise<T> {
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath)
  const raw = await fs.readFile(resolved, 'utf-8')
  return JSON.parse(raw) as T
}

function parseArray<T>(
  raw: unknown[],
  schemaParser: (value: unknown) => T
): T[] {
  const parsed: T[] = []
  for (const item of raw) {
    parsed.push(schemaParser(item))
  }
  return parsed
}

export async function loadTransactions(filePath: string): Promise<TransactionEvent[]> {
  const raw = await readJsonFile<unknown[]>(filePath)
  return parseArray(raw, (item) => TransactionEventSchema.parse(item))
}

export async function loadListings(filePath: string): Promise<ListingEvent[]> {
  const raw = await readJsonFile<unknown[]>(filePath)
  return parseArray(raw, (item) => ListingEventSchema.parse(item))
}

export async function loadEngagementEvents(filePath: string): Promise<EngagementEvent[]> {
  const raw = await readJsonFile<unknown[]>(filePath)
  return parseArray(raw, (item) => EngagementEventSchema.parse(item))
}

export async function loadIngestionBundle(options: {
  transactionsPath: string
  listingsPath: string
  engagementPath: string
}): Promise<IngestionBundle> {
  const [transactions, listings, engagement] = await Promise.all([
    loadTransactions(options.transactionsPath),
    loadListings(options.listingsPath),
    loadEngagementEvents(options.engagementPath)
  ])

  return { transactions, listings, engagement }
}
