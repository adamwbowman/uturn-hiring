<script>
	let status = $state(null);
	let message = $state('');
	
	async function testConnection() {
	  status = 'loading';
	  message = '';
	  
	  try {
		const response = await fetch('/api/test-db');
		const data = await response.json();
		
		if (response.ok) {
		  status = 'success';
		  message = data.message || 'Connected successfully!';
		} else {
		  status = 'error';
		  message = data.error || 'Connection failed';
		}
	  } catch (error) {
		status = 'error';
		message = error.message || 'Error testing connection';
	  }
	}
  </script>
  
  <div class="test-db-container">
	<button class="btn btn-primary" onclick={testConnection} disabled={status === 'loading'}>
	  {#if status === 'loading'}
		<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
		Testing...
	  {:else}
		Simple Test Database Connection
	  {/if}
	</button>
	
	{#if status === 'success'}
	  <div class="alert alert-success mt-3">
		<i class="bi bi-check-circle me-2"></i> {message}
	  </div>
	{:else if status === 'error'}
	  <div class="alert alert-danger mt-3">
		<i class="bi bi-exclamation-triangle me-2"></i> {message}
	  </div>
	{/if}
  </div>