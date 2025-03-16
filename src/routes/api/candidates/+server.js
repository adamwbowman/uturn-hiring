import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/data/dbConn.js';

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

// Migration function to update existing candidates
async function migrateExistingCandidates(collection) {
    try {
        // Find all candidates without stages field
        const result = await collection.updateMany(
            { stages: { $exists: false } },
            {
                $set: {
                    stages: {
                        'New': {
                            status: 'In Progress',
                            reviewer: 'System',
                            notes: 'Initial status',
                            updatedAt: new Date(),
                            completed: false
                        }
                    }
                }
            }
        );
        
        console.log(`Updated ${result.modifiedCount} candidates with stages field`);
    } catch (error) {
        console.error('Migration error:', error);
    }
}

export async function GET() {
    try {
        const collection = await getCollection('candidates');
        
        // Run migration
        await migrateExistingCandidates(collection);
        
        const candidates = await collection.find()
            .sort({ createdAt: -1 })
            .toArray();
        return json(candidates, { headers: corsHeaders() });
    } catch (error) {
        return json(
            { error: 'Failed to fetch candidates' },
            { 
                status: 500,
                headers: corsHeaders()
            }
        );
    }
}

export async function POST({ request }) {
    try {
        const candidate = await request.json();
        
        // Trim input fields
        const sanitizedCandidate = {
            ...candidate,
            name: candidate.name?.trim(),
            email: candidate.email?.trim(),
            source: candidate.source?.trim(),
            sourceContact: candidate.sourceContact?.trim(),
            position: candidate.position?.trim()
        };
        
        // Validate required fields
        if (!sanitizedCandidate.name || !sanitizedCandidate.email || 
            !sanitizedCandidate.position || !sanitizedCandidate.source) {
            return json(
                { error: 'Missing required fields' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }

        // Validate field lengths
        if (sanitizedCandidate.name.length > 100 || 
            sanitizedCandidate.email.length > 100 || 
            (sanitizedCandidate.sourceContact && sanitizedCandidate.sourceContact.length > 100)) {
            return json(
                { error: 'Fields exceed maximum length' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedCandidate.email)) {
            return json(
                { error: 'Invalid email format' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }

        // Validate source
        const validSources = ['Recruiter', 'Referral', 'Other'];
        if (!validSources.includes(sanitizedCandidate.source)) {
            return json(
                { error: 'Invalid source' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }

        // Validate requested pay (if provided)
        if (sanitizedCandidate.requestedPay !== undefined && 
            (isNaN(sanitizedCandidate.requestedPay) || 
             sanitizedCandidate.requestedPay < 0)) {
            return json(
                { error: 'Invalid requested pay amount' },
                { 
                    status: 400,
                    headers: corsHeaders()
                }
            );
        }

        const collection = await getCollection('candidates');
        const result = await collection.insertOne({
            ...sanitizedCandidate,
            status: 'New',
            stages: {
                'New': {
                    status: 'In Progress',
                    reviewer: 'System',
                    notes: 'Initial status',
                    updatedAt: new Date(),
                    completed: false
                }
            },
            createdAt: new Date()
        });

        return json(
            { success: true, id: result.insertedId },
            { headers: corsHeaders() }
        );
    } catch (error) {
        return json(
            { error: 'Failed to create candidate: ' + error.message },
            { 
                status: 500,
                headers: corsHeaders()
            }
        );
    }
} 