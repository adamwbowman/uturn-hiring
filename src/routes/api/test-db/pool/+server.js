import { json } from '@sveltejs/kit';
import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';

export async function GET() {
    let client = null;
    try {
        client = new MongoClient(uri);
        await client.connect();
        
        const serverStatus = await client.db('admin').command({ serverStatus: 1 });
        const connectionStats = serverStatus.connections;

        return json({
            active: connectionStats.current,
            available: connectionStats.available,
            max: connectionStats.totalCreated
        });
    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    } finally {
        if (client) await client.close();
    }
} 