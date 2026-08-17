function StepperInput({ label, value, onChange, min, max, step = 1, display, hint }) {
  const decrease = () => {
    if (value - step < min) return
    onChange(value - step)
  }
  const increase = () => {
    if (value + step > max) return
    onChange(value + step)
  }

  return (
    <div className="stepper-row">
      <div className="stepper-info">
        <span className="stepper-label">{label}</span>
        {hint && <span className="stepper-hint">{hint}</span>}
      </div>
      <div className="stepper-controls">
        <button type="button" onClick={decrease} disabled={value - step < min} aria-label={`Decrease ${label}`}>
          -
        </button>
        <span className="stepper-value">{display ? display(value) : value}</span>
        <button type="button" onClick={increase} disabled={value + step > max} aria-label={`Increase ${label}`}>
          +
        </button>
      </div>
    </div>
  )
}

export default StepperInput
