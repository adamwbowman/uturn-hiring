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
        
        const { status, stageStatus, currentStage, reviewer, notes, action } = updateData;
        
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
        
        // Validate current stage
        if (!validStatuses.includes(currentStage)) {
            console.error('Invalid current stage:', currentStage);
            return json(
                { error: 'Invalid current stage' },
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
        
        const candidateCollection = await getCollection('candidates');

        // First check if the candidate exists
        const candidate = await candidateCollection.findOne({ _id: new ObjectId(params.id) });
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

        // Create appropriate stage data based on the action
        const stageData = {
            status: stageStatus || (action === 'pass' ? 'Passed' : 'Failed'),
            reviewer,
            notes: notes || '',
            updatedAt: new Date(),
            completed: true
        };

        // Determine display status
        let displayStatus = status;
        if (['CV Review', 'Cultural Fit'].includes(status) && action === 'pass') {
            displayStatus = 'In Progress';
        } else if (currentStage === 'Interview' && action === 'pass') {
            // When passing Interview stage, set display status to "Hired"
            displayStatus = 'Hired';
        }

        // Create the update operation
        const update = {
            $set: { 
                status: displayStatus, // This sets the candidate's overall status
                [`stages.${currentStage}`]: stageData // This records the outcome for the current stage
            }
        };
        
        // Special case: When passing the Interview stage, automatically create a Hired record
        if (currentStage === 'Interview' && action === 'pass') {
            update.$set['stages.Hired'] = {
                status: 'Hired',
                reviewer: reviewer, // Use the same reviewer who passed the interview
                notes: '',
                updatedAt: new Date(),
                completed: true
            };
        }
        
        // If moving to a new stage and it's not Failed or Hired, initialize that stage as "In Progress"
        if (status !== 'Failed' && status !== 'Hired' && status !== currentStage) {
            update.$set[`stages.${status}`] = {
                status: 'In Progress',
                reviewer: 'System',
                notes: 'Stage started',
                updatedAt: new Date(),
                completed: false
            };
        }
        
        console.log('Update operation:', update);
        
        const result = await candidateCollection.updateOne(
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
        
        // If candidate is hired, update the position status to "closed"
        if (status === 'Hired') {
            try {
                console.log('Candidate hired, updating position status to closed');
                const positionCollection = await getCollection('positions');
                
                // Find the position by title
                const position = await positionCollection.findOne({ 
                    title: candidate.position, 
                    status: { $ne: 'closed' } // Only update if not already closed
                });
                
                if (position) {
                    console.log(`Closing position: ${position.title}`);
                    
                    await positionCollection.updateOne(
                        { _id: position._id },
                        { $set: { status: 'closed' } }
                    );
                    
                    console.log(`Position ${position.title} updated to closed`);
                }
            } catch (error) {
                console.error('Error updating position status:', error);
                // We still return success for the candidate update even if position update fails
            }
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