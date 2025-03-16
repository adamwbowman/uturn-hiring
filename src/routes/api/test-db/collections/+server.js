import { json } from '@sveltejs/kit';
import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';
const dbName = 'sveltekit_db';

export async function GET() {
    let client = null;
    try {
        client = new MongoClient(uri);
        await client.connect();
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        return json({ collections });
    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    } finally {
        if (client) await client.close();
    }
} 