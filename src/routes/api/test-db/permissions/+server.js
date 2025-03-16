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
        
        // Test read permission
        const canRead = await db.collection('positions').find().limit(1).hasNext();
        
        // Test write permission
        let canWrite = false;
        try {
            await db.collection('_test_write').insertOne({ test: true });
            await db.collection('_test_write').deleteOne({ test: true });
            canWrite = true;
        } catch (e) {
            canWrite = false;
        }
        
        // Test admin permission
        let isAdmin = false;
        try {
            await db.command({ buildInfo: 1 });
            isAdmin = true;
        } catch (e) {
            isAdmin = false;
        }

        return json({
            canRead,
            canWrite,
            isAdmin
        });
    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    } finally {
        if (client) await client.close();
    }
} 