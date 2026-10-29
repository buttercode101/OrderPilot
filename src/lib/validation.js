
export function sanitizeInput(input) {
  return input.replace(/[<>]/g, '').replace(/\n/g, ' ').trim()
}

export function validateEnquiry(enquiry) {
  if (!enquiry || typeof enquiry !== 'string') {
    throw new Error('Enquiry must be a non-empty string')
  }
  if (enquiry.length > 1000) {
    throw new Error('Enquiry is too long')
  }
  return true
}
