import type { IAgent } from '$lib/models/agent';
import Dexie, { type Table } from 'dexie';

export class MySubClassedDexie extends Dexie {
	agents!: Table<IAgent>;

	constructor() {
		super('myDatabase');
		this.version(1).stores({
			agents: '++id, skill_level, asset', // Primary key and indexed props
		});
	}
}

export const db = new MySubClassedDexie();
