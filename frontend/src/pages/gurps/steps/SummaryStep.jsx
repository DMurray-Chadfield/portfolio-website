import { useGurps } from "../../../context/GurpsCharacterContext"
import { deriveSecondary, LANGUAGE_LEVELS, WEALTH_LEVELS } from "../../../lib/gurps/points"

function TraitList({ title, items }) {
  if (items.length === 0) return null
  return (
    <div className="summary-section">
      <h4>{title}</h4>
      <ul className="summary-list">
        {items.map((item) => (
          <li key={item.id}>
            <span>
              {item.name}
              {item.level != null ? ` (${item.level})` : ""}
            </span>
            <span className="summary-cost">[{item.cost}]</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SummaryStep() {
  const { state, totals, reset } = useGurps()
  const derived = deriveSecondary(state.attributes, state.secondary)
  const wealthEntry = WEALTH_LEVELS.find((w) => w.name === state.wealth)
  const balanced = totals.remaining === 0
  const overBudget = totals.remaining < 0
  const hasName = state.name.trim().length > 0

  return (
    <section className="step-panel summary">
      <div className={`budget-banner ${balanced ? "budget-ok" : "budget-warn"}`}>
        {balanced
          ? "Character is complete - spent points equal total points."
          : overBudget
            ? `Over budget by ${-totals.remaining} point${totals.remaining === -1 ? "" : "s"} - remove or reduce traits (or raise starting points).`
            : `Needs ${totals.remaining} more point${totals.remaining === 1 ? "" : "s"} spent (or adjust starting points / take more disadvantages).`}
      </div>

      <h3 className="summary-title">{hasName ? state.name : "Unnamed Character"}</h3>
      {state.concept && <p className="summary-concept">{state.concept}</p>}

      <div className="summary-grid">
        <div className="summary-section">
          <h4>Attributes</h4>
          <table className="summary-table">
            <tbody>
              <tr>
                <td>ST</td>
                <td>{state.attributes.ST}</td>
              </tr>
              <tr>
                <td>DX</td>
                <td>{state.attributes.DX}</td>
              </tr>
              <tr>
                <td>IQ</td>
                <td>{state.attributes.IQ}</td>
              </tr>
              <tr>
                <td>HT</td>
                <td>{state.attributes.HT}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="summary-section">
          <h4>Secondary Characteristics</h4>
          <table className="summary-table">
            <tbody>
              <tr>
                <td>HP</td>
                <td>{derived.hp}</td>
              </tr>
              <tr>
                <td>Will</td>
                <td>{derived.will}</td>
              </tr>
              <tr>
                <td>Per</td>
                <td>{derived.per}</td>
              </tr>
              <tr>
                <td>FP</td>
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
                <td>Damage</td>
                <td>
                  {derived.thrust} / {derived.swing}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="summary-section">
          <h4>Social Background</h4>
          <ul className="summary-list">
            <li>
              <span>Tech Level</span>
              <span className="summary-cost">
                [{state.tlMod > 0 ? "+" : ""}
                {state.tlMod * 5}]
              </span>
            </li>
            <li>
              <span>
                Cultures (Human x{state.cultures.human} / Alien x{state.cultures.alien})
              </span>
              <span className="summary-cost">
                [{state.cultures.human + state.cultures.alien * 2}]
              </span>
            </li>
            {state.languages.map((lang) => (
              <li key={lang.id}>
                <span>
                  {lang.name.trim() || "Unnamed language"} ({LANGUAGE_LEVELS[lang.level]?.label})
                </span>
                <span className="summary-cost">
                  [{LANGUAGE_LEVELS[lang.level]?.cost ?? 0}]
                </span>
              </li>
            ))}
            <li>
              <span>{state.wealth} - {wealthEntry?.wealth}</span>
              <span className="summary-cost">[{wealthEntry?.cost ?? 0}]</span>
            </li>
            <li>
              <span>Status {state.status}</span>
              <span className="summary-cost">[{state.status * 5}]</span>
            </li>
          </ul>
        </div>
      </div>

      <TraitList title="Advantages" items={state.advantages} />
      <TraitList title="Perks" items={state.perks} />
      <TraitList title="Disadvantages" items={state.disadvantages} />
      <TraitList title="Quirks" items={state.quirks} />

      {state.skills.length > 0 && (
        <div className="summary-section">
          <h4>Skills</h4>
          <ul className="summary-list">
            {state.skills.map((skill) => (
              <li key={skill.id}>
                <span>
                  {skill.name.trim() || "Unnamed skill"} - {skill.attribute}/{skill.difficulty}{" "}
                  (relative {skill.relativeLevel >= 0 ? "+" : ""}
                  {skill.relativeLevel})
                </span>
                <span className="summary-cost">[{skill.cost}]</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3 className="summary-subhead">Point Accounting</h3>
      <table className="summary-table accounting-table">
        <tbody>
          <tr>
            <td>Attributes</td>
            <td>{totals.attributes}</td>
          </tr>
          <tr>
            <td>Secondary characteristics</td>
            <td>{totals.secondary}</td>
          </tr>
          <tr>
            <td>Social background</td>
            <td>{totals.social}</td>
          </tr>
          <tr>
            <td>Advantages</td>
            <td>{totals.advantages}</td>
          </tr>
          <tr>
            <td>Perks</td>
            <td>{totals.perks}</td>
          </tr>
          <tr>
            <td>Skills</td>
            <td>{totals.skills}</td>
          </tr>
          <tr className="accounting-total">
            <td>Spent</td>
            <td>{totals.spent}</td>
          </tr>
          <tr>
            <td>Disadvantages & quirks (gained)</td>
            <td>+{totals.gained}</td>
          </tr>
          <tr className="accounting-total">
            <td>Total points</td>
            <td>{totals.total}</td>
          </tr>
          <tr className={`accounting-total ${balanced ? "" : "accounting-warn"}`}>
            <td>Remaining</td>
            <td>{totals.remaining}</td>
          </tr>
        </tbody>
      </table>

      <button type="button" className="secondary-action" onClick={() => {
        if (window.confirm("Start over? This clears the current character.")) reset()
      }}>
        Start Over
      </button>
    </section>
  )
}

export default SummaryStep
