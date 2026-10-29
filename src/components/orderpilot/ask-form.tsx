import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  LockKeyhole,
  Send,
  ShieldCheck,
} from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { enquiryFromMessage } from "@/lib/orderpilot/engine"
import { copyText, whatsappLink } from "@/lib/orderpilot/money"
import { useOrderPilot, useOrderPilotHydrated } from "@/lib/orderpilot/store"
import { tradeLabel, type Trade } from "@/lib/orderpilot/types"
import { Avatar, Button, Field, Mark, TextArea, TextInput } from "./ui"
import { sanitizeInput, validateEnquiry } from "@/lib/validation"

export function AskForm({ biz, trade, phone }: { biz: string; trade: Trade; phone: string }) {
  const hydrated = useOrderPilotHydrated()
  const stored = useOrderPilot((state) => state.business)
  const [enquiryText, setEnquiryText] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      validateEnquiry(enquiryText)
      // Simulate form submission
      alert('Thank you! Your enquiry has been received.')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit}>
        <TextArea
          placeholder="Paste your enquiry here..."
          value={enquiryText}
          onChange={(e) => setEnquiryText(sanitizeInput(e.target.value))}
          className="w-full p-2 border rounded mb-4"
        />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <Button type="submit" disabled={!enquiryText.trim()}>Submit</Button>
      </form>
    </div>
  )
}
