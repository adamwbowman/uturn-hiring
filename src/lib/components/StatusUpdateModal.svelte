<script>
    import { createEventDispatcher } from 'svelte';
    
    let { show = false, candidate, currentStage } = $props();
    const dispatch = createEventDispatcher();
    
    let statusUpdate = $state({
        reviewer: '',
        notes: '',
        action: ''
    });

    const stages = ['New', 'CV Review', 'Cultural Fit', 'Interview', 'Hired'];

    function close() {
        dispatch('close');
    }

    function handleSubmit(event) {
        event.preventDefault();
        
        if (!statusUpdate.reviewer.trim()) {
            alert('Reviewer name is required');
            return;
        }

        if (statusUpdate.action === 'fail' && !statusUpdate.notes) {
            alert('Notes are required when failing a candidate');
            return;
        }

        dispatch('submit', {
            ...statusUpdate,
            candidateId: candidate._id,
            currentStage
        });
    }

    function getStageButtonStyle(stage, candidateStatus, stageData) {
        if (stageData?.completed) {
            if (stageData.status === 'Failed') return 'btn-danger';
            if (stageData.status === 'Passed') return 'btn-success';
            if (stageData.status === 'Skipped') return 'btn-secondary';
        }

        if (stageData?.status === 'In Progress') {
            return 'btn-warning';
        }

        if (candidateStatus === stage) {
            return `btn-${statusFlow[stage]?.color || 'secondary'}`;
        }

        if (candidateStatus === 'Hired') return 'btn-success';
        if (candidateStatus === 'Failed' && stageData?.status === 'Failed') {
            return 'btn-danger';
        }

        return 'btn-outline-secondary';
    }
</script>

{#if show}
    <div class="modal show d-block" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Update Hiring Process</h5>
                    <button type="button" class="btn-close" onclick={close}></button>
                </div>
                <form onsubmit={handleSubmit}>
                    <div class="modal-body">
                        <!-- Hiring Process -->
                        <div class="mb-4">
                            <div class="d-flex gap-1 flex-nowrap justify-content-center">
                                {#each stages as stage}
                                    {@const stageData = candidate?.stages?.[stage]}
                                    <button 
                                        class="btn btn-sm {getStageButtonStyle(stage, candidate?.status, stageData)}"
                                        style="text-align: center; min-width: 85px; padding: 0.25rem 0.5rem;"
                                        disabled
                                    >
                                        {stage}
                                    </button>
                                {/each}
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Candidate: {candidate?.name}</label>
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
                        <button type="button" class="btn btn-secondary" onclick={close}>Cancel</button>
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
                            {#if currentStage === 'Interview'}
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

<style>
    .modal {
        background-color: rgba(0, 0, 0, 0.5);
    }
    
    :global(body.modal-open) {
        overflow: hidden;
        padding-right: 17px;
    }
</style> 