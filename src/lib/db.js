import { MongoClient } from 'mongodb';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

// If we're building the app (e.g., during Vercel deployment),
// don't try to connect to MongoDB
if (building) {
    console.log('Building application, skipping MongoDB connection');
}

// Get MongoDB URIs from environment variables
const MONGODB_URI = env.MONGODB_URI || env.MONGODB_URI_PROD || (
    process.env.NODE_ENV === 'production' 
        ? null 
        : 'mongodb://localhost:27017/uturn-hiring'
);

if (!MONGODB_URI && !building) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

let client;
let clientPromise;

// Only create a client if we're not building and have a URI
if (!building && MONGODB_URI) {
    if (process.env.NODE_ENV === 'development') {
        // In development mode, use a global variable so that the value
        // is preserved across module reloads caused by HMR (Hot Module Replacement).
        if (!global._mongoClientPromise) {
            client = new MongoClient(MONGODB_URI);
            global._mongoClientPromise = client.connect();
        }
        clientPromise = global._mongoClientPromise;
    } else {
        // In production mode, it's best to not use a global variable.
        client = new MongoClient(MONGODB_URI);
        clientPromise = client.connect();
    }
}

export async function getCollection(collectionName) {
    if (building) {
        throw new Error('Cannot access database during build time');
    }
    const client = await clientPromise;
    const db = client.db();
    return db.collection(collectionName);
}

// Export the connection promise for use in other parts of the application
export default clientPromise; 