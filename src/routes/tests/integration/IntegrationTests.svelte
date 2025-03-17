<script>
    let status = $state(null);
    let message = $state('');
    let results = $state([]);
    
    // Helper function for making PATCH requests
    async function makePatchRequest(url, data) {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`PATCH request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return response;
    }

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
        },
        {
            name: 'Complete Candidate Lifecycle',
            run: async () => {
                // 1. Create candidate
                const candidate = {
                    name: 'Integration Test Candidate',
                    email: 'test@example.com',
                    source: 'Recruiter',
                    sourceContact: 'Test Recruiter',
                    position: 'Test Engineer',
                    requestedPay: 120000
                };
                const createResponse = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(candidate)
                });
                if (!createResponse.ok) throw new Error('Failed to create candidate');
                const { id } = await createResponse.json();
                
                // 2. Verify candidate exists and matches input
                const getResponse = await fetch('/api/candidates');
                const candidates = await getResponse.json();
                const created = candidates.find(c => c._id === id);
                if (!created) throw new Error('Created candidate not found');
                if (created.name !== candidate.name) throw new Error('Candidate data mismatch');
                
                // 3. Delete candidate
                const deleteResponse = await fetch(`/api/candidates/${id}`, {
                    method: 'DELETE'
                });
                if (!deleteResponse.ok) throw new Error('Failed to delete candidate');
                
                // 4. Verify deletion
                const finalResponse = await fetch('/api/candidates');
                const finalCandidates = await finalResponse.json();
                if (finalCandidates.find(c => c._id === id)) {
                    throw new Error('Candidate not properly deleted');
                }
                
                return { success: true };
            }
        },
        {
            name: 'Candidate Database State Consistency',
            run: async () => {
                // 1. Clear test data
                const initialCandidates = await (await fetch('/api/candidates')).json();
                for (const cand of initialCandidates) {
                    await fetch(`/api/candidates/${cand._id}`, { method: 'DELETE' });
                }
                
                // 2. Create multiple candidates
                const candidates = [
                    {
                        name: 'Candidate 1',
                        email: 'candidate1@example.com',
                        source: 'Recruiter',
                        sourceContact: 'Recruiter 1',
                        position: 'Engineer',
                        requestedPay: 100000
                    },
                    {
                        name: 'Candidate 2',
                        email: 'candidate2@example.com',
                        source: 'Referral',
                        sourceContact: 'Career Page',
                        position: 'Designer',
                        requestedPay: 90000
                    }
                ];
                
                for (const cand of candidates) {
                    await fetch('/api/candidates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cand)
                    });
                }
                
                // 3. Verify database state
                const finalCandidates = await (await fetch('/api/candidates')).json();
                if (finalCandidates.length !== candidates.length) {
                    throw new Error('Database state inconsistent');
                }
                
                return { 
                    expected: candidates.length,
                    actual: finalCandidates.length
                };
            }
        },
        {
            name: 'Candidate Concurrent Operations',
            run: async () => {
                // 1. Create multiple candidates concurrently
                const candidates = Array(5).fill().map((_, i) => ({
                    name: `Concurrent Candidate ${i}`,
                    email: `concurrent${i}@example.com`,
                    source: 'Recruiter',
                    sourceContact: 'Test Recruiter',
                    position: 'Engineer',
                    requestedPay: 100000 + (i * 10000)
                }));
                
                // Run creates concurrently
                const results = await Promise.all(
                    candidates.map(cand => 
                        fetch('/api/candidates', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(cand)
                        })
                    )
                );
                
                // Verify all operations succeeded
                const allSucceeded = results.every(r => r.ok);
                if (!allSucceeded) throw new Error('Concurrent operations failed');
                
                // Verify database consistency
                const finalCandidates = await (await fetch('/api/candidates')).json();
                const hasAllCandidates = candidates.every(cand => 
                    finalCandidates.some(fc => fc.email === cand.email)
                );
                
                if (!hasAllCandidates) throw new Error('Some concurrent operations not reflected in database');
                
                return { 
                    operationsCompleted: results.length,
                    allSucceeded
                };
            }
        },
        {
            name: 'Candidate Error Recovery',
            run: async () => {
                // 1. Attempt invalid operation
                const invalidCandidate = {
                    name: 'A'.repeat(101), // Too long
                    email: 'test@example.com',
                    source: 'Recruiter',
                    position: 'Engineer'
                };
                
                const invalidResponse = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invalidCandidate)
                });
                
                if (invalidResponse.ok) throw new Error('Should reject invalid candidate');
                
                // 2. Verify system still accepts valid operations
                const validCandidate = {
                    name: 'Valid Candidate',
                    email: 'valid@example.com',
                    source: 'Recruiter',
                    position: 'Engineer',
                    requestedPay: 100000
                };
                
                const validResponse = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(validCandidate)
                });
                
                if (!validResponse.ok) throw new Error('System not recovering from errors');
                
                return { 
                    errorHandled: !invalidResponse.ok,
                    recoverySuccessful: validResponse.ok
                };
            }
        },
        {
            name: 'Candidate Hiring Process Integration',
            run: async () => {
                // 1. Create a position
                const position = {
                    title: 'Integrated Workflow Position',
                    department: 'Engineering',
                    hiringManager: 'Test Manager',
                    timeline: 'Q1'
                };
                
                const createPositionResponse = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(position)
                });
                
                if (!createPositionResponse.ok) throw new Error('Failed to create position');
                const { id: positionId } = await createPositionResponse.json();
                
                // 2. Create a candidate for this position
                const candidate = {
                    name: 'Hiring Process Candidate',
                    email: 'hiring.process@example.com',
                    source: 'Recruiter',
                    position: position.title,
                    requestedPay: 120000
                };
                
                const createCandidateResponse = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(candidate)
                });
                
                if (!createCandidateResponse.ok) throw new Error('Failed to create candidate');
                const { id: candidateId } = await createCandidateResponse.json();
                
                // 3. Verify initial candidate status
                const initialCandidateResponse = await fetch(`/api/candidates/${candidateId}`);
                if (!initialCandidateResponse.ok) throw new Error('Failed to get candidate');
                const initialCandidate = await initialCandidateResponse.json();
                
                if (initialCandidate.status !== 'New') throw new Error('Initial status should be New');
                if (!initialCandidate.stages?.New?.status) throw new Error('Missing New stage status');
                if (initialCandidate.stages.New.status !== 'In Progress') throw new Error('New stage should be In Progress');
                
                // 4. Progress candidate through stages
                const stages = ['CV Review', 'Cultural Fit', 'Interview', 'Hired'];
                let currentStage = 'New';
                
                for (const stage of stages) {
                    // Update candidate to next stage
                    const updateResponse = await makePatchRequest(`/api/candidates/${candidateId}`, {
                        status: stage,
                        currentStage: currentStage,
                        stageStatus: 'Passed',
                        reviewer: 'Integration Tester',
                        notes: `Passed ${currentStage}`,
                        action: 'pass'
                    });
                    
                    if (!updateResponse.ok) {
                        const errorText = await updateResponse.text();
                        throw new Error(`Failed to update candidate to ${stage}: ${errorText}`);
                    }
                    
                    // Verify the update
                    const updatedCandidateResponse = await fetch(`/api/candidates/${candidateId}`);
                    if (!updatedCandidateResponse.ok) throw new Error(`Failed to get candidate after ${stage} update`);
                    const updatedCandidate = await updatedCandidateResponse.json();
                    
                    // Verify previous stage is marked as passed
                    if (updatedCandidate.stages?.[currentStage]?.status !== 'Passed') {
                        throw new Error(`${currentStage} stage should be Passed but was ${updatedCandidate.stages?.[currentStage]?.status}`);
                    }
                    
                    // Verify the stage is marked as completed
                    if (!updatedCandidate.stages?.[currentStage]?.completed) {
                        throw new Error(`${currentStage} stage should be marked as completed`);
                    }
                    
                    // For stages before Hired, verify the new stage is In Progress
                    if (stage !== 'Hired') {
                        if (updatedCandidate.stages?.[stage]?.status !== 'In Progress') {
                            throw new Error(`${stage} stage should be In Progress but was ${updatedCandidate.stages?.[stage]?.status}`);
                        }
                        
                        // Verify the new stage is not marked as completed
                        if (updatedCandidate.stages?.[stage]?.completed) {
                            throw new Error(`${stage} stage should not be marked as completed yet`);
                        }
                        
                        // Verify overall status based on the stage
                        const expectedStatus = ['CV Review', 'Cultural Fit', 'Interview'].includes(stage) ? 'In Progress' : stage;
                        if (updatedCandidate.status !== expectedStatus) {
                            throw new Error(`Overall status should be ${expectedStatus} but was ${updatedCandidate.status}`);
                        }
                    } else {
                        // For Hired stage, verify the status is "Hired"
                        if (updatedCandidate.status !== 'Hired') {
                            throw new Error(`Overall status should be Hired but was ${updatedCandidate.status}`);
                        }
                    }
                    
                    // Update currentStage for next iteration
                    currentStage = stage;
                    
                    // If we just hired the candidate, verify the position was closed
                    if (stage === 'Hired') {
                        // Wait for position update to complete
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        const positionResponse = await fetch(`/api/positions/${positionId}`);
                        if (!positionResponse.ok) throw new Error('Failed to get position after hiring');
                        const updatedPosition = await positionResponse.json();
                        
                        if (updatedPosition.status.toLowerCase() !== 'closed') {
                            throw new Error(`Position should be closed after hiring but was ${updatedPosition.status}`);
                        }
                    }
                }
                
                // 5. Clean up
                await fetch(`/api/candidates/${candidateId}`, { method: 'DELETE' });
                await fetch(`/api/positions/${positionId}`, { method: 'DELETE' });
                
                return { 
                    stagesCompleted: stages.length,
                    positionClosed: true,
                    candidateHired: true
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