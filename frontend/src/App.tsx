import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const ConfigWizard = lazy(() => import('./pages/ConfigWizard'))
const Home = lazy(() => import('./pages/Home'))

function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bgSurface text-textMuted">
          Loading...
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<ConfigWizard />} />
        <Route path="/dashboard/:panelId" element={<Dashboard />} />
      </Routes>
    </Suspense>
  )
}

export default App
