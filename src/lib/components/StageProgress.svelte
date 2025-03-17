<script>
    let { stages = [], currentStage, stageData = {} } = $props();
    
    const statusFlow = {
        'New': { next: 'CV Review', color: 'info', display: 'New' },
        'CV Review': { next: 'Cultural Fit', color: 'warning', display: 'In Progress' },
        'Cultural Fit': { next: 'Interview', color: 'warning', display: 'In Progress' },
        'Interview': { next: 'Hired', color: 'warning', display: 'In Progress' },
        'Hired': { next: null, color: 'success', display: 'Hired' },
        'Failed': { next: null, color: 'danger', display: 'Failed' }
    };

    function getStageButtonStyle(stage, currentStatus, stageInfo) {
        // For stages that have been completed
        if (stageInfo?.completed || stageInfo?.status === 'Passed') {
            if (stageInfo.status === 'Failed') return 'btn-danger';
            if (stageInfo.status === 'Passed') return 'btn-success';
            if (stageInfo.status === 'Skipped') return 'btn-secondary';
        }

        // For stages that are "In Progress"
        if (stageInfo?.status === 'In Progress') {
            return 'btn-warning';
        }

        // For the current active stage
        if (currentStatus === stage) {
            return `btn-${statusFlow[stage]?.color || 'secondary'}`;
        }

        // If hired, all stages are green
        if (currentStatus === 'Hired') return 'btn-success';

        // If failed, show the stage they failed at as red
        if (currentStatus === 'Failed' && stageInfo && stageInfo.status === 'Failed') {
            return 'btn-danger';
        }

        // Future/incomplete stages
        return 'btn-outline-secondary';
    }

    function formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }
</script>

<div class="d-flex gap-2 flex-nowrap">
    {#each stages as stage}
        {@const stageInfo = stageData[stage]}
        <button 
            class="btn btn-sm {getStageButtonStyle(stage, currentStage, stageInfo)}"
            style="min-width: 100px;"
            title={stageInfo ? `Stage: ${stage}
Status: ${stageInfo.status}
Reviewer: ${stageInfo.reviewer}
Date: ${formatDate(stageInfo.updatedAt)}${stageInfo.notes ? '\nNotes: ' + stageInfo.notes : ''}` : ''}
            disabled
        >
            <div class="stage-content">
                <div class="stage-name">{stage}</div>
                {#if stageInfo}
                    {#if stageInfo.status === 'Passed' || stageInfo.status === 'Failed' || stageInfo.status === 'Hired'}
                        {#if stageInfo.updatedAt}
                            <div class="stage-date">
                                {formatDate(stageInfo.updatedAt)}
                            </div>
                        {/if}
                    {:else}
                        <div class="stage-status">
                            {stageInfo.status}
                        </div>
                        {#if stageInfo.status !== 'In Progress' && stageInfo.updatedAt}
                            <div class="stage-date">
                                {formatDate(stageInfo.updatedAt)}
                            </div>
                        {/if}
                    {/if}
                {/if}
            </div>
        </button>
    {/each}
</div>

<style>
    button {
        transition: all 0.2s ease-in-out;
        padding: 0.5rem 0.75rem;
    }
    
    button:hover {
        transform: translateY(-1px);
    }

    .stage-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
    }

    .stage-name {
        font-weight: 600;
        font-size: 0.875rem;
        line-height: 1.2;
    }

    .stage-status {
        font-size: 0.75rem;
        opacity: 0.9;
    }

    .stage-date {
        font-size: 0.7rem;
        opacity: 0.8;
    }

    /* Button state-specific styles */
    .btn-success .stage-date,
    .btn-danger .stage-date {
        color: rgba(255, 255, 255, 0.9);
    }

    .btn-outline-secondary .stage-date {
        color: #6c757d;
    }
</style> 