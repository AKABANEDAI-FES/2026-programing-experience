import type { Creature, ReleaseRequest, ReleaseResponse } from 'shared';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787';

export async function releaseCreature(request: ReleaseRequest): Promise<ReleaseResponse> {
  const response = await fetch(`${apiBaseUrl}/api/release`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return response.json();
}

export async function fetchCreatures(): Promise<Creature[]> {
  const response = await fetch(`${apiBaseUrl}/api/creatures`);
  if (!response.ok) {
    throw new Error('creatures fetch failed');
  }

  const body = (await response.json()) as { creatures: Creature[] };
  return body.creatures;
}
