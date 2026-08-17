export const ATTRIBUTE_COSTS = { ST: 10, DX: 20, IQ: 20, HT: 10 }

export const SECONDARY_LABELS = {
  hp: { label: "Hit Points", costPer: 2, base: "ST" },
  will: { label: "Will", costPer: 5, base: "IQ" },
  per: { label: "Perception", costPer: 5, base: "IQ" },
  fp: { label: "Fatigue Points", costPer: 3, base: "HT" }
}

export const WEALTH_LEVELS = [
  { name: "Dead Broke", cost: -25, wealth: "$0 - no income or property" },
  { name: "Poor", cost: -15, wealth: "1/5 average starting wealth" },
  { name: "Struggling", cost: -10, wealth: "1/2 average starting wealth" },
  { name: "Average", cost: 0, wealth: "standard for campaign TL" },
  { name: "Comfortable", cost: 10, wealth: "2x average starting wealth" },
  { name: "Wealthy", cost: 20, wealth: "5x average starting wealth" },
  { name: "Very Wealthy", cost: 30, wealth: "20x average starting wealth" },
  { name: "Filthy Rich", cost: 50, wealth: "100x average starting wealth" },
  { name: "Multimillionaire 1", cost: 50, wealth: "1,000x average starting wealth" },
  { name: "Multimillionaire 2", cost: 75, wealth: "10,000x average starting wealth" },
  { name: "Multimillionaire 3", cost: 100, wealth: "100,000x average starting wealth" }
]

export const LANGUAGE_LEVELS = {
  broken: { cost: 2, label: "Broken (2 pts)" },
  accented: { cost: 4, label: "Accented (4 pts)" },
  native: { cost: 6, label: "Native (6 pts)" }
}

export const SKILL_DIFFICULTIES = [
  { value: "E", label: "Easy (E)" },
  { value: "A", label: "Average (A)" },
  { value: "H", label: "Hard (H)" },
  { value: "VH", label: "Very Hard (VH)" },
  { value: "Varies", label: "Varies" }
]

export const SKILL_ATTRIBUTES = ["ST", "DX", "IQ", "HT", "Will", "Per", "DX or IQ"]

const SKILL_TABLE = {
  E: { 0: 1, 1: 2, 2: 4, 3: 8 },
  A: { "-1": 1, 0: 2, 1: 4, 2: 8, 3: 12 },
  H: { "-1": 1, 0: 4, 1: 8, 2: 12, 3: 16 },
  VH: { "-2": 1, "-1": 2, 0: 8, 1: 12, 2: 16, 3: 20 }
}

export const SKILL_RELATIVE_LEVELS = [-2, -1, 0, 1, 2, 3, 4, 5, 6]

const DAMAGE_TABLE = {
  1: ["1d-6", "1d-5"],
  2: ["1d-6", "1d-4"],
  3: ["1d-5", "1d-4"],
  4: ["1d-5", "1d-3"],
  5: ["1d-4", "1d-3"],
  6: ["1d-4", "1d-2"],
  7: ["1d-3", "1d-2"],
  8: ["1d-3", "1d-1"],
  9: ["1d-2", "1d-1"],
  10: ["1d-2", "1d"],
  11: ["1d-1", "1d+1"],
  12: ["1d-1", "1d+2"],
  13: ["1d", "2d-1"],
  14: ["1d", "2d"],
  15: ["1d+1", "2d+1"],
  16: ["1d+1", "2d+2"],
  17: ["1d+2", "3d-1"],
  18: ["1d+2", "3d"],
  19: ["2d-1", "3d+1"],
  20: ["2d-1", "3d+2"]
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function attributePoints(attributes) {
  return ["ST", "DX", "IQ", "HT"].reduce(
    (sum, key) => sum + (attributes[key] - 10) * ATTRIBUTE_COSTS[key],
    0
  )
}

export function secondaryPoints(secondary) {
  return (
    secondary.hp * 2 +
    secondary.will * 5 +
    secondary.per * 5 +
    secondary.fp * 3 +
    secondary.speedSteps * 5 +
    secondary.move * 5
  )
}

export function socialPoints(state) {
  const wealthCost = WEALTH_LEVELS.find((w) => w.name === state.wealth)?.cost ?? 0
  const languageCost = state.languages.reduce(
    (sum, lang) => sum + (LANGUAGE_LEVELS[lang.level]?.cost ?? 0),
    0
  )
  return (
    state.tlMod * 5 +
    state.cultures.human * 1 +
    state.cultures.alien * 2 +
    languageCost +
    wealthCost +
    state.status * 5
  )
}

export function damageForST(st) {
  const clamped = Math.max(1, Math.floor(st))
  if (clamped <= 20) {
    const [thr, sw] = DAMAGE_TABLE[clamped]
    return { thr, sw }
  }
  const extra = Math.floor((clamped - 20) / 10)
  return { thr: `${2 + extra}d-1`, sw: `${3 + extra}d+2` }
}

export function deriveSecondary(attributes, secondary) {
  const st = attributes.ST
  const dx = attributes.DX
  const iq = attributes.IQ
  const ht = attributes.HT
  const basicSpeed = (dx + ht) / 4 + 0.25 * secondary.speedSteps
  const basicMove = Math.floor(basicSpeed) + secondary.move
  const damage = damageForST(st)
  return {
    hp: st + secondary.hp,
    will: iq + secondary.will,
    per: iq + secondary.per,
    fp: ht + secondary.fp,
    basicSpeed,
    basicMove,
    basicLift: Math.round((st * st) / 5),
    thrust: damage.thr,
    swing: damage.sw
  }
}

export function skillCost(difficulty, relativeLevel) {
  const table = SKILL_TABLE[difficulty]
  if (!table) return null
  const base = table[relativeLevel]
  if (base !== undefined) return base
  if (relativeLevel > 3) return table[3] + (relativeLevel - 3) * 4
  return null
}

const FIXED = /^-?\d+$/
const PER_LEVEL = /^(-?\d+)\/(.+)$/
const RANGE = /^(-?\d+)\s*to\s*(-?\d+)\+?$/
const BASE_PLUS_PER_LEVEL = /^(\d+)\s+for\b.*\+\s*(\d+)\s*\/\s*level$/i
const VARIABLE_MIN = /^(-?\d+)\+$/
const PART_SPLIT = /\s*(?:,|\bor\b)\s*/

export function parsePointCost(raw) {
  const str = String(raw ?? "").trim()
  if (!str) return { type: "variable" }

  const basePlus = str.match(BASE_PLUS_PER_LEVEL)
  if (basePlus) {
    return { type: "basePlusPerLevel", base: Number(basePlus[1]), perLevel: Number(basePlus[2]) }
  }

  const parts = str.split(PART_SPLIT).filter(Boolean)
  if (parts.length > 1) {
    const trimmed = parts.map((p) => p.trim())
    if (trimmed.every((p) => FIXED.test(p))) {
      return { type: "choice", options: trimmed.map((p) => Number(p)) }
    }
    if (trimmed.every((p) => FIXED.test(p) || PER_LEVEL.test(p))) {
      return {
        type: "perLevelChoice",
        options: trimmed.map((p) => {
          const m = p.match(PER_LEVEL)
          return m
            ? { perLevel: Number(m[1]), unit: m[2].trim() }
            : { perLevel: Number(p), unit: "level" }
        })
      }
    }
    return { type: "variable" }
  }

  const single = parts[0].trim()
  const range = single.match(RANGE)
  if (range) {
    const a = Number(range[1])
    const b = Number(range[2])
    return { type: "range", min: Math.min(a, b), max: Math.max(a, b), default: a }
  }
  const perLevel = single.match(PER_LEVEL)
  if (perLevel) {
    return { type: "perLevel", perLevel: Number(perLevel[1]), unit: perLevel[2].trim() }
  }
  if (FIXED.test(single)) {
    return { type: "fixed", value: Number(single) }
  }
  const variableMin = single.match(VARIABLE_MIN)
  if (variableMin) {
    return { type: "variable", suggestedMin: Number(variableMin[1]) }
  }
  return { type: "variable" }
}

function clampInt(value, min, max) {
  const n = Math.round(Number(value) || min)
  return Math.max(min, Math.min(max, n))
}

function clampNum(value, min, max) {
  const n = Number(value)
  if (Number.isNaN(n)) return min ?? 0
  return Math.max(min, Math.min(max, n))
}

export function resolveTraitCost(parsed, selection = {}) {
  switch (parsed.type) {
    case "fixed":
      return parsed.value
    case "perLevel": {
      const level = clampInt(selection.level ?? 1, 1, 10)
      return parsed.perLevel * level
    }
    case "perLevelChoice": {
      const option = parsed.options[selection.optionIndex ?? 0] ?? parsed.options[0]
      const level = clampInt(selection.level ?? 1, 1, 10)
      return option.perLevel * level
    }
    case "basePlusPerLevel": {
      const level = clampInt(selection.level ?? 0, 0, 10)
      return level === 0 ? parsed.base : parsed.base + parsed.perLevel * (level - 1)
    }
    case "choice":
      return parsed.options[selection.optionIndex ?? 0] ?? parsed.options[0]
    case "range": {
      const value = selection.value ?? parsed.default
      return clampNum(value, parsed.min, parsed.max)
    }
    case "variable":
      return Number.isFinite(Number(selection.value))
        ? Number(selection.value)
        : (parsed.suggestedMin ?? 0)
    default:
      return 0
  }
}

export function totalPoints(state) {
  const attributes = attributePoints(state.attributes)
  const secondary = secondaryPoints(state.secondary)
  const social = socialPoints(state)
  const advantages = state.advantages.reduce((s, t) => s + t.cost, 0)
  const perks = state.perks.reduce((s, t) => s + t.cost, 0)
  const disadvantages = state.disadvantages.reduce((s, t) => s + t.cost, 0)
  const quirks = state.quirks.reduce((s, t) => s + t.cost, 0)
  const skills = state.skills.reduce(
    (s, t) => s + (skillCost(t.difficulty, t.relativeLevel) ?? 0),
    0
  )
  const spent = attributes + secondary + social + advantages + perks + skills
  const gained = -(disadvantages + quirks)
  const total = state.startingPoints + gained
  const remaining = total - spent
  const overDisadvantageLimit = gained > state.disadvantageLimit
  return {
    attributes,
    secondary,
    social,
    advantages,
    perks,
    disadvantages,
    quirks,
    skills,
    spent,
    gained,
    total,
    remaining,
    overDisadvantageLimit
  }
}
