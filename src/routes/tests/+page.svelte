<script>
	import DatabaseTests from './unit/DatabaseTests.svelte';
	import PositionsTests from './unit/PositionsTests.svelte';
	import IntegrationTests from './integration/IntegrationTests.svelte';
	import E2ETests from './e2e/E2ETests.svelte';
	import CandidatesTests from './unit/CandidatesTests.svelte';
	
	const sections = [
		{ id: 'database', title: 'Database Tests', component: DatabaseTests },
		{ id: 'positions', title: 'Positions Tests', component: PositionsTests },
		{ id: 'candidates', title: 'Candidates Tests', component: CandidatesTests },
		{ id: 'integration', title: 'Integration Tests', component: IntegrationTests },
		{ id: 'e2e', title: 'End-to-End Tests', component: E2ETests }
	];
	
	let activeSection = $state('database');
</script>

<div class="container mt-4">
	<!-- Navigation -->
	<ul class="nav nav-tabs mb-4">
		{#each sections as section}
			<li class="nav-item">
				<button 
					class="nav-link {activeSection === section.id ? 'active' : ''}"
					onclick={() => activeSection = section.id}
				>
					{section.title}
				</button>
			</li>
		{/each}
	</ul>

	<!-- Content -->
	{#each sections as section}
		{#if activeSection === section.id}
			{@render section.component()}
		{/if}
	{/each}
</div>

<!-- <div class="container my-4">
	<h1>Test Suite</h1>
	<div class="row g-4">
		<div class="col-12">
			<DatabaseTests />
		</div>
		<div class="col-12">
			<PositionsTests />
		</div>
		<div class="col-12">
			<CandidatesTests />
		</div>
		<div class="col-12">
			<IntegrationTests />
		</div>
		<div class="col-12">
			<E2ETests />
		</div>
	</div>
</div> -->