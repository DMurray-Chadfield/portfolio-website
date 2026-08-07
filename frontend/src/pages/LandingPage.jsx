import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function LandingPage() {
  const { user } = useAuth()

  return (
    <section className="landing-page">
      <div className="landing-grid">
        <div className="landing-copy">
          <p className="eyebrow">Portfolio Platform</p>
          <h1>Building robust software with Kotlin, React, and clean architecture.</h1>
          <p>
            This site now runs a React single-page frontend backed by a Ktor API with
            secure, cookie-based sessions.
          </p>
          <div className="actions">
            {user === null ? (
              <Link className="primary-action" to="/login">
                Go to Login
              </Link>
            ) : (
              <Link className="primary-action" to="/profile">
                Open Profile
              </Link>
            )}
            <a className="secondary-action" href="https://github.com" target="_blank" rel="noreferrer">
              View Work
            </a>
          </div>
        </div>
        <div className="landing-card">
          <h2>Engineering Focus</h2>
          <ul>
            <li>Functional Kotlin backend with Arrow</li>
            <li>Security-first session authentication</li>
            <li>Type-safe SQL with migrations</li>
            <li>React frontend with protected routes</li>
          </ul>
        </div>
      </div>

      <div className="tools-section">
        <h2 className="tools-title">Tools</h2>
        <Link to="/gurps" className="tool-card">
          <div className="tool-card-copy">
            <h3>GURPS Character Creator</h3>
            <p>
              Build a GURPS 4th Edition character step by step, with a live point budget,
              attributes, traits, and a printable summary sheet.
            </p>
          </div>
          <span className="tool-card-link">Open tool</span>
        </Link>
      </div>
    </section>
  )
}

export default LandingPage
