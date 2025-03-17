<script>
    import { onMount } from 'svelte';
    import { Chart, registerables } from 'chart.js';
    Chart.register(...registerables);

    let dashboardData = $state({
        overview: { totalCandidates: 0, totalPositions: 0, openPositions: 0, fillRate: 0 },
        candidatesByStage: [],
        positionsByDepartment: [],
        recentActivity: { candidates: [], positions: [] }
    });
    let loading = $state(true);
    let error = $state(null);
    let stagesChart;
    let departmentsChart;

    onMount(async () => {
        try {
            const response = await fetch('/api/dashboard');
            if (!response.ok) throw new Error('Failed to fetch dashboard data');
            const data = await response.json();
            
            // Ensure we have valid arrays for the charts
            data.candidatesByStage = data.candidatesByStage || [];
            data.positionsByDepartment = data.positionsByDepartment || [];
            
            dashboardData = data;
            
            // Initialize charts after data is loaded
            setTimeout(() => {
                initializeCharts();
            }, 0);
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    });

    function getChartColors(count) {
        const colors = [
            { bg: 'rgba(40, 167, 69, 0.8)', border: 'rgb(40, 167, 69)' },    // green
            { bg: 'rgba(0, 123, 255, 0.8)', border: 'rgb(0, 123, 255)' },    // blue
            { bg: 'rgba(255, 193, 7, 0.8)', border: 'rgb(255, 193, 7)' },    // yellow
            { bg: 'rgba(220, 53, 69, 0.8)', border: 'rgb(220, 53, 69)' },    // red
            { bg: 'rgba(111, 66, 193, 0.8)', border: 'rgb(111, 66, 193)' }   // purple
        ];

        // If we need more colors than we have, repeat the pattern
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    }

    function initializeCharts() {
        // Applications by Stage Chart
        const stagesCtx = document.getElementById('stagesChart');
        if (stagesCtx) {
            if (stagesChart) stagesChart.destroy();

            const stageLabels = dashboardData.candidatesByStage.map(s => s._id || 'Not Set');
            const stageData = dashboardData.candidatesByStage.map(s => s.count);
            const stageColors = getChartColors(stageLabels.length);

            stagesChart = new Chart(stagesCtx, {
                type: 'bar',
                data: {
                    labels: stageLabels,
                    datasets: [{
                        label: 'Candidates',
                        data: stageData,
                        backgroundColor: stageColors.map(c => c.bg),
                        borderColor: stageColors.map(c => c.border),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Candidates by Stage',
                            font: {
                                size: 16
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }

        // Positions by Department Chart
        const deptCtx = document.getElementById('departmentsChart');
        if (deptCtx) {
            if (departmentsChart) departmentsChart.destroy();

            const deptLabels = dashboardData.positionsByDepartment.map(d => d._id || 'Not Set');
            const deptData = dashboardData.positionsByDepartment.map(d => d.count);
            const deptColors = getChartColors(deptLabels.length);

            departmentsChart = new Chart(deptCtx, {
                type: 'doughnut',
                data: {
                    labels: deptLabels,
                    datasets: [{
                        data: deptData,
                        backgroundColor: deptColors.map(c => c.bg),
                        borderColor: deptColors.map(c => c.border),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Positions by Department',
                            font: {
                                size: 16
                            }
                        },
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 20
                            }
                        }
                    }
                }
            });
        }
    }
</script>

<svelte:head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
</svelte:head>

<div class="dashboard container py-4">
    {#if loading}
        <div class="d-flex justify-content-center align-items-center" style="height: 400px;">
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
        <!-- Stats Overview -->
        <div class="row g-4 mb-4">
            <div class="col-md-3">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex align-items-start mb-3">
                            <div class="stat-icon bg-primary bg-opacity-10 rounded p-3 me-3">
                                <i class="bi bi-people text-primary"></i>
                            </div>
                            <div>
                                <h6 class="card-subtitle text-muted">Total Applications</h6>
                                <h2 class="card-title mb-0">{dashboardData.overview.totalCandidates}</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex align-items-start mb-3">
                            <div class="stat-icon bg-success bg-opacity-10 rounded p-3 me-3">
                                <i class="bi bi-briefcase text-success"></i>
                            </div>
                            <div>
                                <h6 class="card-subtitle text-muted">Total Positions</h6>
                                <h2 class="card-title mb-0">{dashboardData.overview.totalPositions}</h2>
                                <small class="text-muted">{dashboardData.overview.openPositions} open</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex align-items-start mb-3">
                            <div class="stat-icon bg-info bg-opacity-10 rounded p-3 me-3">
                                <i class="bi bi-graph-up text-info"></i>
                            </div>
                            <div>
                                <h6 class="card-subtitle text-muted">Fill Rate</h6>
                                <h2 class="card-title mb-0">{dashboardData.overview.fillRate}%</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex align-items-start mb-3">
                            <div class="stat-icon bg-warning bg-opacity-10 rounded p-3 me-3">
                                <i class="bi bi-lightning text-warning"></i>
                            </div>
                            <div>
                                <h6 class="card-subtitle text-muted">Open Positions</h6>
                                <h2 class="card-title mb-0">{dashboardData.overview.openPositions}</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="row g-4 mb-4">
            <div class="col-md-8">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h5 class="card-title mb-0">
                                <i class="bi bi-bar-chart me-2"></i>
                                Candidates by Stage
                            </h5>
                        </div>
                        <div style="height: 400px;">
                            <canvas id="stagesChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h5 class="card-title mb-0">
                                <i class="bi bi-pie-chart me-2"></i>
                                Positions by Department
                            </h5>
                        </div>
                        <div style="height: 400px;">
                            <canvas id="departmentsChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="row g-4">
            <div class="col-md-6">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h5 class="card-title mb-0">
                                <i class="bi bi-clock-history me-2"></i>
                                Recent Candidates
                            </h5>
                        </div>
                        <div class="list-group list-group-flush">
                            {#each dashboardData.recentActivity.candidates as candidate}
                                <div class="list-group-item px-0">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="mb-1">
                                                <i class="bi bi-person me-2 text-muted"></i>
                                                {candidate.name}
                                            </h6>
                                            <small class="text-muted">
                                                <i class="bi bi-arrow-right me-1"></i>
                                                Stage: {candidate.stage || 'Not Set'}
                                            </small>
                                        </div>
                                        <span class="badge bg-primary">
                                            <i class="bi bi-check2 me-1"></i>
                                            {candidate.status || 'New'}
                                        </span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h5 class="card-title mb-0">
                                <i class="bi bi-briefcase me-2"></i>
                                Recent Positions
                            </h5>
                        </div>
                        <div class="list-group list-group-flush">
                            {#each dashboardData.recentActivity.positions as position}
                                <div class="list-group-item px-0">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="mb-1">
                                                <i class="bi bi-file-earmark-text me-2 text-muted"></i>
                                                {position.title}
                                            </h6>
                                            <small class="text-muted">
                                                <i class="bi bi-building me-1"></i>
                                                {position.department || 'No Department'}
                                            </small>
                                        </div>
                                        <span class="badge bg-success">
                                            <i class="bi bi-circle-fill me-1 fs-8"></i>
                                            {position.status || 'Open'}
                                        </span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .dashboard {
        animation: fadeIn 0.3s ease-in;
    }

    .card {
        transition: transform 0.2s ease-in-out;
    }

    .card:hover {
        transform: translateY(-2px);
    }

    .stat-icon {
        font-size: 1.5rem;
        width: 3rem;
        height: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .fs-8 {
        font-size: 0.5rem;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
