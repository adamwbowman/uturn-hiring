<script>
    let { data } = $props();
    
    let showForm = $state(false);
    let newPosition = $state({
        title: '',
        department: 'Engineering',
        hiringManager: '',
        timeline: 'Q1'
    });
    
    // Add state for delete confirmation
    let showDeleteModal = $state(false);
    let positionToDelete = $state(null);
    
    // Add this for modal handling
    let modalBackdrop = $state(false);
    
    const departments = [
        'Engineering',
        'Sales',
        'Management'
    ];
    
    const timelines = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    const stages = ['New', 'CV Review', 'Cultural Fit', 'Interview', 'Hired'];

    function getStageCount(position, stage) {
        return data.candidates.filter(c => 
            c.position === position.title && 
            (c.status === stage || // Current stage
             (c.status === 'Failed' && c.stages?.[stage]?.status === 'Failed')) // Failed at this stage
        ).length;
    }

    function getStageButtonStyle(count, stage, position) {
        const hiredCount = getStageCount(position, 'Hired');
        
        // If there's one or more hires, all other stages should be gray
        if (hiredCount >= 1 && stage !== 'Hired') {
            return 'btn-outline-secondary';
        }
        
        // Show success for hired candidates
        if (stage === 'Hired' && count > 0) return 'btn-success';
        
        // Default states
        if (count === 0) return 'btn-outline-secondary';
        return 'btn-warning';
    }

    async function updatePositionStatus(position) {
        const hiredCount = getStageCount(position, 'Hired');
        if (hiredCount >= 1 && position.status.toLowerCase() !== 'closed') {
            try {
                if (!position._id) return;
                
                const response = await fetch(`/api/positions/${position._id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'closed' })
                });

                if (!response.ok) {
                    throw new Error('Failed to update position status');
                }

                window.location.reload();
            } catch (error) {
                console.error('Error updating position:', error);
            }
        }
    }

    // Simplify the status check function
    function checkPositionStatuses() {
        data.positions?.forEach(updatePositionStatus);
    }

    $effect(() => {
        checkPositionStatuses();
    });

    // Replace console.log with $inspect for state debugging
    $inspect(newPosition);

    function toggleForm() {
        showForm = !showForm;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        try {
            const response = await fetch('/api/positions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newPosition,
                    status: 'open'
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create position');
            }
            
            // Reset form and hide it
            newPosition = {
                title: '',
                department: 'Engineering',
                hiringManager: '',
                timeline: 'Q1'
            };
            showForm = false;
            
            window.location.reload();
        } catch (error) {
            alert('Error creating position: ' + error.message);
        }
    }

    function confirmDelete(position) {
        positionToDelete = position;
        showDeleteModal = true;
        modalBackdrop = true;
        document.body.classList.add('modal-open');
    }
    
    function closeModal() {
        showDeleteModal = false;
        modalBackdrop = false;
        document.body.classList.remove('modal-open');
    }
    
    async function handleDelete() {
        try {
            const response = await fetch(`/api/positions/${positionToDelete._id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                closeModal();
                window.location.reload();
            } else {
                throw new Error('Failed to delete position');
            }
        } catch (error) {
            alert('Error deleting position: ' + error.message);
        }
    }

    function cancelForm() {
        showForm = false;
        newPosition = {
            title: '',
            department: 'Engineering',
            hiringManager: '',
            timeline: 'Q1'
        };
    }
</script>

<div class="container mt-4">
    <!-- Add Position Button -->
    <div class="d-flex justify-content-end mb-3">
        <button 
            type="button" 
            class="btn btn-primary" 
            onclick={() => showForm = true}
            disabled={showForm}
        >
            <i class="bi bi-plus"></i> Add Position
        </button>
    </div>

    <!-- Combined Card for Form and Table -->
    <div class="card">
        <div class="card-body">
            <!-- Form -->
            {#if showForm}
                <form id="positionForm" onsubmit={handleSubmit} class="mb-4">
                    <div class="row g-3">
                        <div class="col">
                            <label for="department" class="form-label">Department</label>
                            <select 
                                class="form-select" 
                                id="department"
                                bind:value={newPosition.department}
                                required
                            >
                                {#each departments as dept}
                                    <option value={dept}>{dept}</option>
                                {/each}
                            </select>
                        </div>

                        <div class="col">
                            <label for="title" class="form-label">Title</label>
                            <input 
                                type="text" 
                                class="form-control" 
                                id="title"
                                bind:value={newPosition.title}
                                required
                            >
                        </div>
                        
                        <div class="col">
                            <label for="hiringManager" class="form-label">Hiring Manager</label>
                            <input 
                                type="text" 
                                class="form-control" 
                                id="hiringManager"
                                bind:value={newPosition.hiringManager}
                                required
                            >
                        </div>
                        
                        <div class="col-2">
                            <label for="timeline" class="form-label">Timeline</label>
                            <select 
                                class="form-select" 
                                id="timeline"
                                bind:value={newPosition.timeline}
                                required
                            >
                                {#each timelines as quarter}
                                    <option value={quarter}>{quarter}</option>
                                {/each}
                            </select>
                        </div>

                        <div class="col-auto d-flex align-items-end gap-2">
                            <button type="button" class="btn btn-secondary w-100px" onclick={cancelForm}>
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-success w-100px">
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
                            <th>Department</th>
                            <th>Title</th>
                            <th>Hiring Manager</th>
                            <th>Stage Map</th>
                            <th>Timeline</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.positions as position}
                            <tr>
                                <td>
                                    <button class="btn btn-sm {position.status.toLowerCase() === 'open' ? 'btn-success' : 'btn-secondary'}" disabled>
                                        {position.status.toLowerCase() === 'open' ? 'Open' : 'Closed'}
                                    </button>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-secondary" disabled>
                                        {position.department}
                                    </button>
                                </td>
                                <td>{position.title}</td>
                                <td>{position.hiringManager}</td>
                                <td>
                                    <div class="d-flex gap-1 flex-nowrap">
                                        {#each stages as stage}
                                            {@const count = getStageCount(position, stage)}
                                            <button 
                                                class="btn btn-sm {getStageButtonStyle(count, stage, position)}"
                                                style="text-align: center; padding: 0.25rem 0.75rem; {stage === 'New' || stage === 'Hired' ? 'width: 65px;' : ''}"
                                                disabled
                                            >
                                                <div class="fw-bold">{stage}</div>
                                                <div class="small">{count}</div>
                                            </button>
                                        {/each}
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-secondary" disabled>
                                        {position.timeline}
                                    </button>
                                </td>
                                <td>
                                    <button 
                                        class="btn btn-sm btn-danger"
                                        onclick={() => confirmDelete(position)}
                                        aria-label={`Delete position: ${position.title}`}
                                    >
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    {#if showDeleteModal}
        <div class="modal d-block" tabindex="-1">
            <div class="modal-dialog">
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
                        Are you sure you want to delete the position: 
                        <strong>{positionToDelete?.title}</strong>?
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
        </div>
        {#if modalBackdrop}
            <div class="modal-backdrop show"></div>
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
</style> 