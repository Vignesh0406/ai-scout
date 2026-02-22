import postgres from "postgres";

let sql: postgres.Sql | null = null;
let migrated = false;

export function getDb() {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set. Add it to .env.local or Vercel environment.");
    }
    
    sql = postgres(url, {
      idle_timeout: 30,
      max_lifetime: 60 * 5,
    });
  }
  
  if (!migrated) {
    migrate().catch(err => console.warn("Migration warning:", err.message));
    migrated = true;
  }
  
  return sql;
}

async function migrate() {
  if (!sql) return;
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        username TEXT,
        password_hash TEXT,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_otp_email_created ON otp_codes(email, created_at)`;

    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT,
        website_url TEXT,
        one_liner TEXT,
        stage TEXT,
        geo TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain)`;

    await sql`
      CREATE TABLE IF NOT EXISTS company_enrichment (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        fetched_at TIMESTAMP DEFAULT NOW(),
        source_url TEXT NOT NULL,
        pages_json TEXT NOT NULL,
        extracted_json TEXT NOT NULL,
        combined_text TEXT NOT NULL,
        summary_json TEXT,
        what_they_do_json TEXT,
        keywords_json TEXT,
        signals_json TEXT
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS theses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        version INTEGER NOT NULL,
        definition_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS thesis_matches (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        thesis_id INTEGER NOT NULL REFERENCES theses(id) ON DELETE CASCADE,
        score REAL NOT NULL,
        confidence REAL,
        reasons_json TEXT,
        missing_json TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_thesis_matches_company ON thesis_matches(company_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS company_lists (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS company_list_items (
        id SERIAL PRIMARY KEY,
        list_id INTEGER NOT NULL REFERENCES company_lists(id) ON DELETE CASCADE,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        added_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(list_id, company_id)
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_list_items_company ON company_list_items(company_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS company_notes (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_notes_company ON company_notes(company_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS saved_searches (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        query_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    const DEFAULT_THESIS = {
      constraints: {
        b2bOnly: true,
        excludedKeywords: ["consumer", "retail", "gaming"]
      },
      signals: [
        { key: "ai_first", label: "AI-first or GenAI-native", weight: 25, any: ["ai", "llm", "machine learning", "neural", "generative", "gpt"] },
        { key: "api_first", label: "API-first or developer platform", weight: 20, any: ["api", "developer", "sdk", "rest", "graphql"] },
        { key: "b2b_saas", label: "B2B SaaS model", weight: 20, any: ["saas", "software", "platform", "enterprise", "b2b"] },
        { key: "infrastructure", label: "Infrastructure or tooling", weight: 15, any: ["infrastructure", "devops", "cloud", "kubernetes", "database"] },
        { key: "security_focus", label: "Security-first approach", weight: 15, any: ["security", "encryption", "compliance", "privacy", "zero trust"] },
        { key: "data_driven", label: "Data analytics or insights", weight: 5, any: ["analytics", "data", "insights", "metrics", "reporting"] }
      ]
    };

    const existing = await sql`SELECT id FROM theses LIMIT 1`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO theses (name, version, definition_json) 
        VALUES ('Default Thesis v1', 1, ${JSON.stringify(DEFAULT_THESIS)})
      `;
    }
  } catch (err: any) {
    console.error("Database migration error:", err.message);
    throw err;
  }
}
