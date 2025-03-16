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

export async function PATCH({ params, request }) {
    try {
        console.log('Received PATCH request for candidate ID:', params.id); // Debug log
        
        const updateData = await request.json();
        console.log('Update payload:', updateData); // Debug log
        
        const { status, reviewer, notes, action } = updateData;
        
        // Validate status transition
        const validStatuses = ['New', 'CV Review', 'Cultural Fit', 'Interview', 'Hired', 'Failed'];
        if (!validStatuses.includes(status)) {
            console.error('Invalid status:', status); // Debug log
            return json({ error: 'Invalid status' }, { status: 400 });
        }
        
        // Validate required fields
        if (!reviewer) {
            console.error('Missing reviewer'); // Debug log
            return json({ error: 'Reviewer name is required' }, { status: 400 });
        }
        
        if (status === 'Failed' && !notes) {
            console.error('Missing notes for failed status'); // Debug log
            return json({ error: 'Notes are required when failing a candidate' }, { status: 400 });
        }

        // Validate ObjectId format
        if (!params.id.match(/^[0-9a-fA-F]{24}$/)) {
            console.error('Invalid ObjectId format:', params.id); // Debug log
            return json({ error: 'Invalid candidate ID format' }, { status: 400 });
        }
        
        const collection = await getCollection('candidates');

        // First check if the candidate exists
        const candidate = await collection.findOne({ _id: new ObjectId(params.id) });
        if (!candidate) {
            console.error('Candidate not found:', params.id); // Debug log
            return json({ error: 'Candidate not found' }, { status: 404 });
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
                [`stages.${candidate.status}`]: stageData // Record outcome for current stage
            }
        };
        
        console.log('Update operation:', update); // Debug log
        
        const result = await collection.updateOne(
            { _id: new ObjectId(params.id) },
            update
        );
        
        console.log('Update result:', result); // Debug log
        
        if (result.matchedCount === 0) {
            console.error('No document matched the ID:', params.id); // Debug log
            return json({ error: 'Candidate not found' }, { status: 404 });
        }
        
        if (result.modifiedCount === 0) {
            console.error('No modifications made to the document'); // Debug log
            return json({ error: 'No changes were made to the candidate' }, { status: 400 });
        }
        
        return json({ success: true });
    } catch (error) {
        console.error('Error updating candidate:', error); // Debug log
        return json({ 
            error: 'Failed to update candidate status',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
} 