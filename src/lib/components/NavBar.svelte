
<script>
	import { page } from '$app/state';
    
	let activePage = $derived(page.url.pathname);
</script>



<nav class="navbar navbar-expand-lg navbar-light bg-white">
    <div class="container-fluid d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
            <a class="navbar-brand" href="/" data-sveltekit-preload-data="hover">Brand</a>
            {@render navMainBtn('Page', '/page', 'bi bi-plus-circle-dotted')}
        </div>
        <div class="btn-group">
            <button type="button" class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-gear"></i>&nbsp;
                Admin
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
                <!-- {@render navAdminBtn('Enter Income', '/admin/enter/income', 'bi bi-box-arrow-in-right')} -->
                <!-- <li><hr class="dropdown-divider"></li> -->
                <!-- {@render navAdminBtn('Edit Categories', '/admin/edit/categories', 'bi bi-pencil-square')} -->
            </ul>
        </div>
    </div>
</nav>

{#snippet navMainBtn(btnName, btnRoute, btnIcon)}
    <a 
        href={btnRoute}
        class="btn {activePage === btnRoute ? 'btn-secondary' : 'btn-outline-secondary'} me-2"
    >
        <i class={btnIcon}></i>&nbsp;
        {btnName}
    </a>
{/snippet}

{#snippet navAdminBtn(btnName, btnRoute, btnIcon)}
    <li>
        <a 
            href={btnRoute}
            class="dropdown-item {activePage === btnRoute ? 'active' : ''}"
        >
            <i class={btnIcon}></i>&nbsp;
            {btnName}
        </a>
    </li>
{/snippet}