import type { ISetting } from '$lib/models/setting';
import { writable, derived } from 'svelte/store';

// Define initial state
const initialState: ISetting = {
	current_round: 0,
	has_ended: true,
	number_of_agents: 0,
	number_of_rounds: 0,
	number_of_good_events: 0,
	number_of_bad_events: 0,
	range_of_skill_levels: [0.1, 1],
	range_of_assets: [1, 100],
	range_of_positions: [160, 90],
	range_of_duplicators: [1, 2]
};

function createSettingStore() {
	const { subscribe, set, update } = writable(initialState);

	return {
		subscribe,
		// Actions
		createSetting: (setting: ISetting) => set(setting),
		endCurrentSetting: () => update((state) => ({ ...state, has_ended: true })),
		// Reset to initial state
		reset: () => set(initialState)
	};
}

export const settingStore = createSettingStore();

// Getters
export const isCurrentSettingEnded = derived(
	settingStore,
	($settingStore) => $settingStore.has_ended ?? false
);
