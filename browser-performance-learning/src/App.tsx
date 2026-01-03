import { useState } from 'react'
import { Sidebar } from './components/Layout/Sidebar'
import { useFPS, getFPSStatus } from './hooks'
import {
  lessons,
  RenderingPipelineLesson,
  JavaScriptExecutionLesson,
  CoreWebVitalsLesson,
  NetworkPerformanceLesson,
  MemoryManagementLesson,
} from './lessons'
import './App.css'

function App() {
  const [activeLesson, setActiveLesson] = useState('rendering-pipeline')
  const { fps } = useFPS()
  const fpsStatus = getFPSStatus(fps)

  const renderLesson = () => {
    switch (activeLesson) {
      case 'rendering-pipeline':
        return <RenderingPipelineLesson />
      case 'javascript-execution':
        return <JavaScriptExecutionLesson />
      case 'core-web-vitals':
        return <CoreWebVitalsLesson />
      case 'network-performance':
        return <NetworkPerformanceLesson />
      case 'memory-management':
        return <MemoryManagementLesson />
      default:
        return <RenderingPipelineLesson />
    }
  }

  return (
    <div className="app">
      <Sidebar
        lessons={lessons}
        activeLesson={activeLesson}
        onSelectLesson={setActiveLesson}
      />

      {/* FPS Indicator */}
      <div className={`fps-indicator ${fpsStatus}`}>
        <span>FPS:</span>
        <span className="fps-value">{fps}</span>
      </div>

      <main className="main-content">
        {renderLesson()}
      </main>
    </div>
  )
}

export default App
