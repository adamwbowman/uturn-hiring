import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/data/mongodb.js';
import { ObjectId } from 'mongodb';

// Helper function for CORS headers
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Expose-Headers': 'Content-Type'
    };
}

export async function OPTIONS() {
    return new Response(null, {
        headers: {
            'Allow': 'GET, POST, PATCH, DELETE, OPTIONS',
            ...corsHeaders()
        }
    });
}

export async function GET({ params }) {
    try {
        if (!params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return json(
                { error: 'Invalid position ID format' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }

        const collection = await getCollection('positions');
        const position = await collection.findOne({ _id: new ObjectId(params.id) });

        if (!position) {
            return json(
                { error: 'Position not found' },
                { 
                    status: 404,
                    headers: corsHeaders()
                }
            );
        }

        return json(position, { headers: corsHeaders() });
    } catch (error) {
        console.error('Error fetching position:', error);
        return json(
            { error: 'Failed to fetch position' },
            { 
                status: 500,
                headers: corsHeaders()
            }
        );
    }
}

export async function DELETE({ params }) {
    try {
        const collection = await getCollection('positions');
        const result = await collection.deleteOne({ _id: new ObjectId(params.id) });
        return result.deletedCount === 0
            ? json(
                { error: 'Position not found' },
                { 
                    status: 404,
                    headers: corsHeaders()
                }
            )
            : json(
                { success: true },
                { headers: corsHeaders() }
            );
    } catch (error) {
        return json(
            { error: 'Failed to delete position' },
            { 
                status: 500,
                headers: corsHeaders()
            }
        );
    }
}

export async function PATCH({ params, request }) {
    try {
        if (!params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return json(
                { error: 'Invalid position ID format' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }

        const updateData = await request.json();
        const collection = await getCollection('positions');
        const result = await collection.updateOne(
            { _id: new ObjectId(params.id) },
            { $set: { status: updateData.status.toLowerCase() } }
        );

        if (result.matchedCount === 0) {
            return json(
                { error: 'Position not found' },
                { 
                    status: 404,
                    headers: corsHeaders()
                }
            );
        }

        return json(
            { success: true },
            { headers: corsHeaders() }
        );
    } catch (error) {
        console.error('Error updating position:', error);
        return json(
            { error: 'Failed to update position status' },
            { 
                status: 500,
                headers: corsHeaders()
            }
        );
    }
} 