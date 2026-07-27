import type { Metadata } from 'next'

// /lab holds internal debug harnesses, not product pages. They deploy with the
// site (output: "standalone", no route exclusion) and robots.ts allows '/',
// so opt them out of indexing explicitly.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return children
}
