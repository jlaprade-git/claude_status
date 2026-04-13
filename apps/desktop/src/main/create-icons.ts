import { nativeImage } from 'electron'

const SIZE = 22  // macOS menu bar standard

export function createTrayIcon(state: 'normal' | 'degraded' | 'outage'): Electron.NativeImage {
  const colorMap: Record<string, [number, number, number]> = {
    normal: [74, 222, 128],   // green
    degraded: [251, 191, 36], // amber
    outage: [239, 68, 68],    // red
  }

  const [r, g, b] = colorMap[state]
  const buf = Buffer.alloc(SIZE * SIZE * 4)
  const cx = SIZE / 2
  const cy = SIZE / 2
  const outerR = SIZE / 2 - 1
  const innerR = outerR - 2

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const idx = (y * SIZE + x) * 4

      if (dist <= innerR) {
        // Filled circle with the status color
        buf[idx] = r
        buf[idx + 1] = g
        buf[idx + 2] = b
        buf[idx + 3] = 255
      } else if (dist <= outerR) {
        // Anti-aliased edge
        const alpha = Math.max(0, Math.min(255, Math.round((outerR - dist) * 255)))
        buf[idx] = r
        buf[idx + 1] = g
        buf[idx + 2] = b
        buf[idx + 3] = alpha
      } else {
        // Transparent
        buf[idx] = 0
        buf[idx + 1] = 0
        buf[idx + 2] = 0
        buf[idx + 3] = 0
      }
    }
  }

  const img = nativeImage.createFromBuffer(buf, {
    width: SIZE,
    height: SIZE,
  })

  return img
}
