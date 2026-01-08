# Gemini Prompt for OAuth Redirect URI Check

## Copy and paste this prompt into Google Cloud Console's Gemini chat:

---

**PROMPT TO COPY:**

```
I need help checking my OAuth 2.0 redirect URI configuration for Firebase Authentication.

Please check my OAuth 2.0 Client IDs in project "household-chores-d8eae" and specifically:

1. Find the "Web application" OAuth client (not Android or iOS)
2. List all "Authorized redirect URIs" configured for that Web application client
3. Tell me if any of these URIs contain "localhost" or "127.0.0.1"
4. Tell me if these URIs are present:
   - https://household-chores-d8eae.firebaseapp.com/__/auth/handler
   - https://household-chores-d8eae.web.app/__/auth/handler

Please provide:
- The exact list of all Authorized redirect URIs
- Which ones contain localhost (if any)
- Whether the Firebase domain URIs are present or missing
- Any recommendations for fixing the configuration

I'm having issues with Google Sign-In redirecting to localhost on Android, and I suspect the redirect URI configuration is the cause.
```

---

## What to do:

1. **Open Google Cloud Console**: https://console.cloud.google.com/
2. **Select project**: `household-chores-d8eae`
3. **Look for Gemini chat** (usually in the top right or sidebar)
4. **Paste the prompt above**
5. **Copy Gemini's response** and share it with me

---

## Alternative shorter prompt:

If the above is too long, try this shorter version:

```
Check my OAuth 2.0 Client IDs in project "household-chores-d8eae". For the "Web application" client, list all Authorized redirect URIs and tell me:
1. Are there any localhost URIs?
2. Are these URIs present: https://household-chores-d8eae.firebaseapp.com/__/auth/handler and https://household-chores-d8eae.web.app/__/auth/handler?
```

---

## What I'll do with the response:

Once you share Gemini's response, I'll:
1. Analyze the current configuration
2. Identify what's wrong
3. Tell you exactly what to add/remove
4. Provide step-by-step fix instructions

