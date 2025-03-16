<script>
    const databaseTests = [
        {
            name: 'Connection Speed',
            run: async () => {
                const start = performance.now();
                await fetch('/api/test-db');
                return { duration: performance.now() - start };
            }
        },
        {
            name: 'Write Performance',
            run: async () => {
                // Test batch insert speed
                const docs = Array(100).fill().map(() => ({ test: true, timestamp: new Date() }));
                const start = performance.now();
                // Insert and then cleanup
                // Return write ops/second
            }
        },
        {
            name: 'Read Performance',
            run: async () => {
                // Test query speed with different conditions
            }
        },
        {
            name: 'Index Usage',
            run: async () => {
                // Check if queries are using indexes properly
            }
        }
    ];
</script> 