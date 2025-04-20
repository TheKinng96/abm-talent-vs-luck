import { histogram as d3Histogram, max as d3Max, extent as d3Extent } from 'd3-array';
import { scaleLinear, scaleLog } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { format } from 'd3-format';

// Helper to compute bins (as originally planned)
export function computeBins(agents) {
	const capitalData = agents.map((a) => a.cap).filter((c) => c > 0); // Filter out zero/negative capital if any
	if (capitalData.length === 0) return [];

	// Decide on scale (linear or log) for binning - Log often better for wealth
	const maxCapital = d3Max(capitalData);
	const minCapital = 1; // Smallest unit of capital, avoid log(0)

	// Setup histogram generator
	const binsGenerator = d3Histogram()
		.value((d) => d) // Use capital value directly
		// Use log thresholds for better distribution visibility
		.domain([minCapital, maxCapital]) // Set domain
		.thresholds(scaleLog().domain([minCapital, maxCapital]).ticks(20)); // ~20 log-spaced bins

	// Or use linear thresholds:
	// .thresholds(20); // ~20 linearly spaced bins

	return binsGenerator(capitalData);
}

// Function to draw histogram using D3 on an SVG element
export function drawHistogram(agents, svgElementId) {
	const bins = computeBins(agents);
	if (!bins || bins.length === 0) {
		console.log('No data to draw histogram.');
		return;
	}

	const svg = select(`#${svgElementId}`);
	svg.selectAll('*').remove(); // Clear previous histogram

	const svgWidth = parseInt(svg.style('width'));
	const svgHeight = parseInt(svg.style('height'));
	const margin = { top: 20, right: 30, bottom: 40, left: 50 };
	const width = svgWidth - margin.left - margin.right;
	const height = svgHeight - margin.top - margin.bottom;

	// Scales
	const xScale = scaleLinear()
		// .domain(d3Extent(bins, d => d.x0)) // Use bin extent
		.domain([bins[0].x0, bins[bins.length - 1].x1]) // Use overall extent
		.range([0, width]);
	// Maybe use scaleLog for x-axis if distribution is very skewed?
	// const xScale = scaleLog()
	//     .domain([Math.max(1, bins[0].x0), bins[bins.length - 1].x1]) // Ensure domain > 0
	//     .range([0, width]).base(10).clamp(true);

	const yScale = scaleLinear()
		.domain([0, d3Max(bins, (d) => d.length)]) // Max bin count
		.range([height, 0])
		.nice(); // Extend domain slightly for better axis

	// Axes
	const xAxis = axisBottom(xScale).ticks(5, format('.1s')); // Format ticks (e.g., 1k, 1M) if numbers get large
	const yAxis = axisLeft(yScale).ticks(5);

	const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

	// X Axis
	g.append('g')
		.attr('class', 'x-axis')
		.attr('transform', `translate(0,${height})`)
		.call(xAxis)
		.append('text')
		.attr('fill', '#000')
		.attr('x', width / 2)
		.attr('y', margin.bottom - 5)
		.attr('text-anchor', 'middle')
		.text('Capital');

	// Y Axis
	g.append('g')
		.attr('class', 'y-axis')
		.call(yAxis)
		.append('text')
		.attr('fill', '#000')
		.attr('transform', 'rotate(-90)')
		.attr('y', -margin.left + 15)
		.attr('x', -height / 2)
		.attr('text-anchor', 'middle')
		.text('Number of Agents');

	// Bars
	g.selectAll('.bar')
		.data(bins)
		.enter()
		.append('rect')
		.attr('class', 'bar')
		.attr('x', (d) => xScale(d.x0) + 1) // +1 for slight gap
		// .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1)) // Ensure width is non-negative
		.attr('width', (d) => {
			// Robust width calculation
			const x1 = xScale(d.x1);
			const x0 = xScale(d.x0);
			// Handle potential issues with log scale near zero or large differences
			return Math.max(1, x1 - x0 - 1); // Minimum width of 1px
		})
		.attr('y', (d) => yScale(d.length))
		.attr('height', (d) => height - yScale(d.length))
		.style('fill', 'steelblue');
}
