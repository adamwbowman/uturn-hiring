import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/data/dbConn.js';
import { ObjectId } from 'mongodb';

export async function DELETE({ params }) {
    try {
        const collection = await getCollection('candidates');
        const result = await collection.deleteOne({ _id: new ObjectId(params.id) });
        
        if (result.deletedCount === 0) {
            return json({ error: 'Candidate not found' }, { status: 404 });
        }
        
        return json({ success: true });
    } catch (error) {
        return json({ error: 'Failed to delete candidate' }, { status: 500 });
    }
} 