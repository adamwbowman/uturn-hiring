export async function load({ fetch }) {
    try {
        // Fetch candidates
        const candidatesResponse = await fetch('/api/candidates');
        const candidates = await candidatesResponse.json();

        // Fetch positions
        const positionsResponse = await fetch('/api/positions');
        const positions = await positionsResponse.json();
        
        // Filter for open positions only
        const openPositions = positions.filter(p => p.status === 'Open');

        return { 
            candidates,
            openPositions 
        };
    } catch (error) {
        return {
            candidates: [],
            openPositions: [],
            error: 'Failed to load data'
        };
    }
} 