# Environment Variables Setup

## Secure API Key Storage

The Claude API key is now stored securely on the server using Vercel environment variables. This keeps your API key safe and never exposes it to the client.

## Setup Instructions

### 1. Get Your Claude API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Navigate to API Keys
3. Create a new API key or copy an existing one
4. The key should start with `sk-ant-`

### 2. Add to Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings**
3. Go to **Environment Variables**
4. Click **Add New**
5. Add the following:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your Claude API key (starts with `sk-ant-`)
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**

### 3. Redeploy

After adding the environment variable, you need to redeploy:

1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

### 4. Test

1. Go to "Generate New Week" in the app
2. Enter your preferences
3. Click "Generate Meal Plan"
4. It should work without asking for an API key!

## Security Notes

- ✅ API key is stored server-side only
- ✅ Never exposed to browser/client code
- ✅ Only accessible in serverless functions
- ✅ Protected by Vercel's security

## Troubleshooting

### "API key not configured" error

- Make sure you added `ANTHROPIC_API_KEY` in Vercel
- Check that you selected all environments (Production, Preview, Development)
- Redeploy after adding the variable

### Still seeing API key input field

- The UI has been updated to remove the input field
- If you see it, make sure you've pulled the latest code
- Clear browser cache and refresh

### Local Development

For local development, you can create a `.env.local` file:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Then run:
```bash
vercel dev
```

This will use the local environment variable.
