import Box from '@mui/material/Box'

export function HoneycombBg({ opacity = 0.045 }: Readonly<{ opacity?: number }>) {
  const R = 26
  const W = R * Math.sqrt(3)
  const rowH = R * 1.5
  const offsetX = W / 2

  const polygons: string[] = []
  for (let row = -1; row < 50; row++) {
    for (let col = -1; col < 42; col++) {
      const cx = col * W + (Math.abs(row) % 2 === 1 ? offsetX : 0)
      const cy = row * rowH
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2
        return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`
      }).join(' ')
      polygons.push(pts)
    }
  }

  const vbW = (42 * W + offsetX).toFixed(1)
  const vbH = (50 * rowH + R).toFixed(1)

  return (
    <Box
      component="svg"
      aria-hidden="true"
      viewBox={`0 0 ${vbW} ${vbH}`}
      preserveAspectRatio="xMidYMid slice"
      sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      {polygons.map((pts) => (
        <polygon key={pts} points={pts} fill="none" stroke={`rgba(255,255,255,${opacity})`} strokeWidth="1" />
      ))}
    </Box>
  )
}
