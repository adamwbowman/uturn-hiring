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
        },
        {
            name: 'Complete Position Management Workflow',
            run: async () => {
                // 1. Create a position
                const position = {
                    title: 'Workflow Test Position',
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
                const { id: positionId } = await createResponse.json();
                
                // 2. Create candidates for the position
                const candidate1 = {
                    name: 'Workflow Test Candidate 1',
                    email: 'test1@example.com',
                    position: position.title,
                    source: 'Recruiter'
                };
                
                const candidate2 = {
                    name: 'Workflow Test Candidate 2',
                    email: 'test2@example.com',
                    position: position.title,
                    source: 'Recruiter'
                };
                
                const createCandidate1Response = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(candidate1)
                });
                
                if (!createCandidate1Response.ok) throw new Error('Failed to create candidate 1');
                const { id: candidate1Id } = await createCandidate1Response.json();
                
                const createCandidate2Response = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(candidate2)
                });
                
                if (!createCandidate2Response.ok) throw new Error('Failed to create candidate 2');
                const { id: candidate2Id } = await createCandidate2Response.json();
                
                // 3. Progress candidates through stages
                const stages = ['CV Review', 'Cultural Fit', 'Interview'];
                
                // Progress first candidate to hired
                for (const stage of [...stages, 'Hired']) {
                    console.log(`Updating candidate 1 to stage: ${stage}`);
                    try {
                        console.log(`Making PATCH request to /api/candidates/${candidate1Id}`);
                        
                        // Use XHR helper instead of fetch for PATCH requests
                        let updateResponse;
                        try {
                            updateResponse = await makePatchRequest(`/api/candidates/${candidate1Id}`, {
                                status: stage,
                                reviewer: 'Test Reviewer',
                                notes: 'Test notes',
                                action: 'pass'
                            });
                            console.log(`PATCH request successful: Status ${updateResponse.status}`);
                        } catch (error) {
                            console.error(`PATCH request failed:`, error);
                            throw new Error(`PATCH request failed: ${error.status} ${error.statusText} - ${error.responseText}`);
                        }
                        
                        // Verify stage was recorded correctly
                        console.log(`Verifying stage record for ${stage}`);
                        const checkStageResponse = await fetch(`/api/candidates/${candidate1Id}`);
                        if (!checkStageResponse.ok) {
                            const errorData = await checkStageResponse.json();
                            throw new Error(`Failed to verify stage record: ${JSON.stringify(errorData)}`);
                        }
                        const candidateWithStage = await checkStageResponse.json();
                        console.log(`Stage data for ${stage}:`, candidateWithStage.stages[stage]);
                        if (!candidateWithStage.stages[stage] || !candidateWithStage.stages[stage].completed) {
                            throw new Error(`Stage ${stage} was not properly recorded`);
                        }

                        // If this is the final (Hired) stage, update position status
                        if (stage === 'Hired') {
                            console.log('Waiting for candidate status update to complete...');
                            // Wait for 1 second to ensure candidate status is updated
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                            // First verify the position exists and get its current status
                            console.log('Verifying position exists...');
                            const checkPositionResponse = await fetch(`/api/positions/${positionId}`);
                            if (!checkPositionResponse.ok) {
                                const errorData = await checkPositionResponse.json();
                                throw new Error(`Failed to get position before update: ${JSON.stringify(errorData)}`);
                            }
                            const positionBeforeUpdate = await checkPositionResponse.json();
                            console.log('Position before update:', positionBeforeUpdate);
                            
                            console.log('Updating position status to closed');
                            
                            // Use XHR helper for position update
                            let updatePositionResponse;
                            try {
                                updatePositionResponse = await makePatchRequest(`/api/positions/${positionId}`, {
                                    status: 'closed'
                                });
                                console.log(`Position PATCH successful: Status ${updatePositionResponse.status}`);
                            } catch (error) {
                                console.error(`Position PATCH failed:`, error);
                                throw new Error(`Position PATCH failed: ${error.status} ${error.statusText} - ${error.responseText}`);
                            }

                            // Verify the position status was updated
                            console.log('Verifying position status update...');
                            const verifyUpdateResponse = await fetch(`/api/positions/${positionId}`);
                            if (!verifyUpdateResponse.ok) {
                                const errorData = await verifyUpdateResponse.json();
                                throw new Error(`Failed to verify position update: ${JSON.stringify(errorData)}`);
                            }
                            const positionAfterUpdate = await verifyUpdateResponse.json();
                            console.log('Position after update:', positionAfterUpdate);

                            // Verify the candidate was actually updated to Hired status
                            const checkCandidateResponse = await fetch(`/api/candidates/${candidate1Id}`);
                            if (!checkCandidateResponse.ok) {
                                const errorData = await checkCandidateResponse.json();
                                throw new Error(`Failed to verify candidate status: ${JSON.stringify(errorData)}`);
                            }
                            const updatedCandidate = await checkCandidateResponse.json();
                            console.log(`Candidate status after update: ${updatedCandidate.status}`);
                            if (updatedCandidate.status !== 'Hired') {
                                throw new Error(`Candidate status should be 'Hired' but was '${updatedCandidate.status}'`);
                            }
                        }
                    } catch (error) {
                        throw new Error(`Failed to update candidate 1 to ${stage}: ${error.message}`);
                    }
                }
                
                // Progress second candidate to Interview
                for (const stage of stages) {
                    console.log(`Updating candidate 2 to stage: ${stage}`);
                    try {
                        console.log(`Making PATCH request to /api/candidates/${candidate2Id}`);
                        
                        // Use XHR helper instead of fetch for PATCH requests
                        let updateResponse;
                        try {
                            updateResponse = await makePatchRequest(`/api/candidates/${candidate2Id}`, {
                                status: stage,
                                reviewer: 'Test Reviewer',
                                notes: 'Test notes',
                                action: 'pass'
                            });
                            console.log(`PATCH request successful: Status ${updateResponse.status}`);
                        } catch (error) {
                            console.error(`PATCH request failed:`, error);
                            throw new Error(`PATCH request failed: ${error.status} ${error.statusText} - ${error.responseText}`);
                        }
                        
                        // Verify stage was recorded correctly
                        console.log(`Verifying stage record for ${stage}`);
                        const checkStageResponse = await fetch(`/api/candidates/${candidate2Id}`);
                        if (!checkStageResponse.ok) {
                            const errorData = await checkStageResponse.json();
                            throw new Error(`Failed to verify stage record: ${JSON.stringify(errorData)}`);
                        }
                        const candidateWithStage = await checkStageResponse.json();
                        console.log(`Stage data for ${stage}:`, candidateWithStage.stages[stage]);
                        if (!candidateWithStage.stages[stage] || !candidateWithStage.stages[stage].completed) {
                            throw new Error(`Stage ${stage} was not properly recorded`);
                        }
                    } catch (error) {
                        throw new Error(`Failed to update candidate 2 to ${stage}: ${error.message}`);
                    }
                }
                
                // 4. Verify position status is now closed (due to hired candidate)
                console.log('Verifying position status');
                const getPositionResponse = await fetch(`/api/positions/${positionId}`);
                if (!getPositionResponse.ok) {
                    const errorData = await getPositionResponse.json();
                    throw new Error(`Failed to get position: ${JSON.stringify(errorData)}`);
                }
                const updatedPosition = await getPositionResponse.json();
                
                console.log(`Current position status: ${updatedPosition.status}`);
                if (updatedPosition.status.toLowerCase() !== 'closed') {
                    throw new Error(`Position status should be 'closed' but was '${updatedPosition.status}'`);
                }
                
                // 5. Verify stage counts
                console.log('Verifying stage counts');
                const getCandidatesResponse = await fetch('/api/candidates');
                if (!getCandidatesResponse.ok) {
                    const errorData = await getCandidatesResponse.json();
                    throw new Error(`Failed to get candidates: ${JSON.stringify(errorData)}`);
                }
                const allCandidates = await getCandidatesResponse.json();
                
                const positionCandidates = allCandidates.filter(c => c.position === position.title);
                const hiredCount = positionCandidates.filter(c => c.status === 'Hired').length;
                const interviewCount = positionCandidates.filter(c => c.status === 'Interview').length;
                
                console.log(`Hired count: ${hiredCount}, Interview count: ${interviewCount}`);
                if (hiredCount !== 1) throw new Error(`Should have exactly 1 hired candidate but found ${hiredCount}`);
                if (interviewCount !== 1) throw new Error(`Should have exactly 1 candidate in Interview stage but found ${interviewCount}`);
                
                return { 
                    success: true,
                    hiredCount,
                    interviewCount,
                    positionStatus: updatedPosition.status
                };
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

    async function makePatchRequest(url, data) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PATCH', url);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Accept', 'application/json');
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve({
                            ok: true,
                            status: xhr.status,
                            json: () => JSON.parse(xhr.responseText),
                            text: () => xhr.responseText
                        });
                    } catch (e) {
                        resolve({
                            ok: true,
                            status: xhr.status,
                            json: () => ({}),
                            text: () => xhr.responseText
                        });
                    }
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText
                    });
                }
            };
            
            xhr.onerror = function() {
                console.error('XHR Error:', xhr.status, xhr.statusText, xhr.responseText);
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText
                });
            };
            
            xhr.send(JSON.stringify(data));
        });
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