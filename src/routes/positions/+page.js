export async function load({ fetch }) {
    try {
        const [positionsResponse, candidatesResponse] = await Promise.all([
            fetch('/api/positions'),
            fetch('/api/candidates')
        ]);
        
        const positions = await positionsResponse.json();
        const candidates = await candidatesResponse.json();
        
        return { 
            positions,
            candidates 
        };
    } catch (error) {
        return {
            positions: [],
            candidates: [],
            error: 'Failed to load data'
        };
    }
} 