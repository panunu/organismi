import './App.css'
import { matrix, bigBang, rules } from './life'
import { FC, useEffect, useRef, useState } from 'react'

const zoomRatio = 10

const start = (e) => {
  Object.values(matrix)?.length === 0 && bigBang(0, 0)

  // bigBang(
  //   Math.round(-50 + Math.random() * 100),
  //   Math.round(-50 + Math.random() * 100)
  // )
}

const App: FC = () => {
  const [iteration, setIteration] = useState(0)

  useEffect(() => {
    setTimeout(() => setIteration(iteration + 1), rules.lifecycleInMs)
  }, [iteration])

  return (
    <div className="App" onClick={start}>
      <Pixels />
    </div>
  )
}

const Pixels: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')

      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

      Object.values(matrix)?.map((organism: any) => {
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
  }, [Object.values(matrix)])

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
    ></canvas>
  )
}

export default App
