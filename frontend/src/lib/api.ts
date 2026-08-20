import type { AgentConfig } from '../data/agentConfig'

export async function fetchAgentConfig(): Promise<AgentConfig> {
  const res = await fetch('/api/v1/agent')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as AgentConfig
}
