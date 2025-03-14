<script>
	let status = $state(null);
	let message = $state('');
	let details = $state(null);
	let activeTab = $state('connection');
	
	// For connectivity metrics
	let connectionTime = $state(null);
	let pingTime = $state(null);
	let queryTime = $state(null);
	
	async function testConnection() {
	  status = 'loading';
	  message = '';
	  details = null;
	  connectionTime = null;
	  pingTime = null;
	  queryTime = null;
	  
	  const startTime = performance.now();
	  
	  try {
		const response = await fetch('/api/test-db/details');
		const data = await response.json();
		
		const endTime = performance.now();
		connectionTime = endTime - startTime;
		
		if (response.ok) {
		  status = 'success';
		  message = data.message || 'Connected successfully!';
		  details = data.details || {};
		  pingTime = data.metrics?.pingTime;
		  queryTime = data.metrics?.queryTime;
		} else {
		  status = 'error';
		  message = data.error || 'Connection failed';
		}
	  } catch (error) {
		status = 'error';
		message = error.message || 'Error testing connection';
	  }
	}
	
	function setTab(tab) {
	  activeTab = tab;
	}
  </script>
  
  <!-- <div class="test-db-container card"> -->
	<!-- <div class="card-header bg-primary text-white">
	  <h4 class="mb-0">MongoDB Connection Test</h4>
	</div> -->
	
	<div class="card-body">
	  <button class="btn btn-primary mb-4" onclick={testConnection} disabled={status === 'loading'}>
		{#if status === 'loading'}
		  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
		  Testing Database Connection...
		{:else}
		  Detailed Test MongoDB Connection
		{/if}
	  </button>
	  
	  {#if status === 'success'}
		<div class="alert alert-success mb-4">
		  <i class="bi bi-check-circle me-2"></i> {message}
		</div>
		
		<ul class="nav nav-tabs mb-3">
		  <li class="nav-item">
			<button class="nav-link {activeTab === 'connection' ? 'active' : ''}" 
					onclick={() => setTab('connection')}>
			  Connection Details
			</button>
		  </li>
		  <li class="nav-item">
			<button class="nav-link {activeTab === 'collections' ? 'active' : ''}" 
					onclick={() => setTab('collections')}>
			  Collections
			</button>
		  </li>
		  <li class="nav-item">
			<button class="nav-link {activeTab === 'stats' ? 'active' : ''}" 
					onclick={() => setTab('stats')}>
			  Database Stats
			</button>
		  </li>
		  <li class="nav-item">
			<button class="nav-link {activeTab === 'metrics' ? 'active' : ''}" 
					onclick={() => setTab('metrics')}>
			  Metrics
			</button>
		  </li>
		</ul>
		
		<div class="tab-content">
		  <!-- Connection Details Tab -->
		  <div class="tab-pane {activeTab === 'connection' ? 'show active' : ''}">
			<div class="table-responsive">
			  <table class="table table-bordered">
				<tbody>
				  <tr>
					<th style="width: 30%">Server Version</th>
					<td>{details?.version || 'N/A'}</td>
				  </tr>
				  <tr>
					<th>Database Name</th>
					<td>{details?.databaseName || 'N/A'}</td>
				  </tr>
				  <tr>
					<th>Connection String</th>
					<td>{details?.connectionString || 'N/A'}</td>
				  </tr>
				  <tr>
					<th>MongoDB Server</th>
					<td>{details?.serverInfo?.host || 'N/A'}:{details?.serverInfo?.port || 'N/A'}</td>
				  </tr>
				</tbody>
			  </table>
			</div>
		  </div>
		  
		  <!-- Collections Tab -->
		  <div class="tab-pane {activeTab === 'collections' ? 'show active' : ''}">
			{#if details?.collections?.length > 0}
			  <div class="table-responsive">
				<table class="table table-striped">
				  <thead>
					<tr>
					  <th>#</th>
					  <th>Collection Name</th>
					  <th>Document Count</th>
					  <th>Size</th>
					</tr>
				  </thead>
				  <tbody>
					{#each details.collections as collection, i}
					  <tr>
						<td>{i + 1}</td>
						<td>{collection.name}</td>
						<td>{collection.count?.toLocaleString() || 'N/A'}</td>
						<td>{formatBytes(collection.size)}</td>
					  </tr>
					{/each}
				  </tbody>
				</table>
			  </div>
			{:else}
			  <div class="alert alert-info">
				No collections found in this database.
			  </div>
			{/if}
		  </div>
		  
		  <!-- Stats Tab -->
		  <div class="tab-pane {activeTab === 'stats' ? 'show active' : ''}">
			{#if details?.stats}
			  <div class="row">
				<div class="col-md-6 mb-3">
				  <div class="card">
					<div class="card-header">Storage</div>
					<div class="card-body">
					  <ul class="list-group list-group-flush">
						<li class="list-group-item d-flex justify-content-between align-items-center">
						  Total Size
						  <span class="badge bg-primary rounded-pill">{formatBytes(details.stats.dataSize)}</span>
						</li>
						<li class="list-group-item d-flex justify-content-between align-items-center">
						  Storage Size
						  <span class="badge bg-primary rounded-pill">{formatBytes(details.stats.storageSize)}</span>
						</li>
						<li class="list-group-item d-flex justify-content-between align-items-center">
						  Index Size
						  <span class="badge bg-primary rounded-pill">{formatBytes(details.stats.indexSize)}</span>
						</li>
					  </ul>
					</div>
				  </div>
				</div>
				
				<div class="col-md-6 mb-3">
				  <div class="card">
					<div class="card-header">Objects</div>
					<div class="card-body">
					  <ul class="list-group list-group-flush">
						<li class="list-group-item d-flex justify-content-between align-items-center">
						  Collections
						  <span class="badge bg-primary rounded-pill">{details.stats.collections}</span>
						</li>
						<li class="list-group-item d-flex justify-content-between align-items-center">
						  Views
						  <span class="badge bg-primary rounded-pill">{details.stats.views}</span>
						</li>
						<li class="list-group-item d-flex justify-content-between align-items-center">
						  Indexes
						  <span class="badge bg-primary rounded-pill">{details.stats.indexes}</span>
						</li>
					  </ul>
					</div>
				  </div>
				</div>
			  </div>
			{:else}
			  <div class="alert alert-info">
				No database statistics available.
			  </div>
			{/if}
		  </div>
		  
		  <!-- Metrics Tab -->
		  <div class="tab-pane {activeTab === 'metrics' ? 'show active' : ''}">
			<div class="card">
			  <div class="card-header">Performance Metrics</div>
			  <div class="card-body">
				<div class="table-responsive">
				  <table class="table table-striped">
					<thead>
					  <tr>
						<th>Operation</th>
						<th>Time (ms)</th>
						<th>Status</th>
					  </tr>
					</thead>
					<tbody>
					  <tr>
						<td>Total Request Time</td>
						<td>{connectionTime ? connectionTime.toFixed(2) : 'N/A'}</td>
						<td>
						  {#if connectionTime}
							<span class="badge {connectionTime < 300 ? 'bg-success' : connectionTime < 1000 ? 'bg-warning' : 'bg-danger'}">
							  {connectionTime < 300 ? 'Fast' : connectionTime < 1000 ? 'Average' : 'Slow'}
							</span>
						  {/if}
						</td>
					  </tr>
					  <tr>
						<td>MongoDB Ping</td>
						<td>{pingTime ? pingTime.toFixed(2) : 'N/A'}</td>
						<td>
						  {#if pingTime}
							<span class="badge {pingTime < 50 ? 'bg-success' : pingTime < 200 ? 'bg-warning' : 'bg-danger'}">
							  {pingTime < 50 ? 'Fast' : pingTime < 200 ? 'Average' : 'Slow'}
							</span>
						  {/if}
						</td>
					  </tr>
					  <tr>
						<td>Sample Query</td>
						<td>{queryTime ? queryTime.toFixed(2) : 'N/A'}</td>
						<td>
						  {#if queryTime}
							<span class="badge {queryTime < 100 ? 'bg-success' : queryTime < 500 ? 'bg-warning' : 'bg-danger'}">
							  {queryTime < 100 ? 'Fast' : queryTime < 500 ? 'Average' : 'Slow'}
							</span>
						  {/if}
						</td>
					  </tr>
					</tbody>
				  </table>
				</div>
			  </div>
			</div>
		  </div>
		</div>
	  {:else if status === 'error'}
		<div class="alert alert-danger">
		  <i class="bi bi-exclamation-triangle me-2"></i>
		  <strong>Connection Error:</strong> {message}
		  
		  <div class="mt-3">
			<strong>Troubleshooting:</strong>
			<ul class="mb-0">
			  <li>Verify MongoDB is running on the expected host and port</li>
			  <li>Check for proper authentication credentials</li>
			  <li>Ensure the database name exists</li>
			  <li>Check server logs for more details</li>
			</ul>
		  </div>
		</div>
	  {/if}
	</div>
  <!-- </div> -->
  
  <!-- <script context="module"> -->
   <script module>
	// Helper function to format bytes
	function formatBytes(bytes, decimals = 2) {
	  if (!bytes) return 'N/A';
	  
	  const k = 1024;
	  const dm = decimals < 0 ? 0 : decimals;
	  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	  
	  const i = Math.floor(Math.log(bytes) / Math.log(k));
	  
	  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	}
  </script>
  
  <style>
	.tab-pane {
	  display: none;
	}
	
	.tab-pane.show {
	  display: block;
	}
  </style>