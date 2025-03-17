<script>
    import { onMount } from 'svelte';
    import { slide } from 'svelte/transition';
    
    let data = $state({
        candidates: [],
        positions: []
    });
    
    let showForm = $state(false);
    let showFilters = $state(false);
    let newCandidate = $state({
        name: '',
        email: '',
        source: '',
        sourceContact: '',
        position: '',
        requestedPay: ''
    });
    
    // Filter states
    let selectedStage = $state('All');
    let selectedStatus = $state('All');
    let selectedDepartment = $state('All');
    let selectedSource = $state('All');
    let loading = $state(true);
    let error = $state(null);
    let filteredCandidates = $state([]);
    
    const stages = ['All', 'New', 'CV Review', 'Cultural Fit', 'Interview', 'Hired', 'Failed'];
    const statuses = ['All', 'New', 'In Progress', 'Hired', 'Failed'];
    const departments = ['All', 'Engineering', 'Sales', 'Management'];
    const sources = $derived(() => {
        const uniqueSources = new Set(['All', ...data.candidates.map(c => c.source).filter(Boolean)]);
        return Array.from(uniqueSources);
    });

    // Watch for changes in filters and data
    $effect(() => {
        console.log('Effect running - Current data:', data);
        console.log('Current filters - Stage:', selectedStage, 'Status:', selectedStatus, 'Department:', selectedDepartment, 'Source:', selectedSource);
        
        if (!Array.isArray(data.candidates)) {
            console.warn('data.candidates is not an array:', data.candidates);
            filteredCandidates = [];
            return;
        }
        
        filteredCandidates = data.candidates.filter(candidate => {
            // Stage filter (specific stage)
            const matchesStage = selectedStage === 'All' || candidate.status === selectedStage;
            
            // Status filter (high-level status)
            const displayStatus = statusFlow[candidate.status]?.display || candidate.status;
            const matchesStatus = selectedStatus === 'All' || displayStatus === selectedStatus;
            
            // Get the department from the position
            const position = data.positions.find(p => p.title === candidate.position);
            const matchesDepartment = selectedDepartment === 'All' || position?.department === selectedDepartment;
            
            const matchesSource = selectedSource === 'All' || candidate.source === selectedSource;
            
            console.log(`Candidate ${candidate.name}: matches stage: ${matchesStage}, matches status: ${matchesStatus}, matches department: ${matchesDepartment}, matches source: ${matchesSource}`);
            return matchesStage && matchesStatus && matchesDepartment && matchesSource;
        });
        
        console.log('Updated filtered candidates:', filteredCandidates);
    });

    onMount(async () => {
        try {
            console.log('Fetching candidates and positions...');
            
            const [candidatesResponse, positionsResponse] = await Promise.all([
                fetch('/api/candidates'),
                fetch('/api/positions')
            ]);
            
            console.log('Candidates response status:', candidatesResponse.status);
            console.log('Positions response status:', positionsResponse.status);
            
            if (!candidatesResponse.ok) {
                const errorData = await candidatesResponse.json();
                throw new Error(`Failed to fetch candidates: ${errorData.error || candidatesResponse.statusText}`);
            }
            if (!positionsResponse.ok) {
                const errorData = await positionsResponse.json();
                throw new Error(`Failed to fetch positions: ${errorData.error || positionsResponse.statusText}`);
            }
            
            const candidates = await candidatesResponse.json();
            const positions = await positionsResponse.json();
            
            console.log('Loaded candidates:', candidates);
            console.log('Loaded positions:', positions);
            
            if (!Array.isArray(candidates)) {
                throw new Error('Candidates data is not in the expected format');
            }
            
            // Update state
            data.candidates = candidates;
            data.positions = positions;
            filteredCandidates = candidates; // Initialize with all candidates
            
        } catch (e) {
            console.error('Error loading data:', e);
            error = e.message;
            
            if (e instanceof TypeError && e.message.includes('fetch')) {
                error = 'Could not connect to the server. Please check if the server is running.';
            } else if (e.message.includes('Unexpected token')) {
                error = 'Server returned invalid data format';
            }
        } finally {
            loading = false;
        }
    });

    let showStatusModal = $state(false);
    let selectedCandidate = $state(null);
    let statusUpdate = $state({
        status: '',
        reviewer: '',
        notes: '',
        action: '' // 'pass' or 'fail'
    });

    const statusFlow = {
        'New': { next: 'CV Review', color: 'info', display: 'New' },
        'CV Review': { next: 'Cultural Fit', color: 'warning', display: 'In Progress' },
        'Cultural Fit': { next: 'Interview', color: 'warning', display: 'In Progress' },
        'Interview': { next: 'Hired', color: 'warning', display: 'In Progress' },
        'Hired': { next: null, color: 'success', display: 'Hired' },
        'Failed': { next: null, color: 'danger', display: 'Failed' }
    };

    function toggleForm() {
        showForm = !showForm;
    }

    // Add state reset functions
    function resetNewCandidate() {
        newCandidate = {
            name: '',
            email: '',
            source: '',
            sourceContact: '',
            position: '',
            requestedPay: ''
        };
    }

    function resetStatusUpdate() {
        statusUpdate = {
            status: '',
            reviewer: '',
            notes: '',
            action: ''
        };
    }

    function cancelForm() {
        showForm = false;
        resetNewCandidate();
    }

    async function createCandidate(candidateData) {
        // Add the initial status and stage data
        const enhancedData = {
            ...candidateData,
            status: 'New',
            stages: {
                'New': {
                    status: 'In Progress',
                    reviewer: 'System',
                    notes: 'Initial stage',
                    updatedAt: new Date(),
                    completed: false
                }
            }
        };
        
        const response = await fetch('/api/candidates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enhancedData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create candidate');
        }
        return response.json();
    }

    async function updateCandidateStatus(candidateId, updateData) {
        try {
            const response = await fetch(`/api/candidates/${candidateId}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.details || 'Failed to update candidate status');
            }

            return await response.json();
        } catch (error) {
            console.error('Update error:', error);
            throw error;
        }
    }

    async function deleteCandidate(candidate) {
        try {
            const response = await fetch(`/api/candidates/${candidate._id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                window.location.reload();
            } else {
                throw new Error('Failed to delete candidate');
            }
        } catch (error) {
            alert('Error deleting candidate: ' + error.message);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        
        const candidateData = {
            ...newCandidate,
            requestedPay: newCandidate.requestedPay ? Number(newCandidate.requestedPay) : undefined
        };

        try {
            await createCandidate(candidateData);
            resetNewCandidate();
            showForm = false;
            window.location.reload();
        } catch (error) {
            alert('Error creating candidate: ' + error.message);
        }
    }

    function formatCurrency(amount) {
        if (!amount) return '-';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    function getPayType(amount) {
        if (!amount) return '';
        return amount < 1000 ? '/hourly' : '/salary';
    }

    function getStatusColor(status) {
        if (status === 'Failed') return 'danger';
        if (status === 'Hired') return 'success';
        if (status === 'In Progress') return 'warning';
        
        // Check if the status maps to a display of "In Progress"
        const displayStatus = statusFlow[status]?.display;
        if (displayStatus === 'In Progress') return 'warning';
        
        return statusFlow[status]?.color || 'secondary';
    }

    function openStatusModal(candidate) {
        selectedCandidate = candidate; // Store the candidate for reference
        
        // If the candidate's status is "In Progress", determine the actual stage
        let actualStatus = candidate.status;
        if (candidate.status === 'In Progress') {
            // Find which stage is currently in progress
            const stages = Object.entries(candidate.stages || {});
            for (const [stageName, stageData] of stages) {
                if (stageData.status === 'In Progress') {
                    actualStatus = stageName;
                    break;
                }
            }
        }
        
        statusUpdate = {
            candidateId: candidate._id,
            previousStatus: actualStatus, // Use the actual stage name, not the display status
            status: actualStatus, // Use the actual stage name, not the display status
            currentStage: actualStatus, // Track the current stage for the API
            reviewer: '',
            notes: '',
            action: ''
        };
        
        showStatusModal = true;
    }

    function closeStatusModal() {
        showStatusModal = false;
        selectedCandidate = null;
        resetStatusUpdate();
    }

    async function handleStatusUpdate(event) {
        event.preventDefault();
        
        if (!statusUpdate.reviewer) {
            alert('Reviewer name is required');
            return;
        }

        if (statusUpdate.action === 'fail' && !statusUpdate.notes) {
            alert('Notes are required when failing a candidate');
            return;
        }
        
        try {
            const candidateId = statusUpdate.candidateId;
            if (!candidateId) {
                throw new Error('Invalid candidate ID');
            }

            const currentStage = statusUpdate.currentStage;
            let newStatus;
            let stageStatus;
            
            // Handle passing a stage
            if (statusUpdate.action === 'pass') {
                // Always set the current stage's status to Passed
                stageStatus = 'Passed';
                
                // Get the next stage from statusFlow
                newStatus = statusFlow[currentStage]?.next || currentStage;
            }
            
            // Handle failing a stage
            if (statusUpdate.action === 'fail') {
                // Set the stage status to Failed
                stageStatus = 'Failed';
                
                // Set the candidate status to Failed
                newStatus = 'Failed';
            }

            await updateCandidateStatus(candidateId, {
                status: newStatus,
                stageStatus: stageStatus,
                currentStage: currentStage,
                reviewer: statusUpdate.reviewer,
                notes: statusUpdate.notes,
                action: statusUpdate.action
            });
            
            closeStatusModal();
            window.location.reload();
        } catch (error) {
            console.error('Error details:', error);
            alert('Error updating candidate status: ' + error.message);
        }
    }

    function getPositionHiringManager(positionTitle) {
        const position = data.positions.find(p => p.title === positionTitle);
        return position?.hiringManager || '-';
    }

    function formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function getStageButtonStyle(stage, candidateStatus, stageData) {
        // For stages that have been completed (have stageData with completed=true)
        if (stageData?.completed) {
            if (stageData.status === 'Failed') return 'btn-danger';      // Red for failed stages
            if (stageData.status === 'Passed') return 'btn-success';     // Green for passed stages
            if (stageData.status === 'Skipped') return 'btn-secondary';  // Gray for skipped stages
        }

        // For stages that are "In Progress" - make yellow
        if (stageData?.status === 'In Progress') {
            return 'btn-warning';
        }

        // For the current active stage
        if (candidateStatus === stage) {
            // Use the color from statusFlow
            return `btn-${statusFlow[stage]?.color || 'secondary'}`;
        }

        // If candidate is hired, all stages are green
        if (candidateStatus === 'Hired') return 'btn-success';

        // If candidate failed, show the stage they failed at as red
        if (candidateStatus === 'Failed' && stageData && stageData.status === 'Failed') {
            return 'btn-danger';
        }

        // Future/incomplete stages are outlined in gray
        return 'btn-outline-secondary';
    }

    function getStageCount(position, stage) {
        // Implementation of getStageCount function
        // This function should return the count of candidates in the specified stage
        // For now, we'll use a placeholder implementation
        return 0; // Placeholder return, actual implementation needed
    }
</script>

<div class="container mt-4">
    <!-- Header with Filters and Add Button -->
    <div class="d-flex flex-column gap-3 mb-4">
        <!-- Top Row: Status Filter and Add Button -->
        <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex gap-2 align-items-center">
                <!-- Filters Toggle Button -->
                <button 
                    type="button" 
                    class="btn btn-outline-secondary d-flex align-items-center gap-1"
                    onclick={() => showFilters = !showFilters}
                >
                    Filters
                    <i class="bi {showFilters ? 'bi-chevron-up' : 'bi-chevron-down'} ms-1"></i>
                </button>

                <!-- Status Filter -->
                <div class="btn-group" role="group" aria-label="Status filter">
                    {#each statuses as status}
                        {@const isActive = selectedStatus === status}
                        {@const icon = status === 'All' ? 'bi-filter'
                            : status === 'New' ? 'bi-star'
                            : status === 'In Progress' ? 'bi-arrow-repeat'
                            : status === 'Hired' ? 'bi-check-circle'
                            : status === 'Failed' ? 'bi-x-circle'
                            : 'bi-circle'}
                        <button 
                            type="button" 
                            class="btn btn-outline-secondary {isActive ? 'active' : ''}"
                            onclick={() => selectedStatus = status}
                        >
                            <i class="bi {icon} me-1"></i>
                            {status}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Add Candidate Button -->
            <button 
                type="button" 
                class="btn btn-primary" 
                onclick={() => showForm = true}
                disabled={showForm}
            >
                <i class="bi bi-plus"></i> Add Candidate
            </button>
        </div>

        <!-- Bottom Row: Other Filters -->
        {#if showFilters}
            <div class="d-flex justify-content-between align-items-center" transition:slide>
                <div class="d-flex gap-2 flex-wrap align-items-center">
                    <small class="text-muted me-1">Filter by:</small>
                    <!-- Stage Filter -->
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-light dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-kanban me-1"></i>
                            {selectedStage === 'All' ? 'Stage' : selectedStage}
                        </button>
                        <ul class="dropdown-menu">
                            {#each stages as stage}
                                <li>
                                    <button 
                                        class="dropdown-item {selectedStage === stage ? 'active' : ''}"
                                        onclick={() => selectedStage = stage}
                                    >
                                        {stage}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    </div>

                    <!-- Department Filter -->
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-light dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-building me-1"></i>
                            {selectedDepartment === 'All' ? 'Department' : selectedDepartment}
                        </button>
                        <ul class="dropdown-menu">
                            {#each departments as dept}
                                <li>
                                    <button 
                                        class="dropdown-item {selectedDepartment === dept ? 'active' : ''}"
                                        onclick={() => selectedDepartment = dept}
                                    >
                                        {dept}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    </div>

                    <!-- Source Filter -->
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-light dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-person-badge me-1"></i>
                            {selectedSource === 'All' ? 'Source' : selectedSource}
                        </button>
                        <ul class="dropdown-menu">
                            {#each sources as source}
                                <li>
                                    <button 
                                        class="dropdown-item {selectedSource === source ? 'active' : ''}"
                                        onclick={() => selectedSource = source}
                                    >
                                        {source}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Loading and Error States -->
    {#if loading}
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    {:else if error}
        <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            {error}
        </div>
    {:else}
        <!-- Combined Card for Form and Table -->
        <div class="card">
            <div class="card-body">
                <!-- Form -->
                {#if showForm}
                    <form id="candidateForm" onsubmit={handleSubmit} class="mb-4" transition:slide>
                        <div class="row g-2 align-items-end">
                            <div class="col">
                                <label for="position" class="form-label">Position</label>
                                <select 
                                    class="form-select" 
                                    id="position"
                                    bind:value={newCandidate.position}
                                    required
                                >
                                    <option value="">Select a position...</option>
                                    {#each data.positions as position}
                                        <option value={position.title}>{position.title} - {position.department}</option>
                                    {/each}
                                </select>
                            </div>

                            <div class="col">
                                <label for="name" class="form-label">Name</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    id="name"
                                    bind:value={newCandidate.name}
                                    required
                                >
                            </div>

                            <div class="col">
                                <label for="email" class="form-label">Email</label>
                                <input 
                                    type="email" 
                                    class="form-control" 
                                    id="email"
                                    bind:value={newCandidate.email}
                                    required
                                >
                            </div>
                            
                            <div class="col-auto">
                                <label for="source" class="form-label">Source</label>
                                <select 
                                    class="form-select" 
                                    id="source"
                                    bind:value={newCandidate.source}
                                    required
                                >
                                    <option value="">Select...</option>
                                    <option value="Recruiter">Recruiter</option>
                                    <option value="Referral">Referral</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div class="col">
                                <label for="sourceContact" class="form-label">Source Contact</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    id="sourceContact"
                                    bind:value={newCandidate.sourceContact}
                                    placeholder="Name or contact info"
                                >
                            </div>
                            
                            <div class="col-auto">
                                <label for="requestedPay" class="form-label">Pay ($)</label>
                                <input 
                                    type="number" 
                                    class="form-control" 
                                    id="requestedPay"
                                    bind:value={newCandidate.requestedPay}
                                    placeholder="Amount"
                                    style="width: 120px;"
                                >
                            </div>

                            <div class="col-auto">
                                <button type="button" class="btn btn-secondary" onclick={cancelForm} style="min-width: 80px; white-space: nowrap;">
                                    Cancel
                                </button>
                            </div>

                            <div class="col-auto">
                                <button type="submit" class="btn btn-success" style="min-width: 80px; white-space: nowrap;">
                                    Add
                                </button>
                            </div>
                        </div>
                    </form>
                {/if}

                <!-- Table -->
                <div class="table-responsive">
                    <!-- Results Count -->
                    <div class="text-end mb-2">
                        <small class="text-muted">
                            Showing {filteredCandidates.length} of {data.candidates.length} candidates
                        </small>
                    </div>
                    
                    <table class="table">
                        <tbody>
                            {#each filteredCandidates as candidate}
                                <tr>
                                    <td class="align-middle">
                                        <div class="d-flex align-items-center gap-2">
                                            <button 
                                                class="btn btn-sm btn-{getStatusColor(candidate.status)}" 
                                                style="min-width: 100px; white-space: nowrap;"
                                                disabled
                                            >
                                                {statusFlow[candidate.status]?.display || candidate.status}
                                            </button>
                                            {#if candidate.status !== 'Failed' && candidate.status !== 'Hired'}
                                                <button 
                                                    class="btn btn-sm btn-outline-{getStatusColor(candidate.status)} btn-status-update"
                                                    onclick={() => openStatusModal(candidate)}
                                                    title="Update status"
                                                >
                                                    <i class="bi bi-fast-forward-fill"></i>
                                                </button>
                                            {/if}
                                        </div>
                                    </td>
                                    <td>
                                        <div>{candidate.name}</div>
                                        <div>
                                            <a href="mailto:{candidate.email}" class="text-muted small text-decoration-none">
                                                {candidate.email}
                                            </a>
                                        </div>
                                    </td>
                                    <td>
                                        <div>{candidate.position}</div>
                                        <div class="text-muted small">
                                            {getPositionHiringManager(candidate.position)}
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex gap-1 flex-nowrap">
                                            {#each ['New', 'CV Review', 'Cultural Fit', 'Interview', 'Hired'] as stage}
                                                {@const stageData = candidate.stages?.[stage]}
                                                <button 
                                                    class="btn btn-sm {getStageButtonStyle(stage, candidate.status, stageData)}"
                                                    style="min-width: 85px; font-size: 0.75rem; padding: 0.2rem 0.5rem;"
                                                    title={stageData ? `Stage: ${stage}\nStatus: ${stageData.status}\nReviewer: ${stageData.reviewer}\nDate: ${formatDate(stageData.updatedAt)}${stageData.notes ? '\nNotes: ' + stageData.notes : ''}` : ''}
                                                    disabled
                                                >
                                                    <div class="text-center">
                                                        <div class="fw-bold">{stage}</div>
                                                        {#if stageData}
                                                            {#if stageData.status === 'Passed' || stageData.status === 'Failed' || stageData.status === 'Hired'}
                                                                {#if stageData.updatedAt}
                                                                    <div class="small text-white">
                                                                        {formatDate(stageData.updatedAt)}
                                                                    </div>
                                                                {/if}
                                                            {:else}
                                                                <div class="small">
                                                                    {stageData.status}
                                                                </div>
                                                                {#if stageData.status !== 'In Progress' && stageData.updatedAt}
                                                                    <div class="small text-muted" style="font-size: 0.65rem;">
                                                                        {formatDate(stageData.updatedAt)}
                                                                    </div>
                                                                {/if}
                                                            {/if}
                                                        {/if}
                                                    </div>
                                                </button>
                                            {/each}
                                        </div>
                                    </td>
                                    <td>
                                        <div>{candidate.source || '-'}</div>
                                        <div class="text-muted small">
                                            {candidate.sourceContact || '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <div>{formatCurrency(candidate.requestedPay)}</div>
                                        <div class="text-muted small">
                                            {getPayType(candidate.requestedPay)}
                                        </div>
                                    </td>
                                    <td class="align-middle">
                                        <div class="btn-group">
                                            <button 
                                                class="btn btn-sm btn-outline-danger hover-fill"
                                                onclick={() => deleteCandidate(candidate)}
                                                aria-label={`Delete candidate: ${candidate.name}`}
                                            >
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Status Update Modal -->
        {#if showStatusModal}
            <div class="modal show d-block" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                Update Hiring Process
                            </h5>
                            <button type="button" class="btn-close" onclick={closeStatusModal}></button>
                        </div>
                        <form onsubmit={handleStatusUpdate}>
                            <div class="modal-body">
                                <!-- Hiring Process -->
                                <div class="mb-4">
                                    <div class="d-flex gap-1 flex-nowrap justify-content-center">
                                        {#each ['New', 'CV Review', 'Cultural Fit', 'Interview', 'Hired'] as stage}
                                            {@const stageData = selectedCandidate?.stages?.[stage]}
                                            <button 
                                                class="btn btn-sm {getStageButtonStyle(stage, selectedCandidate?.status, stageData)}"
                                                style="text-align: center; min-width: 85px; padding: 0.25rem 0.5rem;"
                                                disabled
                                            >
                                                {stage}
                                            </button>
                                        {/each}
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Candidate: {selectedCandidate?.name}</label>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Your Name *</label>
                                    <input 
                                        type="text" 
                                        class="form-control" 
                                        bind:value={statusUpdate.reviewer}
                                        required
                                    >
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">
                                        Notes {statusUpdate.action === 'fail' ? '*' : '(optional)'}
                                    </label>
                                    <textarea 
                                        class="form-control" 
                                        bind:value={statusUpdate.notes}
                                        required={statusUpdate.action === 'fail'}
                                        rows="3"
                                    ></textarea>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick={closeStatusModal}>Cancel</button>
                                <button 
                                    type="submit" 
                                    class="btn btn-danger me-2" 
                                    onclick={() => statusUpdate.action = 'fail'}
                                >
                                    Fail Candidate
                                </button>
                                <button 
                                    type="submit" 
                                    class="btn btn-success" 
                                    onclick={() => statusUpdate.action = 'pass'}
                                >
                                    {#if statusUpdate.currentStage === 'Interview'}
                                        Hire Candidate
                                    {:else}
                                        Pass to Next Stage
                                    {/if}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>
    :global(body.modal-open) {
        overflow: hidden;
        padding-right: 17px; /* Compensate for scrollbar */
    }

    .w-100px {
        width: 100px;
    }
    
    /* Add hover styles for progress and delete buttons */
    :global(.btn-status-update:hover) {
        opacity: 1 !important;
        background-color: var(--bs-btn-hover-bg, var(--bs-primary)) !important;
        color: white !important;
        border-color: var(--bs-btn-hover-border-color, var(--bs-primary)) !important;
        box-shadow: 0 0 0 0.25rem rgba(var(--bs-btn-hover-bg-rgb, 49, 132, 253), 0.25);
    }
    
    :global(.btn-outline-danger:hover) {
        background-color: var(--bs-danger);
        color: white;
    }

    .btn-group {
        flex-wrap: nowrap;
    }
    
    @media (max-width: 768px) {
        .d-flex.gap-3 {
            gap: 0.5rem !important;
        }
        
        .btn-group .btn {
            padding: 0.375rem 0.5rem;
            font-size: 0.875rem;
        }
    }

    .btn-light {
        background-color: #f8f9fa;
        border-color: #dee2e6;
    }
    
    .btn-light:hover {
        background-color: #e9ecef;
        border-color: #dee2e6;
    }
    
    .btn-group-sm .btn {
        font-size: 0.875rem;
        padding: 0.25rem 0.5rem;
    }
    
    .dropdown-menu {
        font-size: 0.875rem;
    }
    
    @media (max-width: 768px) {
        .d-flex.gap-2 {
            gap: 0.25rem !important;
        }
        
        .btn-group-sm .btn {
            padding: 0.2rem 0.4rem;
            font-size: 0.8125rem;
        }
        
        small.text-muted {
            font-size: 0.75rem;
        }
    }

    .btn-group .btn-outline-secondary.active {
        background-color: #6c757d;
        color: white;
        border-color: #6c757d;
    }
    
    .btn-group .btn-outline-secondary:hover {
        background-color: #6c757d;
        color: white;
        border-color: #6c757d;
    }
</style> 