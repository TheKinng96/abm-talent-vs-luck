import { Simulation } from './sim.js';
import { setupCanvas, draw, clearHistogram } from './ui.js';
import { createColorScale } from './utils/color.js';
import { drawHistogram } from './utils/hist.js';

// --- Config ---
const GRID_SIZE = 201;
const NUM_AGENTS = 1000;
const NUM_EVENTS = 100;
const SIM_DURATION = 80; // Adjusted duration (40 years * 2 steps/year)
const CANVAS_ID = 'simulationCanvas';
const HISTOGRAM_SVG_ID = 'histogramSvg';

// --- State ---
let sim;
let animationFrameId = null;
let colorScale;
let isContinuouslyRunning = false; // State for continuous run
let isProcessingBatch = false; // State for batch run

// --- UI Elements ---
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const nextBtn = document.getElementById('nextBtn');
const autoStepsInput = document.getElementById('autoStepsInput');
const autoBtn = document.getElementById('autoBtn');
const tickCounter = document.getElementById('tickCounter');
const statusIndicator = document.getElementById('statusIndicator');
const canvas = document.getElementById(CANVAS_ID);
const agentTableBody = document.getElementById('agentTableBody');

/**
 * Populates the agent table with initial data. Creates rows and cells.
 * @param {Agent[]} agents - The array of agent objects.
 */
function populateAgentTable(agents) {
	if (!agentTableBody) return;
	agentTableBody.innerHTML = ''; // Clear existing rows

	agents.forEach((agent) => {
		const row = agentTableBody.insertRow();
		row.setAttribute('data-agent-id', agent.id); // IMPORTANT: Link row to agent ID

		const idCell = row.insertCell();
		const talentCell = row.insertCell();
		const capitalCell = row.insertCell();

		idCell.textContent = agent.id;
		talentCell.textContent = agent.t.toFixed(3); // Format talent
		capitalCell.textContent = agent.cap.toFixed(2); // Format initial capital
		capitalCell.classList.add('agent-capital-cell'); // Add class for easier selection (optional)
	});
	console.log(`Agent table populated with ${agents.length} rows.`);
}

/**
 * Updates only the capital values in the agent table efficiently.
 * @param {Agent[]} agents - The array of agent objects.
 */
function updateAgentTableCapital(agents) {
	if (!agentTableBody) return;

	// Consider throttling this if performance is still an issue on very fast ticks
	// For now, update every time draw happens

	agents.forEach((agent) => {
		// Find the row using the data attribute
		const row = agentTableBody.querySelector(`tr[data-agent-id="${agent.id}"]`);
		if (row) {
			// Find the capital cell (assuming it's the last cell, index 2)
			const capitalCell = row.cells[2]; // Or use querySelector('.agent-capital-cell') if class was added
			if (capitalCell) {
				const currentDisplayedCapital = parseFloat(capitalCell.textContent);
				const newCapital = agent.cap;
				// Only update DOM if value actually changed (minor optimization)
				// Use tolerance for floating point comparison if needed
				if (Math.abs(currentDisplayedCapital - newCapital) > 0.001) {
					capitalCell.textContent = newCapital.toFixed(2);
				}
			}
		} else {
			// This shouldn't happen if populated correctly, but log if it does
			// console.warn(`Could not find table row for agent ID: ${agent.id}`);
		}
	});
}

// --- Core Simulation Step Function ---
/**
 * Executes a single simulation tick, updates drawing, and checks for completion.
 * @returns {boolean} true if the simulation can continue, false if it ended.
 */
function performTick() {
	if (sim.getCurrentTick() >= sim.getMaxTicks()) {
		return false; // Already finished
	}

	const canContinue = sim.tick(); // Run one simulation step

	// Update drawing and counter
	draw(sim, colorScale); // Update visualization
	updateAgentTableCapital(sim.getAgents()); // Fix: Use sim.getAgents() instead of currentAgents
	updateTickCounter();

	if (!canContinue || sim.getCurrentTick() >= sim.getMaxTicks()) {
		finishSimulation();
		return false; // Simulation just finished
	}
	return true; // Simulation ongoing
}

// --- Animation Loop for Continuous Run ---
function animationLoop() {
	if (!isContinuouslyRunning) return; // Stop if paused

	if (performTick()) {
		// If the tick was successful and sim not ended, request next frame
		animationFrameId = requestAnimationFrame(animationLoop);
	} else {
		// If tick failed (sim ended), ensure state is updated
		isContinuouslyRunning = false;
		updateUIControls();
	}
}

// --- Control Functions ---

function startContinuousRun() {
	if (!isContinuouslyRunning && sim.getCurrentTick() < sim.getMaxTicks() && !isProcessingBatch) {
		isContinuouslyRunning = true;
		statusIndicator.textContent = 'Status: Running...';
		updateUIControls();
		animationFrameId = requestAnimationFrame(animationLoop); // Start the loop
	}
}

function pauseContinuousRun() {
	if (isContinuouslyRunning) {
		isContinuouslyRunning = false;
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		statusIndicator.textContent = 'Status: Paused';
		updateUIControls();
	}
}

function manualTick() {
	if (!isContinuouslyRunning && !isProcessingBatch && sim.getCurrentTick() < sim.getMaxTicks()) {
		statusIndicator.textContent = 'Status: Stepping...';
		performTick(); // Run one step
		statusIndicator.textContent =
			sim.getCurrentTick() >= sim.getMaxTicks() ? 'Status: Finished' : 'Status: Ready';
		updateUIControls(); // Update button states (e.g., disable Next if finished)
	}
}

async function runBatchTicks() {
	if (isContinuouslyRunning || isProcessingBatch || sim.getCurrentTick() >= sim.getMaxTicks()) {
		return; // Don't run if already running/processing/finished
	}

	const steps = parseInt(autoStepsInput.value, 10);
	if (isNaN(steps) || steps <= 0) {
		alert('Please enter a valid number of ticks ( > 0) for the batch run.');
		return;
	}

	isProcessingBatch = true;
	statusIndicator.textContent = `Status: Running batch (${steps} ticks)...`;
	updateUIControls(); // Disable controls during batch

	// Use setTimeout for async execution to allow UI to update before blocking
	await new Promise((resolve) => setTimeout(resolve, 10));

	let stepsTaken = 0;
	let keepGoing = true;
	while (stepsTaken < steps && keepGoing) {
		if (sim.getCurrentTick() < sim.getMaxTicks()) {
			keepGoing = sim.tick(); // Run tick logic
			stepsTaken++;

			// Update UI every few steps to show progress
			if (stepsTaken % 5 === 0 || stepsTaken === steps) {
				draw(sim, colorScale);
				updateAgentTableCapital(sim.getAgents());
				updateTickCounter();
				// Allow UI to update
				await new Promise((resolve) => setTimeout(resolve, 0));
			}
		} else {
			keepGoing = false; // Stop if max ticks reached
		}
	}

	// Final updates after batch
	draw(sim, colorScale); // Draw final state after batch
	updateAgentTableCapital(sim.getAgents());
	updateTickCounter();
	isProcessingBatch = false;

	if (sim.getCurrentTick() >= sim.getMaxTicks()) {
		finishSimulation();
		statusIndicator.textContent = 'Status: Finished';
	} else {
		statusIndicator.textContent = 'Status: Ready';
	}
	updateUIControls(); // Re-enable controls
}

function resetSimulation() {
	pauseContinuousRun(); // Stop continuous run if active
	isProcessingBatch = false; // Ensure batch processing flag is reset

	console.log('Resetting simulation...');
	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}

	sim = new Simulation(GRID_SIZE, NUM_AGENTS, NUM_EVENTS, SIM_DURATION);
	const initialAgents = sim.getAgents();
	colorScale = createColorScale(initialAgents); // Recreate scale

	populateAgentTable(initialAgents);
	setupCanvas(canvas, GRID_SIZE);
	draw(sim, colorScale); // Initial draw
	clearHistogram(HISTOGRAM_SVG_ID);
	updateTickCounter();
	statusIndicator.textContent = 'Status: Ready';
	updateUIControls();
	console.log('Simulation reset.');
}

function finishSimulation() {
	console.log('Simulation finished.');
	isContinuouslyRunning = false;
	isProcessingBatch = false; // Make sure this is false
	statusIndicator.textContent = 'Status: Finished';
	drawHistogram(sim.getAgents(), HISTOGRAM_SVG_ID);
	updateUIControls();
}

// --- UI Update Functions ---

function updateTickCounter() {
	tickCounter.textContent = `Tick: ${sim.getCurrentTick()} / ${sim.getMaxTicks()}`;
}

function updateUIControls() {
	const finished = sim.getCurrentTick() >= sim.getMaxTicks();
	const canInteract = !isContinuouslyRunning && !isProcessingBatch && !finished;

	startBtn.disabled = isContinuouslyRunning || isProcessingBatch || finished;
	pauseBtn.disabled = !isContinuouslyRunning || isProcessingBatch || finished;
	resetBtn.disabled = isContinuouslyRunning || isProcessingBatch; // Allow reset unless actively running

	nextBtn.disabled = !canInteract;
	autoBtn.disabled = !canInteract;
	autoStepsInput.disabled = !canInteract;
}

// --- Initialization ---
function initialize() {
	console.log('Initializing simulation...');
	canvas.width = 603;
	canvas.height = 603;
	resetSimulation(); // Use reset to perform initial setup
}

// --- Event Listeners ---
startBtn.addEventListener('click', startContinuousRun);
pauseBtn.addEventListener('click', pauseContinuousRun);
resetBtn.addEventListener('click', resetSimulation);
nextBtn.addEventListener('click', manualTick);
autoBtn.addEventListener('click', runBatchTicks);

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', initialize);
