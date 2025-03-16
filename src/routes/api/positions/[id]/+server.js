import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/data/dbConn.js';
import { ObjectId } from 'mongodb';

export async function DELETE({ params }) {
    try {
        const collection = await getCollection('positions');
        const result = await collection.deleteOne({ _id: new ObjectId(params.id) });
        return result.deletedCount === 0
            ? json({ error: 'Position not found' }, { status: 404 })
            : json({ success: true });
    } catch (error) {
        return json({ error: 'Failed to delete position' }, { status: 500 });
    }
}

export async function PATCH({ params, request }) {
    try {
        if (!params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return json({ error: 'Invalid position ID format' }, { status: 400 });
        }

        const updateData = await request.json();
        const collection = await getCollection('positions');
        const result = await collection.updateOne(
            { _id: new ObjectId(params.id) },
            { $set: { status: updateData.status.toLowerCase() } }
        );

        if (result.matchedCount === 0) {
            return json({ error: 'Position not found' }, { status: 404 });
        }

        return json({ success: true });
    } catch (error) {
        console.error('Error updating position:', error);
        return json({ error: 'Failed to update position status' }, { status: 500 });
    }
} 