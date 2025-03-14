import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/data/dbConn';
import { ObjectId } from 'mongodb';

export async function GET({ params }) {
    try {
        const collection = await getCollection(params.resource);
        const items = await collection.find({}).toArray();
        return json(items);
    } catch (error) {
        console.error('Error:', error);
        return json({ error: error.message }, { status: 500 });
    }
}

export async function POST({ request, params }) {
    try {
        const collection = await getCollection(params.resource);
        const data = await request.json();
        const result = await collection.insertOne({
            ...data,
            createdAt: new Date()
        });
        return json(result, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH({ request, params }) {
    try {
        const collection = await getCollection(params.resource);
        const data = await request.json();
        const { _id, ...updateData } = data;

        const result = await collection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return json({ error: 'Category not found' }, { status: 404 });
        }

        return json({ message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        return json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE({ request, params }) {
    try {
        const collection = await getCollection(params.resource);
        const data = await request.json();
        const result = await collection.deleteOne({
            _id: new ObjectId(data.id)
        });

        if (result.deletedCount === 0) {
            return json({ error: `${params.resource} not found` }, { status: 404 });
        }
        return json(result, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return json({ error: error.message }, { status: 500 });
    }
}