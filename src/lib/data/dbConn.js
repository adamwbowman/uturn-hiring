
import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';
const dbName = 'sveltekit_db';

let client;

export async function getCollection(collectionName) {
	if (!client) {
		client = new MongoClient(uri);
		await client.connect();
		console.log('✅ Connected to MongoDB');
	}
	return client.db(dbName).collection(collectionName);
}