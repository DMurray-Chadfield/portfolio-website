import { Navigate, Route, Routes } from "react-router-dom"
import Navbar from "./components/Navbar"
import ProtectedRoute from "./components/ProtectedRoute"
import { GurpsCharacterProvider } from "./context/GurpsCharacterContext"
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import ProfilePage from "./pages/ProfilePage"
import GurpsCreatorPage from "./pages/gurps/GurpsCreatorPage"

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gurps"
            element={
              <GurpsCharacterProvider>
                <GurpsCreatorPage />
              </GurpsCharacterProvider>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
