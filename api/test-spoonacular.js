/**
 * Test endpoint to verify Spoonacular API key is configured correctly
 * 
 * Usage:
 * - Local: http://localhost:3001/api/test-spoonacular
 * - Vercel: https://your-app.vercel.app/api/test-spoonacular
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Check if API key exists
    const apiKey = process.env.SPOONACULAR_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'SPOONACULAR_API_KEY not found in environment variables',
        envCheck: {
          hasKey: false,
          keyLength: 0
        }
      });
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
      return res.status(response.status).json({
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
      });
    }

    // 4. Parse successful response
    const data = await response.json();
    
    // 5. Return success with sample data
    return res.status(200).json({
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
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Test failed with exception',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
