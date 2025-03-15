<script>
    let status = $state(null);
    let message = $state('');
    let results = $state([]);
    
    const tests = [
        {
            name: 'Create Position',
            run: async () => {
                const position = {
                    title: 'Test Engineer',
                    department: 'Engineering',
                    hiringManager: 'Test Manager',
                    timeline: 'Q1'
                };
                
                const response = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(position)
                });
                
                if (!response.ok) throw new Error('Failed to create position');
                return { id: (await response.json()).id };
            }
        },
        {
            name: 'Read Positions',
            run: async () => {
                const response = await fetch('/api/positions');
                if (!response.ok) throw new Error('Failed to read positions');
                const positions = await response.json();
                if (!Array.isArray(positions)) throw new Error('Invalid response format');
                return { count: positions.length };
            }
        },
        {
            name: 'Delete Position',
            run: async () => {
                // Get the first position
                const response = await fetch('/api/positions');
                if (!response.ok) throw new Error('Failed to get positions');
                const positions = await response.json();
                if (!positions.length) throw new Error('No positions to delete');
                
                const deleteResponse = await fetch(`/api/positions/${positions[0]._id}`, {
                    method: 'DELETE'
                });
                
                if (!deleteResponse.ok) throw new Error('Failed to delete position');
                return { id: positions[0]._id };
            }
        }
    ];
    
    async function runTests() {
        status = 'running';
        message = 'Running position tests...';
        results = [];
        
        for (const test of tests) {
            try {
                const startTime = performance.now();
                const result = await test.run();
                const endTime = performance.now();
                
                results = [...results, {
                    name: test.name,
                    status: 'success',
                    duration: endTime - startTime,
                    details: result
                }];
            } catch (error) {
                results = [...results, {
                    name: test.name,
                    status: 'error',
                    error: error.message
                }];
            }
        }
        
        status = results.every(r => r.status === 'success') ? 'success' : 'error';
        message = status === 'success' ? 'All tests passed!' : 'Some tests failed';
    }
</script>

<div class="card">
    <div class="card-header d-flex justify-content-between align-items-center">
        <span>Position Tests</span>
        <button 
            class="btn btn-primary btn-sm" 
            onclick={runTests} 
            disabled={status === 'running'}
        >
            {#if status === 'running'}
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                Running Tests...
            {:else}
                Run Position Tests
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
        {:else if status === 'error'}
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i> {message}
            </div>
        {/if}
        
        {#if results.length > 0}
            <div class="table-responsive">
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
                        {#each results as result}
                            <tr>
                                <td>{result.name}</td>
                                <td>
                                    <span class="badge bg-{result.status === 'success' ? 'success' : 'danger'}">
                                        {result.status}
                                    </span>
                                </td>
                                <td>
                                    {result.duration ? `${result.duration.toFixed(2)}ms` : 'N/A'}
                                </td>
                                <td>
                                    {#if result.status === 'success'}
                                        {JSON.stringify(result.details)}
                                    {:else}
                                        <span class="text-danger">{result.error}</span>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div> 