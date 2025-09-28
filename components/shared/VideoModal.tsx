"use client"

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { buildVideoEmbedUrl, cn } from '@/lib/utils'

type VideoModalProps = {
  open: boolean
  onClose: () => void
  video: {
    provider: 'wistia' | 'vimeo'
    id: string
  }
}

export function VideoModal({ open, onClose, video }: VideoModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) {
    return null
  }

  const container = typeof window !== 'undefined' ? document.body : null
  if (!container) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={cn(
          'relative h-full w-full max-h-[80vh] max-w-4xl overflow-hidden rounded-3xl bg-black shadow-2xl'
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 z-10 rounded-full bg-black/70 p-2 text-white hover:bg-black"
          onClick={onClose}
          aria-label="Close video"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <iframe
          className="h-full w-full"
          src={`${buildVideoEmbedUrl(video)}?autoplay=1`}
          title="Product video"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    </div>,
    container
  )
}
