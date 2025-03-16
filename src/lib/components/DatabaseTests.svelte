<script>
    let status = $state(null);
    let message = $state('');
    let results = $state([]);
    
    const tests = [
        // Database Connection Tests
        {
            name: 'Database Connection',
            run: async () => {
                const response = await fetch('/api/test-db');
                if (!response.ok) throw new Error('Failed to connect to database');
                return { status: 'Connected' };
            }
        },
        {
            name: 'Database Details',
            run: async () => {
                const response = await fetch('/api/test-db/details');
                if (!response.ok) throw new Error('Failed to get database details');
                const data = await response.json();
                return { 
                    version: data.details.version,
                    collections: data.details.collections.length
                };
            }
        },

        // Position CRUD Tests
        {
            name: 'Create Position',
            run: async () => {
                const position = {
                    title: 'Test Engineer',
                    department: 'Engineering',
                    hiringManager: 'Test Manager',
                    timeline: 'Q1'
                };
                const response = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(position)
                });
                if (!response.ok) throw new Error('Failed to create position');
                const result = await response.json();
                return { id: result.id };
            }
        },
        {
            name: 'Read Positions',
            run: async () => {
                const response = await fetch('/api/positions');
                if (!response.ok) throw new Error('Failed to read positions');
                const positions = await response.json();
                return { count: positions.length };
            }
        },
        {
            name: 'Verify Position Status',
            run: async () => {
                const response = await fetch('/api/positions');
                if (!response.ok) throw new Error('Failed to read positions');
                const positions = await response.json();
                const allValid = positions.every(p => 
                    p.status === 'Open' || p.status === 'Closed'
                );
                if (!allValid) throw new Error('Invalid position status found');
                return { validStatuses: true };
            }
        },
        {
            name: 'Verify Position Fields',
            run: async () => {
                const response = await fetch('/api/positions');
                if (!response.ok) throw new Error('Failed to read positions');
                const positions = await response.json();
                const requiredFields = ['title', 'department', 'hiringManager', 'timeline', 'status'];
                const allValid = positions.every(p => 
                    requiredFields.every(field => p[field] !== undefined)
                );
                if (!allValid) throw new Error('Missing required fields');
                return { validFields: true };
            }
        },
        {
            name: 'Delete Position',
            run: async () => {
                const response = await fetch('/api/positions');
                if (!response.ok) throw new Error('Failed to get positions');
                const positions = await response.json();
                if (!positions.length) throw new Error('No positions to delete');
                
                const deleteResponse = await fetch(`/api/positions/${positions[0]._id}`, {
                    method: 'DELETE'
                });
                if (!deleteResponse.ok) throw new Error('Failed to delete position');
                return { deletedId: positions[0]._id };
            }
        },

        // Data Validation Tests
        {
            name: 'Department Validation',
            run: async () => {
                const validDepartments = ['Engineering', 'Sales', 'Management'];
                const response = await fetch('/api/positions');
                if (!response.ok) throw new Error('Failed to read positions');
                const positions = await response.json();
                const allValid = positions.every(p => 
                    validDepartments.includes(p.department)
                );
                if (!allValid) throw new Error('Invalid department found');
                return { validDepartments: true };
            }
        },
        {
            name: 'Timeline Validation',
            run: async () => {
                const validTimelines = ['Q1', 'Q2', 'Q3', 'Q4'];
                const response = await fetch('/api/positions');
                if (!response.ok) throw new Error('Failed to read positions');
                const positions = await response.json();
                const allValid = positions.every(p => 
                    validTimelines.includes(p.timeline)
                );
                if (!allValid) throw new Error('Invalid timeline found');
                return { validTimelines: true };
            }
        },

        // Performance Tests
        {
            name: 'Response Time',
            run: async () => {
                const start = performance.now();
                const response = await fetch('/api/positions');
                const end = performance.now();
                if (!response.ok) throw new Error('Failed to read positions');
                const duration = end - start;
                if (duration > 1000) throw new Error('Response time exceeded 1000ms');
                return { duration: `${duration.toFixed(2)}ms` };
            }
        }
    ];

    // ... rest of the component code remains the same ...
</script> 