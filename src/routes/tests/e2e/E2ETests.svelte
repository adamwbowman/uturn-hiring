<script>
    let status = $state(null);
    let message = $state('');
    let results = $state([]);
    
    const tests = [
        {
            name: 'Complete Position Management Workflow',
            run: async () => {
                // 1. Create a new position
                const position = {
                    title: 'Senior Software Engineer',
                    department: 'Engineering',
                    hiringManager: 'John Doe',
                    timeline: 'Q2'
                };
                
                const createResponse = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(position)
                });
                if (!createResponse.ok) throw new Error('Failed to create position');
                const { id } = await createResponse.json();
                
                // 2. Verify position is listed
                const listResponse = await fetch('/api/positions');
                if (!listResponse.ok) throw new Error('Failed to list positions');
                const positions = await listResponse.json();
                const created = positions.find(p => p._id === id);
                if (!created) throw new Error('Position not found in listing');
                
                // 3. Verify all fields match
                const fieldChecks = [
                    ['title', position.title],
                    ['department', position.department],
                    ['hiringManager', position.hiringManager],
                    ['timeline', position.timeline],
                    ['status', 'Open'] // Default status
                ];
                
                for (const [field, expected] of fieldChecks) {
                    if (created[field] !== expected) {
                        throw new Error(`Field mismatch: ${field} expected ${expected}, got ${created[field]}`);
                    }
                }
                
                // 4. Clean up
                const deleteResponse = await fetch(`/api/positions/${id}`, {
                    method: 'DELETE'
                });
                if (!deleteResponse.ok) throw new Error('Failed to clean up test position');
                
                return { success: true, fieldsVerified: fieldChecks.length };
            }
        },
        {
            name: 'Multiple Positions Management',
            run: async () => {
                // 1. Create multiple positions
                const positions = [
                    {
                        title: 'Frontend Developer',
                        department: 'Engineering',
                        hiringManager: 'Jane Smith',
                        timeline: 'Q1'
                    },
                    {
                        title: 'Sales Representative',
                        department: 'Sales',
                        hiringManager: 'Mike Johnson',
                        timeline: 'Q2'
                    },
                    {
                        title: 'Product Manager',
                        department: 'Management',
                        hiringManager: 'Sarah Wilson',
                        timeline: 'Q3'
                    }
                ];
                
                const createdIds = [];
                
                // Create positions
                for (const pos of positions) {
                    const response = await fetch('/api/positions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(pos)
                    });
                    if (!response.ok) throw new Error(`Failed to create position: ${pos.title}`);
                    const { id } = await response.json();
                    createdIds.push(id);
                }
                
                // 2. Verify all positions are listed
                const listResponse = await fetch('/api/positions');
                if (!listResponse.ok) throw new Error('Failed to list positions');
                const listedPositions = await listResponse.json();
                
                // Check each position exists and matches
                for (let i = 0; i < positions.length; i++) {
                    const created = listedPositions.find(p => p._id === createdIds[i]);
                    if (!created) throw new Error(`Position not found: ${positions[i].title}`);
                    
                    if (created.title !== positions[i].title ||
                        created.department !== positions[i].department ||
                        created.hiringManager !== positions[i].hiringManager ||
                        created.timeline !== positions[i].timeline) {
                        throw new Error(`Data mismatch for position: ${positions[i].title}`);
                    }
                }
                
                // 3. Clean up
                for (const id of createdIds) {
                    const deleteResponse = await fetch(`/api/positions/${id}`, {
                        method: 'DELETE'
                    });
                    if (!deleteResponse.ok) throw new Error(`Failed to delete position: ${id}`);
                }
                
                return { 
                    positionsCreated: positions.length,
                    positionsVerified: positions.length,
                    positionsDeleted: createdIds.length
                };
            }
        },
        {
            name: 'Department Filter Workflow',
            run: async () => {
                // 1. Create positions in different departments
                const departments = ['Engineering', 'Sales', 'Management'];
                const createdIds = [];
                
                for (const dept of departments) {
                    const position = {
                        title: `${dept} Role`,
                        department: dept,
                        hiringManager: 'Test Manager',
                        timeline: 'Q1'
                    };
                    
                    const response = await fetch('/api/positions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(position)
                    });
                    if (!response.ok) throw new Error(`Failed to create ${dept} position`);
                    const { id } = await response.json();
                    createdIds.push(id);
                }
                
                // 2. Verify all departments are represented
                const listResponse = await fetch('/api/positions');
                if (!listResponse.ok) throw new Error('Failed to list positions');
                const positions = await listResponse.json();
                
                const deptCounts = {};
                for (const pos of positions) {
                    deptCounts[pos.department] = (deptCounts[pos.department] || 0) + 1;
                }
                
                for (const dept of departments) {
                    if (!deptCounts[dept]) {
                        throw new Error(`Department ${dept} not found in positions`);
                    }
                }
                
                // 3. Clean up
                for (const id of createdIds) {
                    await fetch(`/api/positions/${id}`, { method: 'DELETE' });
                }
                
                return { 
                    departmentsTested: departments.length,
                    departmentCounts: deptCounts
                };
            }
        },
        {
            name: 'Timeline-based Workflow',
            run: async () => {
                // 1. Create positions for different quarters
                const timelines = ['Q1', 'Q2', 'Q3', 'Q4'];
                const createdIds = [];
                
                for (const timeline of timelines) {
                    const position = {
                        title: `${timeline} Position`,
                        department: 'Engineering',
                        hiringManager: 'Test Manager',
                        timeline: timeline
                    };
                    
                    const response = await fetch('/api/positions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(position)
                    });
                    if (!response.ok) throw new Error(`Failed to create ${timeline} position`);
                    const { id } = await response.json();
                    createdIds.push(id);
                }
                
                // 2. Verify timeline distribution
                const listResponse = await fetch('/api/positions');
                if (!listResponse.ok) throw new Error('Failed to list positions');
                const positions = await listResponse.json();
                
                const timelineCounts = {};
                for (const pos of positions) {
                    timelineCounts[pos.timeline] = (timelineCounts[pos.timeline] || 0) + 1;
                }
                
                for (const timeline of timelines) {
                    if (!timelineCounts[timeline]) {
                        throw new Error(`Timeline ${timeline} not found in positions`);
                    }
                }
                
                // 3. Clean up
                for (const id of createdIds) {
                    await fetch(`/api/positions/${id}`, { method: 'DELETE' });
                }
                
                return { 
                    timelinesTested: timelines.length,
                    timelineCounts: timelineCounts
                };
            }
        },
        {
            name: 'Complete Candidate Management Workflow',
            run: async () => {
                // 1. Create a new candidate
                const candidate = {
                    name: 'John Smith',
                    email: 'john.smith@example.com',
                    source: 'Recruiter',
                    sourceContact: 'Jane Recruiter',
                    position: 'Senior Engineer',
                    requestedPay: 150000
                };
                
                const createResponse = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(candidate)
                });
                if (!createResponse.ok) throw new Error('Failed to create candidate');
                const { id } = await createResponse.json();
                
                // 2. Verify candidate is listed
                const listResponse = await fetch('/api/candidates');
                if (!listResponse.ok) throw new Error('Failed to list candidates');
                const candidates = await listResponse.json();
                const created = candidates.find(c => c._id === id);
                if (!created) throw new Error('Candidate not found in listing');
                
                // 3. Verify all fields match
                const fieldChecks = [
                    ['name', candidate.name],
                    ['email', candidate.email],
                    ['source', candidate.source],
                    ['sourceContact', candidate.sourceContact],
                    ['position', candidate.position],
                    ['requestedPay', candidate.requestedPay],
                    ['status', 'New'] // Default status
                ];
                
                for (const [field, expected] of fieldChecks) {
                    if (created[field] !== expected) {
                        throw new Error(`Field mismatch: ${field} expected ${expected}, got ${created[field]}`);
                    }
                }
                
                // 4. Clean up
                const deleteResponse = await fetch(`/api/candidates/${id}`, {
                    method: 'DELETE'
                });
                if (!deleteResponse.ok) throw new Error('Failed to clean up test candidate');
                
                return { success: true, fieldsVerified: fieldChecks.length };
            }
        },
        {
            name: 'Multiple Candidates Management',
            run: async () => {
                // 1. Create multiple candidates
                const candidates = [
                    {
                        name: 'Frontend Dev',
                        email: 'frontend@example.com',
                        source: 'Recruiter',
                        sourceContact: 'Career Page',
                        position: 'Frontend Developer',
                        requestedPay: 120000
                    },
                    {
                        name: 'Sales Rep',
                        email: 'sales@example.com',
                        source: 'Referral',
                        sourceContact: 'Mike Manager',
                        position: 'Sales Representative',
                        requestedPay: 80000
                    },
                    {
                        name: 'Product Manager',
                        email: 'pm@example.com',
                        source: 'Other',
                        sourceContact: 'Sarah Recruiter',
                        position: 'Product Manager',
                        requestedPay: 140000
                    }
                ];
                
                const createdIds = [];
                
                // Create candidates
                for (const cand of candidates) {
                    const response = await fetch('/api/candidates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cand)
                    });
                    if (!response.ok) throw new Error(`Failed to create candidate: ${cand.name}`);
                    const { id } = await response.json();
                    createdIds.push(id);
                }
                
                // 2. Verify all candidates are listed
                const listResponse = await fetch('/api/candidates');
                if (!listResponse.ok) throw new Error('Failed to list candidates');
                const listedCandidates = await listResponse.json();
                
                // Check each candidate exists and matches
                for (let i = 0; i < candidates.length; i++) {
                    const created = listedCandidates.find(c => c._id === createdIds[i]);
                    if (!created) throw new Error(`Candidate not found: ${candidates[i].name}`);
                    
                    if (created.name !== candidates[i].name ||
                        created.email !== candidates[i].email ||
                        created.source !== candidates[i].source ||
                        created.position !== candidates[i].position) {
                        throw new Error(`Data mismatch for candidate: ${candidates[i].name}`);
                    }
                }
                
                // 3. Clean up
                for (const id of createdIds) {
                    const deleteResponse = await fetch(`/api/candidates/${id}`, {
                        method: 'DELETE'
                    });
                    if (!deleteResponse.ok) throw new Error(`Failed to delete candidate: ${id}`);
                }
                
                return { 
                    candidatesCreated: candidates.length,
                    candidatesVerified: candidates.length,
                    candidatesDeleted: createdIds.length
                };
            }
        },
        {
            name: 'Source Filter Workflow',
            run: async () => {
                // 1. Create candidates from different sources
                const sources = ['Recruiter', 'Referral', 'Other'];
                const createdIds = [];
                
                for (const source of sources) {
                    const candidate = {
                        name: `${source} Candidate`,
                        email: `${source.toLowerCase()}@example.com`,
                        source: source,
                        sourceContact: `${source} Contact`,
                        position: 'Test Role',
                        requestedPay: 100000
                    };
                    
                    const response = await fetch('/api/candidates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(candidate)
                    });
                    if (!response.ok) throw new Error(`Failed to create ${source} candidate`);
                    const { id } = await response.json();
                    createdIds.push(id);
                }
                
                // 2. Verify all sources are represented
                const listResponse = await fetch('/api/candidates');
                if (!listResponse.ok) throw new Error('Failed to list candidates');
                const candidates = await listResponse.json();
                
                const sourceCounts = {};
                for (const cand of candidates) {
                    sourceCounts[cand.source] = (sourceCounts[cand.source] || 0) + 1;
                }
                
                for (const source of sources) {
                    if (!sourceCounts[source]) {
                        throw new Error(`Source ${source} not found in candidates`);
                    }
                }
                
                // 3. Clean up
                for (const id of createdIds) {
                    await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
                }
                
                return { 
                    sourcesTested: sources.length,
                    sourceCounts: sourceCounts
                };
            }
        },
        {
            name: 'Pay Range Workflow',
            run: async () => {
                // 1. Create candidates with different pay ranges
                const payRanges = [50000, 100000, 150000, 200000];
                const createdIds = [];
                
                for (const pay of payRanges) {
                    const candidate = {
                        name: `${pay} Candidate`,
                        email: `pay${pay}@example.com`,
                        source: 'Recruiter',
                        sourceContact: 'Test Recruiter',
                        position: 'Test Role',
                        requestedPay: pay
                    };
                    
                    const response = await fetch('/api/candidates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(candidate)
                    });
                    if (!response.ok) throw new Error(`Failed to create candidate with pay ${pay}`);
                    const { id } = await response.json();
                    createdIds.push(id);
                }
                
                // 2. Verify pay range distribution
                const listResponse = await fetch('/api/candidates');
                if (!listResponse.ok) throw new Error('Failed to list candidates');
                const candidates = await listResponse.json();
                
                const payCounts = {
                    hourly: 0,
                    salary: 0
                };
                
                for (const cand of candidates) {
                    if (cand.requestedPay < 1000) {
                        payCounts.hourly++;
                    } else {
                        payCounts.salary++;
                    }
                }
                
                // 3. Clean up
                for (const id of createdIds) {
                    await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
                }
                
                return { 
                    payRangesTested: payRanges.length,
                    payCounts: payCounts
                };
            }
        },
        {
            name: 'Full Hiring Process E2E Flow',
            run: async () => {
                // 1. Create a position
                const position = {
                    title: 'E2E Hire Process Position',
                    department: 'Engineering',
                    hiringManager: 'E2E Test Manager',
                    timeline: 'Q1'
                };
                
                const createPositionResponse = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(position)
                });
                
                if (!createPositionResponse.ok) throw new Error('Failed to create position');
                const { id: positionId } = await createPositionResponse.json();
                
                // Verify position is open
                const initialPositionResponse = await fetch(`/api/positions/${positionId}`);
                if (!initialPositionResponse.ok) throw new Error('Failed to get initial position');
                const initialPosition = await initialPositionResponse.json();
                
                if (initialPosition.status.toLowerCase() !== 'open') {
                    throw new Error(`Initial position status should be Open but was ${initialPosition.status}`);
                }
                
                // 2. Create multiple candidates for same position
                const candidates = [
                    {
                        name: 'Hired Candidate',
                        email: 'hired@example.com',
                        source: 'Recruiter',
                        position: position.title,
                        requestedPay: 120000
                    },
                    {
                        name: 'Interview Candidate',
                        email: 'interview@example.com',
                        source: 'Recruiter',
                        position: position.title,
                        requestedPay: 110000
                    },
                    {
                        name: 'Failed Candidate',
                        email: 'failed@example.com',
                        source: 'Recruiter',
                        position: position.title,
                        requestedPay: 100000
                    }
                ];
                
                const candidateIds = [];
                
                for (const candidateData of candidates) {
                    const createResponse = await fetch('/api/candidates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(candidateData)
                    });
                    
                    if (!createResponse.ok) throw new Error(`Failed to create candidate: ${candidateData.name}`);
                    const { id } = await createResponse.json();
                    candidateIds.push(id);
                }
                
                // 3. Progress first candidate to Hired
                const candidateToHire = candidateIds[0];
                const stages = ['CV Review', 'Cultural Fit', 'Interview', 'Hired'];
                let currentStage = 'New';
                
                for (const stage of stages) {
                    const updateResponse = await fetch(`/api/candidates/${candidateToHire}`, {
                        method: 'PATCH',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            status: stage,
                            currentStage: currentStage,
                            stageStatus: 'Passed',
                            reviewer: 'E2E Tester',
                            notes: `Passed ${currentStage}`,
                            action: 'pass'
                        })
                    });
                    
                    if (!updateResponse.ok) {
                        const errorText = await updateResponse.text();
                        throw new Error(`Failed to update candidate to ${stage}: ${errorText}`);
                    }
                    
                    currentStage = stage;
                }
                
                // 4. Progress second candidate to Interview
                const candidateToInterview = candidateIds[1];
                currentStage = 'New';
                
                for (const stage of stages.slice(0, 3)) { // CV Review, Cultural Fit, Interview
                    const updateResponse = await fetch(`/api/candidates/${candidateToInterview}`, {
                        method: 'PATCH',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            status: stage,
                            currentStage: currentStage,
                            stageStatus: 'Passed',
                            reviewer: 'E2E Tester',
                            notes: `Passed ${currentStage}`,
                            action: 'pass'
                        })
                    });
                    
                    if (!updateResponse.ok) {
                        const errorText = await updateResponse.text();
                        throw new Error(`Failed to update second candidate to ${stage}: ${errorText}`);
                    }
                    
                    currentStage = stage;
                }
                
                // 5. Fail the third candidate at CV Review
                const candidateToFail = candidateIds[2];
                const failUpdateResponse = await fetch(`/api/candidates/${candidateToFail}`, {
                    method: 'PATCH',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'Failed',
                        currentStage: 'New',
                        stageStatus: 'Failed',
                        reviewer: 'E2E Tester',
                        notes: 'Not a good fit',
                        action: 'fail'
                    })
                });
                
                if (!failUpdateResponse.ok) {
                    const errorText = await failUpdateResponse.text();
                    throw new Error(`Failed to fail candidate: ${errorText}`);
                }
                
                // 6. Wait for the position status update to complete
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 7. Verify position is closed because of hired candidate
                const finalPositionResponse = await fetch(`/api/positions/${positionId}`);
                if (!finalPositionResponse.ok) throw new Error('Failed to get final position status');
                const finalPosition = await finalPositionResponse.json();
                
                if (finalPosition.status.toLowerCase() !== 'closed') {
                    throw new Error(`Position should be closed after hiring but was ${finalPosition.status}`);
                }
                
                // 8. Verify candidate statuses
                const getHiredResponse = await fetch(`/api/candidates/${candidateToHire}`);
                if (!getHiredResponse.ok) throw new Error('Failed to get hired candidate');
                const hiredCandidate = await getHiredResponse.json();
                
                const getInterviewResponse = await fetch(`/api/candidates/${candidateToInterview}`);
                if (!getInterviewResponse.ok) throw new Error('Failed to get interview candidate');
                const interviewCandidate = await getInterviewResponse.json();
                
                const getFailedResponse = await fetch(`/api/candidates/${candidateToFail}`);
                if (!getFailedResponse.ok) throw new Error('Failed to get failed candidate');
                const failedCandidate = await getFailedResponse.json();
                
                // Verify statuses
                if (hiredCandidate.status !== 'Hired') {
                    throw new Error(`Hired candidate status should be 'Hired' but was '${hiredCandidate.status}'`);
                }
                
                if (interviewCandidate.status !== 'Interview') {
                    throw new Error(`Interview candidate status should be 'Interview' but was '${interviewCandidate.status}'`);
                }
                
                if (failedCandidate.status !== 'Failed') {
                    throw new Error(`Failed candidate status should be 'Failed' but was '${failedCandidate.status}'`);
                }
                
                // 9. Clean up
                for (const id of candidateIds) {
                    await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
                }
                await fetch(`/api/positions/${positionId}`, { method: 'DELETE' });
                
                return { 
                    positionClosed: true,
                    hiredCandidate: hiredCandidate.status === 'Hired',
                    interviewCandidate: interviewCandidate.status === 'Interview',
                    failedCandidate: failedCandidate.status === 'Failed'
                };
            }
        }
    ];
    
    async function runTests() {
        status = 'running';
        message = 'Running end-to-end tests...';
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
        message = status === 'success' ? 'All end-to-end tests passed!' : 'Some end-to-end tests failed';
    }
</script>

<div class="card">
    <div class="card-header d-flex justify-content-between align-items-center">
        <span>End-to-End Tests</span>
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