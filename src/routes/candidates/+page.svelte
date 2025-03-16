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
        'New': { next: 'CV Review', color: 'info' },
        'CV Review': { next: 'Cultural Fit', color: 'warning' },
        'Cultural Fit': { next: 'Interview', color: 'warning' },
        'Interview': { next: 'Hired', color: 'warning' }
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
        const response = await fetch('/api/candidates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(candidateData)
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
        return statusFlow[status]?.color || 'secondary';
    }

    function openStatusModal(candidate) {
        selectedCandidate = candidate;
        statusUpdate = {
            action: 'pass',
            status: statusFlow[candidate.status]?.next || candidate.status,
            reviewer: '',
            notes: ''
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

        if (statusUpdate.status === 'Failed' && !statusUpdate.notes) {
            alert('Notes are required when failing a candidate');
            return;
        }
        
        try {
            if (!selectedCandidate?._id) {
                throw new Error('Invalid candidate ID');
            }

            await updateCandidateStatus(selectedCandidate._id, {
                status: statusUpdate.status,
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

        // For the current active stage, use its color from statusFlow
        if (candidateStatus === stage) return `btn-${getStatusColor(stage)}`;

        // If candidate is hired, all stages are green
        if (candidateStatus === 'Hired') return 'btn-success';

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
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Name/Email</th>
                            <th>Position</th>
                            <th>Stage Map</th>
                            <th>Source/Contact</th>
                            <th>Pay</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.candidates as candidate}
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center gap-2">
                                        <button 
                                            class="btn btn-sm btn-{getStatusColor(candidate.status)}" 
                                            disabled
                                        >
                                            {candidate.status}
                                        </button>
                                        {#if candidate.status !== 'Failed' && candidate.status !== 'Hired'}
                                            <button 
                                                class="btn btn-sm btn-{getStatusColor(candidate.status)}"
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
                                        <a href="mailto:{candidate.email}" class="text-muted small">
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
                                                style="min-width: 120px; font-size: 0.7rem; padding: 0.2rem 0.4rem;"
                                                title={stageData ? `Stage: ${stage}\nOutcome: ${stageData.status}\nReviewer: ${stageData.reviewer}\nDate: ${formatDate(stageData.updatedAt)}${stageData.notes ? '\nNotes: ' + stageData.notes : ''}` : ''}
                                                disabled
                                            >
                                                <div class="text-start">
                                                    <div class="fw-bold">{stage}</div>
                                                    {#if stageData}
                                                        <div class="small opacity-75">
                                                            <div>{stageData.status}</div>
                                                            <div>{formatDate(stageData.updatedAt)}</div>
                                                        </div>
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
                                <td>
                                    <div class="btn-group">
                                        <button 
                                            class="btn btn-sm btn-danger" 
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
                            Update Candidate Status
                        </h5>
                        <button type="button" class="btn-close" onclick={closeStatusModal}></button>
                    </div>
                    <form onsubmit={handleStatusUpdate}>
                        <div class="modal-body">
                            <!-- Stage Map -->
                            <div class="mb-4">
                                <div class="d-flex gap-1 flex-nowrap justify-content-center">
                                    {#each ['New', 'CV Review', 'Cultural Fit', 'Interview', 'Hired'] as stage}
                                        {@const stageData = selectedCandidate?.stages?.[stage]}
                                        <button 
                                            class="btn btn-sm {getStageButtonStyle(stage, selectedCandidate?.status, stageData)}"
                                            style="text-align: center; padding: 0.25rem 0.75rem; {stage === 'New' || stage === 'Hired' ? 'width: 65px;' : ''}"
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
                            <button type="button" class="btn btn-secondary" onclick={closeStatusModal}>
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                class="btn btn-danger me-2"
                                onclick={() => {
                                    statusUpdate.action = 'fail';
                                    statusUpdate.status = 'Failed';
                                }}
                            >
                                Fail
                            </button>
                            <button 
                                type="submit" 
                                class="btn btn-success"
                                onclick={() => {
                                    statusUpdate.action = 'pass';
                                    statusUpdate.status = statusFlow[selectedCandidate.status]?.next || selectedCandidate.status;
                                }}
                            >
                                Pass
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
</style> 