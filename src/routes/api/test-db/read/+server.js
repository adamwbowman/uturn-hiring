import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/data/dbConn.js';

export async function GET({ url }) {
    try {
        const collectionName = url.searchParams.get('collection');
        const collection = await getCollection(collectionName);
        const documents = await collection.find().limit(10).toArray();
        return json(documents);
    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    }
} 