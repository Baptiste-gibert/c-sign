import { Routes, Route } from 'react-router-dom'

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <h1 className="text-4xl font-bold text-neutral-900">c-sign</h1>
    </div>
  )
}

function SignPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <p className="text-neutral-600">Sign page - coming soon</p>
    </div>
  )
}

function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <p className="text-neutral-600">Success page - coming soon</p>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign/:dayId" element={<SignPage />} />
      <Route path="/success" element={<SuccessPage />} />
    </Routes>
  )
}

export default App
