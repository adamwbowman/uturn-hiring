<script>
    let status = $state(null);
    let message = $state('');
    let details = $state(null);
    let activeTab = $state('connection');
    
    // For connectivity metrics
    let connectionTime = $state(null);
    let pingTime = $state(null);
    let queryTime = $state(null);
    
    async function runTests() {
        status = 'running';
        message = 'Testing database connection...';
        details = null;
        connectionTime = null;
        pingTime = null;
        queryTime = null;
        
        try {
            const startTime = performance.now();
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
</script>

<div class="card">
    <div class="card-header d-flex justify-content-between align-items-center">
        <span>Database Connection Tests</span>
        <button 
            class="btn btn-primary btn-sm" 
            onclick={runTests} 
            disabled={status === 'running'}
        >
            {#if status === 'running'}
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                Running Tests...
            {:else}
                Run Tests
            {/if}
        </button>
    </div>
    
    <div class="card-body">
        {#if status === 'running'}
            <div class="alert alert-info">
                <i class="bi bi-arrow-repeat me-2"></i> {message}
            </div>
        {:else if status === 'success'}
            <div class="alert alert-success">
                <i class="bi bi-check-circle me-2"></i> {message}
            </div>
            
            <!-- Test Results -->
            <div class="table-responsive mb-4">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Test</th>
                            <th>Status</th>
                            <th>Duration</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Connection</td>
                            <td>
                                <span class="badge bg-success">Success</span>
                            </td>
                            <td>{connectionTime ? `${connectionTime.toFixed(2)}ms` : 'N/A'}</td>
                            <td>{details?.version || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>MongoDB Ping</td>
                            <td>
                                <span class="badge bg-success">Success</span>
                            </td>
                            <td>{pingTime ? `${pingTime.toFixed(2)}ms` : 'N/A'}</td>
                            <td>Server: {details?.serverInfo?.host || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Query Test</td>
                            <td>
                                <span class="badge bg-success">Success</span>
                            </td>
                            <td>{queryTime ? `${queryTime.toFixed(2)}ms` : 'N/A'}</td>
                            <td>Collections: {details?.collections?.length || 0}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Database Details -->
            {#if details}
                <h6 class="mb-3">Database Details</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <tbody>
                            <tr>
                                <th style="width: 200px">Database Name</th>
                                <td>{details.databaseName || 'N/A'}</td>
                            </tr>
                            <tr>
                                <th>Collections</th>
                                <td>{details.stats?.collections || 0}</td>
                            </tr>
                            <tr>
                                <th>Total Size</th>
                                <td>{formatBytes(details.stats?.dataSize) || 'N/A'}</td>
                            </tr>
                            <tr>
                                <th>Storage Size</th>
                                <td>{formatBytes(details.stats?.storageSize) || 'N/A'}</td>
                            </tr>
                            <tr>
                                <th>Indexes</th>
                                <td>{details.stats?.indexes || 0}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            {/if}
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
</div>

<script module>
    function formatBytes(bytes, decimals = 2) {
        if (!bytes) return 'N/A';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
</script> 