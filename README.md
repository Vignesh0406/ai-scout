# Precision AI Scout

A modern VC intelligence interface for discovering, enriching, and scoring high-signal startups. Built with Next.js, Tailwind CSS, and AI-powered web enrichment.

## Overview

Precision AI Scout combines a clean, modern intelligence interface with live enrichment that pulls and summarizes public web data on demand. Users can discover companies through fast search and filters, open a profile, enrich it with real website content, generate explainable thesis matches, and take action (save to lists, add notes, export).

**Key Features:**
- 🔍 Fast search with faceted filters (stage, geography, website status)
- 📊 Explainable thesis matching with signal detection
- 🌐 Live web enrichment with real page content extraction
- 📋 Create and manage company lists
- 💾 Save searches for quick access
- 📝 Add notes and diligence breadcrumbs
- 🎨 Modern, responsive UI with smooth animations

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS with custom animations
- **Database:** SQLite (better-sqlite3)
- **Web Scraping:** Cheerio + Node.js Fetch API
- **Auth:** Email/OTP based authentication
- **Email:** Gmail SMTP (Nodemailer)
- **Type Safety:** TypeScript + Zod

## Prerequisites

- Node.js 18+ and npm
- A Gmail account for OTP emails (or dev mode without email)
- A git repository (for deployment)

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd precision-ai-scout
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Gmail SMTP (for OTP email delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="<your-email@gmail.com>"

# Optional: Database path (defaults to ./db.sqlite)
# DATABASE_URL=./db.sqlite
```

### 4. Configure Gmail for sending OTPs

1. **Enable 2-Step Verification** on your Google Account:
   - Go to https://myaccount.google.com/security
   - Scroll to "How you sign in to Google" → Enable 2-Step Verification

2. **Generate an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password
   - Paste it as `SMTP_PASS` in `.env.local`

3. **Verify credentials**:
   - Update `SMTP_USER` to match your Gmail address
   - Update `SMTP_FROM` with the same email

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Scripts

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm start

# Run linting
npm run lint
```

### Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes (auth, enrichment)
│   ├── company/[id]/            # Company profile page
│   ├── lists/                   # Lists management
│   ├── login/                   # Auth (login/register)
│   ├── page.tsx                 # Homepage (search + results)
│   └── layout.tsx               # Root layout
├── components/                  # React client components
│   ├── CompanyProfileClient.tsx # Profile enrichment UI
│   ├── AuthStatusClient.tsx     # User auth status
│   └── ThemeClient.tsx          # Dark mode toggle
├── lib/                         # Business logic
│   ├── auth.ts                  # Auth helpers + OTP
│   ├── db.ts                    # SQLite database
│   ├── email.ts                 # Email sending (Nodemailer)
│   ├── enrich.ts                # Web scraping + extraction
│   ├── repo.ts                  # Database queries
│   └── thesis.ts                # Thesis management
└── globals.css                  # Tailwind + custom animations
```

### Key API Routes

#### Authentication

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in with email/password
- `POST /api/auth/request-otp` - Request OTP for email verification
- `POST /api/auth/verify-email` - Verify OTP code
- `POST /api/auth/verify-otp` - Verify login OTP
- `POST /api/auth/logout` - Sign out

#### Company Management

- `GET /api/company/[id]` - Get company details
- `POST /api/company/[id]/enrich` - Fetch and extract web content
- `POST /api/company/[id]/notes` - Add a note
- `GET /api/lists` - Get user's lists
- `POST /api/lists` - Create a new list
- `POST /api/lists/[id]/items` - Add company to list

### Live Enrichment Flow

1. User clicks "Enrich" on a company profile
2. Frontend calls `POST /api/company/[id]/enrich`
3. Backend (server-side):
   - Fetches the company's website
   - Extracts text from key pages (home, pricing, careers, security, about, product)
   - Stores raw content in database
   - Runs thesis matching against extracted text
4. Frontend receives enrichment data and displays:
   - Pages fetched with titles and text
   - Derived signals (pricing, careers, security pages)
   - Thesis match score and confidence
   - Evidence for why it matched
   - Source URLs with timestamps

### Enrichment Output Fields

```typescript
{
  sourceUrl: string;
  pages: Array<{
    url: string;
    title: string;
    text: string;  // Up to 20,000 chars per page
  }>;
  combinedText: string;  // All pages combined
  extracted: {
    title?: string;
    hasPricing: boolean;
    hasCareers: boolean;
    hasSecurity: boolean;
  };
  fetched_at: string;  // ISO timestamp
}
```

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**:
   - Go to https://vercel.com/new
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**:
   - In Vercel dashboard → Settings → Environment Variables
   - Add all variables from `.env.local`:
     ```
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=465
     SMTP_USER=your-email@gmail.com
     SMTP_PASS=your-app-password
     SMTP_FROM="<your-email@gmail.com>"
     ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy automatically

5. **Database (SQLite)**:
   - SQLite file is stored at `.next/sqlite.db` in production
   - Data persists across deployments (stored in `.next` directory)
   - For data backup, you can export via API or database queries

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_HOST` | Yes | Gmail SMTP server: `smtp.gmail.com` |
| `SMTP_PORT` | Yes | Gmail SMTP port: `465` |
| `SMTP_USER` | Yes | Your Gmail address (must match `SMTP_FROM`) |
| `SMTP_PASS` | Yes | App-specific password (16 chars from Google) |
| `SMTP_FROM` | Yes | Sender email in format: `"<email@gmail.com>"` |

### Production Checklist

- [ ] All environment variables set in deployment platform
- [ ] Database initialized (runs automatically on first request)
- [ ] Test email delivery (register new account)
- [ ] Test web enrichment (enrich a company)
- [ ] Monitor logs for errors
- [ ] Set up backup strategy for SQLite database

## Features & Workflows

### 1. Search & Discover
- Fast full-text search across company names, descriptions, domains
- Filter by funding stage, geography, and website status
- Sort by thesis match score (if computed)
- Pagination for large result sets

### 2. Company Profile
- Overview: name, stage, geography, one-liner
- Thesis match: score, confidence, reasons, missing signals
- Enrichment status and source URLs
- Notes: add quick diligence notes tied to company

### 3. Live Enrichment
- Click "Enrich" to fetch real website content
- Extracts pages: home, pricing, careers, security, about, product
- Shows which pages were found
- Detects signals: pricing page, careers listing, security certifications
- Recomputes thesis match with real data

### 4. Lists & Saved Searches
- Create custom lists to organize companies
- Save frequently-used searches for quick access
- Add/remove companies from lists
- Export lists as JSON/CSV (stretch)

### 5. Notes & Diligence
- Add timestamped notes on any company
- Quick breadcrumbs from meetings or calls
- Synced across sessions

## Security & Best Practices

### API Key Safety
- **SMTP credentials are server-side only** — never exposed in browser
- Email sending happens in server API routes
- Environment variables are not included in client-side JavaScript
- Database file is not accessible from the web

### Web Scraping
- Uses public pages only (no authentication evasion)
- Respects robots.txt implicitly (Cheerio + fetch)
- User-Agent header identifies the scraper
- Targets specific known paths (/pricing, /careers, /security, etc.)

### Authentication
- Passwords are hashed (bcrypt)
- OTP codes expire after 10 minutes
- Email verification required for new accounts
- Session-based authentication with secure cookies

## Troubleshooting

### "Failed to send OTP email"
- Check SMTP credentials in `.env.local`
- Verify app password (not regular Gmail password)
- Confirm 2-Step Verification is enabled
- In development, set `NODE_ENV=development` and OTP will print to console

### "No website to enrich"
- Company must have a `website_url` or `domain` field
- Check company data in database
- Use a real URL (not localhost)

### "Enrichment failed"
- Website may be blocking requests
- Check network in browser console for error details
- Try a different company with a public, accessible site

### Database errors
- SQLite is auto-created on first run
- Check write permissions in project directory
- On Vercel, database is persisted in `.next` directory

### Build fails on Vercel
- Ensure `NODE_VERSION` is 18+ in Vercel settings
- Check that all dependencies are in `package.json`
- Review build logs in Vercel dashboard

## Performance Tips

1. **Enrich on-demand**: Don't enrich all companies at once; it's slow and resource-intensive
2. **Cache results**: Enrichment is cached in database automatically
3. **Limit pages**: Enrichment fetches up to 4 pages per company; adjust `maxPages` in code
4. **Search filters**: Use filters before searching for better performance
5. **Database indexes**: Create indexes on frequently-queried columns (e.g., `company_id`, `thesis_id`)

## Future Enhancements

- **Batch enrichment**: Queue and rate-limit bulk enrichment jobs
- **LLM extraction**: Use Claude/GPT to extract structured fields from enriched content
- **Vector search**: Semantic search via embeddings
- **Integrations**: Slack notifications, CRM sync, email export
- **Analytics**: Track sourcing metrics, time-to-decision, conversion rates
- **Bulk actions**: Export, tag, or enrich multiple companies at once
- **Custom thesis**: Let VCs define their own thesis scoring criteria

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Commit with clear messages: `git commit -m "Add feature X"`
4. Push and create a pull request

## License

MIT — feel free to use this as a template or starting point.

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review API logs in browser console or server output
3. Inspect database with SQLite client
4. Open a GitHub issue with detailed error messages

---

**Built for the Vibe Coding Take-Home assignment.** Fast, clean, and thesis-first. 🚀
