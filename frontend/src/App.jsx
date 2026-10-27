import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import Navbar from "./components/Navbar"
import ProtectedRoute from "./components/ProtectedRoute"
import { GurpsCharacterProvider } from "./context/GurpsCharacterContext"
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import ProfilePage from "./pages/ProfilePage"
import RoyalTreePage from "./pages/royalTree/RoyalTreePage"
import GurpsCreatorPage from "./pages/gurps/GurpsCreatorPage"

function App() {
  const { pathname } = useLocation()
  const mainClassName = pathname === "/family-tree" ? "app-main app-main-family-tree" : "app-main"

  return (
    <div className="app">
      <Navbar />
      <main className={mainClassName}>
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
          <Route path="/family-tree" element={<RoyalTreePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
