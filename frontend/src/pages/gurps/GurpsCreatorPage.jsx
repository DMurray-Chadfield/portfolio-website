import { useGurps } from "../../context/GurpsCharacterContext"
import ConceptStep from "./steps/ConceptStep"
import AttributesStep from "./steps/AttributesStep"
import SecondaryStep from "./steps/SecondaryStep"
import SocialStep from "./steps/SocialStep"
import AdvantagesStep from "./steps/AdvantagesStep"
import DisadvantagesStep from "./steps/DisadvantagesStep"
import SkillsStep from "./steps/SkillsStep"
import SummaryStep from "./steps/SummaryStep"

const STEPS = [
  { id: "concept", label: "Concept" },
  { id: "attributes", label: "Attributes" },
  { id: "secondary", label: "Secondary" },
  { id: "social", label: "Social" },
  { id: "advantages", label: "Advantages" },
  { id: "disadvantages", label: "Disadvantages" },
  { id: "skills", label: "Skills" },
  { id: "summary", label: "Summary" }
]

const STEP_COMPONENTS = [
  ConceptStep,
  AttributesStep,
  SecondaryStep,
  SocialStep,
  AdvantagesStep,
  DisadvantagesStep,
  SkillsStep,
  SummaryStep
]

function PointsSummary() {
  const { state, totals } = useGurps()
  return (
    <aside className={`points-summary ${totals.remaining < 0 || totals.overDisadvantageLimit ? "points-over" : ""}`}>
      <h3>Point Total</h3>
      <dl>
        <dt>Starting points</dt>
        <dd>{state.startingPoints}</dd>
        <dt>From disadvantages</dt>
        <dd>+{totals.gained}</dd>
        <dt className="points-total">Total available</dt>
        <dd className="points-total">{totals.total}</dd>
        <dt>Spent</dt>
        <dd>{totals.spent}</dd>
        <dt className="points-remaining">Remaining</dt>
        <dd className="points-remaining">{totals.remaining}</dd>
      </dl>
      {totals.overDisadvantageLimit && (
        <p className="points-note">Disadvantages exceed the {state.disadvantageLimit} pt limit.</p>
      )}
      {totals.remaining < 0 && <p className="points-note">Over budget - remove or reduce traits.</p>}
    </aside>
  )
}

function GurpsCreatorPage() {
  const { state, dispatch } = useGurps()
  const stepIndex = state.step
  const StepComponent = STEP_COMPONENTS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1

  return (
    <section className="gurps-page">
      <header className="gurps-header">
        <p className="eyebrow">GURPS 4th Edition</p>
        <h1>Character Creator</h1>
        <p className="gurps-subtitle">
          Build a hero step by step with a running point budget.
        </p>
      </header>

      <ol className="step-indicator">
        {STEPS.map((step, i) => (
          <li key={step.id}>
            <button
              type="button"
              className={`step-indicator-item ${i === stepIndex ? "step-active" : ""} ${i < stepIndex ? "step-done" : ""}`}
              onClick={() => dispatch({ type: "GO_TO_STEP", step: i })}
              aria-current={i === stepIndex ? "step" : undefined}
            >
              <span className="step-indicator-index">{i + 1}</span>
              <span className="step-indicator-label">{step.label}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="gurps-layout">
        <div className="gurps-content">
          <StepComponent />
        </div>
        <PointsSummary />
      </div>

      <div className="gurps-nav">
        <button
          type="button"
          className="secondary-action"
          onClick={() => dispatch({ type: "PREV_STEP" })}
          disabled={isFirst}
        >
          Back
        </button>
        {isLast ? (
          <button
            type="button"
            className="primary-action"
            onClick={() => dispatch({ type: "GO_TO_STEP", step: 0 })}
          >
            New Character
          </button>
        ) : (
          <button
            type="button"
            className="primary-action"
            onClick={() => dispatch({ type: "NEXT_STEP" })}
          >
            Next: {STEPS[stepIndex + 1].label}
          </button>
        )}
      </div>
    </section>
  )
}

export default GurpsCreatorPage
