import { createContext, useContext, useEffect, useMemo, useState } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = async () => {
    try {
      const response = await fetch("/api/me", {
        credentials: "include"
      })
      if (!response.ok) {
        setUser(null)
        return null
      }
      const payload = await response.json()
      const nextUser = payload.user ?? null
      setUser(nextUser)
      return nextUser
    } catch (_error) {
      setUser(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      })
      const rawBody = await response.text()
      const payload = (() => {
        try {
          return JSON.parse(rawBody)
        } catch (_error) {
          return {}
        }
      })()
      if (!response.ok || payload.success !== true) {
        return {
          success: false,
          error: payload.error ?? `Request failed (${response.status})`
        }
      }
      await refreshSession()
      return { success: true }
    } catch (_error) {
      return { success: false, error: "Network error" }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      })
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshSession()
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      refreshSession,
      login,
      logout
    }),
    [user, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return context
}
