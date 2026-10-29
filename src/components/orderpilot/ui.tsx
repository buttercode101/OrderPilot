import { useState } from 'react'

export function QuoteLineEdit({ line, onChange }) {
  const [editValue, setEditValue] = useState(line.quantity)
  const [isEditing, setIsEditing] = useState(false)

  const handleEdit = () => {
    if (editValue !== line.quantity) {
      onChange({ ...line, quantity: editValue })
    }
    setIsEditing(false)
  }

  return (
    <div className="quote-line-edit">
      {isEditing ? (
        <div className="edit-input">
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEdit}
            onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
          />
          <button onClick={handleEdit} className="confirm-edit">Confirm</button>
        </div>
      ) : (
        <div className="line-display" onClick={() => setIsEditing(true)}>
          {line.description} ({line.quantity})
        </div>
      )}
    </div>
  )
}
