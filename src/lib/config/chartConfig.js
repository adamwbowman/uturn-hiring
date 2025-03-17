export const chartColors = [
    { bg: 'rgba(40, 167, 69, 0.8)', border: 'rgb(40, 167, 69)' },    // green
    { bg: 'rgba(0, 123, 255, 0.8)', border: 'rgb(0, 123, 255)' },    // blue
    { bg: 'rgba(255, 193, 7, 0.8)', border: 'rgb(255, 193, 7)' },    // yellow
    { bg: 'rgba(220, 53, 69, 0.8)', border: 'rgb(220, 53, 69)' },    // red
    { bg: 'rgba(111, 66, 193, 0.8)', border: 'rgb(111, 66, 193)' }   // purple
];

export function getChartColors(count) {
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(chartColors[i % chartColors.length]);
    }
    return result;
}

export const barChartConfig = {
    type: 'bar',
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
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
};

export const doughnutChartConfig = {
    type: 'doughnut',
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
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
}; 