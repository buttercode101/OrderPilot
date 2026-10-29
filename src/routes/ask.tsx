import { useState } from 'react'

export function CustomerForm() {
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formData, setFormData] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormSubmitted(true)
    // Simulate form submission
    setTimeout(() => {
      alert('Thank you! Your enquiry has been received. You will receive a response shortly.')
      setFormSubmitted(false)
    }, 2000)
  }

  return (
    <div className="customer-form">
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Paste your enquiry here..."
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
        />
        <button type="submit" disabled={formSubmitted}>Submit</button>
      </form>
      {formSubmitted && (
        <div className="confirmation-message">
          Your enquiry has been submitted successfully!<br />
          You will receive a response shortly.
        </div>
      )}
    </div>
  )
}
