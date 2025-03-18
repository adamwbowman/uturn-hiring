import { MongoClient } from 'mongodb';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

// Skip DB connection during build
if (building) {
    console.log('Skipping DB connection during build');
}

let client;
let isConnecting = false;
let connectionPromise = null;

async function connect() {
    if (building) {
        console.log('Skipping DB connection during build');
        return null;
    }

    // Get the connection string from environment variables
    const uri = env.MONGODB_URI_PROD;
    if (!uri) {
        throw new Error('MongoDB connection string not found in environment variables');
    }

    if (isConnecting) {
        return connectionPromise;
    }

    isConnecting = true;
    connectionPromise = new Promise(async (resolve, reject) => {
        try {
            client = new MongoClient(uri);
            await client.connect();
            console.log('✅ Connected to MongoDB Atlas');
            isConnecting = false;
            resolve(client);
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            isConnecting = false;
            client = null;
            reject(error);
        }
    });

    return connectionPromise;
}

export async function getCollection(collectionName) {
    if (building) {
        console.log('Skipping DB operation during build');
        return null;
    }

    try {
        if (!client) {
            await connect();
        }
        
        if (!client) {
            throw new Error('No MongoDB connection available');
        }
        
        // Test the connection
        const db = client.db();
        await db.command({ ping: 1 });
        
        return db.collection(collectionName);
    } catch (error) {
        console.error('❌ MongoDB operation error:', error);
        // Reset client on error to force a new connection attempt
        client = null;
        throw error;
    }
} 