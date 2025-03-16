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
                let currentStage = 'New';  // Initialize the current stage
                for (const stage of [...stages, 'Hired']) {
                    console.log(`Updating candidate 1 to stage: ${stage}`);
                    try {
                        console.log(`Making PATCH request to /api/candidates/${candidate1Id}`);
                        
                        // Use XHR helper instead of fetch for PATCH requests
                        let updateResponse;
                        try {
                            updateResponse = await makePatchRequest(`/api/candidates/${candidate1Id}`, {
                                status: stage,
                                currentStage: currentStage,
                                stageStatus: 'Passed',
                                reviewer: 'Test Reviewer',
                                notes: 'Test notes',
                                action: 'pass'
                            });
                            console.log(`PATCH request successful: Status ${updateResponse.status}`);
                        } catch (error) {
                            console.error(`PATCH request failed:`, error);
                            throw new Error(`PATCH request failed: ${error.status} ${error.statusText} - ${error.responseText}`);
                        }
                        
                        // Update currentStage for the next iteration
                        currentStage = stage;
                        
                        // Verify stage was recorded correctly
                        console.log(`Verifying stage record for ${stage}`);
                        const checkStageResponse = await fetch(`/api/candidates/${candidate1Id}`);
                        if (!checkStageResponse.ok) {
                            const errorData = await checkStageResponse.json();
                            throw new Error(`Failed to verify stage record: ${JSON.stringify(errorData)}`);
                        }
                        const candidateWithStage = await checkStageResponse.json();
                        console.log(`Stage data for ${stage}:`, candidateWithStage.stages[stage]);
                        if (!candidateWithStage.stages[stage]) {
                            throw new Error(`Stage ${stage} was not found in candidate data`);
                        }
                        
                        // The current and next stages have different completion states
                        if (stage === 'CV Review') {
                            // We're checking "CV Review" stage - this is the NEW stage we're transitioning TO
                            // It should be "In Progress" not "Passed" at this point
                            if (candidateWithStage.stages[stage].status !== 'In Progress') {
                                throw new Error(`Stage ${stage} should be In Progress but was ${candidateWithStage.stages[stage].status}`);
                            }
                            
                            // Also verify the previous stage (New) is marked as Passed
                            if (candidateWithStage.stages['New'].status !== 'Passed') {
                                throw new Error(`Previous stage New should be marked as Passed but was ${candidateWithStage.stages['New'].status}`);
                            }
                        } else if (stage === 'Cultural Fit') {
                            // We're checking "Cultural Fit" stage - this is the NEW stage we're transitioning TO
                            if (candidateWithStage.stages[stage].status !== 'In Progress') {
                                throw new Error(`Stage ${stage} should be In Progress but was ${candidateWithStage.stages[stage].status}`);
                            }
                            
                            // Also verify the previous stage (CV Review) is marked as Passed
                            if (candidateWithStage.stages['CV Review'].status !== 'Passed') {
                                throw new Error(`Previous stage CV Review should be marked as Passed but was ${candidateWithStage.stages['CV Review'].status}`);
                            }
                        } else if (stage === 'Interview') {
                            // We're checking "Interview" stage - this is the NEW stage we're transitioning TO
                            if (candidateWithStage.stages[stage].status !== 'In Progress') {
                                throw new Error(`Stage ${stage} should be In Progress but was ${candidateWithStage.stages[stage].status}`);
                            }
                            
                            // Also verify the previous stage (Cultural Fit) is marked as Passed
                            if (candidateWithStage.stages['Cultural Fit'].status !== 'Passed') {
                                throw new Error(`Previous stage Cultural Fit should be marked as Passed but was ${candidateWithStage.stages['Cultural Fit'].status}`);
                            }
                        } else if (stage === 'Hired') {
                            // Special case for Hired stage
                            if (candidateWithStage.stages[stage].status !== 'Hired') {
                                throw new Error(`Stage ${stage} should be Hired but was ${candidateWithStage.stages[stage].status}`);
                            }
                            
                            // Also verify the previous stage (Interview) is marked as Passed
                            if (candidateWithStage.stages['Interview'].status !== 'Passed') {
                                throw new Error(`Previous stage Interview should be marked as Passed but was ${candidateWithStage.stages['Interview'].status}`);
                            }
                        }

                        // If this is the final (Hired) stage, update position status
                        if (stage === 'Hired') {
                            console.log('Waiting for candidate status update to complete...');
                            // Wait for 1 second to ensure candidate status is updated and position is automatically closed
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                            // Verify the position status was automatically updated to closed
                            console.log('Verifying position status was automatically updated...');
                            const verifyUpdateResponse = await fetch(`/api/positions/${positionId}`);
                            if (!verifyUpdateResponse.ok) {
                                const errorData = await verifyUpdateResponse.json();
                                throw new Error(`Failed to verify position update: ${JSON.stringify(errorData)}`);
                            }
                            const positionAfterUpdate = await verifyUpdateResponse.json();
                            console.log('Position after update:', positionAfterUpdate);
                            
                            // Verify position status is closed
                            if (positionAfterUpdate.status.toLowerCase() !== 'closed') {
                                throw new Error(`Position status should have been automatically set to 'closed' but was '${positionAfterUpdate.status}'`);
                            }

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
                            
                            // Verify the candidate has Interview stage marked as 'Passed'
                            if (!updatedCandidate.stages?.Interview?.status || updatedCandidate.stages.Interview.status !== 'Passed') {
                                throw new Error(`Interview stage status should be 'Passed' but was '${updatedCandidate.stages?.Interview?.status || 'not set'}'`);
                            }
                            
                            // Verify the candidate has Hired stage marked as 'Hired'
                            if (!updatedCandidate.stages?.Hired?.status || updatedCandidate.stages.Hired.status !== 'Hired') {
                                throw new Error(`Hired stage status should be 'Hired' but was '${updatedCandidate.stages?.Hired?.status || 'not set'}'`);
                            }
                        }
                    } catch (error) {
                        throw new Error(`Failed to update candidate 1 to ${stage}: ${error.message}`);
                    }
                }
                
                // Progress second candidate to Interview
                currentStage = 'New'; // Reset the current stage for the second candidate
                for (const stage of stages) {
                    console.log(`Updating candidate 2 to stage: ${stage}`);
                    try {
                        console.log(`Making PATCH request to /api/candidates/${candidate2Id}`);
                        
                        // Use XHR helper instead of fetch for PATCH requests
                        let updateResponse;
                        try {
                            updateResponse = await makePatchRequest(`/api/candidates/${candidate2Id}`, {
                                status: stage,
                                currentStage: currentStage,
                                stageStatus: 'Passed',
                                reviewer: 'Test Reviewer',
                                notes: 'Test notes',
                                action: 'pass'
                            });
                            console.log(`PATCH request successful: Status ${updateResponse.status}`);
                        } catch (error) {
                            console.error(`PATCH request failed:`, error);
                            throw new Error(`PATCH request failed: ${error.status} ${error.statusText} - ${error.responseText}`);
                        }
                        
                        // Update currentStage for the next iteration
                        currentStage = stage;
                        
                        // Verify stage was recorded correctly
                        console.log(`Verifying stage record for ${stage}`);
                        const checkStageResponse = await fetch(`/api/candidates/${candidate2Id}`);
                        if (!checkStageResponse.ok) {
                            const errorData = await checkStageResponse.json();
                            throw new Error(`Failed to verify stage record: ${JSON.stringify(errorData)}`);
                        }
                        const candidateWithStage = await checkStageResponse.json();
                        console.log(`Stage data for ${stage}:`, candidateWithStage.stages[stage]);
                        if (!candidateWithStage.stages[stage]) {
                            throw new Error(`Stage ${stage} was not found in candidate data`);
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
        },
        {
            name: 'Stage Count Logic',
            run: async () => {
                // 1. Create a position
                const position = {
                    title: 'Stage Count Test Position',
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
                
                // 2. Create a candidate for the position
                const candidate = {
                    name: `Stage Count Test Candidate ${Date.now()}`, // Add timestamp for uniqueness
                    email: `stagecount-${Date.now()}@example.com`, // Add timestamp for uniqueness
                    position: position.title,
                    source: 'Recruiter'
                };
                
                const createCandidateResponse = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(candidate)
                });
                
                if (!createCandidateResponse.ok) throw new Error('Failed to create candidate');
                const { id: candidateId } = await createCandidateResponse.json();
                
                // 3. Progress candidate to CV Review stage
                console.log('Progressing candidate to CV Review stage');
                try {
                    let updateResponse = await makePatchRequest(`/api/candidates/${candidateId}`, {
                        status: 'CV Review',
                        currentStage: 'New',
                        stageStatus: 'Passed',
                        reviewer: 'Test Reviewer',
                        notes: 'Test notes',
                        action: 'pass'
                    });
                    
                    if (!updateResponse.ok) throw new Error('Failed to update candidate to CV Review');
                } catch (error) {
                    throw new Error(`Failed to update candidate: ${error.message}`);
                }
                
                // 4. Verify the candidate data and stage statuses
                const getCandidateResponse = await fetch(`/api/candidates/${candidateId}`);
                if (!getCandidateResponse.ok) throw new Error('Failed to get updated candidate');
                const updatedCandidate = await getCandidateResponse.json();
                
                console.log('Candidate after update:', updatedCandidate);
                
                // Verify New stage is marked as Passed
                if (updatedCandidate.stages?.New?.status !== 'Passed') {
                    throw new Error(`New stage should be 'Passed' but was '${updatedCandidate.stages?.New?.status || 'not set'}'`);
                }
                
                // Verify CV Review stage is In Progress
                if (updatedCandidate.stages?.['CV Review']?.status !== 'In Progress') {
                    throw new Error(`CV Review stage should be 'In Progress' but was '${updatedCandidate.stages?.['CV Review']?.status || 'not set'}'`);
                }
                
                // 5. Get positions with candidates to check stage counts
                const getPositionsResponse = await fetch('/api/positions');
                if (!getPositionsResponse.ok) throw new Error('Failed to get positions');
                const positions = await getPositionsResponse.json();
                
                // Find our test position
                const testPosition = positions.find(p => p._id === positionId);
                if (!testPosition) throw new Error('Test position not found');
                
                // 6. Manually calculate stage counts using the same logic as our function
                const allCandidatesResponse = await fetch('/api/candidates');
                if (!allCandidatesResponse.ok) throw new Error('Failed to get all candidates');
                const allCandidates = await allCandidatesResponse.json();
                
                // Count CV Review stage with In Progress status
                const cvReviewCount = allCandidates.filter(c => 
                    c.position === position.title && 
                    c.name === candidate.name && // Ensure we're only counting our test candidate
                    c.stages?.['CV Review']?.status === 'In Progress'
                ).length;
                
                // This should be 1 based on our test setup
                if (cvReviewCount !== 1) {
                    throw new Error(`Expected CV Review count to be 1, but got ${cvReviewCount}`);
                }
                
                // Count New stage with In Progress status (should be 0 since we passed it)
                const newStageCount = allCandidates.filter(c => 
                    c.position === position.title && 
                    c.name === candidate.name && // Ensure we're only counting our test candidate
                    c.stages?.New?.status === 'In Progress'
                ).length;
                
                if (newStageCount !== 0) {
                    throw new Error(`Expected New stage count to be 0, but got ${newStageCount}`);
                }
                
                return {
                    success: true,
                    cvReviewCount,
                    newStageCount,
                    candidate: {
                        status: updatedCandidate.status,
                        newStageStatus: updatedCandidate.stages?.New?.status,
                        cvReviewStageStatus: updatedCandidate.stages?.['CV Review']?.status
                    }
                };
            }
        },
        {
            name: 'Interview to Hired Transition',
            run: async () => {
                // 1. Create a position
                const position = {
                    title: 'Hire Test Position',
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
                
                // 2. Create a candidate for the position
                const candidate = {
                    name: 'Hire Test Candidate',
                    email: 'hiretest@example.com',
                    position: position.title,
                    source: 'Recruiter'
                };
                
                const createCandidateResponse = await fetch('/api/candidates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(candidate)
                });
                
                if (!createCandidateResponse.ok) throw new Error('Failed to create candidate');
                const { id: candidateId } = await createCandidateResponse.json();
                
                // 3. Progress candidate directly to Interview stage (skipping intermediate stages for simplicity)
                console.log('Setting up candidate at Interview stage');
                try {
                    // First get the candidate to ensure we're using the correct currentStage
                    const getInitialCandidateResponse = await fetch(`/api/candidates/${candidateId}`);
                    if (!getInitialCandidateResponse.ok) throw new Error('Failed to get initial candidate data');
                    const initialCandidate = await getInitialCandidateResponse.json();
                    
                    // Update from New to Interview (directly for test simplicity)
                    let updateResponse = await makePatchRequest(`/api/candidates/${candidateId}`, {
                        status: 'Interview',
                        currentStage: initialCandidate.status,
                        stageStatus: 'Passed',
                        reviewer: 'Test Reviewer',
                        notes: 'Direct to Interview for testing',
                        action: 'pass'
                    });
                    
                    if (!updateResponse.ok) throw new Error('Failed to update candidate to Interview');
                } catch (error) {
                    throw new Error(`Failed to update candidate: ${error.message}`);
                }
                
                // 4. Verify Interview stage is correctly set up
                let verifyResponse = await fetch(`/api/candidates/${candidateId}`);
                if (!verifyResponse.ok) throw new Error('Failed to verify candidate setup');
                let verifyCandidate = await verifyResponse.json();
                
                console.log('Candidate after setup:', verifyCandidate);
                
                // 5. Now update from Interview to Hired
                console.log('Updating candidate from Interview to Hired');
                try {
                    let hireResponse = await makePatchRequest(`/api/candidates/${candidateId}`, {
                        status: 'Hired',
                        currentStage: 'Interview',
                        stageStatus: 'Passed', // This should be Passed, not Hired
                        reviewer: 'Hiring Manager',
                        notes: 'Excellent candidate',
                        action: 'pass'
                    });
                    
                    if (!hireResponse.ok) throw new Error('Failed to hire candidate');
                } catch (error) {
                    throw new Error(`Failed to hire candidate: ${error.message}`);
                }
                
                // 6. Wait for the position update to complete
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 7. Verify the candidate data after hiring
                const getHiredCandidateResponse = await fetch(`/api/candidates/${candidateId}`);
                if (!getHiredCandidateResponse.ok) throw new Error('Failed to get hired candidate data');
                const hiredCandidate = await getHiredCandidateResponse.json();
                
                console.log('Candidate after hiring:', hiredCandidate);
                
                // Verify Interview stage is marked as Passed
                if (hiredCandidate.stages?.Interview?.status !== 'Passed') {
                    throw new Error(`Interview stage should be 'Passed' but was '${hiredCandidate.stages?.Interview?.status || 'not set'}'`);
                }
                
                // Verify Hired stage is created and marked as Hired
                if (!hiredCandidate.stages?.Hired || hiredCandidate.stages?.Hired?.status !== 'Hired') {
                    throw new Error(`Hired stage should be created with status 'Hired' but was '${hiredCandidate.stages?.Hired?.status || 'not set'}'`);
                }
                
                // 8. Verify the position was automatically closed
                const getPositionResponse = await fetch(`/api/positions/${positionId}`);
                if (!getPositionResponse.ok) throw new Error('Failed to get position after hiring');
                const positionAfterHiring = await getPositionResponse.json();
                
                console.log('Position after hiring:', positionAfterHiring);
                
                if (positionAfterHiring.status.toLowerCase() !== 'closed') {
                    throw new Error(`Position should be automatically closed but status was '${positionAfterHiring.status}'`);
                }
                
                return {
                    success: true,
                    positionStatus: positionAfterHiring.status,
                    candidateStatus: hiredCandidate.status,
                    interviewStageStatus: hiredCandidate.stages?.Interview?.status,
                    hiredStageStatus: hiredCandidate.stages?.Hired?.status
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