import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-brand">
          DM
        </Link>
        <nav className="site-nav" aria-label="Main">
          <Link to="/">Home</Link>
          {user === null ? (
            <Link to="/login">Login</Link>
          ) : (
            <>
              <Link to="/profile">Profile</Link>
              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
