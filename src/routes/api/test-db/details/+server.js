import { json } from '@sveltejs/kit';
import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';
const dbName = 'sveltekit_db';

export async function GET() {
  let client = null;
  
  try {
    // Start timing the connection
    const connectStart = performance.now();
    
    // Create a new client and connect
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    
    // 1. Connection Details - Get server info
    const pingStart = performance.now();
    const serverInfo = await db.command({ ping: 1 });
    const pingEnd = performance.now();
    const pingTime = pingEnd - pingStart;
    
    const buildInfo = await db.command({ buildInfo: 1 });
    const serverStatus = await db.command({ serverStatus: 1 });
    
    // 2. Collections Listing - Get all collections
    const collections = await db.listCollections().toArray();
    const collectionDetails = [];
    
    // Query time measurement
    let queryTime = 0;
    
    // Get details for each collection
    for (const collection of collections) {
      const coll = db.collection(collection.name);
      
      const queryStart = performance.now();
      const count = await coll.countDocuments();
      const queryEnd = performance.now();
      
      // Use the first collection's query time as our sample
      if (collectionDetails.length === 0) {
        queryTime = queryEnd - queryStart;
      }
      
      const stats = await db.command({ collStats: collection.name });
      
      collectionDetails.push({
        name: collection.name,
        count: count,
        size: stats.size,
        storageSize: stats.storageSize,
        indexSize: stats.totalIndexSize
      });
    }
    
    // 3. Database Stats
    const dbStats = await db.command({ dbStats: 1 });
    
    // 4. Prepare the response
    const endTime = performance.now();
    const totalTime = endTime - connectStart;
    
    return json({
      status: 'success',
      message: 'Successfully connected to MongoDB!',
      details: {
        version: buildInfo.version,
        databaseName: dbName,
        connectionString: uri.replace(/:\/\/(.+?):(.+?)@/, '://***:***@'), // Hide credentials
        serverInfo: {
          host: serverStatus.host,
          port: serverStatus.port || 27017,
          uptime: serverStatus.uptime,
          process: serverStatus.process
        },
        collections: collectionDetails,
        stats: {
          dataSize: dbStats.dataSize,
          storageSize: dbStats.storageSize,
          indexSize: dbStats.indexSize,
          collections: dbStats.collections,
          views: dbStats.views,
          indexes: dbStats.indexes,
          objects: dbStats.objects
        }
      },
      metrics: {
        totalTime: totalTime,
        pingTime: pingTime,
        queryTime: queryTime
      }
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