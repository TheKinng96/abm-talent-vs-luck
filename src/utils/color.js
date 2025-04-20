// src/utils/color.js

import { scaleLog, scaleLinear } from 'd3-scale'; // Note: scaleLinear added for clarity if switching
import { interpolateViridis } from 'd3-scale-chromatic';
import { extent as d3Extent } from 'd3-array';

// --- Configuration ---
const USE_FIXED_DOMAIN = true;
const MIN_CAP_DISPLAY = 1;
const MAX_CAP_DISPLAY = 10000; // Adjust as needed
const SCALE_TYPE = 'log'; // 'log' or 'linear'

/**
 * Creates and returns a function that maps capital to a color.
 * This function internally uses a D3 scale and an interpolator.
 * @param {Agent[]} agents - Array of agent objects (only needed for dynamic domain).
 * @returns {Function} A function that takes a capital value and returns a color string.
 */
export function createColorScale(agents) {
	// console.log("Entering createColorScale. Agents count:", agents?.length);
	let domain = [MIN_CAP_DISPLAY, MAX_CAP_DISPLAY];

	try {
		if (!USE_FIXED_DOMAIN) {
			const capitalExtent = d3Extent(agents, (a) => a.cap);
			const minCap = Math.max(MIN_CAP_DISPLAY, capitalExtent[0] ?? MIN_CAP_DISPLAY);
			const maxCap = Math.max(minCap + 1, capitalExtent[1] ?? MAX_CAP_DISPLAY);
			domain = [minCap, maxCap];
			// console.log("Using dynamic domain:", domain);
		} else {
			// console.log("Using fixed domain:", domain);
		}

		let scale;
		if (SCALE_TYPE === 'log') {
			// console.log("Creating log scale base");
			scale = scaleLog();
		} else {
			// console.log("Creating linear scale base");
			scale = scaleLinear();
		}

		// Configure the base scale to map the capital domain to the range [0, 1]
		const baseScale = scale
			.domain(domain)
			.range([0, 1]) // Map capital to a 0-1 range
			.clamp(true); // Clamp values outside the domain

		// *** The Fix: Return a NEW function that combines the scale and interpolator ***
		const finalColorFunction = (capitalValue) => {
			const scaledValue = baseScale(Math.max(MIN_CAP_DISPLAY, capitalValue)); // Ensure input >= min domain for log
			return interpolateViridis(scaledValue); // Use the interpolator on the 0-1 value
		};

		// console.log("Scale function created successfully. Type:", typeof finalColorFunction);
		return finalColorFunction; // Return the combined function
	} catch (error) {
		console.error('!!! Error inside createColorScale:', error);
		// Return a fallback function that returns a fixed error color
		return (value) => '#FF00FF'; // Bright pink indicates error
	}
}

/**
 * Helper function to get a placeholder color if the scale fails.
 * @returns {string} A default color string.
 */
export function getDefaultColor() {
	return '#cccccc'; // A neutral grey
}
