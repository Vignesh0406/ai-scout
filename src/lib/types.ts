export type Company = {
  id: number;
  name: string;
  domain: string | null;
  website_url: string | null;
  one_liner: string | null;
  stage: string | null;
  geo: string | null;
  created_at: string;
  updated_at: string;
};

export type Thesis = {
  id: number;
  name: string;
  version: number;
  definition_json: string;
};

export type ThesisDefinition = {
  constraints: {
    b2bOnly?: boolean;
    excludedKeywords?: string[];
  };
  signals: Array<{
    key: string;
    label: string;
    weight: number;
    any: string[];
  }>;
};

export type ThesisMatch = {
  id: number;
  company_id: number;
  thesis_id: number;
  score: number;
  confidence: number;
  reasons_json: string;
  missing_json: string;
  computed_at: string;
};
