import React from 'react'
import { RootPage } from '@payloadcms/next/views'
import type { Metadata } from 'next'

import config from '@/payload.config'
import { importMap } from '../importMap.js'

export const metadata: Metadata = {
  title: 'c-sign Admin',
  description: 'Feuille de Presence Digitale'
}

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export default async function Page({ params, searchParams }: Args) {
  return (
    <RootPage
      config={Promise.resolve(config)}
      importMap={importMap}
      params={params}
      searchParams={searchParams}
    />
  )
}
