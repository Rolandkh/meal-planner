/**
 * Diagnostic endpoint to check if environment variable is set
 * Remove this after confirming the API key is working
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  return res.status(200).json({
    hasApiKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    keyStartsWith: apiKey ? apiKey.substring(0, 10) : 'N/A',
    keyEndsWith: apiKey ? '...' + apiKey.substring(apiKey.length - 4) : 'N/A',
    message: apiKey 
      ? 'API key is set. If you still get errors, check that the key is correct and has no extra spaces.' 
      : 'API key is NOT set. Please add ANTHROPIC_API_KEY in Vercel environment variables.'
  });
}
