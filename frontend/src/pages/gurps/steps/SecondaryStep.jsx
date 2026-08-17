import { useGurps } from "../../../context/GurpsCharacterContext"
import { deriveSecondary } from "../../../lib/gurps/points"
import StepperInput from "../components/StepperInput"

function SecondaryStep() {
  const { state, dispatch, totals } = useGurps()
  const derived = deriveSecondary(state.attributes, state.secondary)
  const setSecondary = (key, value) => dispatch({ type: "SET_SECONDARY", key, value })

  return (
    <section className="step-panel">
      <p className="step-intro">
        Secondary characteristics derive from your basic attributes. Adjust them independently at
        the listed cost.
      </p>

      <StepperInput
        label="Hit Points (base: ST)"
        value={state.secondary.hp}
        onChange={(v) => setSecondary("hp", v)}
        min={-20}
        max={20}
        hint="2 pts per point"
      />
      <StepperInput
        label="Will (base: IQ)"
        value={state.secondary.will}
        onChange={(v) => setSecondary("will", v)}
        min={-20}
        max={20}
        hint="5 pts per point"
      />
      <StepperInput
        label="Perception (base: IQ)"
        value={state.secondary.per}
        onChange={(v) => setSecondary("per", v)}
        min={-20}
        max={20}
        hint="5 pts per point"
      />
      <StepperInput
        label="Fatigue Points (base: HT)"
        value={state.secondary.fp}
        onChange={(v) => setSecondary("fp", v)}
        min={-20}
        max={20}
        hint="3 pts per point"
      />
      <StepperInput
        label="Basic Speed (base: (DX+HT)/4)"
        value={state.secondary.speedSteps}
        onChange={(v) => setSecondary("speedSteps", v)}
        min={-40}
        max={40}
        display={() => derived.basicSpeed.toFixed(2)}
        hint="5 pts per 0.25"
      />
      <StepperInput
        label="Basic Move (base: floor of Speed)"
        value={state.secondary.move}
        onChange={(v) => setSecondary("move", v)}
        min={-10}
        max={20}
        display={() => derived.basicMove}
        hint="5 pts per yard/s"
      />

      <table className="derived-table">
        <thead>
          <tr>
            <th>Characteristic</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Hit Points</td>
            <td>{derived.hp}</td>
          </tr>
          <tr>
            <td>Will</td>
            <td>{derived.will}</td>
          </tr>
          <tr>
            <td>Perception</td>
            <td>{derived.per}</td>
          </tr>
          <tr>
            <td>Fatigue Points</td>
            <td>{derived.fp}</td>
          </tr>
          <tr>
            <td>Basic Speed</td>
            <td>{derived.basicSpeed.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Basic Move</td>
            <td>{derived.basicMove}</td>
          </tr>
          <tr>
            <td>Basic Lift</td>
            <td>{derived.basicLift} lbs</td>
          </tr>
          <tr>
            <td>Damage (Thrust / Swing)</td>
            <td>
              {derived.thrust} / {derived.swing}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="step-summary">Secondary characteristic points spent: {totals.secondary}</p>
    </section>
  )
}

export default SecondaryStep
