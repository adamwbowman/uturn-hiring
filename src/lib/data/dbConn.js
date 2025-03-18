import { MongoClient } from 'mongodb';
import { MONGODB_URI_PROD } from '$env/static/private';
import { building } from '$app/environment';

// Skip DB connection during build
if (building) {
	console.log('Skipping DB connection during build');
}

if (!MONGODB_URI_PROD && !building) {
	throw new Error('MongoDB connection string not found in environment variables');
}

let client;
let isConnecting = false;
let connectionPromise = null;

async function connect() {
	if (building) {
		console.log('Skipping DB connection during build');
		return null;
	}

	if (isConnecting) {
		return connectionPromise;
	}

	isConnecting = true;
	connectionPromise = new Promise(async (resolve, reject) => {
		try {
			client = new MongoClient(MONGODB_URI_PROD);
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