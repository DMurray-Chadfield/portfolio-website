import { useGurps } from "../../../context/GurpsCharacterContext"
import {
  SKILL_ATTRIBUTES,
  SKILL_DIFFICULTIES,
  SKILL_RELATIVE_LEVELS,
  skillCost,
  uid
} from "../../../lib/gurps/points"

function SkillsStep() {
  const { state, dispatch, totals } = useGurps()

  const addSkill = () =>
    dispatch({
      type: "ADD_SKILL",
      skill: { id: uid(), name: "", attribute: "DX", difficulty: "A", relativeLevel: 0 }
    })

  return (
    <section className="step-panel">
      <p className="step-intro">
        Skills represent trained expertise. Pick an attribute, a difficulty, and a target level
        relative to that attribute; the cost comes from the skill cost table.
      </p>

      {state.skills.length > 0 && (
        <ul className="skill-list">
          {state.skills.map((skill) => {
            const cost = skillCost(skill.difficulty, skill.relativeLevel)
            return (
              <li key={skill.id} className="skill-row">
                <input
                  type="text"
                  value={skill.name}
                  placeholder="Skill name"
                  onChange={(e) =>
                    dispatch({ type: "UPDATE_SKILL", id: skill.id, field: "name", value: e.target.value })
                  }
                />
                <select
                  value={skill.attribute}
                  onChange={(e) =>
                    dispatch({ type: "UPDATE_SKILL", id: skill.id, field: "attribute", value: e.target.value })
                  }
                >
                  {SKILL_ATTRIBUTES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <select
                  value={skill.difficulty}
                  onChange={(e) =>
                    dispatch({ type: "UPDATE_SKILL", id: skill.id, field: "difficulty", value: e.target.value })
                  }
                >
                  {SKILL_DIFFICULTIES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <select
                  value={skill.relativeLevel}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_SKILL",
                      id: skill.id,
                      field: "relativeLevel",
                      value: Number(e.target.value)
                    })
                  }
                >
                  {SKILL_RELATIVE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl >= 0 ? `+${lvl}` : lvl}
                    </option>
                  ))}
                </select>
                <span className="skill-cost">
                  {cost === null ? "-" : `${cost} pts`}
                </span>
                <button
                  type="button"
                  className="added-remove"
                  onClick={() => dispatch({ type: "REMOVE_SKILL", id: skill.id })}
                >
                  Remove
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <button type="button" className="secondary-action" onClick={addSkill}>
        Add skill
      </button>

      <p className="step-summary">Skill points spent: {totals.skills}</p>
    </section>
  )
}

export default SkillsStep
