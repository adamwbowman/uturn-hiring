import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/data/dbConn.js';

export async function GET() {
    try {
        const collection = await getCollection('positions');
        const positions = await collection.find()
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .toArray();
        return json(positions);
    } catch (error) {
        return json({ error: 'Failed to fetch positions' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const position = await request.json();
        
        // Validate required fields
        if (!position.title || !position.department || !position.hiringManager) {
            return json({ 
                error: 'Missing required fields' 
            }, { status: 400 });
        }

        const collection = await getCollection('positions');
        const result = await collection.insertOne({
            ...position,
            status: 'Open',  // Capitalized
            createdAt: new Date()
        });

        if (!result.acknowledged) {
            return json({ 
                error: 'Failed to create position' 
            }, { status: 500 });
        }

        return json({ 
            success: true, 
            id: result.insertedId 
        });
    } catch (error) {
        console.error('Error creating position:', error);
        return json({ 
            error: 'Failed to create position: ' + error.message 
        }, { status: 500 });
    }
} 