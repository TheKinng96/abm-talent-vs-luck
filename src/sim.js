import { Agent } from './agent.js';
import { LuckEvent } from './event.js';
import { generateTalent, randomPosition } from './utils/random.js';

export class Simulation {
	constructor(gridSize = 201, numAgents = 1000, numEvents = 100, duration = 500) {
		this.gridSize = gridSize;
		this.numAgents = numAgents;
		this.numEvents = numEvents;
		this.duration = duration; // 500 ticks
		this.agents = [];
		this.events = [];
		this.agentsMap = new Map(); // Use Map for potentially sparse grid lookup
		this.tickCount = 0;
		this.isRunning = false;
		this.init();
	}

	init() {
		this.agents = [];
		this.events = [];
		this.agentsMap.clear();
		this.tickCount = 0;
		this.isRunning = false;

		// Create Agents at unique random positions
		const occupied = new Set();
		while (this.agents.length < this.numAgents) {
			const [x, y] = randomPosition(this.gridSize);
			const posKey = `${x}-${y}`;
			if (!occupied.has(posKey)) {
				occupied.add(posKey);
				const talent = generateTalent();
				const agent = new Agent(x, y, talent);
				this.agents.push(agent);
				this.agentsMap.set(posKey, agent); // Map position string to agent
			}
		}

		// Create Events (50 lucky, 50 unlucky)
		for (let i = 0; i < this.numEvents; i++) {
			const type = i < this.numEvents / 2 ? 'lucky' : 'unlucky';
			this.events.push(new LuckEvent(type, this.gridSize));
		}
		console.log(
			`Simulation initialized with ${this.agents.length} agents and ${this.events.length} events.`
		);
	}

	tick() {
		if (this.tickCount >= this.duration) {
			this.isRunning = false;
			console.log('Simulation finished.');
			return false; // Indicate simulation ended
		}

		this.events.forEach((event) => {
			event.move();
			const posKey = `${event.x}-${event.y}`;
			const hitAgent = this.agentsMap.get(posKey);

			if (hitAgent) {
				if (event.type === 'lucky') {
					hitAgent.applyLucky();
				} else {
					hitAgent.applyUnlucky();
				}
			}
		});

		this.tickCount++;
		return true; // Indicate simulation continues
	}

	reset() {
		this.init();
		// Agents are recreated in init, so their capital is reset
	}

	getAgents() {
		return this.agents;
	}

	getEvents() {
		return this.events;
	}

	getCurrentTick() {
		return this.tickCount;
	}

	getMaxTicks() {
		return this.duration;
	}
}
