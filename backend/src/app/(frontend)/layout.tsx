import './globals.css'

import type { Metadata } from 'next'
import React from 'react'

import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'c-sign - Feuille de Presence Digitale',
  description: 'Feuille de Presence Digitale pour Ceva Sante Animale',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
