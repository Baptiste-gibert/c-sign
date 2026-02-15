import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react'
import SignatureCanvasLib from 'react-signature-canvas'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export interface SignatureCanvasHandle {
  isEmpty: () => boolean
  getBlob: () => Promise<Blob | null>
  clear: () => void
}

export const SignatureCanvas = forwardRef<SignatureCanvasHandle>((_, ref) => {
  const { t } = useTranslation('public')
  const canvasRef = useRef<SignatureCanvasLib>(null)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    // Handle high-DPI displays
    if (canvasRef.current) {
      const canvas = canvasRef.current.getCanvas()
      const ratio = window.devicePixelRatio || 1

      // Lock dimensions on mount
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(ratio, ratio)
      }
    }
  }, [])

  useImperativeHandle(ref, () => ({
    isEmpty: () => {
      return canvasRef.current?.isEmpty() ?? true
    },
    getBlob: async () => {
      if (!canvasRef.current || canvasRef.current.isEmpty()) {
        return null
      }

      const dataUrl = canvasRef.current.getTrimmedCanvas().toDataURL('image/png')
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      return blob
    },
    clear: () => {
      canvasRef.current?.clear()
      setHasDrawn(false)
    },
  }))

  const handleBegin = () => {
    setHasDrawn(true)
  }

  return (
    <div className="space-y-2">
      <div
        className="relative h-40 w-full overflow-hidden rounded-md sm:h-48 md:h-56"
        style={{ border: '2px solid var(--accent)' }}
      >
        {!hasDrawn && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px]"
            style={{ color: 'var(--text-sec)', opacity: 0.5 }}
          >
            {t('signHere')}
          </div>
        )}
        <SignatureCanvasLib
          ref={canvasRef}
          canvasProps={{
            className: 'w-full h-full touch-none cursor-crosshair',
          }}
          backgroundColor="rgb(255, 255, 255)"
          penColor="#1a1a2e"
          minWidth={2.5}
          maxWidth={2.5}
          onBegin={handleBegin}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          canvasRef.current?.clear()
          setHasDrawn(false)
        }}
        className="h-7 text-xs"
        style={{ borderColor: 'var(--border-c)', color: 'var(--accent)' }}
      >
        {t('clear')}
      </Button>
    </div>
  )
})

SignatureCanvas.displayName = 'SignatureCanvas'
