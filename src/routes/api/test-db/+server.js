import { MongoClient } from 'mongodb';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { building } from '$app/environment';

async function testConnection(uri, environment) {
    if (building) {
        return {
            status: 'skipped',
            message: 'Database connection test skipped during build',
            environment
        };
    }

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
    const uri = env.MONGODB_URI || env.MONGODB_URI_PROD || (
        testEnv === 'prod' 
            ? null
            : 'mongodb://localhost:27017/uturn-hiring'
    );
    
    if (!uri && !building) {
        return json({
            status: 'error',
            message: 'MongoDB connection string not found in environment variables',
            environment: testEnv
        }, { status: 500 });
    }
    
    return json(await testConnection(uri, testEnv));
}