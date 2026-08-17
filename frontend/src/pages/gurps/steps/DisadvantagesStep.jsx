import { useGurps } from "../../../context/GurpsCharacterContext"
import traits from "../../../data/gurpsTraits.json"
import TraitPicker from "../components/TraitPicker"

function DisadvantagesStep() {
  const { state, dispatch, totals } = useGurps()

  const addTrait = (list) => (trait) => dispatch({ type: "ADD_TRAIT", list, trait })
  const removeTrait = (list) => (id) => dispatch({ type: "REMOVE_TRAIT", list, id })

  return (
    <section className="step-panel">
      <p className="step-intro">
        Disadvantages and quirks give you extra points to spend. Your GM likely caps disadvantage
        points at 50% of starting points.
      </p>

      <div className={`limit-meter ${totals.overDisadvantageLimit ? "limit-meter-over" : ""}`}>
        <span>
          Points gained: <strong>{totals.gained}</strong>
        </span>
        <span>
          Limit: <strong>{state.disadvantageLimit}</strong>
        </span>
        {totals.overDisadvantageLimit && (
          <span className="limit-warning">Exceeds limit by {totals.gained - state.disadvantageLimit} pts</span>
        )}
      </div>

      <TraitPicker
        title="Disadvantages"
        traits={traits.disadvantages}
        added={state.disadvantages}
        onAdd={addTrait("disadvantages")}
        onRemove={removeTrait("disadvantages")}
      />

      <TraitPicker
        title="Quirks"
        traits={traits.quirks}
        added={state.quirks}
        onAdd={addTrait("quirks")}
        onRemove={removeTrait("quirks")}
      />

      <p className="step-summary">
        Points gained from disadvantages: {totals.disadvantages} (and {totals.quirks} from quirks)
      </p>
    </section>
  )
}

export default DisadvantagesStep
