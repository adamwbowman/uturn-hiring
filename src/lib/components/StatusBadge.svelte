<script>
    let { status, size = 'md', showIcon = true } = $props();
    
    const statusConfig = {
        'New': { color: 'info', icon: 'bi-star' },
        'In Progress': { color: 'warning', icon: 'bi-arrow-repeat' },
        'Hired': { color: 'success', icon: 'bi-check-circle' },
        'Failed': { color: 'danger', icon: 'bi-x-circle' },
        'Open': { color: 'success', icon: 'bi-circle' },
        'Closed': { color: 'danger', icon: 'bi-x-circle' }
    };

    let badgeClass = $derived(() => {
        const config = statusConfig[status] || { color: 'secondary', icon: 'bi-circle' };
        return `btn btn-${size} btn-${config.color}`;
    });

    let iconClass = $derived(() => {
        const config = statusConfig[status] || { color: 'secondary', icon: 'bi-circle' };
        return `bi ${config.icon}`;
    });
</script>

<button class={badgeClass} style="min-width: 80px; white-space: nowrap;" disabled>
    {#if showIcon}
        <i class={iconClass} style="margin-right: 4px;"></i>
    {/if}
    {status}
</button>

<style>
    button {
        font-size: var(--status-badge-font-size, 0.875rem);
        padding: var(--status-badge-padding, 0.25rem 0.5rem);
    }
</style> 