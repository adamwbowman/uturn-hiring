export async function load({ fetch }) {
    try {
        const response = await fetch('/api/positions');
        const positions = await response.json();
        return { positions };
    } catch (error) {
        return {
            positions: [],
            error: 'Failed to load positions'
        };
    }
} 