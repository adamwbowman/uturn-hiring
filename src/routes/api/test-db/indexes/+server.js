import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/data/mongodb.js';

export async function GET() {
    try {
        const collection = await getCollection('positions');
        const indexes = await collection.indexes();
        return json({ indexes });
    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    }
} 