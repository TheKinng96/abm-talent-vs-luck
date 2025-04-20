// No imports needed here if colorScale is passed in, or import createColorScale
// We will handle imports and setup in main.js

let ctx;
let canvasWidth, canvasHeight;
let scaleFactor; // To map grid coordinates to canvas pixels

export function setupCanvas(canvasElement, gridSize) {
	ctx = canvasElement.getContext('2d');
	canvasWidth = canvasElement.width;
	canvasHeight = canvasElement.height;
	scaleFactor = canvasWidth / gridSize; // Assumes square canvas/grid
	console.log(`Canvas setup: ${canvasWidth}x${canvasHeight}, Scale: ${scaleFactor}`);
}

export function draw(simulation, colorScale) {
	if (!ctx) return;

	// Clear canvas
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	const agents = simulation.getAgents();
	const events = simulation.getEvents();
	const agentRadius = Math.max(1, Math.min(2, scaleFactor / 3)); // Agent dot size
	const eventRadius = Math.max(1, scaleFactor / 4); // Event dot size

	// Draw Agents
	agents.forEach((agent) => {
		ctx.fillStyle = colorScale(Math.max(1, agent.cap)); // Use scale, ensure cap > 0 for log
		ctx.beginPath();
		ctx.arc(
			(agent.x + 0.5) * scaleFactor, // Center in cell
			(agent.y + 0.5) * scaleFactor, // Center in cell
			agentRadius,
			0,
			2 * Math.PI
		);
		ctx.fill();
	});

	// Draw Events
	events.forEach((event) => {
		ctx.fillStyle = event.type === 'lucky' ? 'lime' : 'red';
		ctx.beginPath();
		ctx.arc(
			(event.x + 0.5) * scaleFactor, // Center in cell
			(event.y + 0.5) * scaleFactor, // Center in cell
			eventRadius,
			0,
			2 * Math.PI
		);
		ctx.fill();
	});
}

export function clearHistogram(svgElementId) {
	const svg = document.getElementById(svgElementId);
	if (svg) {
		svg.innerHTML = ''; // Clear previous histogram
	}
}
