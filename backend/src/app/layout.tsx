import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'c-sign Backend',
  description: 'Feuille de Presence Digitale'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
