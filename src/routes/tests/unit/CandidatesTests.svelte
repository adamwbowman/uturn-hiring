<script>
    let status = $state(null);
    let message = $state('');
    let results = $state([]);
    
    const tests = [
        {
            name: 'Create Candidate',
            run: async () => {
                const candidate = {
                    name: 'Test Candidate',
                    email: 'test@example.com',
                    source: 'Recruiter',
                    sourceContact: 'Test Recruiter',
                    position: 'Test Engineer',
                    requestedPay: 120000
                };
                
                const response = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(candidate)
                });
                
                if (!response.ok) throw new Error('Failed to create candidate');
                return { id: (await response.json()).id };
            }
        },
        {
            name: 'Read Candidates',
            run: async () => {
                const response = await fetch('/api/candidates');
                if (!response.ok) throw new Error('Failed to read candidates');
                const candidates = await response.json();
                if (!Array.isArray(candidates)) throw new Error('Invalid response format');
                return { count: candidates.length };
            }
        },
        {
            name: 'Delete Candidate',
            run: async () => {
                const response = await fetch('/api/candidates');
                if (!response.ok) throw new Error('Failed to get candidates');
                const candidates = await response.json();
                if (!candidates.length) throw new Error('No candidates to delete');
                
                const deleteResponse = await fetch(`/api/candidates/${candidates[0]._id}`, {
                    method: 'DELETE'
                });
                
                if (!deleteResponse.ok) throw new Error('Failed to delete candidate');
                return { id: candidates[0]._id };
            }
        },
        {
            name: 'Validate Required Fields',
            run: async () => {
                const invalidCandidate = {
                    name: '', // Empty name
                    email: 'test@example.com',
                    source: 'Recruiter',
                    position: 'Test Engineer'
                };
                
                const response = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invalidCandidate)
                });
                
                if (response.ok) throw new Error('Should reject invalid candidate');
                return { status: response.status };
            }
        },
        {
            name: 'Verify Default Status',
            run: async () => {
                const candidate = {
                    name: 'Status Test',
                    email: 'status@example.com',
                    source: 'Recruiter',
                    position: 'Test Engineer'
                };
                
                const createResponse = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(candidate)
                });
                
                if (!createResponse.ok) throw new Error('Failed to create candidate');
                const { id } = await createResponse.json();
                
                // Fetch all candidates and find the one we just created
                const getResponse = await fetch('/api/candidates');
                const candidates = await getResponse.json();
                const created = candidates.find(c => c._id === id);
                
                if (created.status !== 'New') throw new Error('Default status should be New');
                return { status: created.status };
            }
        },
        {
            name: 'Verify Sort Order',
            run: async () => {
                const response = await fetch('/api/candidates');
                const candidates = await response.json();
                
                if (candidates.length < 2) {
                    return { message: 'Not enough candidates to test sort' };
                }
                
                // Check if candidates are sorted by createdAt in descending order
                for (let i = 1; i < candidates.length; i++) {
                    const current = new Date(candidates[i].createdAt);
                    const previous = new Date(candidates[i-1].createdAt);
                    if (current > previous) {
                        throw new Error('Candidates not sorted correctly');
                    }
                }
                
                return { sorted: true, count: candidates.length };
            }
        },
        {
            name: 'Validate Source Options',
            run: async () => {
                const invalidCandidate = {
                    name: 'Test Candidate',
                    email: 'test@example.com',
                    source: 'InvalidSource', // Invalid source
                    position: 'Test Engineer'
                };
                
                const response = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invalidCandidate)
                });
                
                if (response.ok) throw new Error('Should reject invalid source');
                return { status: response.status };
            }
        },
        {
            name: 'Validate Delete Non-existent Candidate',
            run: async () => {
                const fakeId = '000000000000000000000000';
                const response = await fetch(`/api/candidates/${fakeId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) throw new Error('Should fail to delete non-existent candidate');
                return { status: response.status };
            }
        },
        {
            name: 'Input Sanitization',
            run: async () => {
                const candidate = {
                    name: '  Test Candidate  ', // Extra spaces
                    email: ' test@example.com ', // Extra spaces
                    source: 'Recruiter',
                    sourceContact: ' Test Recruiter ', // Extra spaces
                    position: ' Test Engineer ' // Extra spaces
                };
                
                const response = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(candidate)
                });
                
                if (!response.ok) throw new Error('Failed to create candidate');
                const { id } = await response.json();
                
                // Verify stored data is trimmed
                const getResponse = await fetch('/api/candidates');
                const candidates = await getResponse.json();
                const created = candidates.find(c => c._id === id);
                
                if (created.name !== 'Test Candidate' || 
                    created.email !== 'test@example.com' ||
                    created.sourceContact !== 'Test Recruiter' ||
                    created.position !== 'Test Engineer') {
                    throw new Error('Input not properly sanitized');
                }
                return { sanitized: true };
            }
        },
        {
            name: 'Email Format Validation',
            run: async () => {
                const invalidCandidate = {
                    name: 'Test Candidate',
                    email: 'invalid-email', // Invalid email format
                    source: 'Recruiter',
                    position: 'Test Engineer'
                };
                
                const response = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invalidCandidate)
                });
                
                if (response.ok) throw new Error('Should reject invalid email format');
                return { status: response.status };
            }
        },
        {
            name: 'Requested Pay Validation',
            run: async () => {
                const invalidCandidate = {
                    name: 'Test Candidate',
                    email: 'test@example.com',
                    source: 'Recruiter',
                    position: 'Test Engineer',
                    requestedPay: -1000 // Invalid negative amount
                };
                
                const response = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invalidCandidate)
                });
                
                if (response.ok) throw new Error('Should reject negative pay amount');
                return { status: response.status };
            }
        },
        {
            name: 'Field Length Limits',
            run: async () => {
                const candidate = {
                    name: 'A'.repeat(101), // Too long
                    email: 'test@example.com',
                    source: 'Recruiter',
                    sourceContact: 'B'.repeat(101), // Too long
                    position: 'Test Engineer'
                };
                
                const response = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(candidate)
                });
                
                if (response.ok) throw new Error('Should reject overlength fields');
                return { lengthValidation: true };
            }
        }
    ];
    
    async function runTests() {
        status = 'running';
        message = 'Running candidate tests...';
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
        <span>Candidate Management Tests</span>
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