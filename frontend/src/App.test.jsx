import { afterAll, beforeAll, describe, it, expect, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import App from "./App.jsx"
import { AuthProvider } from "./context/AuthContext.jsx"

let consoleError

beforeAll(() => {
  const original = console.error
  consoleError = vi.spyOn(console, "error").mockImplementation((message, ...args) => {
    if (typeof message === "string" && message.includes("useLayoutEffect does nothing on the server")) return
    original.call(console, message, ...args)
  })
})

afterAll(() => {
  consoleError.mockRestore()
})

function renderAt(path) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe("App family-tree layout", () => {
  it("uses the viewport-filling main class on the family tree route", () => {
    const html = renderAt("/family-tree")
    expect(html).toContain('class="app-main app-main-family-tree"')
    expect(html).toContain("Royal Family Tree")
    expect(html).toContain("royal-tree-canvas")
  })

  it("keeps the regular main layout on other routes", () => {
    const html = renderAt("/")
    expect(html).toContain('class="app-main"')
    expect(html).not.toContain("app-main-family-tree")
  })
})
