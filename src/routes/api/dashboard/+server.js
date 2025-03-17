import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/data/dbConn.js';

export async function GET() {
    try {
        const candidatesCollection = await getCollection('candidates');
        const positionsCollection = await getCollection('positions');

        // Get total counts
        const totalCandidates = await candidatesCollection.countDocuments();
        const totalPositions = await positionsCollection.countDocuments();
        const openPositions = await positionsCollection.countDocuments({ status: 'Open' });
        const fillRate = totalPositions > 0 ? ((totalPositions - openPositions) / totalPositions * 100).toFixed(1) : 0;

        // Get candidates by current stage/status
        const candidatesByStage = await candidatesCollection.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    _id: { $ne: null }
                }
            },
            { $sort: { count: -1 } }
        ]).toArray();

        // Get positions by department
        const positionsByDepartment = await positionsCollection.aggregate([
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    _id: { $ne: null }
                }
            },
            { $sort: { count: -1 } }
        ]).toArray();

        // Get recent activity
        const recentCandidates = await candidatesCollection
            .find()
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();

        const recentPositions = await positionsCollection
            .find()
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();

        return json({
            overview: {
                totalCandidates,
                totalPositions,
                openPositions,
                fillRate
            },
            candidatesByStage,
            positionsByDepartment,
            recentActivity: {
                candidates: recentCandidates,
                positions: recentPositions
            }
        });
    } catch (error) {
        console.error('Dashboard data error:', error);
        return json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
} 