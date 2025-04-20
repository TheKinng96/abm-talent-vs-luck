// Box-Muller transform for Normal deviates
function normalBoxMuller() {
	let u = 0,
		v = 0;
	while (u === 0) u = Math.random(); // Converting [0,1) to (0,1), [ is <= while ( is <
	while (v === 0) v = Math.random();
	let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
	// We generate two numbers, z0 and z1. We only use z0 here.
	// Can store z1 for next call if optimization needed.
	return z;
}

// Generate talent: Truncated Normal(mu, sigma) in [0, 1]
export function generateTalent(mu = 0.6, sigma = 0.1) {
	let talent;
	do {
		talent = mu + sigma * normalBoxMuller();
	} while (talent < 0 || talent > 1); // Truncate/clamp
	return talent;
}

// Generate random integer position within grid dimensions
export function randomPosition(gridSize) {
	const x = Math.floor(Math.random() * gridSize);
	const y = Math.floor(Math.random() * gridSize);
	return [x, y];
}

// Clamp value within bounds
export function clamp(value, min, max) {
	return Math.max(min, Math.min(value, max));
}
