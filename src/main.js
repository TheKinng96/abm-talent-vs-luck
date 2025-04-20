import { Simulation } from './sim.js';
import { setupCanvas, draw, clearHistogram } from './ui.js';
import { createColorScale } from './utils/color.js';
import { drawHistogram } from './utils/hist.js';

// --- Config ---
const GRID_SIZE = 201;
const NUM_AGENTS = 1000;
const NUM_EVENTS = 100;
const SIM_DURATION = 80; // Ticks
const CANVAS_ID = 'simulationCanvas';
const HISTOGRAM_SVG_ID = 'histogramSvg';

// --- State ---
let sim;
let animationFrameId = null;
let simSpeed = 5; // ticks per frame multiplier
let colorScale;

// --- UI Elements ---
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedSlider = document.getElementById('speedSlider');
const tickCounter = document.getElementById('tickCounter');
const canvas = document.getElementById(CANVAS_ID);

// --- Initialization ---
function initialize() {
	console.log('Initializing simulation...');
	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}

	sim = new Simulation(GRID_SIZE, NUM_AGENTS, NUM_EVENTS, SIM_DURATION);
	setupCanvas(canvas, GRID_SIZE);

	// Create color scale
	colorScale = createColorScale(sim.getAgents());

	// Initial draw
	draw(sim, colorScale);
	updateUIControls();
	updateTickCounter();
	clearHistogram(HISTOGRAM_SVG_ID); // Clear histogram on reset
	console.log('Initialization complete.');
}

// --- Animation Loop ---
function animationLoop() {
	if (!sim.isRunning) return;

	for (let i = 0; i < simSpeed; i++) {
		if (!sim.tick()) {
			// If tick() returns false, simulation ended
			stopSimulation();
			drawHistogram(sim.getAgents(), HISTOGRAM_SVG_ID); // Draw final histogram
			break; // Exit speed loop
		}
	}

	// Update color scale domain periodically or based on max value if dynamic
	// colorScale = createColorScale(sim.getAgents()); // Option: Update scale dynamically

	draw(sim, colorScale);
	updateTickCounter();

	if (sim.isRunning) {
		animationFrameId = requestAnimationFrame(animationLoop);
	}
}

// --- Control Functions ---
function startSimulation() {
	if (!sim.isRunning && sim.getCurrentTick() < sim.getMaxTicks()) {
		sim.isRunning = true;
		animationFrameId = requestAnimationFrame(animationLoop);
		updateUIControls();
		console.log('Simulation started.');
	}
}

function pauseSimulation() {
	if (sim.isRunning) {
		sim.isRunning = false;
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		updateUIControls();
		console.log('Simulation paused.');
	}
}

function resetSimulation() {
	pauseSimulation(); // Ensure loop is stopped
	console.log('Resetting simulation...');
	initialize(); // Re-initialize everything
	console.log('Simulation reset.');
}

function updateSpeed() {
	simSpeed = parseInt(speedSlider.value, 10);
}

function updateUIControls() {
	startBtn.disabled = sim.isRunning || sim.getCurrentTick() >= sim.getMaxTicks();
	pauseBtn.disabled = !sim.isRunning;
	resetBtn.disabled = sim.isRunning; // Maybe allow reset while running? safer to disable.
}

function updateTickCounter() {
	tickCounter.textContent = `Tick: ${sim.getCurrentTick()} / ${sim.getMaxTicks()}`;
}

function stopSimulation() {
	sim.isRunning = false;
	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}
	updateUIControls();
	console.log('Simulation stopped/finished.');
}

// --- Event Listeners ---
startBtn.addEventListener('click', startSimulation);
pauseBtn.addEventListener('click', pauseSimulation);
resetBtn.addEventListener('click', resetSimulation);
speedSlider.addEventListener('input', updateSpeed);

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
	// Set canvas size explicitly (could also be done via CSS + JS)
	canvas.width = 603;
	canvas.height = 603;
	initialize(); // Initialize on load
});
