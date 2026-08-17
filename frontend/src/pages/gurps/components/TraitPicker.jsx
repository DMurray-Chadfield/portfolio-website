import { useMemo, useState } from "react"
import { parsePointCost, resolveTraitCost } from "../../../lib/gurps/points"

function MiniStepper({ value, onChange, min, max }) {
  const step = (delta) => {
    const next = value + delta
    if (next >= min && next <= max) onChange(next)
  }
  return (
    <span className="mini-stepper">
      <button type="button" onClick={() => step(-1)} disabled={value <= min} aria-label="Decrease level">
        -
      </button>
      <span className="mini-stepper-value">{value}</span>
      <button type="button" onClick={() => step(1)} disabled={value >= max} aria-label="Increase level">
        +
      </button>
    </span>
  )
}

function formatCost(cost) {
  return cost >= 0 ? `${cost}` : `${cost}`
}

function TraitRow({ trait, alreadyAdded, onAdd }) {
  const parsed = useMemo(() => parsePointCost(trait.point_cost), [trait.point_cost])
  const [level, setLevel] = useState(() =>
    parsed.type === "basePlusPerLevel" ? 0 : 1
  )
  const [optionIndex, setOptionIndex] = useState(0)
  const [rangeValue, setRangeValue] = useState(parsed.default ?? "")
  const [variableValue, setVariableValue] = useState(parsed.suggestedMin ?? "")

  const selection = { level, optionIndex, value: rangeValue || variableValue }
  const cost = resolveTraitCost(parsed, selection)

  const handleAdd = () => {
    const entry = {
      name: trait.name,
      cost,
      category: trait.category,
      description: trait.description
    }
    if (parsed.type === "perLevel" || parsed.type === "perLevelChoice" || parsed.type === "basePlusPerLevel") {
      entry.level = level
    }
    onAdd(entry)
  }

  const unitLabel = parsed.type === "perLevel" || parsed.type === "perLevelChoice" ? parsed.unit : null

  return (
    <li className="trait-row">
      <div className="trait-row-head">
        <span className="trait-name">{trait.name}</span>
        <span className="trait-cost">[{formatCost(cost)}]</span>
      </div>
      <div className="trait-meta">
        <span className="trait-category">{trait.category}</span>
      </div>
      <p className="trait-description">{trait.description}</p>
      <div className="trait-actions">
        {parsed.type === "perLevel" && (
          <>
            <MiniStepper value={level} onChange={setLevel} min={1} max={10} />
            <span className="trait-level-hint">
              {parsed.perLevel} pts per {unitLabel}
            </span>
          </>
        )}
        {parsed.type === "perLevelChoice" && (
          <>
            <select value={optionIndex} onChange={(e) => setOptionIndex(Number(e.target.value))}>
              {parsed.options.map((opt, i) => (
                <option key={opt.perLevel} value={i}>
                  {opt.perLevel} pts per {opt.unit}
                </option>
              ))}
            </select>
            <MiniStepper value={level} onChange={setLevel} min={1} max={10} />
          </>
        )}
        {parsed.type === "basePlusPerLevel" && (
          <>
            <MiniStepper value={level} onChange={setLevel} min={0} max={10} />
            <span className="trait-level-hint">
              {parsed.base} pts for level 0, +{parsed.perLevel} pts per level
            </span>
          </>
        )}
        {parsed.type === "choice" && (
          <select value={optionIndex} onChange={(e) => setOptionIndex(Number(e.target.value))}>
            {parsed.options.map((opt, i) => (
              <option key={opt} value={i}>
                {formatCost(opt)} pts
              </option>
            ))}
          </select>
        )}
        {parsed.type === "range" && (
          <input
            type="number"
            className="trait-number-input"
            value={rangeValue}
            min={parsed.min}
            max={parsed.max}
            onChange={(e) => setRangeValue(e.target.value)}
          />
        )}
        {parsed.type === "variable" && (
          <input
            type="number"
            className="trait-number-input"
            value={variableValue}
            onChange={(e) => setVariableValue(e.target.value)}
            placeholder={parsed.suggestedMin != null ? `${parsed.suggestedMin}+` : "points"}
          />
        )}
        <button type="button" className="trait-add" onClick={handleAdd} disabled={alreadyAdded}>
          {alreadyAdded ? "Added" : "Add"}
        </button>
      </div>
    </li>
  )
}

function TraitPicker({ title, traits, added, onAdd, onRemove }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")

  const categories = useMemo(
    () => [...new Set(traits.map((t) => t.category))].sort(),
    [traits]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return traits.filter((t) => {
      const matchesCategory = category === "All" || t.category === category
      const matchesQuery =
        q === "" ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [traits, query, category])

  const addedNames = useMemo(() => new Set(added.map((t) => t.name)), [added])

  return (
    <section className="trait-picker">
      <div className="trait-picker-head">
        <h3>{title}</h3>
        <div className="trait-picker-filters">
          <input
            type="search"
            placeholder="Search traits..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="trait-search"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="All">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {added.length > 0 && (
        <ul className="added-list">
          {added.map((t) => (
            <li key={t.id} className="added-item">
              <span className="added-name">
                {t.name}
                {t.level != null && ` (${t.level})`}
              </span>
              <span className="added-cost">[{formatCost(t.cost)}]</span>
              <button type="button" className="added-remove" onClick={() => onRemove(t.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <ul className="trait-list">
        {filtered.map((trait) => (
          <TraitRow
            key={trait.name}
            trait={trait}
            alreadyAdded={addedNames.has(trait.name)}
            onAdd={onAdd}
          />
        ))}
        {filtered.length === 0 && <li className="trait-empty">No traits match your search.</li>}
      </ul>
    </section>
  )
}

export default TraitPicker
