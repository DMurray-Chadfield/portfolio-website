import { useGurps } from "../../../context/GurpsCharacterContext"
import { ATTRIBUTE_COSTS, deriveSecondary } from "../../../lib/gurps/points"
import StepperInput from "../components/StepperInput"

const ATTRIBUTE_DESCRIPTIONS = {
  ST: "Physical muscle, lifting capacity, basic damage, and Hit Points.",
  DX: "Agility, coordination, motor skills, and combat skills.",
  IQ: "Brainpower, creativity, memory, perception, and mental skills.",
  HT: "Stamina, physical grit, and resistance to poison and disease."
}

function AttributesStep() {
  const { state, dispatch, totals } = useGurps()
  const derived = deriveSecondary(state.attributes, state.secondary)

  const setAttribute = (key, value) =>
    dispatch({ type: "SET_ATTRIBUTE", key, value })

  return (
    <section className="step-panel">
      <p className="step-intro">
        An average score is 10 (0 points). Each level above or below 10 costs or refunds the listed
        points. ST and HT cost 10 pts/level; DX and IQ cost 20 pts/level.
      </p>

      {["ST", "DX", "IQ", "HT"].map((key) => {
        const value = state.attributes[key]
        const cost = (value - 10) * ATTRIBUTE_COSTS[key]
        return (
          <StepperInput
            key={key}
            label={`${key} - ${ATTRIBUTE_DESCRIPTIONS[key]}`}
            value={value}
            onChange={(v) => setAttribute(key, v)}
            min={3}
            max={20}
            hint={`${ATTRIBUTE_COSTS[key]} pts/level - subtotal ${cost > 0 ? "+" : ""}${cost} pts`}
          />
        )
      })}

      <div className="derived-strip">
        <span>
          Basic Lift <strong>{derived.basicLift} lbs</strong>
        </span>
        <span>
          Thrust <strong>{derived.thrust}</strong>
        </span>
        <span>
          Swing <strong>{derived.swing}</strong>
        </span>
      </div>

      <p className="step-summary">Attribute points spent: {totals.attributes}</p>
    </section>
  )
}

export default AttributesStep
