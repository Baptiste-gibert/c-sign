import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react'
import SignatureCanvasLib from 'react-signature-canvas'
import { Button } from '@/components/ui/button'

export interface SignatureCanvasHandle {
  isEmpty: () => boolean
  getBlob: () => Promise<Blob | null>
  clear: () => void
}

export const SignatureCanvas = forwardRef<SignatureCanvasHandle>((_, ref) => {
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
      <div className="relative w-full h-48 border border-border rounded-md overflow-hidden">
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground text-sm">
            Signez ici
          </div>
        )}
        <SignatureCanvasLib
          ref={canvasRef}
          canvasProps={{
            className: 'w-full h-full touch-none',
          }}
          backgroundColor="rgb(255, 255, 255)"
          onBegin={handleBegin}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          canvasRef.current?.clear()
          setHasDrawn(false)
        }}
      >
        Effacer
      </Button>
    </div>
  )
})

SignatureCanvas.displayName = 'SignatureCanvas'
