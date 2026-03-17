import { useState, useEffect } from 'react';
import { SimulationRequest, SimulationResponse, Metadata, AllScenariosRequest, AllScenariosResponse } from '../types';

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

export function useMetadata() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  useEffect(() => {
    fetch(`${BASE}/simulate/metadata`)
      .then(r => r.json())
      .then(setMetadata)
      .catch(console.error);
  }, []);
  return metadata;
}

export function useDefaults() {
  const [defaults, setDefaults] = useState<SimulationRequest | null>(null);
  useEffect(() => {
    fetch(`${BASE}/simulate/defaults`)
      .then(r => r.json())
      .then(setDefaults)
      .catch(console.error);
  }, []);
  return defaults;
}

export async function runSimulation(req: SimulationRequest): Promise<SimulationResponse> {
  const res = await fetch(`${BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Simulation failed');
  }
  return res.json();
}

export async function runAllScenarios(req: AllScenariosRequest): Promise<AllScenariosResponse> {
  const res = await fetch(`${BASE}/simulate/all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Simulation failed');
  }
  return res.json();
}
