import { useGurps } from "../../../context/GurpsCharacterContext"
import traits from "../../../data/gurpsTraits.json"
import TraitPicker from "../components/TraitPicker"

function AdvantagesStep() {
  const { state, dispatch, totals } = useGurps()

  const addTrait = (list) => (trait) => dispatch({ type: "ADD_TRAIT", list, trait })
  const removeTrait = (list) => (id) => dispatch({ type: "REMOVE_TRAIT", list, id })

  return (
    <section className="step-panel">
      <p className="step-intro">
        Advantages are beneficial traits that cost points. Perks cost 1 point each.
      </p>

      <TraitPicker
        title="Advantages"
        traits={traits.advantages}
        added={state.advantages}
        onAdd={addTrait("advantages")}
        onRemove={removeTrait("advantages")}
      />

      <TraitPicker
        title="Perks"
        traits={traits.perks}
        added={state.perks}
        onAdd={addTrait("perks")}
        onRemove={removeTrait("perks")}
      />

      <p className="step-summary">
        Advantage points: {totals.advantages} (+{totals.perks} perks)
      </p>
    </section>
  )
}

export default AdvantagesStep
