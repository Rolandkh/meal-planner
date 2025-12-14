/**
 * Test endpoint to check available Claude models
 * This helps us find the correct model name format
 */

export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Try different model names
  const modelsToTest = [
    'claude-3-5-sonnet-20241022',
    'claude-sonnet-4-20250514',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-5-sonnet-20240620'
  ];

  const results = [];

  for (const model of modelsToTest) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });

      const data = await response.json();
      results.push({
        model,
        status: response.status,
        success: response.ok,
        error: data.error?.message || (response.ok ? 'OK' : 'Failed')
      });
    } catch (error) {
      results.push({
        model,
        status: 'error',
        success: false,
        error: error.message
      });
    }
  }

  return res.status(200).json({ results });
}
