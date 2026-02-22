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
  
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      username TEXT,
      password_hash TEXT,
      verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_otp_email_created ON otp_codes(email, created_at);

    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

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
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);

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
    );

    CREATE TABLE IF NOT EXISTS theses (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      version INTEGER NOT NULL,
      definition_json TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS thesis_matches (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      thesis_id INTEGER NOT NULL REFERENCES theses(id) ON DELETE CASCADE,
      score REAL NOT NULL,
      confidence REAL,
      reasons_json TEXT,
      missing_json TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_thesis_matches_company ON thesis_matches(company_id);

    CREATE TABLE IF NOT EXISTS company_lists (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS company_list_items (
      id SERIAL PRIMARY KEY,
      list_id INTEGER NOT NULL REFERENCES company_lists(id) ON DELETE CASCADE,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      added_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(list_id, company_id)
    );

    CREATE INDEX IF NOT EXISTS idx_list_items_company ON company_list_items(company_id);

    CREATE TABLE IF NOT EXISTS company_notes (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_notes_company ON company_notes(company_id);

    CREATE TABLE IF NOT EXISTS saved_searches (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      query_json TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `.catch(() => {});
}
