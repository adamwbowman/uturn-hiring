<script>
    let { data } = $props();
    
    let showForm = $state(false);
    let newPosition = $state({
        title: '',
        department: 'Engineering',
        hiringManager: '',
        timeline: 'Q1'
    });
    
    const departments = [
        'Engineering',
        'Sales',
        'Management'
    ];
    
    const timelines = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    const stages = ['New', 'CV Review', 'Cultural Fit', 'Interview', 'Hired'];

    function getStageCount(position, stage) {
        if (stage === 'Hired') {
            // For Hired stage, count candidates where the Hired stage has status "Hired"
            return data.candidates.filter(c => 
                c.position === position.title && 
                c.stages?.Hired?.status === 'Hired'
            ).length;
        }
        
        // For other stages, use existing logic
        return data.candidates.filter(c => 
            c.position === position.title && 
            c.stages?.[stage]?.status && 
            ['In Progress', 'Failed'].includes(c.stages[stage].status)
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

    function cancelForm() {
        showForm = false;
        newPosition = {
            title: '',
            department: 'Engineering',
            hiringManager: '',
            timeline: 'Q1'
        };
    }

    // Replace confirmDelete and closeModal functions with direct delete function
    async function deletePosition(position) {
        try {
            const response = await fetch(`/api/positions/${position._id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                window.location.reload();
            } else {
                throw new Error('Failed to delete position');
            }
        } catch (error) {
            alert('Error deleting position: ' + error.message);
        }
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
                <table class="table position-table">
                    <tbody>
                        {#each data.positions as position}
                            <tr>
                                <td class="align-middle status-col">
                                    <button class="btn btn-sm {position.status.toLowerCase() === 'open' ? 'btn-success' : 'btn-danger'}" 
                                            style="width: 80px;" 
                                            disabled>
                                        {position.status.toLowerCase() === 'open' ? 'Open' : 'Closed'}
                                    </button>
                                </td>
                                <td class="align-middle dept-col">
                                    <button class="btn btn-sm btn-outline-secondary department-btn" disabled>
                                        {position.department}
                                    </button>
                                </td>
                                <td class="align-middle title-col">
                                    <div class="d-flex">
                                        <div class="fw-bold title-text">{position.title}</div>
                                        <div class="text-muted small ms-3 manager-text">{position.hiringManager}</div>
                                    </div>
                                </td>
                                <td class="align-middle text-end stage-col">
                                    <div class="d-flex gap-1 flex-nowrap justify-content-end">
                                        {#each stages as stage}
                                            {@const count = getStageCount(position, stage)}
                                            <button 
                                                class="btn btn-sm {getStageButtonStyle(count, stage, position)} stage-btn"
                                                disabled
                                            >
                                                {stage === 'Hired' ? 'Hired' : `${stage}: ${count}`}
                                            </button>
                                        {/each}
                                    </div>
                                </td>
                                <td class="align-middle action-col">
                                    <div class="d-flex">
                                        <button class="btn btn-sm btn-info me-2 text-white" disabled>
                                            {position.timeline}
                                        </button>
                                        <button 
                                            class="btn btn-sm btn-outline-danger hover-fill"
                                            onclick={() => deletePosition(position)}
                                            aria-label={`Delete position: ${position.title}`}
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
</div>

<style>
    :global(body.modal-open) {
        overflow: hidden;
        padding-right: 17px; /* Compensate for scrollbar */
    }

    .w-100px {
        width: 100px;
    }
    
    .hover-fill:hover {
        background-color: #dc3545;
        color: white;
    }
    
    .department-btn {
        width: 110px;
        text-align: center;
    }
    
    .stage-btn {
        font-size: 0.75rem;
        padding: 0.15rem 0.5rem;
        text-align: center;
        white-space: nowrap;
        line-height: 1.2;
    }
    
    .position-table {
        table-layout: fixed;
        width: 100%;
    }
    
    .status-col {
        width: 100px;
    }
    
    .dept-col {
        width: 120px;
    }
    
    .title-col {
        width: 40%;
    }
    
    .stage-col {
        width: 30%;
    }
    
    .action-col {
        width: 15%;
    }
    
    .title-text {
        width: 55%;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .manager-text {
        width: 45%;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style> 