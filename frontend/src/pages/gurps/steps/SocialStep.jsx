import { useGurps } from "../../../context/GurpsCharacterContext"
import { LANGUAGE_LEVELS, uid, WEALTH_LEVELS } from "../../../lib/gurps/points"
import StepperInput from "../components/StepperInput"

function SocialStep() {
  const { state, dispatch, totals } = useGurps()
  const setField = (field, value) => dispatch({ type: "SET_FIELD", field, value })
  const setCulture = (key, value) => dispatch({ type: "SET_CULTURE", key, value })

  const addLanguage = () =>
    dispatch({
      type: "ADD_LANGUAGE",
      language: { id: uid(), name: "", level: "accented" }
    })

  return (
    <section className="step-panel">
      <p className="step-intro">
        Technology Level, culture, and language shape who your character is. Wealth and Status
        affect social standing.
      </p>

      <h3 className="step-subhead">Technology Level</h3>
      <StepperInput
        label="Personal TL relative to campaign TL"
        value={state.tlMod}
        onChange={(v) => setField("tlMod", v)}
        min={-5}
        max={5}
        hint="5 pts per TL below/above campaign average"
      />

      <h3 className="step-subhead">Cultural Familiarity</h3>
      <StepperInput
        label="Familiar human cultures"
        value={state.cultures.human}
        onChange={(v) => setCulture("human", v)}
        min={0}
        max={10}
        hint="1 pt per culture"
      />
      <StepperInput
        label="Familiar alien cultures"
        value={state.cultures.alien}
        onChange={(v) => setCulture("alien", v)}
        min={0}
        max={10}
        hint="2 pts per culture"
      />

      <h3 className="step-subhead">Languages</h3>
      <p className="field-hint">Your native language is free. Add others by comprehension level.</p>
      {state.languages.length > 0 && (
        <ul className="language-list">
          {state.languages.map((lang) => (
            <li key={lang.id} className="language-row">
              <input
                type="text"
                value={lang.name}
                placeholder="Language name"
                onChange={(e) =>
                  dispatch({ type: "UPDATE_LANGUAGE", id: lang.id, field: "name", value: e.target.value })
                }
              />
              <select
                value={lang.level}
                onChange={(e) =>
                  dispatch({ type: "UPDATE_LANGUAGE", id: lang.id, field: "level", value: e.target.value })
                }
              >
                {Object.entries(LANGUAGE_LEVELS).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="added-remove"
                onClick={() => dispatch({ type: "REMOVE_LANGUAGE", id: lang.id })}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="secondary-action" onClick={addLanguage}>
        Add language
      </button>

      <h3 className="step-subhead">Wealth</h3>
      <div className="field-row">
        <select
          value={state.wealth}
          onChange={(e) => setField("wealth", e.target.value)}
          className="wealth-select"
        >
          {WEALTH_LEVELS.map((w) => (
            <option key={w.name} value={w.name}>
              {w.name} [{w.cost} pts] - {w.wealth}
            </option>
          ))}
        </select>
      </div>

      <h3 className="step-subhead">Status</h3>
      <StepperInput
        label="Status level"
        value={state.status}
        onChange={(v) => setField("status", v)}
        min={-2}
        max={8}
        hint={`5 pts per level (selected wealth: ${state.wealth})`}
      />

      <p className="step-summary">Social background points spent: {totals.social}</p>
    </section>
  )
}

export default SocialStep
