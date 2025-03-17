<script>
    let { filters = [], selectedFilters = {}, showFilters = false } = $props();
    
    const dispatch = createEventDispatcher();
    
    function updateFilter(filterName, value) {
        dispatch('filterChange', { filterName, value });
    }
</script>

<div class="d-flex flex-column gap-2 mb-4">
    <div class="d-flex justify-content-between align-items-center">
        <div class="d-flex gap-2 align-items-center">
            <!-- Filters Toggle Button -->
            <button 
                type="button" 
                class="btn btn-outline-secondary d-flex align-items-center gap-1"
                onclick={() => showFilters = !showFilters}
            >
                Filters
                <i class="bi {showFilters ? 'bi-chevron-up' : 'bi-chevron-down'} ms-1"></i>
            </button>

            <!-- Status Filter -->
            {#if filters.some(f => f.type === 'status')}
                {@const statusFilter = filters.find(f => f.type === 'status')}
                <div class="btn-group" role="group" aria-label="Status filter">
                    {#each statusFilter.options as option}
                        {@const isActive = selectedFilters[statusFilter.name] === option.value}
                        <button 
                            type="button" 
                            class="btn btn-outline-secondary {isActive ? 'active' : ''}"
                            onclick={() => updateFilter(statusFilter.name, option.value)}
                        >
                            <i class="bi {option.icon} me-1"></i>
                            {option.label}
                        </button>
                    {/each}
                </div>
            {/if}
        </div>

        <slot name="actions"></slot>
    </div>

    <!-- Expanded Filters -->
    {#if showFilters}
        <div class="d-flex justify-content-between align-items-center" transition:slide>
            <div class="d-flex gap-2 flex-wrap align-items-center">
                <small class="text-muted me-1">Filter by:</small>
                
                {#each filters.filter(f => f.type !== 'status') as filter}
                    <div class="btn-group btn-group-sm">
                        <button 
                            type="button" 
                            class="btn btn-light dropdown-toggle" 
                            data-bs-toggle="dropdown" 
                            aria-expanded="false"
                        >
                            <i class="bi {filter.icon} me-1"></i>
                            {selectedFilters[filter.name] === 'All' ? filter.label : selectedFilters[filter.name]}
                        </button>
                        <ul class="dropdown-menu">
                            {#each filter.options as option}
                                <li>
                                    <button 
                                        class="dropdown-item {selectedFilters[filter.name] === option.value ? 'active' : ''}"
                                        onclick={() => updateFilter(filter.name, option.value)}
                                    >
                                        {option.label}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .btn-group .btn-outline-secondary.active {
        background-color: #6c757d;
        color: white;
        border-color: #6c757d;
    }
    
    .btn-group .btn-outline-secondary:hover {
        background-color: #6c757d;
        color: white;
        border-color: #6c757d;
    }
</style> 