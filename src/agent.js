export class Agent {
	constructor(x, y, talent) {
		this.x = x;
		this.y = y;
		this.t = talent; // talent
		this.cap = 10; // initial capital
		this.initialCap = 10;
		this.id = `${x}-${y}`; // Unique ID based on fixed position
	}

	applyLucky() {
		if (Math.random() < this.t) {
			this.cap *= 2;
		}
	}

	applyUnlucky() {
		this.cap /= 2;
	}

	reset() {
		this.cap = this.initialCap;
	}
}
