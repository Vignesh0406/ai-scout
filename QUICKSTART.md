# Quick Start Guide - Precision AI Scout

Get up and running in 5 minutes!

## 🚀 Deploy to Vercel (Recommended - 3 minutes)

### Prerequisites
- GitHub account with code pushed
- Gmail account with 2-Step Verification enabled

### Step 1: Enable Gmail for Email (2 minutes)

```bash
# 1. Go to https://myaccount.google.com/security
# 2. Enable "2-Step Verification"
# 3. Go to https://myaccount.google.com/apppasswords
# 4. Select "Mail" → "Windows Computer"
# 5. Copy the 16-character password
```

### Step 2: Deploy to Vercel (1 minute)

```bash
# Push to GitHub
git add .
git commit -m "Precision AI Scout - Internship Submission"
git push origin main
```

Then:
1. Go to https://vercel.com/new
2. Connect your GitHub repo
3. Click "Deploy"
4. Add environment variables:
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `465`
   - `SMTP_USER` = your-email@gmail.com
   - `SMTP_PASS` = 16-char app password (from Step 1)
   - `SMTP_FROM` = `"<your-email@gmail.com>"`
5. Done! Your URL is live

## 🖥️ Run Locally (2 minutes)

```bash
# Install
npm install

# Create .env.local with Gmail credentials
echo 'SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="<your-email@gmail.com>"' > .env.local

# Start
npm run dev

# Open http://localhost:3000
```

---

## 📱 Demo Walkthrough (3 minutes)

### 1. Browse Companies (30 seconds)
- Homepage loads with 20+ companies
- See badges for stage (Seed, Series A) and geo (US, EU)
- Try searching: "security", "compliance", "data"

### 2. View Company Profile (30 seconds)
- Click any company name
- See their one-liner and metadata
- View thesis matching (if enriched)

### 3. Enrich a Company ⭐ (1 minute)
- **Click "✨ Enrich" button**
- Watch spinner while system:
  - Fetches their website
  - Extracts summary
  - Lists what they do (bullets)
  - Finds keywords
  - Detects signals (pricing, hiring, security, blog)
  - Links all source pages
- Thesis score auto-updates!

### 4. Create Lists (30 seconds)
- Go to "Lists" tab
- Click "New List"
- Add companies from search results

### 5. Add Notes (30 seconds)
- Open company profile
- Scroll to "Diligence Notes"
- Add observation
- Auto-saved!

---

## 🎯 Key Features

| Feature | What It Does |
|---------|--------------|
| 🔍 **Search** | Find companies by keyword |
| 🏷️ **Filters** | Stage, geography, website status |
| 📊 **Profiles** | Company overview + scoring |
| ✨ **Enrich** | Fetch and analyze real websites |
| 📋 **Lists** | Organize companies |
| 📝 **Notes** | Quick diligence observations |
| 🌙 **Dark Mode** | Full dark theme support |
| 📱 **Responsive** | Works on mobile/tablet/desktop |

---

## 🧪 Test Scenarios

### Scenario 1: Test Search
```
Search: "security"
Expected: Find SecurityVault, CodeSecure, APIGuard
Filter by Stage: "Series A"
Expected: See only Series A companies
```

### Scenario 2: Test Enrichment
```
1. Open "SecurityVault" profile
2. Click "✨ Enrich"
3. See:
   - Loading spinner
   - Website content being fetched
   - Summary extracted
   - Keywords found
   - Signals detected
   - Source URLs listed
```

### Scenario 3: Test Authentication
```
1. Click "Sign in"
2. Go to "Register"
3. Enter email and password
4. Check inbox for OTP code
5. Verify code
6. Login successful!
```

### Scenario 4: Test Lists
```
1. Search for companies
2. Go to "Lists" → "Promising"
3. Add 2-3 companies
4. Refresh page
5. Companies persist!
```

---

## 🎨 Features Showcased

### Technical Excellence
✅ Full-stack TypeScript (type safety)
✅ Real web scraping (Cheerio)
✅ Email OTP authentication
✅ SQLite database
✅ RESTful API design
✅ Error handling & validation

### UX/Design
✅ Modern gradients & colors
✅ Smooth animations
✅ Dark mode support
✅ Responsive layout
✅ Loading states
✅ Error messages

### Business Logic
✅ Explainable thesis matching
✅ 6-weighted signal system
✅ Confidence scoring
✅ List management
✅ Diligence notes
✅ Saved searches

---

## 📊 What Evaluators Will See

| Tab | What's Shown |
|-----|-------------|
| **Search** | 20 companies, working filters |
| **Company Profile** | Full details, ready to enrich |
| **Enrichment** | Real website data extracted |
| **Thesis Match** | Score + reasons + confidence |
| **Lists** | Organize and manage companies |
| **Notes** | Timestamped observations |
| **UI** | Modern, animated, responsive |

---

## 🎓 What This Demonstrates

1. **Full-Stack Skills**
   - Frontend: React, Tailwind, animations
   - Backend: Next.js API, authentication
   - Database: SQLite, migrations
   - Deployment: Vercel

2. **Software Engineering**
   - Clean code (TypeScript)
   - Error handling
   - Input validation (Zod)
   - Type safety throughout

3. **Product Sense**
   - Solves real problem (VC sourcing)
   - Intuitive UX
   - Useful features
   - Polished design

4. **Problem Solving**
   - Web scraping challenges
   - Email delivery
   - Thesis matching algorithm
   - Responsive design

---

## ❓ Troubleshooting

### Email not sending?
- Check SMTP credentials are correct
- Verify 2-Step Verification is ON in Gmail
- Verify app password is 16 characters

### Website enrichment failing?
- Try a different company
- Some websites block scraping
- Works best with public websites

### Deploy failed?
- Check build logs in Vercel dashboard
- Ensure all env vars are set
- Verify Node.js is 18+

### Thesis match showing 0?
- Click "Enrich" first
- Thesis computation requires enriched data
- Refresh page after enrichment

---

## 📞 Questions?

Check these files:
- **How to use**: README.md
- **How to deploy**: DEPLOYMENT.md
- **Assignment details**: SUBMISSION.md
- **Architecture**: src/ folder structure

---

## ✨ Summary

**Precision AI Scout** is a production-ready VC intelligence platform that demonstrates:
- Modern web development skills
- Real-time data enrichment
- Beautiful UI/UX
- Thoughtful product design

**Ready to impress!** 🚀

---

**Time to deploy**: 3-5 minutes
**Time to demo**: 3 minutes
**Time to evaluate**: 5-10 minutes

Good luck with your evaluation! 🎓
