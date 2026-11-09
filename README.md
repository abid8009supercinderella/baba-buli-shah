# Bilal Abid AI — Vercel deployment

This version uses Google's **Interactions API** with `gemini-3.8-flash`. It does not use the retired `gemini-2.0-flash` or the unavailable-to-this-key `gemini-2.5-flash` model.

## Deploy
1. Extract this ZIP.
2. Upload all files and folders to a new GitHub repository.
3. Import the repository into Vercel.
4. Create a Gemini API key in Google AI Studio.
5. In Vercel → Project → Settings → Environment Variables, add:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key
6. Save, then redeploy.

Do not put the API key in `index.html` or commit it to GitHub.

## Files
- `index.html`: responsive chat interface
- `api/chat.js`: server-side Gemini Interactions API call
- `package.json`: official `@google/genai` SDK dependency
- `vercel.json`: Vercel function settings

## Important
A valid API key, model access, and available quota are still required. Google controls model availability and quotas, so no code can guarantee that every request will always succeed. The website displays API errors rather than spinning forever.
