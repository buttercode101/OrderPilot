import { createFileRoute } from "@tanstack/react-router"
import { AskForm } from "@/components/orderpilot/ask-form"
import { asTrade } from "@/lib/orderpilot/types"
import { useState } from "react"

export const Route = createFileRoute("/ask")({
  validateSearch: (search: Record<string, unknown>) => ({
    biz: typeof search.biz === "string" ? search.biz.slice(0, 80) : "",
    trade: asTrade(typeof search.trade === "string" ? search.trade : ""),
    phone: typeof search.phone === "string" ? search.phone.slice(0, 30) : "",
  }),
  component: () => {
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
      <div className="container mx-auto p-4">
        <AskForm biz="" trade="other" phone="" />
        {formSubmitted && (
          <div className="mt-4 p-4 bg-green-100 rounded-lg">
            Your enquiry has been submitted successfully!<br />
            You will receive a response shortly.
          </div>
        )}
      </div>
    )
  }
})
