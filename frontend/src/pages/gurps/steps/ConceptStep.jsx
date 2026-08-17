import { useRef, useState } from "react"
import { useGurps } from "../../../context/GurpsCharacterContext"

const PRESETS = [25, 50, 75, 100, 150, 200, 300, 500]

function ConceptStep() {
  const { state, dispatch } = useGurps()
  const [limitTouched, setLimitTouched] = useState(false)
  const previousDefault = useRef(Math.floor(state.startingPoints / 2))

  const updateStartingPoints = (value) => {
    const next = Number(value)
    dispatch({ type: "SET_FIELD", field: "startingPoints", value: next })
    if (!limitTouched) {
      dispatch({
        type: "SET_FIELD",
        field: "disadvantageLimit",
        value: Math.floor(next / 2)
      })
    }
    previousDefault.current = Math.floor(next / 2)
  }

  return (
    <section className="step-panel">
      <div className="field-row">
        <label className="field-label" htmlFor="gurps-name">
          Character Name
        </label>
        <input
          id="gurps-name"
          type="text"
          value={state.name}
          onChange={(e) => dispatch({ type: "SET_FIELD", field: "name", value: e.target.value })}
          placeholder="e.g. Alaric the Wanderer"
        />
      </div>

      <div className="field-row">
        <label className="field-label" htmlFor="gurps-concept">
          Concept & Background
        </label>
        <textarea
          id="gurps-concept"
          rows={4}
          value={state.concept}
          onChange={(e) => dispatch({ type: "SET_FIELD", field: "concept", value: e.target.value })}
          placeholder="Who is this character? Their occupation, role in the group, and backstory."
        />
      </div>

      <div className="field-grid">
        <div className="field-row">
          <label className="field-label" htmlFor="gurps-starting-points">
            Starting Points
          </label>
          <input
            id="gurps-starting-points"
            type="number"
            min={10}
            step={5}
            value={state.startingPoints}
            onChange={(e) => updateStartingPoints(e.target.value)}
            list="gurps-point-presets"
          />
          <datalist id="gurps-point-presets">
            {PRESETS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <span className="field-hint">
            Typical: 25 (Average) to 500 (Superhuman). 150 is the common heroic baseline.
          </span>
        </div>

        <div className="field-row">
          <label className="field-label" htmlFor="gurps-disadvantage-limit">
            Disadvantage Limit
          </label>
          <input
            id="gurps-disadvantage-limit"
            type="number"
            min={0}
            step={5}
            value={state.disadvantageLimit}
            onChange={(e) => {
              setLimitTouched(true)
              dispatch({
                type: "SET_FIELD",
                field: "disadvantageLimit",
                value: Number(e.target.value)
              })
            }}
          />
          <span className="field-hint">
            GMs usually cap disadvantage points at 50% of starting points (currently{" "}
            {previousDefault.current}).
          </span>
        </div>
      </div>
    </section>
  )
}

export default ConceptStep
