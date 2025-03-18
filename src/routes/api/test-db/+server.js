import { MongoClient } from 'mongodb';
import { MONGODB_URI_DEV, MONGODB_URI_PROD } from '$env/static/private';
import { json } from '@sveltejs/kit';

async function testConnection(uri, environment) {
    console.log(`Testing ${environment} connection...`);
    
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db();
        await db.command({ ping: 1 });
        console.log(`Connected to database: ${db.databaseName}`);
        
        return {
            status: 'success',
            message: 'Successfully connected to MongoDB',
            connection: {
                database: db.databaseName,
                environment
            }
        };
    } catch (error) {
        console.error(`${environment} connection error:`, error);
        return {
            status: 'error',
            message: error.message,
            environment,
            details: error.code ? {
                code: error.code,
                codeName: error.codeName
            } : undefined
        };
    } finally {
        await client.close();
    }
}

export async function GET({ url }) {
    const testEnv = url.searchParams.get('env') || 'prod';
    const uri = testEnv === 'prod' ? MONGODB_URI_PROD : MONGODB_URI_DEV;
    
    return json(await testConnection(uri, testEnv));
}