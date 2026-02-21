import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

let db: Database.Database | null = null;

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function migrate(d: Database.Database) {
  d.pragma("journal_mode = WAL");

  d.exec(`
    create table if not exists users (
      id integer primary key autoincrement,
      email text not null,
      created_at text not null default (datetime('now')),
      unique(email)
    );

    create table if not exists otp_codes (
      id integer primary key autoincrement,
      email text not null,
      code_hash text not null,
      attempts integer not null default 0,
      created_at text not null default (datetime('now')),
      expires_at text not null,
      used_at text
    );

    create index if not exists idx_otp_email_created on otp_codes(email, created_at);

    create table if not exists sessions (
      id integer primary key autoincrement,
      user_id integer not null references users(id) on delete cascade,
      token_hash text not null,
      created_at text not null default (datetime('now')),
      expires_at text not null,
      unique(token_hash)
    );

    create index if not exists idx_sessions_user on sessions(user_id);

    create table if not exists companies (
      id integer primary key autoincrement,
      name text not null,
      domain text,
      website_url text,
      one_liner text,
      stage text,
      geo text,
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now'))
    );

    create unique index if not exists idx_companies_domain on companies(domain);

    create table if not exists company_enrichment (
      id integer primary key autoincrement,
      company_id integer not null references companies(id) on delete cascade,
      fetched_at text not null default (datetime('now')),
      source_url text not null,
      pages_json text not null,
      extracted_json text not null,
      combined_text text not null
    );

    create table if not exists theses (
      id integer primary key autoincrement,
      name text not null,
      version integer not null,
      definition_json text not null,
      created_at text not null default (datetime('now'))
    );

    create table if not exists thesis_matches (
      id integer primary key autoincrement,
      company_id integer not null references companies(id) on delete cascade,
      thesis_id integer not null references theses(id) on delete cascade,
      score real not null,
      confidence real not null,
      reasons_json text not null,
      missing_json text not null,
      computed_at text not null default (datetime('now')),
      unique(company_id, thesis_id)
    );

    create table if not exists lists (
      id integer primary key autoincrement,
      name text not null,
      description text,
      created_at text not null default (datetime('now'))
    );

    create table if not exists list_items (
      list_id integer not null references lists(id) on delete cascade,
      company_id integer not null references companies(id) on delete cascade,
      added_at text not null default (datetime('now')),
      primary key(list_id, company_id)
    );

    create table if not exists notes (
      id integer primary key autoincrement,
      company_id integer not null references companies(id) on delete cascade,
      body text not null,
      created_at text not null default (datetime('now'))
    );

    create table if not exists saved_searches (
      id integer primary key autoincrement,
      name text not null,
      query_json text not null,
      created_at text not null default (datetime('now'))
    );
  `);

  try {
    d.exec("alter table users add column username text");
  } catch {}
  try {
    d.exec("alter table users add column password_hash text");
  } catch {}
  try {
    d.exec("alter table users add column verified_at text");
  } catch {}

  const thesisCount = d.prepare("select count(*) as c from theses").get() as { c: number };
  if (thesisCount.c === 0) {
    const defaultThesis = {
      constraints: {
        b2bOnly: true,
        excludedKeywords: ["consumer", "dating", "crypto casino"]
      },
      signals: [
        {
          key: "regulated_keywords",
          label: "Regulated workflow keywords",
          weight: 0.25,
          any: ["compliance", "audit", "policy", "risk", "governance", "GRC", "SOX", "HIPAA", "SOC 2"]
        },
        {
          key: "security_page",
          label: "Has security/compliance page",
          weight: 0.2,
          any: ["security", "trust", "SOC 2", "ISO 27001", "HIPAA", "GDPR"]
        },
        {
          key: "b2b_ICP",
          label: "B2B ICP cues",
          weight: 0.2,
          any: ["enterprise", "teams", "IT", "CISO", "compliance officer", "procurement"]
        },
        {
          key: "pricing_or_sales",
          label: "Pricing / sales-led cues",
          weight: 0.1,
          any: ["pricing", "contact sales", "request a demo"]
        },
        {
          key: "hiring_signal",
          label: "Hiring signal",
          weight: 0.1,
          any: ["careers", "we're hiring", "open roles"]
        },
        {
          key: "data_infra",
          label: "Data/infra integrations",
          weight: 0.15,
          any: ["Snowflake", "Databricks", "Okta", "SAML", "SCIM", "AWS", "GCP"]
        }
      ]
    };

    d.prepare(
      "insert into theses(name, version, definition_json) values(?, ?, ?)"
    ).run("Default Thesis", 1, JSON.stringify(defaultThesis));
  }
}

export function getDb() {
  if (db) return db;
  
  let dir: string;
  if (process.env.VERCEL) {
    dir = "/tmp/.scout";
  } else {
    const root = process.cwd();
    dir = path.join(root, ".scout");
  }
  
  ensureDir(dir);
  const dbPath = path.join(dir, "scout.db");
  db = new Database(dbPath);
  migrate(db);
  return db;
}
