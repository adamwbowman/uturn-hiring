import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/data/dbConn.js';

export async function POST({ request }) {
    try {
        const { collection: collectionName, document } = await request.json();
        const collection = await getCollection(collectionName);
        const result = await collection.insertOne(document);
        return json({ success: true, id: result.insertedId });
    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    }
} 