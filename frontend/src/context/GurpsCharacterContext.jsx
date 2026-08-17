import { createContext, useContext, useEffect, useMemo, useReducer } from "react"
import { totalPoints, uid } from "../lib/gurps/points"

const STORAGE_KEY = "gurps-character-draft"

export const INITIAL_STATE = {
  step: 0,
  name: "",
  concept: "",
  startingPoints: 150,
  disadvantageLimit: 75,
  attributes: { ST: 10, DX: 10, IQ: 10, HT: 10 },
  secondary: { hp: 0, will: 0, per: 0, fp: 0, speedSteps: 0, move: 0 },
  tlMod: 0,
  cultures: { human: 0, alien: 0 },
  languages: [],
  wealth: "Average",
  status: 0,
  advantages: [],
  perks: [],
  disadvantages: [],
  quirks: [],
  skills: []
}

function withId(entry) {
  return { ...entry, id: entry.id ?? uid() }
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value }
    case "SET_ATTRIBUTE":
      return { ...state, attributes: { ...state.attributes, [action.key]: action.value } }
    case "SET_SECONDARY":
      return { ...state, secondary: { ...state.secondary, [action.key]: action.value } }
    case "SET_CULTURE":
      return { ...state, cultures: { ...state.cultures, [action.key]: action.value } }
    case "ADD_TRAIT":
      return { ...state, [action.list]: [...state[action.list], withId(action.trait)] }
    case "REMOVE_TRAIT":
      return { ...state, [action.list]: state[action.list].filter((t) => t.id !== action.id) }
    case "ADD_LANGUAGE":
      return { ...state, languages: [...state.languages, withId(action.language)] }
    case "REMOVE_LANGUAGE":
      return { ...state, languages: state.languages.filter((l) => l.id !== action.id) }
    case "UPDATE_LANGUAGE":
      return {
        ...state,
        languages: state.languages.map((l) =>
          l.id === action.id ? { ...l, [action.field]: action.value } : l
        )
      }
    case "ADD_SKILL":
      return { ...state, skills: [...state.skills, withId(action.skill)] }
    case "REMOVE_SKILL":
      return { ...state, skills: state.skills.filter((s) => s.id !== action.id) }
    case "UPDATE_SKILL":
      return {
        ...state,
        skills: state.skills.map((s) => (s.id === action.id ? { ...s, [action.field]: action.value } : s))
      }
    case "GO_TO_STEP":
      return { ...state, step: action.step }
    case "NEXT_STEP":
      return { ...state, step: state.step + 1 }
    case "PREV_STEP":
      return { ...state, step: Math.max(0, state.step - 1) }
    case "RESET":
      return INITIAL_STATE
    default:
      return state
  }
}

function initFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_STATE
    const parsed = JSON.parse(raw)
    return {
      ...INITIAL_STATE,
      ...parsed,
      attributes: { ...INITIAL_STATE.attributes, ...parsed.attributes },
      secondary: { ...INITIAL_STATE.secondary, ...parsed.secondary },
      cultures: { ...INITIAL_STATE.cultures, ...parsed.cultures }
    }
  } catch {
    return INITIAL_STATE
  }
}

const GurpsCharacterContext = createContext(null)

export function GurpsCharacterProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initFromStorage)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage may be unavailable; ignore
    }
  }, [state])

  const totals = useMemo(() => totalPoints(state), [state])

  const value = useMemo(
    () => ({ state, dispatch, totals, reset: () => dispatch({ type: "RESET" }) }),
    [state, totals]
  )

  return <GurpsCharacterContext.Provider value={value}>{children}</GurpsCharacterContext.Provider>
}

export function useGurps() {
  const context = useContext(GurpsCharacterContext)
  if (context === null) {
    throw new Error("useGurps must be used inside GurpsCharacterProvider")
  }
  return context
}
