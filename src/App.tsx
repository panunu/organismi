import { matrix, bigBang, rules } from './life'
import { FC, useEffect, useRef, useState } from 'react'

const zoomRatio = 10
const framesPerSecond = 32
export const slowDownInMs = 0

const start = (e) => {
  if (Object.values(matrix)?.length === 0) bigBang(0, 0)
  else
    bigBang(
      Math.round(-50 + Math.random() * 100),
      Math.round(-50 + Math.random() * 100)
    )
}

const App: FC = () => {
  const [iteration, setIteration] = useState(0)

  useEffect(() => {
    setTimeout(() => setIteration(iteration + 1), 1000 / framesPerSecond)
  }, [iteration])

  return (
    <div className="App" onClick={start}>
      <Pixels iteration={iteration} />
    </div>
  )
}

const Pixels: FC<any> = ({ iteration }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ctx, setCtx] = useState(null)

  useEffect(() => {
    if (canvasRef) {
      const ctx = canvasRef.current.getContext('2d', { alpha: false })
      ctx.imageSmoothingEnabled = false
      setCtx(ctx)
    }
  }, [canvasRef])

  useEffect(() => {
    if (ctx) {
      ctx.beginPath()
      ctx.fillStyle = `wheat`
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      ctx.closePath()

      Object.values(matrix)?.forEach((organism: any) => {
        let color = organism.color.rgb().object()

        ctx.beginPath()
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${
          organism.energy / 100 + 0.05
        })`
        ctx?.fillRect(
          organism.x * zoomRatio + window.innerWidth / 2,
          organism.y * zoomRatio + window.innerHeight / 2,
          zoomRatio,
          zoomRatio
        )
        ctx.closePath()
      })
    }
  }, [iteration])

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
    ></canvas>
  )
}

export default App
