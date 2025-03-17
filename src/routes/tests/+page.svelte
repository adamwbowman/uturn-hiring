<script>
	import UnitTests from './unit/CandidatesTests.svelte';
	import IntegrationTests from './integration/IntegrationTests.svelte';
	import E2ETests from './e2e/E2ETests.svelte';

	let cleanupStatus = $state(null);
	let cleanupMessage = $state('');
	let cleanupResults = $state(null);

	async function cleanupTestData() {
		try {
			cleanupStatus = 'running';
			cleanupMessage = 'Cleaning up test data...';
			cleanupResults = null;

			// Get all candidates
			const candidatesResponse = await fetch('/api/candidates');
			if (!candidatesResponse.ok) throw new Error('Failed to fetch candidates');
			const candidates = await candidatesResponse.json();

			// Get all positions
			const positionsResponse = await fetch('/api/positions');
			if (!positionsResponse.ok) throw new Error('Failed to fetch positions');
			const positions = await positionsResponse.json();

			// Filter test candidates (those created by tests)
			const testCandidates = candidates.filter(c => 
				c.email?.includes('example.com') || // Test emails
				c.name?.includes('Test') || // Test names
				c.name?.includes('Candidate') || // Test candidates
				c.sourceContact?.includes('Test') || // Test contacts
				c.email?.match(/^(concurrent|test|stage|hiring)\d*@/) // Other test patterns
			);

			// Filter test positions (those created by tests)
			const testPositions = positions.filter(p => 
				p.title?.includes('Test') || // Test positions
				p.title?.includes('Position') || // Generic test positions
				p.hiringManager?.includes('Test') || // Test managers
				p.title?.match(/^(E2E|Integration|Concurrent)/) // Other test patterns
			);

			// Delete test candidates
			const candidateDeletions = testCandidates.map(c => 
				fetch(`/api/candidates/${c._id}`, { method: 'DELETE' })
			);
			await Promise.all(candidateDeletions);

			// Delete test positions
			const positionDeletions = testPositions.map(p => 
				fetch(`/api/positions/${p._id}`, { method: 'DELETE' })
			);
			await Promise.all(positionDeletions);

			cleanupStatus = 'success';
			cleanupMessage = 'Test data cleanup completed successfully';
			cleanupResults = {
				candidatesRemoved: testCandidates.length,
				positionsRemoved: testPositions.length
			};
		} catch (error) {
			cleanupStatus = 'error';
			cleanupMessage = `Error cleaning up test data: ${error.message}`;
			cleanupResults = null;
		}
	}
</script>

<div class="container mt-4">
	<div class="row">
		<div class="col-12 mb-4">
			<div class="card">
				<div class="card-header d-flex justify-content-between align-items-center">
					<span>Test Data Management</span>
					<button 
						class="btn btn-danger btn-sm" 
						onclick={cleanupTestData} 
						disabled={cleanupStatus === 'running'}
					>
						{#if cleanupStatus === 'running'}
							<span class="spinner-border spinner-border-sm me-2" role="status"></span>
							Cleaning Test Data...
						{:else}
							Clean Test Data
						{/if}
					</button>
				</div>
				<div class="card-body">
					{#if cleanupStatus === 'running'}
						<div class="alert alert-info">
							<i class="bi bi-arrow-repeat me-2"></i> {cleanupMessage}
						</div>
					{:else if cleanupStatus === 'success'}
						<div class="alert alert-success">
							<i class="bi bi-check-circle me-2"></i> {cleanupMessage}
						</div>
					{:else if cleanupStatus === 'error'}
						<div class="alert alert-danger">
							<i class="bi bi-exclamation-triangle me-2"></i> {cleanupMessage}
						</div>
					{/if}
					{#if cleanupResults}
						<div class="mt-3">
							<strong>Cleanup Results:</strong>
							<ul>
								<li>Candidates Removed: {cleanupResults.candidatesRemoved}</li>
								<li>Positions Removed: {cleanupResults.positionsRemoved}</li>
							</ul>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
	
	<div class="row">
		<div class="col-12 mb-4">
			<UnitTests />
		</div>
		<div class="col-12 mb-4">
			<IntegrationTests />
		</div>
		<div class="col-12 mb-4">
			<E2ETests />
		</div>
	</div>
</div>