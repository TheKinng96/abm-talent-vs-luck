import type { IAgent } from '$lib/models/agent';
import { writable, derived } from 'svelte/store';

// Define initial state
const initialState: IAgent[] = [];

// Create a custom store
function createAgentsStore() {
	const { subscribe, set, update } = writable(initialState);

	return {
		subscribe,
		// Actions
		addAgent: (agent: IAgent) => update((state) => [...state, agent]),
		updateAgent: (updatedAgent: IAgent) =>
			update((state) =>
				state.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent))
			),
		removeAgent: (id: string) => update((state) => state.filter((agent) => agent.id !== id)),
		// Reset to initial state
		reset: () => set(initialState)
	};
}

export const agentsStore = createAgentsStore();

// Getters
export const totalAgents = derived(agentsStore, ($agentsStore) => $agentsStore.length);

export const findAgentById = (id: string) =>
	derived(agentsStore, ($agentsStore) => $agentsStore.find((agent) => agent.id === id));
