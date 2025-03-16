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
        },
        {
            name: 'Validate Required Fields',
            run: async () => {
                const invalidPosition = {
                    title: '', // Empty title
                    department: 'Engineering',
                    timeline: 'Q1'
                    // Missing hiringManager
                };
                
                const response = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invalidPosition)
                });
                
                if (response.ok) throw new Error('Should reject invalid position');
                return { status: response.status };
            }
        },
        {
            name: 'Verify Default Status',
            run: async () => {
                const position = {
                    title: 'Status Test',
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
                
                // Fetch all positions and find the one we just created
                const getResponse = await fetch('/api/positions');
                const positions = await getResponse.json();
                const created = positions.find(p => p._id === id);
                
                if (created.status !== 'Open') throw new Error('Default status should be Open');
                return { status: created.status };
            }
        },
        {
            name: 'Verify Sort Order',
            run: async () => {
                const response = await fetch('/api/positions');
                const positions = await response.json();
                
                if (positions.length < 2) {
                    return { message: 'Not enough positions to test sort' };
                }
                
                // Check if positions are sorted by createdAt in descending order
                for (let i = 1; i < positions.length; i++) {
                    const current = new Date(positions[i].createdAt);
                    const previous = new Date(positions[i-1].createdAt);
                    if (current > previous) {
                        throw new Error('Positions not sorted correctly');
                    }
                }
                
                return { sorted: true, count: positions.length };
            }
        },
        {
            name: 'Validate Department Options',
            run: async () => {
                const invalidPosition = {
                    title: 'Test Position',
                    department: 'InvalidDepartment', // Invalid department
                    hiringManager: 'Test Manager',
                    timeline: 'Q1'
                };
                
                const response = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invalidPosition)
                });
                
                if (response.ok) throw new Error('Should reject invalid department');
                return { status: response.status };
            }
        },
        {
            name: 'Validate Timeline Options',
            run: async () => {
                const invalidPosition = {
                    title: 'Test Position',
                    department: 'Engineering',
                    hiringManager: 'Test Manager',
                    timeline: 'InvalidQuarter' // Invalid timeline
                };
                
                const response = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invalidPosition)
                });
                
                if (response.ok) throw new Error('Should reject invalid timeline');
                return { status: response.status };
            }
        },
        {
            name: 'Validate Delete Non-existent Position',
            run: async () => {
                const fakeId = '000000000000000000000000';
                const response = await fetch(`/api/positions/${fakeId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) throw new Error('Should fail to delete non-existent position');
                return { status: response.status };
            }
        },
        {
            name: 'Input Sanitization',
            run: async () => {
                const position = {
                    title: '  Test Engineer  ', // Extra spaces
                    department: 'Engineering',
                    hiringManager: ' John Doe ', // Extra spaces
                    timeline: 'Q1'
                };
                
                const response = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(position)
                });
                
                if (!response.ok) throw new Error('Failed to create position');
                const { id } = await response.json();
                
                // Verify stored data is trimmed
                const getResponse = await fetch('/api/positions');
                const positions = await getResponse.json();
                const created = positions.find(p => p._id === id);
                
                if (created.title !== 'Test Engineer' || created.hiringManager !== 'John Doe') {
                    throw new Error('Input not properly sanitized');
                }
                return { sanitized: true };
            }
        },
        {
            name: 'Duplicate Position Check',
            run: async () => {
                const position = {
                    title: 'Duplicate Test',
                    department: 'Engineering',
                    hiringManager: 'Test Manager',
                    timeline: 'Q1'
                };
                
                // Create first position
                const response1 = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(position)
                });
                
                if (!response1.ok) throw new Error('Failed to create first position');
                
                // Try to create duplicate
                const response2 = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(position)
                });
                
                // Should allow duplicate for now, but we could change this behavior
                if (!response2.ok) throw new Error('Failed to create second position');
                return { duplicateAllowed: true };
            }
        },
        {
            name: 'Special Characters Handling',
            run: async () => {
                const position = {
                    title: 'Test & Engineer (Special)',
                    department: 'Engineering',
                    hiringManager: 'O\'Connor, John-Paul',
                    timeline: 'Q1'
                };
                
                const response = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(position)
                });
                
                if (!response.ok) throw new Error('Failed to handle special characters');
                return { specialCharsHandled: true };
            }
        },
        {
            name: 'Field Length Limits',
            run: async () => {
                const position = {
                    title: 'A'.repeat(101), // Too long
                    department: 'Engineering',
                    hiringManager: 'B'.repeat(51), // Too long
                    timeline: 'Q1'
                };
                
                const response = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(position)
                });
                
                if (response.ok) throw new Error('Should reject overlength fields');
                return { lengthValidation: true };
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
        <span>Position Management Tests</span>
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