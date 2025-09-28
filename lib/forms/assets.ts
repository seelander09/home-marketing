const assetMap: Record<string, string> = {
  "guide-2025-seller-playbook": "/downloads/2025-seller-playbook.pdf",
  "case-study-austin": "/downloads/case-study-austin.pdf",
  "case-study-scottsdale": "/downloads/case-study-scottsdale.pdf",
  "newsletter": "/downloads/newsletter.pdf",
  "compliance-checklist": "/downloads/compliance-checklist.pdf"
}

export function resolveAsset(id: string) {
  return assetMap[id]
}
