import { json } from '@sveltejs/kit';
import { MongoClient } from 'mongodb';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

export async function GET() {
    if (building) {
        return json({
            status: 'skipped',
            message: 'Database connection test skipped during build'
        });
    }

    const uri = env.MONGODB_URI_PROD;
    
    // Debug log to check the URI
    console.log('Connection string type:', typeof uri);
    console.log('Connection string starts with:', uri?.substring(0, 14));

    if (!uri) {
        return json({
            status: 'error',
            message: 'MongoDB connection string not found in environment variables'
        }, { status: 500 });
    }

    let client = null;
    
    try {
        // Create a new client and connect
        client = new MongoClient(uri);
        await client.connect();
        
        // Try a simple command to verify the connection
        const db = client.db();
        await db.command({ ping: 1 });
        
        return json({
            status: 'success',
            message: 'Successfully connected to MongoDB Atlas!',
            database: db.databaseName
        });
    } catch (error) {
        console.error('MongoDB connection error:', error);
        return json({
            status: 'error',
            error: `Failed to connect: ${error.message}`,
            type: typeof uri,
            starts_with: uri?.substring(0, 14)
        }, { status: 500 });
    } finally {
        // Always close the connection
        if (client) {
            await client.close();
        }
    }
} 