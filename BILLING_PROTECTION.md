# Billing Protection Guide

## Free Tier Limits (Very Generous!)

The Blaze plan includes a **free tier** that covers most small apps:

### Cloud Functions Free Tier:
- **2 million invocations/month** (FREE)
- **400,000 GB-seconds compute time/month** (FREE)
- **200,000 CPU-seconds/month** (FREE)

### Gemini API Free Tier:
- **15 requests/minute** (FREE)
- **1,500 requests/day** (FREE)

### Estimated Usage for Your App:
- **Suggestions**: ~5-10 requests per user per day
- **Insights**: ~1-2 requests per user per day
- **Total**: ~7-12 requests per user per day

**For 2 users**: ~14-24 requests/day = **Well within free tier!**

## Cost Protection Steps

### 1. Set Up Billing Alerts (IMPORTANT!)

1. Go to [Google Cloud Console](https://console.cloud.google.com/billing)
2. Select your project: `household-chores-d8eae`
3. Go to **Billing** → **Budgets & alerts**
4. Click **Create Budget**
5. Set:
   - **Budget amount**: $5/month (or whatever you're comfortable with)
   - **Alert threshold**: 50% ($2.50), 90% ($4.50), 100% ($5.00)
   - **Email alerts**: Your email

### 2. Set Spending Limit (CRITICAL!)

1. Go to [Firebase Console](https://console.firebase.google.com/project/household-chores-d8eae/usage/details)
2. Click **Modify plan** or **Usage and billing**
3. Set **Spending limit**: $5/month (or $0 to disable if you want)
4. This will **automatically disable services** if you hit the limit

### 3. Monitor Usage

Check usage regularly:
- [Firebase Usage Dashboard](https://console.firebase.google.com/project/household-chores-d8eae/usage)
- [Cloud Functions Metrics](https://console.cloud.google.com/functions/list?project=household-chores-d8eae)

### 4. Add Rate Limiting to Functions

We can add rate limiting to prevent abuse. This ensures:
- Max requests per user per day
- Prevents accidental loops
- Protects against abuse

## Actual Costs (If You Exceed Free Tier)

### Cloud Functions:
- **$0.40 per million invocations** (after free tier)
- Example: 3 million invocations = $0.40 (only pay for 1 million over free tier)

### Gemini API:
- **$0.00025 per 1K characters input**
- **$0.0005 per 1K characters output**
- Example: 1,000 requests with ~500 chars each = ~$0.12

**Realistic worst case**: $1-2/month for heavy usage

## Recommended Settings

1. **Spending limit**: $5/month
2. **Billing alerts**: At $1, $3, $4.50
3. **Monitor**: Check monthly
4. **Rate limiting**: Add to functions (I can help with this)

## What Happens If You Hit the Limit?

- **Spending limit**: Services automatically pause
- **No surprise bills**: You'll get alerts before hitting limit
- **Easy to adjust**: Increase limit if needed

## Safe to Proceed?

**YES!** With these protections:
- ✅ Free tier covers typical usage
- ✅ Spending limit prevents surprises
- ✅ Alerts notify you early
- ✅ Easy to monitor

You're very unlikely to pay anything, and if you do, it'll be minimal ($1-2/month max).

