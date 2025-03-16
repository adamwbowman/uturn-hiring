import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';
const dbName = 'sveltekit_db';

let client;
let isConnecting = false;
let connectionPromise = null;

async function connect() {
	if (isConnecting) {
		return connectionPromise;
	}

	isConnecting = true;
	connectionPromise = new Promise(async (resolve, reject) => {
		try {
			client = new MongoClient(uri);
			await client.connect();
			console.log('✅ Connected to MongoDB');
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
	try {
		if (!client) {
			await connect();
		}
		
		// Test the connection
		await client.db(dbName).command({ ping: 1 });
		
		return client.db(dbName).collection(collectionName);
	} catch (error) {
		console.error('❌ MongoDB operation error:', error);
		// Reset client on error to force a new connection attempt
		client = null;
		throw error;
	}
}