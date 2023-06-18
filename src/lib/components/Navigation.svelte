<script lang="ts">
	import { RangeSlider, drawerStore } from '@skeletonlabs/skeleton';
	import { settingStore, isCurrentSettingEnded } from '$stores/setting.store';
	import { writable } from 'svelte/store';

	let hasSettingEnded = false;

	isCurrentSettingEnded.subscribe((value) => {
		hasSettingEnded = value;
	});

	function drawerClose(): void {
		drawerStore.close();
	}

	function startSimulation(): void {
		console.log('start simulation');
		drawerClose();
	}

	function endSimulation(): void {
		console.log('reset simulation');
		drawerClose();
	}

	// Range
	let agentNumber = 30;
	let totalRounds = 60;
	let numberOfGoodEvents = 30;
	let numberOfBadEvents = 30;

	const minSkillLevel = writable(0.1);
	const maxSkillLevel = writable(1);

	$: if ($minSkillLevel > $maxSkillLevel) {
		maxSkillLevel.set($minSkillLevel);
	}

	$: if ($maxSkillLevel < $minSkillLevel) {
		minSkillLevel.set($maxSkillLevel);
	}
</script>

<nav class="list-nav p-4 h-full flex flex-col">
	<h3 class="pb-4">Settings</h3>

	<ul class="controller">
		<li class="pb-2">
			<RangeSlider name="range-slider" bind:value={totalRounds} max={100} min={5} step={5} ticked
				>Total rounds: {totalRounds}</RangeSlider
			>
		</li>
		<li class="pb-2">
			<RangeSlider name="range-slider" bind:value={agentNumber} max={50} step={5} ticked
				>Number of Agents: {agentNumber}</RangeSlider
			>
		</li>
		<li class="pb-2">
			<RangeSlider
				name="range-slider"
				bind:value={numberOfGoodEvents}
				min={5}
				max={100}
				step={1}
				ticked>Number of Good Events: {numberOfGoodEvents}</RangeSlider
			>
		</li>
		<li class="pb-2">
			<RangeSlider
				name="range-slider"
				bind:value={numberOfBadEvents}
				min={5}
				max={100}
				step={1}
				ticked>Number of Bad Events: {numberOfBadEvents}</RangeSlider
			>
		</li>

		<hr />
		<h4>Agent Setting</h4>

		<li class="pb-2">
			<div class="field">
				<label for="min_skill_levels" class="flex-1">Min Skill Level</label>
				<input
					name="min_skill_levels"
					type="number"
					class="rounded max-w-[50%]"
					bind:value={$minSkillLevel}
					step={0.1}
				/>
			</div>
		</li>
		<li class="pb-2">
			<div class="field">
				<label for="max_skill_levels" class="flex-1">Max Skill Level</label>
				<input
					name="max_skill_levels"
					type="number"
					class="rounded max-w-[50%]"
					bind:value={$maxSkillLevel}
					min={$minSkillLevel}
					step={0.1}
				/>
			</div>
		</li>
	</ul>

	<span class="flex-1" />

	<div class="flex justify-between mt-auto gap-2">
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
