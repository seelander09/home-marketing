export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)
}

export function buildVideoEmbedUrl({ provider, id }: { provider: 'wistia' | 'vimeo'; id: string }) {
  if (provider === 'vimeo') {
    return `https://player.vimeo.com/video/${id}`
  }
  return `https://fast.wistia.net/embed/iframe/${id}`
}
