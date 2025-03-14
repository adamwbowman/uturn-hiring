import { json } from '@sveltejs/kit';
import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';
const dbName = 'sveltekit_db';

export async function GET() {
  let client = null;
  
  try {
    // Create a new client and connect
    client = new MongoClient(uri);
    await client.connect();
    
    // Try a simple command to verify the connection
    await client.db(dbName).command({ ping: 1 });
    
    return json({
      status: 'success',
      message: 'Successfully connected to MongoDB!'
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return json({
      status: 'error',
      error: `Failed to connect: ${error.message}`
    }, { status: 500 });
  } finally {
    // Always close the connection
    if (client) {
      await client.close();
    }
  }
}