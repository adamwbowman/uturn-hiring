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
    
    function toggleForm() {
        showForm = !showForm;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        
        // Convert requestedPay to number if not empty
        const candidateData = {
            ...newCandidate,
            requestedPay: newCandidate.requestedPay ? Number(newCandidate.requestedPay) : undefined
        };

        try {
            const response = await fetch('/api/candidates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(candidateData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create candidate');
            }
            
            // Reset form and hide it
            newCandidate = {
                name: '',
                email: '',
                source: '',
                sourceContact: '',
                position: '',
                requestedPay: ''
            };
            showForm = false;
            
            window.location.reload();
        } catch (error) {
            alert('Error creating candidate: ' + error.message);
        }
    }

    function confirmDelete(candidate) {
        candidateToDelete = candidate;
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
            const response = await fetch(`/api/candidates/${candidateToDelete._id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                closeModal();
                window.location.reload();
            } else {
                throw new Error('Failed to delete candidate');
            }
        } catch (error) {
            alert('Error deleting candidate: ' + error.message);
        }
    }

    function cancelForm() {
        showForm = false;
        newCandidate = {
            name: '',
            email: '',
            source: '',
            sourceContact: '',
            position: '',
            requestedPay: ''
        };
    }

    function formatCurrency(amount) {
        if (!amount) return '-';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    function getPayType(amount) {
        if (!amount) return '';
        return amount < 1000 ? '/hourly' : '/salary';
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
                                min="0"
                                step="1000"
                                placeholder="Annual salary"
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
                                    <button class="btn btn-sm {candidate.status === 'New' ? 'btn-info' : 'btn-secondary'}" disabled>
                                        {candidate.status}
                                    </button>
                                </td>
                                <td>
                                    <div>{candidate.name}</div>
                                    <div>
                                        <a href="mailto:{candidate.email}" class="text-muted small">
                                            {candidate.email}
                                        </a>
                                    </div>
                                </td>
                                <td>{candidate.position}</td>
                                <td>
                                    <!-- Empty Stage Map column -->
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
                                    <button 
                                        class="btn btn-sm btn-danger"
                                        onclick={() => confirmDelete(candidate)}
                                        aria-label={`Delete candidate: ${candidate.name}`}
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