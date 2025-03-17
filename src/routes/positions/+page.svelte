<script>
    import { onMount } from 'svelte';
    import { slide } from 'svelte/transition';
    
    let data = $state({
        positions: [],
        candidates: []
    });
    
    let showForm = $state(false);
    let showFilters = $state(false);
    let newPosition = $state({
        title: '',
        department: 'Engineering',
        hiringManager: '',
        timeline: 'Q1'
    });
    
    // Filter states
    let selectedDepartment = $state('All');
    let selectedStatus = $state('All');
    let selectedTimeline = $state('All');
    let loading = $state(true);
    let error = $state(null);
    let filteredPositions = $state([]);
    
    const departments = [
        'All',
        'Engineering',
        'Sales',
        'Management'
    ];
    
    const timelines = ['All', 'Q1', 'Q2', 'Q3', 'Q4'];
    const stages = ['New', 'CV Review', 'Cultural Fit', 'Interview', 'Hired'];
    const statuses = ['All', 'Open', 'Closed'];

    // Watch for changes in filters and data
    $effect(() => {
        if (!Array.isArray(data.positions)) {
            filteredPositions = [];
            return;
        }
        
        filteredPositions = data.positions.filter(position => {
            const matchesDepartment = selectedDepartment === 'All' || position.department === selectedDepartment;
            const matchesStatus = selectedStatus === 'All' || position.status?.toLowerCase() === selectedStatus.toLowerCase();
            const matchesTimeline = selectedTimeline === 'All' || position.timeline === selectedTimeline;
            return matchesDepartment && matchesStatus && matchesTimeline;
        });
    });

    onMount(async () => {
        try {
            const [positionsResponse, candidatesResponse] = await Promise.all([
                fetch('/api/positions'),
                fetch('/api/candidates')
            ]);
            
            if (!positionsResponse.ok) {
                const errorData = await positionsResponse.json();
                throw new Error(`Failed to fetch positions: ${errorData.error || positionsResponse.statusText}`);
            }
            if (!candidatesResponse.ok) {
                const errorData = await candidatesResponse.json();
                throw new Error(`Failed to fetch candidates: ${errorData.error || candidatesResponse.statusText}`);
            }
            
            const positions = await positionsResponse.json();
            const candidates = await candidatesResponse.json();
            
            if (!Array.isArray(positions)) {
                throw new Error('Positions data is not in the expected format');
            }
            
            // Update state
            data.positions = positions;
            data.candidates = candidates;
            filteredPositions = positions; // Initialize with all positions
            
        } catch (e) {
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
    <!-- Header with Filters and Add Button -->
    <div class="d-flex flex-column gap-2 mb-4">
        <div class="d-flex justify-content-between align-items-center">
            <!-- Status Filter -->
            <div class="d-flex gap-3">
                <button 
                    type="button" 
                    class="btn btn-outline-secondary"
                    onclick={() => showFilters = !showFilters}
                    class:active={showFilters}
                >
                    Filters
                    <i class="bi bi-chevron-down ms-1"></i>
                </button>

                <div class="btn-group" role="group" aria-label="Status filter">
                    {#each statuses as status}
                        <button 
                            type="button" 
                            class="btn {selectedStatus === status ? 'btn-secondary' : 'btn-outline-secondary'}"
                            onclick={() => selectedStatus = status}
                        >
                            <i class="bi {status === 'Open' ? 'bi-circle' : status === 'Closed' ? 'bi-x-circle' : 'bi-three-dots'} me-1"></i>
                            {status}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Add Position Button -->
            <button 
                type="button" 
                class="btn btn-primary" 
                onclick={() => showForm = true}
                disabled={showForm}
            >
                <i class="bi bi-plus"></i> Add Position
            </button>
        </div>

        <!-- Second Line Filters -->
        {#if showFilters}
        <div class="d-flex gap-2 align-items-center" transition:slide>
            <small class="text-muted">Filter by:</small>
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

            <!-- Timeline Filter -->
            <div class="btn-group btn-group-sm">
                <button type="button" class="btn btn-light dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-calendar me-1"></i>
                    {selectedTimeline === 'All' ? 'Timeline' : selectedTimeline}
                </button>
                <ul class="dropdown-menu">
                    {#each timelines as timeline}
                        <li>
                            <button 
                                class="dropdown-item {selectedTimeline === timeline ? 'active' : ''}"
                                onclick={() => selectedTimeline = timeline}
                            >
                                {timeline}
                            </button>
                        </li>
                    {/each}
                </ul>
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
                    <form id="positionForm" onsubmit={handleSubmit} class="mb-4" transition:slide>
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
                    <!-- Results Count -->
                    <div class="text-end mb-2">
                        <small class="text-muted">
                            Showing {filteredPositions.length} of {data.positions.length} positions
                        </small>
                    </div>

                    {#if data.positions.length === 0}
                        <div class="text-center py-5 text-muted">
                            <i class="bi bi-inbox-fill fs-1 mb-3 d-block"></i>
                            No positions found
                        </div>
                    {:else}
                        <table class="table position-table">
                            <tbody>
                                {#each filteredPositions as position}
                                    <tr>
                                        <td class="align-middle status-col">
                                            <button class="btn btn-sm {position.status?.toLowerCase() === 'open' ? 'btn-success' : 'btn-danger'}" 
                                                    style="width: 80px;" 
                                                    disabled>
                                                {position.status?.toLowerCase() === 'open' ? 'Open' : 'Closed'}
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
                    {/if}
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