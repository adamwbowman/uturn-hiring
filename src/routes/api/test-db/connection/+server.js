import { json } from '@sveltejs/kit';
import { MongoClient } from 'mongodb';
import { MONGODB_URI, MONGODB_DB } from '$env/static/private';

export async function GET() {
    let client = null;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db(MONGODB_DB);
        const buildInfo = await db.command({ buildInfo: 1 });

        return json({
            status: 'connected',
            database: MONGODB_DB,
            version: buildInfo.version
        });
    } catch (error) {
        return json({ 
            error: 'Failed to connect to database',
            details: error.message 
        }, { status: 500 });
    } finally {
        if (client) await client.close();
    }
} 