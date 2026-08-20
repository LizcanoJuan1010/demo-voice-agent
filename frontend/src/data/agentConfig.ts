export type AccountView = {
  consumerName: string
  accountNumber: string
  cardLastFour: string
  creditor: string
  balanceOwed: string
  daysPastDue: number
  minimumPaymentDue: string
  pastDueAmount: string
  monthlyPayment: string
}

export type Persona = {
  name: string
  role: string
  company: string
  tone: string
}

export type DeepgramAgentConfig = {
  listen: { provider: { type: string; model: string } }
  think: {
    provider: { type: string; model: string }
    prompt: string
    endpoint?: { url: string; headers: Record<string, string> }
  }
  speak: { provider: { type: string; version: string; model: string } }
}

export type AgentConfig = {
  account: AccountView
  persona: Persona
  assistantPrompt: string
  deepgramAgentConfig: DeepgramAgentConfig
  deepgramApiKey?: string
}

export type TranscriptLine = {
  id: string | number
  role: 'ai' | 'user'
  text: string
}

export type CallOutcome = {
  label: string
  value: string
}

const FALLBACK_PROMPT = `You are Riley Morgan, a professional and empathetic Collections Specialist calling on behalf of Chase Card Services.

You are making an OUTBOUND call to a consumer whose Chase credit card is 60 days past due (pre-charge-off). Your goal is to cure the delinquency — collect the past-due amount or secure a clear promise to pay — while remaining fully compliant with the Fair Debt Collection Practices Act (FDCPA).

COMPLIANCE RULES (MANDATORY):
1. Before discussing the debt, state: "This is an attempt to collect a debt, and any information obtained will be used for that purpose."
2. Verify the consumer's identity before revealing any account or balance details. Never disclose the debt to third parties.
3. Never threaten, intimidate, use profanity, or make false statements (no threats of arrest, jail, or legal action you will not take).
4. Offer payment options without pressure, recap any promise to pay with the exact amount and date, and capture the outcome.

TONE: empathetic, calm, patient, and professional.`

export const FALLBACK_AGENT_CONFIG: AgentConfig = {
  account: {
    consumerName: 'James Carter',
    accountNumber: 'CH-7723849',
    cardLastFour: '3849',
    creditor: 'Chase Card Services',
    balanceOwed: '$3,847.22',
    daysPastDue: 60,
    minimumPaymentDue: '$94.50',
    pastDueAmount: '$189.00',
    monthlyPayment: '$94.50',
  },
  persona: {
    name: 'Riley Morgan',
    role: 'Collections Specialist',
    company: 'Chase Card Services',
    tone: 'Warm, professional, patient and empathetic',
  },
  assistantPrompt: FALLBACK_PROMPT,
  deepgramAgentConfig: {
    listen: { provider: { type: 'deepgram', model: 'nova-3' } },
    think: {
      provider: { type: 'open_ai', model: 'gpt-4o-mini' },
      prompt: FALLBACK_PROMPT,
    },
    speak: {
      provider: { type: 'deepgram', version: 'v2', model: 'flux-kit-en' },
    },
  },
}

// Guion de la llamada de cobranza (demo simulado, offline, cero costo).
// Representa una llamada saliente pre-charge-off conforme a la FDCPA.
export const DEMO_SCRIPT: { role: 'ai' | 'user'; text: string }[] = [
  {
    role: 'ai',
    text: 'Hi, this is Riley calling from Chase Card Services. Am I speaking with James Carter?',
  },
  { role: 'user', text: 'Yes, this is James.' },
  {
    role: 'ai',
    text: "Thank you, James. Before we go any further, I need to let you know this is an attempt to collect a debt, and any information obtained will be used for that purpose. This call may be monitored or recorded. To make sure I'm speaking with the right person, can you confirm your date of birth or the last four digits of your Social Security number?",
  },
  { role: 'user', text: 'Sure — my date of birth is March 14, 1985.' },
  {
    role: 'ai',
    text: "Thank you, that matches. I'm calling about your Chase credit card ending in 3849, which is currently 60 days past due.",
  },
  {
    role: 'ai',
    text: 'To be transparent: your total balance is $3,847.22, and the amount currently past due is $189.00 — that reflects two missed monthly payments of $94.50 each.',
  },
  {
    role: 'user',
    text: "I know, I'm sorry. I had an unexpected expense last month and things got tight.",
  },
  {
    role: 'ai',
    text: "I completely understand, and I appreciate you being upfront with me. That's exactly why I'm calling — we want to work with you to get this back on track. There's no judgment here; my job is to find a payment arrangement that works for your situation.",
  },
  {
    role: 'user',
    text: "I can probably pay the $94.50 minimum next week, but the full $189 might be hard right now.",
  },
  {
    role: 'ai',
    text: "That's a great start. Here are your options: you could pay the full past-due amount of $189.00 today, or we can set up a promise to pay — for example, make the $94.50 minimum payment today and commit the remaining $94.50 by a date you choose. Would that work?",
  },
  {
    role: 'user',
    text: 'Yes, I can do $94.50 today and the other $94.50 by the 28th.',
  },
  {
    role: 'ai',
    text: "Perfect. Let me confirm your promise to pay: $94.50 today, and the remaining $94.50 by the 28th of this month. Does that sound correct?",
  },
  { role: 'user', text: "Yes, that's right." },
  {
    role: 'ai',
    text: "Thank you, James. I've noted that on the account, and you'll receive a confirmation by email. If anything changes and you can't make the payment, please call us back as soon as possible — we're here to help. Is there anything else I can do for you today?",
  },
  { role: 'user', text: "No, that's everything. Thank you." },
  {
    role: 'ai',
    text: "You're welcome. Thank you for taking care of this today, and have a great rest of your day.",
  },
]

export const DEMO_OUTCOME: CallOutcome = {
  label: 'Promise to pay',
  value: '$94.50 today + $94.50 by the 28th',
}
