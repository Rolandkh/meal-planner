/**
 * Vercel Serverless Function
 * Proxies requests to Claude API with server-side API key
 * This keeps the API key secure and never exposes it to the client
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment variable (set in Vercel dashboard)
  // Try both possible variable names (Vercel sometimes uses different casing)
  const apiKey = (process.env.ANTHROPIC_API_KEY || process.env.anthropic_api_key || process.env.Anthropic_Api_Key)?.trim();

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set or is empty');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.toLowerCase().includes('anthropic')));
    return res.status(500).json({ 
      error: 'API key not configured. Please set ANTHROPIC_API_KEY in Vercel environment variables and redeploy. Visit /api/check-env to verify.' 
    });
  }

  // Validate API key format
  if (!apiKey.startsWith('sk-ant-')) {
    console.error('API key format is invalid (should start with sk-ant-)');
    console.error('Key starts with:', apiKey.substring(0, 10));
    return res.status(500).json({ 
      error: `Invalid API key format. The key should start with "sk-ant-". Found: "${apiKey.substring(0, 10)}...". Please check your Vercel environment variable.` 
    });
  }

  // Log key info (first 10 and last 4 chars only for security)
  console.log('Using API key:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4));

  try {
    const { userPrompt, budgetTarget, store, feedbackHistory } = req.body;

    // Load base specification
    const baseSpec = await loadBaseSpecification();

    // Build feedback summary
    const feedbackSummary = buildFeedbackSummary(feedbackHistory || []);

    // Construct the system prompt
    const systemPrompt = `${baseSpec}

${feedbackSummary ? `\n## FEEDBACK HISTORY\n${feedbackSummary}\n` : ''}

Generate a meal plan following the specification above. Return ONLY valid JSON matching the structure below. Do not include any markdown formatting or code blocks.`;

    // Construct the user prompt
    const userMessage = `Generate a meal plan for the week of ${getNextWeekDate()}.

User preferences for this week:
${userPrompt || 'No specific preferences provided.'}

Constraints:
- Budget: $${budgetTarget} max
- Store: ${store === 'coles-caulfield' ? 'Coles Caulfield Village (Store ID: 7724)' : 'Woolworths Carnegie North'}

Output required (JSON format):
{
  "week_of": "YYYY-MM-DD",
  "roland_meals": {
    "sunday": {
      "breakfast": {"name": "...", "time": "8:00 AM"},
      "lunch": {"name": "...", "time": "12:30 PM"},
      "dinner": {"name": "...", "time": "5:30 PM"}
    },
    ...
  },
  "maia_meals": {
    "sunday": {
      "lunch": {"name": "...", "time": "12:30 PM"},
      "dinner": {"name": "...", "time": "5:30 PM"}
    },
    ...
  },
  "shopping_list": [
    {"category": "...", "items": [{"name": "...", "price": 0.00, "aisle": 1}]}
  ],
  "prep_tasks": {
    "sunday": {
      "roland": {"morning": [...], "evening": [...]},
      "maia": {"morning": [...], "evening": [...]}
    },
    ...
  },
  "budget_estimate": 0.00,
  "notes": "..."
}`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Claude API error:', error);
      
      // Provide more helpful error messages
      let errorMessage = error.error?.message || `API error: ${response.status}`;
      if (errorMessage.includes('invalid x-api-key') || errorMessage.includes('authentication')) {
        errorMessage = 'Invalid API key. Please check that ANTHROPIC_API_KEY is set correctly in Vercel environment variables. Make sure there are no extra spaces or characters.';
      }
      
      return res.status(response.status).json({ 
        error: errorMessage 
      });
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Extract JSON from response
    let jsonText = content.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/```$/, '').trim();
    }

    const mealPlan = JSON.parse(jsonText);

    // Return the meal plan
    return res.status(200).json({
      ...mealPlan,
      budget_target: budgetTarget
    });

  } catch (error) {
    console.error('Claude API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      apiKeyPresent: !!process.env.ANTHROPIC_API_KEY,
      apiKeyLength: process.env.ANTHROPIC_API_KEY?.length
    });
    
    return res.status(500).json({ 
      error: error.message || 'Failed to generate meal plan. Check server logs for details.' 
    });
  }
}

/**
 * Load base specification
 */
async function loadBaseSpecification() {
  // Return key parts of the spec
  return `Meal Planner App Specification

## ROLAND'S MEAL PLAN
- Breakfast: 8:00 AM (Protein bar)
- Lunch: 12:30 PM (Protein bar + ~600 cal meal)
- Dinner: 5:30 PM (Protein + vegetables, NO carbs)
- Thursday: Fast day (last meal 12:00 PM, no dinner)
- Friday: Post-fast (coffee only, light meal at 1:00 PM)

## MAIA'S MEAL PLAN
- Sunday: Lunch and dinner with Roland
- Monday: Breakfast (crumpet), Packed lunch, Dinner with Roland
- Tuesday: Breakfast (crumpet), Packed lunch, Dinner with Roland
- Wednesday: Breakfast (crumpet), Lunch with Roland, At mum's for dinner
- Thursday-Saturday: No meals scheduled

## INGREDIENT EFFICIENCY
Maximize shared ingredients between Roland and Maia's meals.`;
}

/**
 * Build feedback summary
 */
function buildFeedbackSummary(feedbackHistory) {
  if (!feedbackHistory || feedbackHistory.length === 0) {
    return null;
  }

  const loved = [];
  const didntWork = [];
  const notes = [];

  feedbackHistory.forEach(feedback => {
    if (feedback.loved) loved.push(feedback.loved);
    if (feedback.didntWork) didntWork.push(feedback.didntWork);
    if (feedback.notes) notes.push(feedback.notes);
  });

  let summary = '';
  if (loved.length > 0) {
    summary += `Loved meals: ${loved.join(', ')}\n`;
  }
  if (didntWork.length > 0) {
    summary += `Didn't work: ${didntWork.join(', ')}\n`;
  }
  if (notes.length > 0) {
    summary += `Notes: ${notes.join(' ')}\n`;
  }

  return summary || null;
}

/**
 * Get next week's date range
 */
function getNextWeekDate() {
  const today = new Date();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (7 - today.getDay()));
  
  const nextSaturday = new Date(nextSunday);
  nextSaturday.setDate(nextSunday.getDate() + 6);
  
  const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };
  
  return `${formatDate(nextSunday)} - ${formatDate(nextSaturday)}, ${nextSunday.getFullYear()}`;
}
