import type { ServerResponse } from 'node:http'

interface SSEClient {
  id: string
  response: ServerResponse
}

const clients = new Map<string, SSEClient>()

export function addClient(id: string, res: ServerResponse): void {
  clients.set(id, { id, response: res })
}

export function removeClient(id: string): void {
  clients.delete(id)
}

export function broadcast(eventType: string, data: unknown): void {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of clients.values()) {
    try {
      client.response.write(payload)
    } catch {
      clients.delete(client.id)
    }
  }
}

export function getConnectedCount(): number {
  return clients.size
}
