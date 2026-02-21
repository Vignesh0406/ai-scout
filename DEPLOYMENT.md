# Deployment Guide

This guide covers deploying **Precision AI Scout** to Vercel (recommended) or Netlify.

## Quick Start: Deploy to Vercel in 5 Minutes

### Prerequisites

1. GitHub account with your code pushed
2. Vercel account (https://vercel.com/signup)
3. Gmail account with app password (see [Gmail Setup](#gmail-setup))

### Step 1: Prepare Your GitHub Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Precision AI Scout"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/precision-ai-scout.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 2: Gmail Setup (Required for OTP emails)

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** if not already enabled
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character app password (you'll need this in Step 4)

### Step 3: Connect to Vercel

1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Paste your GitHub repo URL
4. Click "Continue"
5. Vercel will auto-detect the Next.js framework

### Step 4: Add Environment Variables

In the Vercel dashboard, go to **Settings → Environment Variables** and add:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM="<your-email@gmail.com>"
```

**Important**: The `SMTP_PASS` is the 16-character code from Step 2, not your regular Gmail password.

### Step 5: Deploy

1. Click the **Deploy** button
2. Vercel will build and deploy your app
3. Once complete, you'll get a live URL
4. Share the URL with your team!

## Detailed Setup: Gmail SMTP

### Why Gmail?

- **Free**: No cost for sending up to 500 emails/day
- **Reliable**: Google's infrastructure
- **Simple**: Works with standard SMTP

### Enabling Gmail for SMTP

#### 1. Enable 2-Step Verification (Required)

- Go to https://myaccount.google.com/security
- Scroll to "How you sign in to Google"
- Click "2-Step Verification" → "Enable"
- Follow the prompts (verify with phone or security key)

#### 2. Generate App Password

- Go to https://myaccount.google.com/apppasswords
- Select "Mail" → "Windows Computer" (or your OS)
- Google generates a 16-character password
- Copy it (e.g., `abcd efgh ijkl mnop`)

#### 3. Add to Environment Variables

```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop  # No spaces
SMTP_FROM="<your-email@gmail.com>"
```

### Testing SMTP Connection Locally

```bash
# Set environment variables
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=465
export SMTP_USER=your-email@gmail.com
export SMTP_PASS=your-app-password
export SMTP_FROM="<your-email@gmail.com>"

# Run dev server
npm run dev

# Try registering a new account; OTP should arrive in email
```

## Deployment Options

### Option 1: Vercel (Recommended)

**Pros:**
- Seamless Next.js integration
- Built-in analytics
- 0ms cold starts with Hobby tier
- SQLite persistence in `.next` folder
- Environment variables GUI

**Cons:**
- Limited free tier (100GB bandwidth/month)
- SQLite is stored in ephemeral filesystem (data persists in `.next`)

**Deploy:**

```bash
npm install -g vercel
vercel
# Follow prompts, add env vars
```

### Option 2: Netlify

**Pros:**
- Free tier is generous
- Good support for Next.js
- Built-in form handling

**Cons:**
- Requires manual Next.js functions setup
- SQLite needs filesystem persistence (harder to manage)

**Deploy:**

1. Push to GitHub
2. Go to https://netlify.com
3. Click "New site from Git"
4. Select your repo
5. Build command: `npm run build`
6. Publish directory: `.next`
7. Add env vars in **Site Settings → Build & Deploy → Environment**
8. Trigger a new deploy

### Option 3: Self-Hosted (Advanced)

If you want full control over the database:

```bash
# Build
npm run build

# Start production server
npm start
```

Then deploy to:
- AWS EC2 / Lightsail
- DigitalOcean
- Heroku
- Railway
- Fly.io

## Monitoring & Debugging

### View Logs in Vercel

1. Go to your Vercel project dashboard
2. Click the deployment you want to inspect
3. Go to **Deployments → [Latest] → Logs**
4. Filter for errors or search for specific messages

### Check Email Delivery

To verify OTP emails are sending:

1. Register a new account with a test email
2. Watch the Vercel logs for email send attempts
3. Check your email inbox (and spam folder)
4. If it fails, check:
   - `SMTP_PASS` is correct (16 chars, from App Passwords)
   - 2-Step Verification is enabled on Gmail account
   - Email address matches `SMTP_USER`

### Database Status

The SQLite database is stored in `.next/` and persists across deployments on Vercel.

To inspect the database:

```bash
# Download and inspect locally
# Vercel doesn't provide direct DB access, but you can:
# 1. Export data via API
# 2. Connect to a Vercel Postgres database (advanced)
```

## Performance Optimization

### Cache Enrichment Results

Enrichment is automatically cached in the database. Subsequent enrichments of the same company don't re-fetch the web unless you manually trigger it.

### Optimize for Large Datasets

If you have >10k companies:

1. Add database indexes:
   ```sql
   CREATE INDEX idx_company_name ON companies(name);
   CREATE INDEX idx_thesis_matches ON thesis_matches(company_id, thesis_id);
   ```

2. Implement pagination (already in the app)

3. Consider upgrading to Vercel Pro ($20/mo) for:
   - More function concurrency
   - Faster cold starts
   - 1TB bandwidth

### Reduce Bundle Size

Current bundle is **~106KB** (good for a full VC tool).

If you need to shrink it further:
- Remove unused Tailwind classes
- Lazy-load heavy components
- Use dynamic imports for client components

## Troubleshooting Deployment

### Build Fails: "Cannot find module 'nodemailer'"

**Solution:** Dependencies weren't installed. Vercel should auto-install from `package.json`.

Verify in `package.json`:
```json
"dependencies": {
  "nodemailer": "^6.9.16"
}
```

### OTP Email Not Sending in Production

**Check:**

1. Environment variables are set correctly:
   ```bash
   vercel env ls
   ```

2. Gmail app password is correct (from https://myaccount.google.com/apppasswords)

3. 2-Step Verification is enabled

4. Try sending a test email from API:
   ```bash
   curl -X POST https://your-site.vercel.app/api/auth/request-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

5. Check logs for SMTP errors

### Database File Not Persisting

SQLite on Vercel is stored in `.next/` which persists, but:

- **Don't rely on it for critical data** — Vercel is not designed for stateful databases
- **Better solution:** Upgrade to Vercel Postgres (paid) or use external DB (MongoDB Atlas, Railway Postgres, etc.)

For now, SQLite in `.next/` is fine for demo/MVP.

### "Cannot POST /api/company/1/enrich"

This usually means:

1. The API route isn't built
2. Function is timing out (web scraping > 10s in free tier)

**Solution:**
- Upgrade to Vercel Pro for longer timeouts
- Reduce max pages to enrich (edit `maxPages` in `enrich.ts`)

## Production Checklist

- [ ] GitHub repo created and code pushed
- [ ] Gmail account with 2-Step Verification enabled
- [ ] App password generated from Google
- [ ] Vercel project created
- [ ] All 5 env vars set in Vercel dashboard
- [ ] First deployment successful
- [ ] Test registration (email should arrive)
- [ ] Test enrichment on a company
- [ ] Test creating a list and adding companies
- [ ] Share URL with team

## Next Steps

Once deployed:

1. **Monitor**: Check Vercel analytics for usage
2. **Iterate**: Add features based on feedback
3. **Scale**: If >1k daily active users, consider upgrading to Vercel Pro
4. **Backup**: Regularly export company data (build an export API endpoint)

## Support

For deployment issues:

1. Check Vercel docs: https://vercel.com/docs
2. Check Next.js docs: https://nextjs.org/docs
3. Review README.md troubleshooting section
4. Check GitHub Issues

Good luck! 🚀
