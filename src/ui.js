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

/**
 * Draws the current state of the simulation on the canvas.
 * @param {Simulation} simulation - The simulation instance.
 * @param {Function} colorScale - The D3 color scale function.
 * @param {string | null} selectedAgentId - The ID of the agent to highlight, or null.
 */
export function draw(simulation, colorScale, selectedAgentId) {
	// <<<--- Added selectedAgentId parameter
	if (!ctx) return;

	// Clear canvas
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	const agents = simulation.getAgents();
	const events = simulation.getEvents();
	const agentRadius = Math.max(1, Math.min(2.5, scaleFactor / 2.5)); // Slightly bigger base radius maybe
	const eventRadius = Math.max(1, scaleFactor / 4);
	const highlightStrokeColor = 'black'; // Or 'white', '#FF00FF', etc.
	const highlightLineWidth = 3; // px

	// Draw Agents
	agents.forEach((agent) => {
		const cx = (agent.x + 0.5) * scaleFactor; // Center x in cell
		const cy = (agent.y + 0.5) * scaleFactor; // Center y in cell

		// Draw the basic agent circle
		ctx.fillStyle = colorScale(Math.max(1, agent.cap)); // Use scale, ensure cap > 0 for log
		ctx.beginPath();
		ctx.arc(cx, cy, agentRadius, 0, 2 * Math.PI);
		ctx.fill();

		// --- Draw Highlight if Selected ---
		if (agent.id === selectedAgentId) {
			ctx.strokeStyle = highlightStrokeColor;
			ctx.lineWidth = highlightLineWidth;
			// No need for new path, stroke the existing arc path
			ctx.stroke();
		}
		// --- End Highlight ---
	});

	// Draw Events (remain the same)
	events.forEach((event) => {
		ctx.fillStyle = event.type === 'lucky' ? 'lime' : 'red';
		ctx.beginPath();
		ctx.arc(
			(event.x + 0.5) * scaleFactor,
			(event.y + 0.5) * scaleFactor,
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
