import React from 'react'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import type { ServerFunctionClient } from 'payload'
import '../(payload)/custom.scss'

import config from '@/payload.config'
import { importMap } from './admin/importMap.js'

const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap
  })
}

export default async function PayloadLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={Promise.resolve(config)} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
