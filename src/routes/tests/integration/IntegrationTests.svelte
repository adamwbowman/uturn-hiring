<script>
    let status = $state(null);
    let message = $state('');
    let results = $state([]);
    
    const tests = [
        {
            name: 'Complete Position Lifecycle',
            run: async () => {
                // 1. Create position
                const position = {
                    title: 'Integration Test Position',
                    department: 'Engineering',
                    hiringManager: 'Test Manager',
                    timeline: 'Q1'
                };
                const createResponse = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(position)
                });
                if (!createResponse.ok) throw new Error('Failed to create position');
                const { id } = await createResponse.json();
                
                // 2. Verify position exists and matches input
                const getResponse = await fetch('/api/positions');
                const positions = await getResponse.json();
                const created = positions.find(p => p._id === id);
                if (!created) throw new Error('Created position not found');
                if (created.title !== position.title) throw new Error('Position data mismatch');
                
                // 3. Delete position
                const deleteResponse = await fetch(`/api/positions/${id}`, {
                    method: 'DELETE'
                });
                if (!deleteResponse.ok) throw new Error('Failed to delete position');
                
                // 4. Verify deletion
                const finalResponse = await fetch('/api/positions');
                const finalPositions = await finalResponse.json();
                if (finalPositions.find(p => p._id === id)) {
                    throw new Error('Position not properly deleted');
                }
                
                return { success: true };
            }
        },
        {
            name: 'Database State Consistency',
            run: async () => {
                // 1. Clear test data
                const initialPositions = await (await fetch('/api/positions')).json();
                for (const pos of initialPositions) {
                    await fetch(`/api/positions/${pos._id}`, { method: 'DELETE' });
                }
                
                // 2. Create multiple positions
                const positions = [
                    {
                        title: 'Position 1',
                        department: 'Engineering',
                        hiringManager: 'Manager 1',
                        timeline: 'Q1'
                    },
                    {
                        title: 'Position 2',
                        department: 'Sales',
                        hiringManager: 'Manager 2',
                        timeline: 'Q2'
                    }
                ];
                
                for (const pos of positions) {
                    await fetch('/api/positions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(pos)
                    });
                }
                
                // 3. Verify database state
                const finalPositions = await (await fetch('/api/positions')).json();
                if (finalPositions.length !== positions.length) {
                    throw new Error('Database state inconsistent');
                }
                
                return { 
                    expected: positions.length,
                    actual: finalPositions.length
                };
            }
        },
        {
            name: 'Concurrent Operations',
            run: async () => {
                // 1. Create multiple positions concurrently
                const positions = Array(5).fill().map((_, i) => ({
                    title: `Concurrent Position ${i}`,
                    department: 'Engineering',
                    hiringManager: 'Test Manager',
                    timeline: 'Q1'
                }));
                
                // Run creates concurrently
                const results = await Promise.all(
                    positions.map(pos => 
                        fetch('/api/positions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(pos)
                        })
                    )
                );
                
                // Verify all operations succeeded
                const allSucceeded = results.every(r => r.ok);
                if (!allSucceeded) throw new Error('Concurrent operations failed');
                
                // Verify database consistency
                const finalPositions = await (await fetch('/api/positions')).json();
                const hasAllPositions = positions.every(pos => 
                    finalPositions.some(fp => fp.title === pos.title)
                );
                
                if (!hasAllPositions) throw new Error('Some concurrent operations not reflected in database');
                
                return { 
                    operationsCompleted: results.length,
                    allSucceeded
                };
            }
        },
        {
            name: 'Error Recovery',
            run: async () => {
                // 1. Attempt invalid operation
                const invalidPosition = {
                    title: 'A'.repeat(101), // Too long
                    department: 'Engineering',
                    hiringManager: 'Test Manager',
                    timeline: 'Q1'
                };
                
                const invalidResponse = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invalidPosition)
                });
                
                if (invalidResponse.ok) throw new Error('Should reject invalid position');
                
                // 2. Verify system still accepts valid operations
                const validPosition = {
                    title: 'Valid Position',
                    department: 'Engineering',
                    hiringManager: 'Test Manager',
                    timeline: 'Q1'
                };
                
                const validResponse = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(validPosition)
                });
                
                if (!validResponse.ok) throw new Error('System not recovering from errors');
                
                return { 
                    errorHandled: !invalidResponse.ok,
                    recoverySuccessful: validResponse.ok
                };
            }
        }
    ];
    
    async function runTests() {
        status = 'running';
        message = 'Running integration tests...';
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
        message = status === 'success' ? 'All integration tests passed!' : 'Some integration tests failed';
    }
</script>

<div class="card">
    <div class="card-header d-flex justify-content-between align-items-center">
        <span>Integration Tests</span>
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