/**
 * Standalone script to test Spoonacular API key
 * 
 * Run: node test-spoonacular-key.js
 */

import 'dotenv/config';

async function testSpoonacularAPI() {
  console.log('🧪 Testing Spoonacular API Key...\n');

  // 1. Check if API key exists
  const apiKey = process.env.SPOONACULAR_API_KEY;
  
  if (!apiKey) {
    console.error('❌ SPOONACULAR_API_KEY not found in .env file');
    console.log('\nPlease add to .env:');
    console.log('SPOONACULAR_API_KEY=your_key_here');
    process.exit(1);
  }

  console.log(`✅ API Key found: ${apiKey.slice(0, 4)}...${apiKey.slice(-4)} (${apiKey.length} chars)\n`);

  // 2. Test API call - Get a random recipe
  try {
    const testUrl = new URL('https://api.spoonacular.com/recipes/complexSearch');
    testUrl.searchParams.set('number', '1');
    testUrl.searchParams.set('addRecipeInformation', 'true');
    testUrl.searchParams.set('apiKey', apiKey);

    console.log('📡 Calling Spoonacular API...');
    const startTime = Date.now();
    
    const response = await fetch(testUrl.toString());
    const responseTime = Date.now() - startTime;
    
    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    // 3. Check quota headers
    const quotaUsed = response.headers.get('X-API-Quota-Used');
    const quotaLimit = response.headers.get('X-API-Quota-Limit');
    const requestsUsed = response.headers.get('X-API-Quota-Request');

    if (quotaUsed && quotaLimit) {
      console.log('📈 Quota Information:');
      console.log(`   Points used: ${quotaUsed} / ${quotaLimit}`);
      console.log(`   Requests: ${requestsUsed || 'N/A'}`);
      console.log(`   Remaining: ${quotaLimit - quotaUsed} points\n`);
    }

    // 4. Parse response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:');
      console.error(errorText);
      process.exit(1);
    }

    const data = await response.json();
    
    // 5. Display results
    console.log('✅ SUCCESS! Spoonacular API is working!\n');
    console.log('📊 Test Results:');
    console.log(`   Total recipes found: ${data.totalResults}`);
    
    if (data.results?.[0]) {
      const sample = data.results[0];
      console.log('\n🍽️  Sample Recipe:');
      console.log(`   ID: ${sample.id}`);
      console.log(`   Title: ${sample.title}`);
      console.log(`   Ready in: ${sample.readyInMinutes} minutes`);
      console.log(`   Servings: ${sample.servings}`);
      console.log(`   Image: ${sample.image || 'N/A'}`);
      
      if (sample.nutrition) {
        console.log(`   Calories: ${sample.nutrition.nutrients?.find(n => n.name === 'Calories')?.amount || 'N/A'}`);
      }
    }

    console.log('\n✅ All systems go! Ready for Slice 5 extraction.\n');

  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

testSpoonacularAPI();
