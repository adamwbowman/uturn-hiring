import adapter from '@sveltejs/adapter-auto';

// /** @type {import('@sveltejs/kit').Config} */
// const config = {
// 	kit: {
// 		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
// 		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
// 		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
// 		adapter: adapter()
// 	}
// };

// export default config;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
	  adapter: adapter({
		// if true, will deploy the app using edge functions
		// (https://vercel.com/docs/concepts/functions/edge-functions)
		// rather than serverless functions
		edge: false,
		
		// specify external dependencies that should be bundled
		external: ['mongodb'],
		
		// automatically split routes into smaller chunks
		split: false
	  })
	}
  };
  
  export default config;
