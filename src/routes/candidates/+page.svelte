<script>
    let { data } = $props();
    
    let showForm = $state(false);
    let newCandidate = $state({
        name: '',
        email: '',
        source: '',
        sourceContact: '',
        position: '',
        requestedPay: ''
    });
    
    // Add state for delete confirmation
    let showDeleteModal = $state(false);
    let candidateToDelete = $state(null);
    let modalBackdrop = $state(false);

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

    async function deleteCandidate(candidateId) {
        const response = await fetch(`/api/candidates/${candidateId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete candidate');
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

    function toggleModal(show) {
        modalBackdrop = show;
        if (show) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
    }

    function confirmDelete(candidate) {
        candidateToDelete = candidate;
        showDeleteModal = true;
        toggleModal(true);
    }
    
    function closeModal() {
        showDeleteModal = false;
        toggleModal(false);
    }
    
    async function handleDelete() {
        try {
            await deleteCandidate(candidateToDelete._id);
            closeModal();
            window.location.reload();
        } catch (error) {
            alert('Error deleting candidate: ' + error.message);
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
        toggleModal(true);
    }

    function closeStatusModal() {
        showStatusModal = false;
        toggleModal(false);
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
        const position = data.openPositions.find(p => p.title === positionTitle);
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
    <!-- Add Candidate Button -->
    <div class="d-flex justify-content-end mb-3">
        <button 
            type="button" 
            class="btn btn-primary" 
            onclick={() => showForm = true}
            disabled={showForm}
        >
            <i class="bi bi-plus"></i> Add Candidate
        </button>
    </div>

    <!-- Combined Card for Form and Table -->
    <div class="card">
        <div class="card-body">
            <!-- Form -->
            {#if showForm}
                <form id="candidateForm" onsubmit={handleSubmit} class="mb-4">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label for="position" class="form-label">Position</label>
                            <select 
                                class="form-select" 
                                id="position"
                                bind:value={newCandidate.position}
                                required
                            >
                                <option value="">Select a position...</option>
                                {#each data.openPositions as position}
                                    <option value={position.title}>{position.title} - {position.department}</option>
                                {/each}
                            </select>
                        </div>

                        <div class="col-md-4">
                            <label for="name" class="form-label">Name</label>
                            <input 
                                type="text" 
                                class="form-control" 
                                id="name"
                                bind:value={newCandidate.name}
                                required
                            >
                        </div>

                        <div class="col-md-4">
                            <label for="email" class="form-label">Email</label>
                            <input 
                                type="email" 
                                class="form-control" 
                                id="email"
                                bind:value={newCandidate.email}
                                required
                            >
                        </div>
                        
                        <div class="col-md-2">
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

                        <div class="col-md-3">
                            <label for="sourceContact" class="form-label">Source Contact</label>
                            <input 
                                type="text" 
                                class="form-control" 
                                id="sourceContact"
                                bind:value={newCandidate.sourceContact}
                                placeholder="Name or contact info"
                            >
                        </div>
                        
                        <div class="col-md-3">
                            <label for="requestedPay" class="form-label">Requested Pay ($)</label>
                            <input 
                                type="number" 
                                class="form-control" 
                                id="requestedPay"
                                bind:value={newCandidate.requestedPay}
                                placeholder="Enter amount"
                            >
                        </div>

                        <div class="col-md-2 d-flex align-items-end">
                            <button type="button" class="btn btn-secondary w-100" onclick={cancelForm}>
                                Cancel
                            </button>
                        </div>

                        <div class="col-md-2 d-flex align-items-end">
                            <button type="submit" class="btn btn-success w-100">
                                Add
                            </button>
                        </div>
                    </div>
                </form>
            {/if}

            <!-- Table -->
            <div class="table-responsive">
                <table class="table">
                    <tbody>
                        {#each data.candidates as candidate}
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
                                            class="btn btn-sm btn-outline-danger" 
                                            onclick={() => confirmDelete(candidate)}
                                            title="Delete candidate"
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
        {#if modalBackdrop}
            <div class="modal-backdrop show"></div>
        {/if}
    {/if}

    <!-- Delete Confirmation Modal -->
    {#if showDeleteModal}
        <div class="modal d-block" tabindex="-1">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Confirm Delete</h5>
                    <button 
                        type="button" 
                        class="btn-close" 
                        onclick={closeModal}
                        aria-label="Close modal"
                    ></button>
                </div>
                <div class="modal-body">
                    Are you sure you want to delete the candidate: 
                    <strong>{candidateToDelete?.name}</strong>?
                </div>
                <div class="modal-footer">
                    <button 
                        type="button" 
                        class="btn btn-secondary" 
                        onclick={closeModal}
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        class="btn btn-danger" 
                        onclick={handleDelete}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
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
</style> 