import { useMemo, useState } from "react"
import { SKILL_DIFFICULTIES } from "../../../lib/gurps/points"

function SkillPicker({ skills, added, onAdd }) {
  const [query, setQuery] = useState("")
  const [difficulty, setDifficulty] = useState("All")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return skills.filter((s) => {
      const matchesDifficulty = difficulty === "All" || s.difficulty === difficulty
      const matchesQuery = q === "" || s.name.toLowerCase().includes(q)
      return matchesDifficulty && matchesQuery
    })
  }, [skills, query, difficulty])

  const addedNames = useMemo(() => new Set(added.map((s) => s.name)), [added])

  return (
    <section className="trait-picker">
      <div className="trait-picker-head">
        <h3>All Skills</h3>
        <div className="trait-picker-filters">
          <input
            type="search"
            placeholder="Search skills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="trait-search"
          />
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="All">All difficulties</option>
            {SKILL_DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="trait-list">
        {filtered.map((skill) => {
          const alreadyAdded = addedNames.has(skill.name)
          return (
            <li key={skill.name} className="trait-row">
              <div className="trait-row-head">
                <span className="trait-name">{skill.name}</span>
                <span className="trait-cost">
                  {skill.attribute} / {skill.difficulty}
                </span>
              </div>
              <div className="trait-actions">
                <button
                  type="button"
                  className="trait-add"
                  onClick={() => onAdd(skill)}
                  disabled={alreadyAdded}
                >
                  {alreadyAdded ? "Added" : "Add"}
                </button>
              </div>
            </li>
          )
        })}
        {filtered.length === 0 && <li className="trait-empty">No skills match your search.</li>}
      </ul>
    </section>
  )
}

export default SkillPicker