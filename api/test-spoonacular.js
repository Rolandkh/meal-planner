/**
 * Test endpoint to verify Spoonacular API key is configured correctly
 * 
 * Usage:
 * - Local: http://localhost:3000/api/test-spoonacular
 * - Vercel: https://your-app.vercel.app/api/test-spoonacular
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    // 1. Check if API key exists
    const apiKey = process.env.SPOONACULAR_API_KEY;
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SPOONACULAR_API_KEY not found in environment variables',
          envCheck: {
            hasKey: false,
            keyLength: 0
          }
        }),
        { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        }
      );
    }

    // 2. Make a simple test API call to Spoonacular
    const testUrl = new URL('https://api.spoonacular.com/recipes/complexSearch');
    testUrl.searchParams.set('number', '1');  // Just fetch 1 recipe
    testUrl.searchParams.set('addRecipeInformation', 'true');
    testUrl.searchParams.set('apiKey', apiKey);

    console.log('Testing Spoonacular API...');
    const startTime = Date.now();
    
    const response = await fetch(testUrl.toString());
    const responseTime = Date.now() - startTime;
    
    // 3. Check response status
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          success: false,
          error: `Spoonacular API returned ${response.status}`,
          details: errorText,
          envCheck: {
            hasKey: true,
            keyLength: apiKey.length,
            keyPreview: `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
          },
          apiResponse: {
            status: response.status,
            statusText: response.statusText
          }
        }),
        { 
          status: response.status,
          headers: { 'content-type': 'application/json' }
        }
      );
    }

    // 4. Parse successful response
    const data = await response.json();
    
    // 5. Return success with sample data
    return new Response(
      JSON.stringify({
        success: true,
        message: '✅ Spoonacular API is working correctly!',
        envCheck: {
          hasKey: true,
          keyLength: apiKey.length,
          keyPreview: `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
        },
        apiTest: {
          endpoint: 'complexSearch',
          responseTime: `${responseTime}ms`,
          recipesFound: data.totalResults,
          sampleRecipe: data.results?.[0] ? {
            id: data.results[0].id,
            title: data.results[0].title,
            readyInMinutes: data.results[0].readyInMinutes,
            servings: data.results[0].servings,
            image: data.results[0].image
          } : null
        },
        quota: {
          pointsUsed: response.headers.get('X-API-Quota-Used'),
          pointsLimit: response.headers.get('X-API-Quota-Limit'),
          requestsUsed: response.headers.get('X-API-Quota-Request')
        }
      }),
      { 
        status: 200,
        headers: { 'content-type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Test failed with exception',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      }
    );
  }
}
