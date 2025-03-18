import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/data/mongodb.js';

export async function GET() {
    try {
        const collection = await getCollection('positions');
        
        // Test simple query
        const simpleStart = performance.now();
        await collection.find({}).limit(10).toArray();
        const simpleQuery = performance.now() - simpleStart;

        // Test indexed query
        const indexedStart = performance.now();
        await collection.find({ department: 'Engineering' }).limit(10).toArray();
        const indexedQuery = performance.now() - indexedStart;

        // Test aggregation
        const aggStart = performance.now();
        await collection.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } }
        ]).toArray();
        const aggregation = performance.now() - aggStart;

        return json({
            simpleQuery: simpleQuery.toFixed(2),
            indexedQuery: indexedQuery.toFixed(2),
            aggregation: aggregation.toFixed(2)
        });
    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    }
} 