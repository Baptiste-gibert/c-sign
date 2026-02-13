import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'c-sign Backend',
  description: 'Feuille de Presence Digitale'
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
