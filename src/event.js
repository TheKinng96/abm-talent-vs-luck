import { randomPosition, clamp } from './utils/random.js';

export class LuckEvent {
	constructor(type, gridSize) {
		this.type = type; // 'lucky' or 'unlucky'
		this.gridSize = gridSize;
		[this.x, this.y] = randomPosition(this.gridSize);
	}

	move() {
		const dx = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
		const dy = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1

		this.x = clamp(this.x + dx, 0, this.gridSize - 1);
		this.y = clamp(this.y + dy, 0, this.gridSize - 1);
	}
}
