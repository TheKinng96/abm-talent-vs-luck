import { Simulation } from './sim.js';
import { setupCanvas, draw, clearHistogram } from './ui.js';
import { createColorScale } from './utils/color.js';
import { drawHistogram } from './utils/hist.js';

// --- Config ---
const GRID_SIZE = 201;
const NUM_AGENTS = 1000;
const NUM_EVENTS = 1000;
const SIM_DURATION = 80; // Adjusted duration (40 years * 2 steps/year)
const CANVAS_ID = 'simulationCanvas';
const HISTOGRAM_SVG_ID = 'histogramSvg';

// --- State ---
let sim;
let animationFrameId = null;
let colorScale;
let isContinuouslyRunning = false; // State for continuous run
let isProcessingBatch = false; // State for batch run
let currentSortColumn = 'id'; // Default sort column
let currentSortDirection = 'asc'; // Default sort direction ('asc' or 'desc')
let currentAgentsSnapshot = []; // Holds the agents array used for the *last table population*
let selectedAgentId = null;

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
const agentTableHeader = document.querySelector('#agentTable thead');

/**
 * Populates the agent table based on the provided (and potentially sorted) agent list.
 * Clears and rebuilds the table body.
 * @param {Agent[]} agentsToDisplay - The array of agent objects to display in the table.
 */
function populateAgentTable(agentsToDisplay) {
	if (!agentTableBody) return;
	agentTableBody.innerHTML = ''; // Clear existing rows

	agentsToDisplay.forEach((agent) => {
		const row = agentTableBody.insertRow();
		row.setAttribute('data-agent-id', agent.id);

		const idCell = row.insertCell();
		const talentCell = row.insertCell();
		const capitalCell = row.insertCell();

		idCell.textContent = agent.id;
		talentCell.textContent = agent.t.toFixed(3);
		capitalCell.textContent = agent.cap.toFixed(2);
		capitalCell.classList.add('agent-capital-cell');
	});
	updateSortIndicators(); // Update visual indicators on headers
	// console.log(`Agent table populated/repopulated with ${agentsToDisplay.length} rows.`);
}

/**
 * Updates only the capital values in the currently displayed agent table.
 * IMPORTANT: This assumes the table rows are already present and in the correct order
 *            as determined by the last call to populateAgentTable / sortTable.
 */
function updateAgentTableCapital() {
	if (!agentTableBody || currentAgentsSnapshot.length === 0) return;

	// Update based on the agents currently in the simulation state
	const currentSimAgents = sim.getAgents();
	const agentMap = new Map(currentSimAgents.map((agent) => [agent.id, agent])); // Quick lookup

	// Iterate through the ROWS currently in the table body
	Array.from(agentTableBody.rows).forEach((row) => {
		const agentId = row.getAttribute('data-agent-id');
		const agent = agentMap.get(agentId); // Get current data for this agent

		if (agent && row.cells.length > 2) {
			const capitalCell = row.cells[2]; // Capital is the 3rd cell (index 2)
			const currentDisplayedCapital = parseFloat(capitalCell.textContent);
			const newCapital = agent.cap;

			if (Math.abs(currentDisplayedCapital - newCapital) > 0.001) {
				capitalCell.textContent = newCapital.toFixed(2);
			}
		}
	});
}

/**
 * Sorts the simulation agents based on the clicked column and updates the table display.
 * @param {string} column - The identifier ('id', 'talent', 'capital') of the column to sort by.
 */
function sortTable(column) {
	if (!sim) return;

	const agentsToSort = [...sim.getAgents()]; // Create a mutable copy

	// Determine new sort direction
	if (column === currentSortColumn) {
		currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
	} else {
		currentSortColumn = column;
		currentSortDirection = 'asc'; // Default to ascending for new column
	}

	// Sorting logic
	agentsToSort.sort((a, b) => {
		let valA, valB;

		switch (column) {
			case 'talent':
				valA = a.t;
				valB = b.t;
				break;
			case 'capital':
				valA = a.cap;
				valB = b.cap;
				break;
			case 'id': // String comparison
			default:
				valA = a.id;
				valB = b.id;
				// Use localeCompare for potentially complex string sorting
				return currentSortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
		}

		// Numeric comparison
		return currentSortDirection === 'asc' ? valA - valB : valB - valA;
	});

	currentAgentsSnapshot = agentsToSort; // Store the newly sorted list
	populateAgentTable(currentAgentsSnapshot); // Repopulate table with sorted data
}

/**
 * Updates the visual indicators (arrows) on the table headers.
 */
function updateSortIndicators() {
	if (!agentTableHeader) return;
	const headers = agentTableHeader.querySelectorAll('th.sortable-header');
	headers.forEach((th) => {
		const column = th.getAttribute('data-column');
		th.classList.remove('sort-asc', 'sort-desc'); // Remove existing classes
		if (column === currentSortColumn) {
			th.classList.add(currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
		}
	});
}

// --- Attach Sort Event Listener ---
function setupTableSorting() {
	if (!agentTableHeader) return;
	// Use event delegation on the thead element
	agentTableHeader.addEventListener('click', (event) => {
		const header = event.target.closest('th.sortable-header'); // Find the clicked header
		if (header) {
			const column = header.getAttribute('data-column');
			if (column) {
				// Prevent sorting during active runs if it causes issues (optional)
				// if (isContinuouslyRunning || isProcessingBatch) {
				//     console.log("Sorting disabled while simulation is running.");
				//     return;
				// }
				sortTable(column);
			}
		}
	});
	console.log('Table sorting enabled.');
}

/**
 * Sets up the event listener for agent selection via table row clicks.
 */
function setupTableSelection() {
	if (!agentTableBody) return;

	agentTableBody.addEventListener('click', (event) => {
		const row = event.target.closest('tr'); // Find the clicked table row
		if (!row || !sim) return; // Exit if click wasn't on a row or sim not ready

		const agentId = row.getAttribute('data-agent-id');
		if (!agentId) return; // Exit if row has no agent ID

		// Toggle selection
		if (selectedAgentId === agentId) {
			selectedAgentId = null; // Deselect if clicking the already selected agent
			// console.log("Agent deselected:", agentId);
		} else {
			selectedAgentId = agentId; // Select the new agent
			// console.log("Agent selected:", agentId);
		}

		// Force an immediate redraw to show/hide the highlight
		// Pass the updated selectedAgentId to draw
		draw(sim, colorScale, selectedAgentId);

		// Optional: Add visual cue to the selected table row
		highlightTableRow(selectedAgentId);
	});

	// Optional: Click on canvas background to deselect
	canvas.addEventListener('click', (event) => {
		// Basic check: If click is not near an agent, deselect.
		// More complex logic could check if the click was on empty space.
		// For now, let's just allow any canvas click (not on table) to deselect
		// We need to prevent this if the click originated from the table listener bubbling up.
		// The table listener above should handle the primary logic.
		// A simple deselect on any canvas click might be too aggressive.
		// Let's stick to clicking the row again to deselect for now.
		// Or add a dedicated "Clear Selection" button if needed.
	});

	console.log('Table selection enabled.');
}

/**
 * Optional: Adds/removes a CSS class to highlight the selected row in the table.
 * @param {string | null} agentIdToHighlight - The ID of the agent whose row should be highlighted, or null to clear.
 */
function highlightTableRow(agentIdToHighlight) {
	if (!agentTableBody) return;
	// Remove highlight from previously selected row
	const previouslySelected = agentTableBody.querySelector('tr.selected-row');
	if (previouslySelected) {
		previouslySelected.classList.remove('selected-row');
	}
	// Add highlight to the newly selected row
	if (agentIdToHighlight) {
		const row = agentTableBody.querySelector(`tr[data-agent-id="${agentIdToHighlight}"]`);
		if (row) {
			row.classList.add('selected-row');
		}
	}
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
	draw(sim, colorScale, selectedAgentId); // Update visualization
	updateAgentTableCapital(); // Update table capital values
	updateTickCounter();

	// Update histogram in real-time
	drawHistogram(sim.getAgents(), HISTOGRAM_SVG_ID);

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
				draw(sim, colorScale, selectedAgentId);
				updateAgentTableCapital();
				updateTickCounter();
				// Update histogram in real-time
				drawHistogram(sim.getAgents(), HISTOGRAM_SVG_ID);
				// Allow UI to update
				await new Promise((resolve) => setTimeout(resolve, 0));
			}
		} else {
			keepGoing = false; // Stop if max ticks reached
		}
	}

	// Final updates after batch
	draw(sim, colorScale); // Draw final state after batch
	updateAgentTableCapital();
	updateTickCounter();
	// Update histogram one final time
	drawHistogram(sim.getAgents(), HISTOGRAM_SVG_ID);
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
	currentAgentsSnapshot = initialAgents; // Update the snapshot
	selectedAgentId = null;
	highlightTableRow(null);

	populateAgentTable(initialAgents);
	setupCanvas(canvas, GRID_SIZE);
	draw(sim, colorScale, selectedAgentId); // Initial draw
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

	// Set canvas size
	canvas.width = 603;
	canvas.height = 603;

	// Initialize simulation
	sim = new Simulation(GRID_SIZE, NUM_AGENTS, NUM_EVENTS, SIM_DURATION);
	const initialAgents = sim.getAgents();
	colorScale = createColorScale(initialAgents);
	currentAgentsSnapshot = initialAgents;

	// Setup UI
	setupCanvas(canvas, GRID_SIZE);
	populateAgentTable(initialAgents);
	draw(sim, colorScale);
	clearHistogram(HISTOGRAM_SVG_ID);
	// Draw initial histogram
	drawHistogram(initialAgents, HISTOGRAM_SVG_ID);
	updateTickCounter();
	statusIndicator.textContent = 'Status: Ready';
	updateUIControls();
	setupTableSorting();
	setupTableSelection();

	console.log('Initialization complete');
}

// --- Event Listeners ---
startBtn.addEventListener('click', startContinuousRun);
pauseBtn.addEventListener('click', pauseContinuousRun);
resetBtn.addEventListener('click', resetSimulation);
nextBtn.addEventListener('click', manualTick);
autoBtn.addEventListener('click', runBatchTicks);

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', initialize);
