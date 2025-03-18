import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/data/mongodb.js';

// Helper function for CORS headers
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
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

export async function GET() {
    try {
        const collection = await getCollection('positions');
        const positions = await collection.find()
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .toArray();
        return json(positions, { headers: corsHeaders() });
    } catch (error) {
        return json(
            { error: 'Failed to fetch positions' },
            { 
                status: 500,
                headers: corsHeaders()
            }
        );
    }
}

export async function POST({ request }) {
    try {
        const position = await request.json();
        
        // Trim input fields
        const sanitizedPosition = {
            ...position,
            title: position.title?.trim(),
            hiringManager: position.hiringManager?.trim()
        };
        
        // Validate required fields
        if (!sanitizedPosition.title || !sanitizedPosition.department || !sanitizedPosition.hiringManager) {
            return json(
                { error: 'Missing required fields' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }

        // Validate field lengths
        if (sanitizedPosition.title.length > 100 || sanitizedPosition.hiringManager.length > 50) {
            return json(
                { error: 'Fields exceed maximum length' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }

        // Validate department
        const validDepartments = ['Engineering', 'Sales', 'Management'];
        if (!validDepartments.includes(sanitizedPosition.department)) {
            return json(
                { error: 'Invalid department' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }

        // Validate timeline
        const validTimelines = ['Q1', 'Q2', 'Q3', 'Q4'];
        if (!validTimelines.includes(sanitizedPosition.timeline)) {
            return json(
                { error: 'Invalid timeline' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }

        const collection = await getCollection('positions');
        const result = await collection.insertOne({
            ...sanitizedPosition,
            status: 'Open',
            createdAt: new Date()
        });

        return json(
            { success: true, id: result.insertedId },
            { headers: corsHeaders() }
        );
    } catch (error) {
        return json(
            { error: 'Failed to create position: ' + error.message },
            { 
                status: 500,
                headers: corsHeaders()
            }
        );
    }
} 