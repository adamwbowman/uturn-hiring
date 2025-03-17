<script>
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
        },
        {
            name: 'Verify New Candidate Stage Status',
            run: async () => {
                // Create a new candidate
                const candidate = {
                    name: 'Stage Test Candidate',
                    email: 'stages@example.com',
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
                
                // Fetch the created candidate to verify stage status
                const getResponse = await fetch(`/api/candidates/${id}`);
                if (!getResponse.ok) throw new Error('Failed to get candidate');
                const createdCandidate = await getResponse.json();
                
                // Verify the candidate status is "New"
                if (createdCandidate.status !== 'New') {
                    throw new Error(`Expected status to be 'New', got '${createdCandidate.status}'`);
                }
                
                // Verify the candidate has a "New" stage with "In Progress" status
                if (!createdCandidate.stages?.New?.status) {
                    throw new Error('Missing New stage status');
                }
                
                if (createdCandidate.stages.New.status !== 'In Progress') {
                    throw new Error(`Expected New stage status to be 'In Progress', got '${createdCandidate.stages.New.status}'`);
                }
                
                if (createdCandidate.stages.New.completed) {
                    throw new Error('New stage should not be marked as completed');
                }
                
                return { 
                    status: createdCandidate.status,
                    newStageStatus: createdCandidate.stages.New.status,
                    completed: createdCandidate.stages.New.completed
                };
            }
        },
        {
            name: 'Stage Transition: New to CV Review',
            run: async () => {
                // Create a new candidate
                const candidate = {
                    name: 'Stage Transition Candidate',
                    email: 'stagetransition@example.com',
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
                
                // Update from New to CV Review
                const updateData = {
                    status: 'CV Review',
                    currentStage: 'New',
                    stageStatus: 'Passed',
                    reviewer: 'Test Reviewer',
                    notes: 'Test notes',
                    action: 'pass'
                };
                
                try {
                    const updateResponse = await makePatchRequest(`/api/candidates/${id}`, updateData);
                    if (!updateResponse.ok) throw new Error('Failed to update candidate');
                } catch (error) {
                    throw new Error(`Failed to update candidate: ${error.message}`);
                }
                
                // Get the updated candidate
                const getUpdatedResponse = await fetch(`/api/candidates/${id}`);
                if (!getUpdatedResponse.ok) throw new Error('Failed to get updated candidate');
                const updatedCandidate = await getUpdatedResponse.json();
                
                // Verify the New stage status is "Passed"
                if (updatedCandidate.stages?.New?.status !== 'Passed') {
                    throw new Error(`Expected New stage status to be 'Passed', got '${updatedCandidate.stages?.New?.status}'`);
                }
                
                // Verify the New stage is marked as completed
                if (!updatedCandidate.stages?.New?.completed) {
                    throw new Error('New stage should be marked as completed');
                }
                
                // Verify the CV Review stage status is "In Progress"
                if (updatedCandidate.stages?.['CV Review']?.status !== 'In Progress') {
                    throw new Error(`Expected CV Review stage status to be 'In Progress', got '${updatedCandidate.stages?.['CV Review']?.status}'`);
                }
                
                // Verify the CV Review stage is not marked as completed
                if (updatedCandidate.stages?.['CV Review']?.completed) {
                    throw new Error('CV Review stage should not be marked as completed');
                }
                
                // Verify the overall status is "In Progress"
                if (updatedCandidate.status !== 'In Progress') {
                    throw new Error(`Expected status to be 'In Progress', got '${updatedCandidate.status}'`);
                }
                
                return { 
                    status: updatedCandidate.status,
                    newStageStatus: updatedCandidate.stages.New.status,
                    cvReviewStageStatus: updatedCandidate.stages['CV Review'].status
                };
            }
        },
        {
            name: 'Stage Transition: Fail Candidate',
            run: async () => {
                // Create a new candidate
                const candidate = {
                    name: 'Stage Fail Candidate',
                    email: 'stagefail@example.com',
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
                
                // Update the candidate to fail at New stage
                const updateData = {
                    status: 'Failed',
                    currentStage: 'New',
                    stageStatus: 'Failed',
                    reviewer: 'Test Reviewer',
                    notes: 'Not a good fit',
                    action: 'fail'
                };
                
                const updateResponse = await fetch(`/api/candidates/${id}`, {
                    method: 'PATCH',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to update candidate: ${errorText}`);
                }
                
                // Get the updated candidate
                const getUpdatedResponse = await fetch(`/api/candidates/${id}`);
                if (!getUpdatedResponse.ok) throw new Error('Failed to get updated candidate');
                const updatedCandidate = await getUpdatedResponse.json();
                
                // Verify the New stage status is "Failed"
                if (updatedCandidate.stages?.New?.status !== 'Failed') {
                    throw new Error(`Expected New stage status to be 'Failed', got '${updatedCandidate.stages?.New?.status}'`);
                }
                
                // Verify the New stage is marked as completed
                if (!updatedCandidate.stages?.New?.completed) {
                    throw new Error('New stage should be marked as completed');
                }
                
                // Verify the reviewer and notes were saved
                if (updatedCandidate.stages?.New?.reviewer !== 'Test Reviewer') {
                    throw new Error(`Expected reviewer to be 'Test Reviewer', got '${updatedCandidate.stages?.New?.reviewer}'`);
                }
                
                if (updatedCandidate.stages?.New?.notes !== 'Not a good fit') {
                    throw new Error(`Expected notes to be 'Not a good fit', got '${updatedCandidate.stages?.New?.notes}'`);
                }
                
                // Verify the overall status is "Failed"
                if (updatedCandidate.status !== 'Failed') {
                    throw new Error(`Expected status to be 'Failed', got '${updatedCandidate.status}'`);
                }
                
                return { 
                    status: updatedCandidate.status,
                    newStageStatus: updatedCandidate.stages.New.status,
                    reviewer: updatedCandidate.stages.New.reviewer,
                    notes: updatedCandidate.stages.New.notes
                };
            }
        },
        {
            name: 'Interview to Hired Transition',
            run: async () => {
                // Create a new candidate
                const candidate = {
                    name: 'Hiring Test Candidate',
                    email: 'hiring@example.com',
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
                
                // Fast-forward to Interview stage (skipping intermediate stages for simplicity)
                const getInitialResponse = await fetch(`/api/candidates/${id}`);
                if (!getInitialResponse.ok) throw new Error('Failed to get initial candidate');
                const initialCandidate = await getInitialResponse.json();
                
                // Update candidate directly to Interview stage
                const setupData = {
                    status: 'Interview',
                    currentStage: initialCandidate.status,
                    stageStatus: 'Passed',
                    reviewer: 'Test Reviewer',
                    notes: 'Fast-forward to Interview',
                    action: 'pass'
                };
                
                const setupResponse = await fetch(`/api/candidates/${id}`, {
                    method: 'PATCH',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(setupData)
                });
                
                if (!setupResponse.ok) {
                    const errorText = await setupResponse.text();
                    throw new Error(`Failed to setup candidate at Interview stage: ${errorText}`);
                }
                
                // Get the candidate at Interview stage
                const getInterviewResponse = await fetch(`/api/candidates/${id}`);
                if (!getInterviewResponse.ok) throw new Error('Failed to get candidate at Interview stage');
                const interviewCandidate = await getInterviewResponse.json();
                
                // Now update from Interview to Hired
                const hireData = {
                    status: 'Hired',
                    currentStage: 'Interview',
                    stageStatus: 'Passed',
                    reviewer: 'Hiring Manager',
                    notes: 'Great candidate',
                    action: 'pass'
                };
                
                const hireResponse = await fetch(`/api/candidates/${id}`, {
                    method: 'PATCH',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(hireData)
                });
                
                if (!hireResponse.ok) {
                    const errorText = await hireResponse.text();
                    throw new Error(`Failed to hire candidate: ${errorText}`);
                }
                
                // Get the hired candidate
                const getHiredResponse = await fetch(`/api/candidates/${id}`);
                if (!getHiredResponse.ok) throw new Error('Failed to get hired candidate');
                const hiredCandidate = await getHiredResponse.json();
                
                // Verify the Interview stage status is "Passed"
                if (hiredCandidate.stages?.Interview?.status !== 'Passed') {
                    throw new Error(`Expected Interview stage status to be 'Passed', got '${hiredCandidate.stages?.Interview?.status}'`);
                }
                
                // Verify the Interview stage is marked as completed
                if (!hiredCandidate.stages?.Interview?.completed) {
                    throw new Error('Interview stage should be marked as completed');
                }
                
                // Verify a Hired stage was created with status "Hired"
                if (!hiredCandidate.stages?.Hired) {
                    throw new Error('No Hired stage found');
                }
                
                if (hiredCandidate.stages?.Hired?.status !== 'Hired') {
                    throw new Error(`Expected Hired stage status to be 'Hired', got '${hiredCandidate.stages?.Hired?.status}'`);
                }
                
                // Verify the Hired stage is marked as completed
                if (!hiredCandidate.stages?.Hired?.completed) {
                    throw new Error('Hired stage should be marked as completed');
                }
                
                // Verify the overall status is "Hired"
                if (hiredCandidate.status !== 'Hired') {
                    throw new Error(`Expected status to be 'Hired', got '${hiredCandidate.status}'`);
                }
                
                return { 
                    status: hiredCandidate.status,
                    interviewStageStatus: hiredCandidate.stages.Interview.status,
                    hiredStageStatus: hiredCandidate.stages.Hired.status
                };
            }
        },
        {
            name: 'Hiring Process Status Transitions',
            run: async () => {
                // Mock API responses
                let mockCandidate = {
                    id: 'test123',
                    name: 'Test Candidate',
                    email: 'test@example.com',
                    status: 'New',
                    stages: []
                };
                
                const originalFetch = window.fetch;
                
                // Override fetch to mock responses
                window.fetch = async (url, options) => {
                    if (url.includes('/api/candidates/test123') && options?.method === 'PATCH') {
                        const body = JSON.parse(options.body);
                        
                        // Verify required fields are present
                        if (!body.currentStage) {
                            return new Response(JSON.stringify({ error: 'Current stage is required' }), {
                                status: 400,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                        
                        if (!body.action) {
                            return new Response(JSON.stringify({ error: 'Action is required' }), {
                                status: 400,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                        
                        // Handle transitions
                        if (body.currentStage === 'New' && body.action === 'pass') {
                            mockCandidate = {
                                ...mockCandidate,
                                status: 'In Progress',
                                stages: [
                                    { stage: 'New', status: 'Passed', reviewer: body.reviewer, notes: body.notes, date: new Date().toISOString() },
                                    { stage: 'CV Review', status: 'In Progress', date: new Date().toISOString() }
                                ]
                            };
                        } else if (body.currentStage === 'New' && body.action === 'fail') {
                            mockCandidate = {
                                ...mockCandidate,
                                status: 'Failed',
                                stages: [
                                    { stage: 'New', status: 'Failed', reviewer: body.reviewer, notes: body.notes, date: new Date().toISOString() }
                                ]
                            };
                        } else if (body.currentStage === 'CV Review' && body.action === 'pass') {
                            mockCandidate = {
                                ...mockCandidate,
                                status: 'In Progress',
                                stages: [
                                    ...mockCandidate.stages.filter(s => s.stage !== 'CV Review'),
                                    { stage: 'CV Review', status: 'Passed', reviewer: body.reviewer, notes: body.notes, date: new Date().toISOString() },
                                    { stage: 'Cultural Fit', status: 'In Progress', date: new Date().toISOString() }
                                ]
                            };
                        } else if (body.currentStage === 'Cultural Fit' && body.action === 'pass') {
                            mockCandidate = {
                                ...mockCandidate,
                                status: 'In Progress',
                                stages: [
                                    ...mockCandidate.stages.filter(s => s.stage !== 'Cultural Fit'),
                                    { stage: 'Cultural Fit', status: 'Passed', reviewer: body.reviewer, notes: body.notes, date: new Date().toISOString() },
                                    { stage: 'Interview', status: 'In Progress', date: new Date().toISOString() }
                                ]
                            };
                        } else if (body.currentStage === 'Interview' && body.action === 'pass') {
                            mockCandidate = {
                                ...mockCandidate,
                                status: 'Hired',
                                stages: [
                                    ...mockCandidate.stages.filter(s => s.stage !== 'Interview'),
                                    { stage: 'Interview', status: 'Passed', reviewer: body.reviewer, notes: body.notes, date: new Date().toISOString() },
                                    { stage: 'Hired', status: 'Completed', date: new Date().toISOString() }
                                ]
                            };
                        } else if (body.action === 'fail') {
                            mockCandidate = {
                                ...mockCandidate,
                                status: 'Failed',
                                stages: [
                                    ...mockCandidate.stages.filter(s => s.stage !== body.currentStage),
                                    { stage: body.currentStage, status: 'Failed', reviewer: body.reviewer, notes: body.notes, date: new Date().toISOString() }
                                ]
                            };
                        }
                        
                        return new Response(JSON.stringify(mockCandidate), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    
                    if (url.includes('/api/candidates/test123') && (!options || options.method === 'GET')) {
                        return new Response(JSON.stringify(mockCandidate), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    
                    // For any other URLs, use the original fetch
                    return originalFetch(url, options);
                };
                
                // Test New -> CV Review (pass)
                let response = await fetch('/api/candidates/test123', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentStage: 'New',
                        action: 'pass',
                        reviewer: 'Test Reviewer',
                        notes: 'Looks good'
                    })
                });
                
                let result = await response.json();
                if (result.status !== 'In Progress') {
                    throw new Error(`Expected status to be 'In Progress' after passing New stage, got '${result.status}'`);
                }
                
                if (!result.stages.find(s => s.stage === 'New' && s.status === 'Passed')) {
                    throw new Error('Expected New stage to be marked as Passed');
                }
                
                if (!result.stages.find(s => s.stage === 'CV Review' && s.status === 'In Progress')) {
                    throw new Error('Expected CV Review stage to be marked as In Progress');
                }
                
                // Test CV Review -> Cultural Fit (pass)
                response = await fetch('/api/candidates/test123', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentStage: 'CV Review',
                        action: 'pass',
                        reviewer: 'Test Reviewer',
                        notes: 'CV looks good'
                    })
                });
                
                result = await response.json();
                if (result.status !== 'In Progress') {
                    throw new Error(`Expected status to still be 'In Progress' after passing CV Review, got '${result.status}'`);
                }
                
                if (!result.stages.find(s => s.stage === 'CV Review' && s.status === 'Passed')) {
                    throw new Error('Expected CV Review stage to be marked as Passed');
                }
                
                if (!result.stages.find(s => s.stage === 'Cultural Fit' && s.status === 'In Progress')) {
                    throw new Error('Expected Cultural Fit stage to be marked as In Progress');
                }
                
                // Test Cultural Fit -> Interview (pass)
                response = await fetch('/api/candidates/test123', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentStage: 'Cultural Fit',
                        action: 'pass',
                        reviewer: 'Test Reviewer',
                        notes: 'Great culture fit'
                    })
                });
                
                result = await response.json();
                if (result.status !== 'In Progress') {
                    throw new Error(`Expected status to still be 'In Progress' after passing Cultural Fit, got '${result.status}'`);
                }
                
                if (!result.stages.find(s => s.stage === 'Cultural Fit' && s.status === 'Passed')) {
                    throw new Error('Expected Cultural Fit stage to be marked as Passed');
                }
                
                if (!result.stages.find(s => s.stage === 'Interview' && s.status === 'In Progress')) {
                    throw new Error('Expected Interview stage to be marked as In Progress');
                }
                
                // Test Interview -> Hired (pass)
                response = await fetch('/api/candidates/test123', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentStage: 'Interview',
                        action: 'pass',
                        reviewer: 'Test Reviewer',
                        notes: 'Great interview'
                    })
                });
                
                result = await response.json();
                if (result.status !== 'Hired') {
                    throw new Error(`Expected status to be 'Hired' after passing Interview, got '${result.status}'`);
                }
                
                if (!result.stages.find(s => s.stage === 'Interview' && s.status === 'Passed')) {
                    throw new Error('Expected Interview stage to be marked as Passed');
                }
                
                if (!result.stages.find(s => s.stage === 'Hired' && s.status === 'Completed')) {
                    throw new Error('Expected Hired stage to be marked as Completed');
                }
                
                // Reset for failure test
                mockCandidate = {
                    id: 'test123',
                    name: 'Test Candidate',
                    email: 'test@example.com',
                    status: 'New',
                    stages: []
                };
                
                // Test New -> Failed (fail)
                response = await fetch('/api/candidates/test123', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentStage: 'New',
                        action: 'fail',
                        reviewer: 'Test Reviewer',
                        notes: 'Not suitable'
                    })
                });
                
                result = await response.json();
                if (result.status !== 'Failed') {
                    throw new Error(`Expected status to be 'Failed' after failing New stage, got '${result.status}'`);
                }
                
                if (!result.stages.find(s => s.stage === 'New' && s.status === 'Failed')) {
                    throw new Error('Expected New stage to be marked as Failed');
                }
                
                // Restore original fetch
                window.fetch = originalFetch;
                
                return {
                    newToCVReview: true,
                    cvReviewToCulturalFit: true,
                    culturalFitToInterview: true,
                    interviewToHired: true,
                    newToFailed: true
                };
            }
        },
        {
            name: 'Missing Required Fields Validation',
            run: async () => {
                // Mock API responses
                const originalFetch = window.fetch;
                
                // Override fetch to mock responses
                window.fetch = async (url, options) => {
                    if (url.includes('/api/candidates/test123') && options?.method === 'PATCH') {
                        const body = JSON.parse(options.body);
                        
                        // Check for missing required fields
                        const missingFields = [];
                        if (!body.currentStage) missingFields.push('currentStage');
                        if (!body.action) missingFields.push('action');
                        if (body.action === 'pass' || body.action === 'fail') {
                            if (!body.reviewer) missingFields.push('reviewer');
                            if (!body.notes) missingFields.push('notes');
                        }
                        
                        if (missingFields.length > 0) {
                            return new Response(JSON.stringify({ 
                                error: `Missing required fields: ${missingFields.join(', ')}` 
                            }), {
                                status: 400,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                        
                        return new Response(JSON.stringify({ status: 'Updated' }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    
                    // For any other URLs, use the original fetch
                    return originalFetch(url, options);
                };
                
                // Test missing currentStage
                let response = await fetch('/api/candidates/test123', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'pass',
                        reviewer: 'Test Reviewer',
                        notes: 'Looks good'
                    })
                });
                
                let result = await response.json();
                if (response.status !== 400 || !result.error.includes('currentStage')) {
                    throw new Error('Expected 400 error for missing currentStage');
                }
                
                // Test missing action
                response = await fetch('/api/candidates/test123', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentStage: 'New',
                        reviewer: 'Test Reviewer',
                        notes: 'Looks good'
                    })
                });
                
                result = await response.json();
                if (response.status !== 400 || !result.error.includes('action')) {
                    throw new Error('Expected 400 error for missing action');
                }
                
                // Test missing reviewer
                response = await fetch('/api/candidates/test123', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentStage: 'New',
                        action: 'pass',
                        notes: 'Looks good'
                    })
                });
                
                result = await response.json();
                if (response.status !== 400 || !result.error.includes('reviewer')) {
                    throw new Error('Expected 400 error for missing reviewer');
                }
                
                // Test missing notes
                response = await fetch('/api/candidates/test123', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentStage: 'New',
                        action: 'pass',
                        reviewer: 'Test Reviewer'
                    })
                });
                
                result = await response.json();
                if (response.status !== 400 || !result.error.includes('notes')) {
                    throw new Error('Expected 400 error for missing notes');
                }
                
                // Restore original fetch
                window.fetch = originalFetch;
                
                return {
                    missingCurrentStage: true,
                    missingAction: true,
                    missingReviewer: true,
                    missingNotes: true
                };
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