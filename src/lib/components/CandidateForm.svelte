<script>
    import { createEventDispatcher } from 'svelte';
    
    let { positions = [], showForm = false } = $props();
    const dispatch = createEventDispatcher();
    
    let newCandidate = $state({
        name: '',
        email: '',
        source: '',
        sourceContact: '',
        position: '',
        requestedPay: ''
    });

    function resetForm() {
        newCandidate = {
            name: '',
            email: '',
            source: '',
            sourceContact: '',
            position: '',
            requestedPay: ''
        };
    }

    function handleSubmit(event) {
        event.preventDefault();
        
        const candidateData = {
            ...newCandidate,
            requestedPay: newCandidate.requestedPay ? Number(newCandidate.requestedPay) : undefined
        };

        dispatch('submit', candidateData);
        resetForm();
    }

    function handleCancel() {
        resetForm();
        dispatch('cancel');
    }
</script>

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
                    {#each positions as position}
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
                <button type="button" class="btn btn-secondary" onclick={handleCancel} style="min-width: 80px; white-space: nowrap;">
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