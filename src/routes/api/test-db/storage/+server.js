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
        
        const stats = await db.command({ dbStats: 1 });
        const serverStatus = await db.command({ serverStatus: 1 });

        return json({
            dbSize: stats.dataSize,
            available: serverStatus.mem.available,
            collections: stats.collections,
            indexes: stats.indexes,
            avgObjSize: stats.avgObjSize
        });
    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    } finally {
        if (client) await client.close();
    }
} 