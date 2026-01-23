import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ui.inference.sh'

  // Block pages (components documentation)
  const blocks = [
    'agent',
    'chat',
    'code-block',
    'markdown',
    'sidebar-light',
    'steps',
    'table-of-contents',
    'tools',
    'widgets',
    'youtube-embed',
    'zoomable-image',
  ]

  const blockPages = blocks.map((block) => ({
    url: `${baseUrl}/blocks/${block}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...blockPages,
  ]
}
