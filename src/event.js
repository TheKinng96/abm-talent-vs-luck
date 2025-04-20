import { randomPosition, clamp } from './utils/random.js';

const MAX_STEP_SIZE = 5;

export class LuckEvent {
	constructor(type, gridSize) {
		this.type = type; // 'lucky' or 'unlucky'
		this.gridSize = gridSize;
		[this.x, this.y] = randomPosition(this.gridSize);
	}

	move() {
		// Generate random step between -MAX_STEP_SIZE and +MAX_STEP_SIZE
		const dx = Math.floor(Math.random() * (2 * MAX_STEP_SIZE + 1)) - MAX_STEP_SIZE;
		const dy = Math.floor(Math.random() * (2 * MAX_STEP_SIZE + 1)) - MAX_STEP_SIZE;

		// Apply step and clamp to grid boundaries
		this.x = clamp(this.x + dx, 0, this.gridSize - 1);
		this.y = clamp(this.y + dy, 0, this.gridSize - 1);
	}
}
