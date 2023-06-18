<script lang="ts">
	import { RangeSlider, drawerStore } from '@skeletonlabs/skeleton';
	import { settingStore, isCurrentSettingEnded } from '$stores/setting.store';

	let hasSettingEnded = false;

	isCurrentSettingEnded.subscribe((value) => {
		hasSettingEnded = value;
	});

	function drawerClose(): void {
		drawerStore.close();
	}

	function startSimulation(): void {
		console.log('start simulation');
	}

	function endSimulation(): void {
		console.log('reset simulation');
	}

	// Range
	let agentNumber = 30;
</script>

<nav class="list-nav p-4">
	<h3 class="pb-4">Settings</h3>

	<ul class="controller">
		<li>
			<RangeSlider name="range-slider" bind:value={agentNumber} max={50} step={5} ticked
				>Number of Agents: {agentNumber}</RangeSlider
			>
		</li>
	</ul>

	<span class="flex-1" />

	<div class="flex p-4 justify-between">
		<button
			class="btn btn-sm flex-1"
			class:variant-filled-primary={hasSettingEnded}
			class:variant-filled-secondary={!hasSettingEnded}
			on:click={startSimulation}>{hasSettingEnded ? 'Start' : 'Restart'}</button
		>
		<button
			class="btn btn-sm flex-1"
			class:variant-filled-warning={!hasSettingEnded}
			disabled={hasSettingEnded}
			on:click={endSimulation}>Speed Up</button
		>
	</div>
</nav>
