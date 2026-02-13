import sharp from 'sharp'

/**
 * Optimize signature image for XLSX embedding
 * - Resize to 200x100px
 * - Flatten alpha channel to white background
 * - Convert to JPEG at 80% quality
 */
export async function optimizeSignature(inputBuffer: Buffer): Promise<Buffer> {
  try {
    const optimized = await sharp(inputBuffer)
      .resize(200, 100, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer()

    return optimized
  } catch (error) {
    throw new Error(
      `Failed to optimize signature image: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
