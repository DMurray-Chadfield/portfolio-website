function initialsOf(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function FactCard({ person, onClose, cardRef = null }) {
  return (
    <div className="royal-tree-card" ref={cardRef}>
      <div className="royal-tree-card-head">
        {person.portrait ? (
          <img className="royal-tree-portrait" src={`/portraits/${person.portrait}`} alt={person.name} />
        ) : (
          <span className="royal-tree-monogram">{initialsOf(person.name)}</span>
        )}
        <div className="royal-tree-card-title">
          <h3 className="royal-tree-card-name">{person.name}</h3>
          {person.house ? <p className="royal-tree-card-house">{person.house}</p> : null}
          {person.reign ? <p className="royal-tree-card-reign">{person.reign}</p> : null}
        </div>
        <button type="button" className="royal-tree-close" onClick={onClose}>
          Close
        </button>
      </div>
      <dl className="royal-tree-facts">
        <div>
          <dt>Predecessor</dt>
          <dd>{person.predecessor || "–"}</dd>
        </div>
        <div>
          <dt>Successor</dt>
          <dd>{person.successor || "–"}</dd>
        </div>
      </dl>
      {person.summary ? <p className="royal-tree-summary">{person.summary}</p> : null}
      {person.portraitCredit ? <p className="royal-tree-credit">{person.portraitCredit}</p> : null}
    </div>
  )
}

export default FactCard
