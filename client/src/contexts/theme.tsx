import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"

const STORAGE_KEY = "whisper-theme"
export type Theme = "light" | "dark"

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "dark" || stored === "light") return stored
  return "light"
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#0c0f18" : "#e8eaf0")
  }
}

const TRANSITION_CLASS = "theme-transition"
const TRANSITION_MS = 580

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
} | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme())

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement
    root.classList.add(TRANSITION_CLASS)
    requestAnimationFrame(() => {
      setThemeState(next)
      localStorage.setItem(STORAGE_KEY, next)
      applyTheme(next)
      setTimeout(() => {
        root.classList.remove(TRANSITION_CLASS)
      }, TRANSITION_MS)
    })
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
