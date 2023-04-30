import './App.css'
import { matrix, bigBang, rules } from './life.ts'
import { FC, useEffect, useState } from 'react'

const zoomRatio = 10

const start = (e) => {
  Object.values(matrix)?.length === 0 && bigBang(0, 0)

  // Math.round(e.clientX / zoomRatio), Math.round(e.clientY / zoomRatio)
}

const App: FC = () => {
  const [iteration, setIteration] = useState(0)

  useEffect(() => {
    setTimeout(() => setIteration(iteration + 1), rules.lifecycleInMs)
  }, [iteration])

  return (
    <div className="App" onClick={start}>
      <Pixels key={iteration} />
    </div>
  )
}

const Pixels: FC<any> = ({}) => {
  // TODO: Try canvas.

  return Object.values(matrix)?.map((organism: any) => {
    if (!organism) {
      return null
    }

    return (
      <Pixel
        key={`${organism.x}.${organism.y}`}
        x={organism.x}
        y={organism.y}
        opacity={organism.energy}
        color={organism.color}
      />
    )
  })
}

const Pixel: FC<any> = ({ x, y, opacity, color }) => {
  return (
    <div
      style={{
        position: 'absolute',
        marginLeft: window.innerWidth / 2,
        marginTop: window.innerHeight / 2,
        top: `${x * zoomRatio}px`,
        left: `${y * zoomRatio}px`,
        width: `${zoomRatio}px`,
        height: `${zoomRatio}px`,
        backgroundColor: color,
        opacity: `${opacity + 5}%`,
      }}
    ></div>
  )
}

export default App
