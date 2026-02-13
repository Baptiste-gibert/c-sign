import { useMutation } from '@tanstack/react-query'

export function useDownloadExport() {
  return useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`/api/events/${eventId}/export`, {
        credentials: 'include', // CRITICAL: send HTTP-only cookies for auth
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to download export')
      }

      // Extract filename from Content-Disposition header
      const contentDisposition = res.headers.get('Content-Disposition')
      let filename = 'export.xlsx' // fallback
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) {
          filename = match[1]
        }
      }

      // Convert response to blob
      const blob = await res.blob()

      // Create temporary download link and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
  })
}
