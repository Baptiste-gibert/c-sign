import React from 'react'
import { NotFoundPage } from '@payloadcms/next/views'

import config from '@/payload.config'
import { importMap } from '../importMap.js'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export default async function PayloadNotFound(props: Args) {
  const params = props.params || Promise.resolve({ segments: [] })
  const searchParams = props.searchParams || Promise.resolve({})

  return (
    <NotFoundPage
      config={Promise.resolve(config)}
      importMap={importMap}
      params={params}
      searchParams={searchParams}
    />
  )
}
