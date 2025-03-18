import { MongoClient } from 'mongodb';
import { MONGODB_URI_DEV, MONGODB_URI_PROD } from '$env/static/private';

// Choose the appropriate connection URI based on environment
const MONGODB_URI = process.env.NODE_ENV === 'production' ? MONGODB_URI_PROD : MONGODB_URI_DEV;

if (!MONGODB_URI) {
    throw new Error('Please define the MongoDB environment variables inside .env');
}

let client;
let clientPromise;

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

export async function getCollection(collectionName) {
    const client = await clientPromise;
    const db = client.db(); // This will use the database specified in your connection string
    return db.collection(collectionName);
}

// Export the connection promise for use in other parts of the application
export default clientPromise; 