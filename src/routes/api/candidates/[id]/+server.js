import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/data/dbConn.js';
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
        // Validate ObjectId format
        if (!params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return json(
                { error: 'Invalid candidate ID format' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }

        const collection = await getCollection('candidates');
        const candidate = await collection.findOne({ _id: new ObjectId(params.id) });

        if (!candidate) {
            return json(
                { error: 'Candidate not found' },
                { 
                    status: 404,
                    headers: corsHeaders()
                }
            );
        }

        return json(candidate, { headers: corsHeaders() });
    } catch (error) {
        console.error('Error fetching candidate:', error);
        return json(
            { error: 'Failed to fetch candidate' },
            { 
                status: 500,
                headers: corsHeaders()
            }
        );
    }
}

export async function DELETE({ params }) {
    try {
        const collection = await getCollection('candidates');
        const result = await collection.deleteOne({ _id: new ObjectId(params.id) });
        
        if (result.deletedCount === 0) {
            return json(
                { error: 'Candidate not found' },
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
        return json(
            { error: 'Failed to delete candidate' },
            { 
                status: 500,
                headers: corsHeaders()
            }
        );
    }
}

export async function PATCH({ params, request }) {
    try {
        console.log('Received PATCH request for candidate ID:', params.id);
        
        const updateData = await request.json();
        console.log('Update payload:', updateData);
        
        const { status, reviewer, notes, action } = updateData;
        
        // Validate status transition
        const validStatuses = ['New', 'CV Review', 'Cultural Fit', 'Interview', 'Hired', 'Failed'];
        if (!validStatuses.includes(status)) {
            console.error('Invalid status:', status);
            return json(
                { error: 'Invalid status' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }
        
        // Validate required fields
        if (!reviewer) {
            console.error('Missing reviewer');
            return json(
                { error: 'Reviewer name is required' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }
        
        if (status === 'Failed' && !notes) {
            console.error('Missing notes for failed status');
            return json(
                { error: 'Notes are required when failing a candidate' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }

        // Validate ObjectId format
        if (!params.id.match(/^[0-9a-fA-F]{24}$/)) {
            console.error('Invalid ObjectId format:', params.id);
            return json(
                { error: 'Invalid candidate ID format' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }
        
        const collection = await getCollection('candidates');

        // First check if the candidate exists
        const candidate = await collection.findOne({ _id: new ObjectId(params.id) });
        if (!candidate) {
            console.error('Candidate not found:', params.id);
            return json(
                { error: 'Candidate not found' },
                { 
                    status: 404,
                    headers: corsHeaders()
                }
            );
        }

        console.log('Found candidate:', candidate);

        const stageData = {
            status: action === 'pass' ? 'Passed' : 'Failed',
            reviewer,
            notes: notes || '',
            updatedAt: new Date(),
            completed: true
        };

        const update = {
            $set: { 
                status,
                [`stages.${status}`]: stageData
            }
        };
        
        console.log('Update operation:', update);
        
        const result = await collection.updateOne(
            { _id: new ObjectId(params.id) },
            update
        );
        
        console.log('Update result:', result);
        
        if (result.matchedCount === 0) {
            console.error('No document matched the ID:', params.id);
            return json(
                { error: 'Candidate not found' },
                { 
                    status: 404,
                    headers: corsHeaders()
                }
            );
        }
        
        if (result.modifiedCount === 0) {
            console.error('No modifications made to the document');
            return json(
                { error: 'No changes were made to the candidate' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }
        
        return json(
            { success: true },
            { headers: corsHeaders() }
        );
    } catch (error) {
        console.error('Error updating candidate:', error);
        return json({ 
            error: 'Failed to update candidate status',
            details: error.message,
            stack: error.stack
        }, { 
            status: 500,
            headers: corsHeaders()
        });
    }
} 