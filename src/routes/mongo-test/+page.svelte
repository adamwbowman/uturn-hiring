<script>
	import SimpleDbTest from '$lib/components/SimpleDbTest.svelte';
	import EnhancedMongoDbTest from '$lib/components/EnhancedMongoDbTest.svelte';
	import PositionsTest from '$lib/components/PositionsTest.svelte';
</script>
  
  <div class="container mt-4">
	<SimpleDbTest />
  </div>

  <div class="container my-4">
	<EnhancedMongoDbTest />
  </div>

  <div class="container my-4">
	<PositionsTest />
  </div>