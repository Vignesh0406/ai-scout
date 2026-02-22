import type postgres from "postgres";

export type QueryResult = any;

export class QueryBuilder {
  private sql: postgres.Sql;
  private query = "";
  private params: any[] = [];

  constructor(sql: postgres.Sql) {
    this.sql = sql;
  }

  prepare(query: string) {
    this.query = query;
    this.params = [];
    return this;
  }

  run(...args: any[]) {
    this.params = args;
    return this.executeAsync();
  }

  get(...args: any[]) {
    this.params = args;
    return this.getOneAsync();
  }

  all(...args: any[]) {
    this.params = args;
    return this.getAllAsync();
  }

  private async executeAsync() {
    try {
      const query = this.convertQuery(this.query);
      await this.sql.unsafe(query, this.params);
      return { changes: 1 };
    } catch (err) {
      console.error("Query error:", err);
      throw err;
    }
  }

  private async getOneAsync() {
    try {
      const query = this.convertQuery(this.query);
      const results = await this.sql.unsafe(query, this.params);
      return results[0] || null;
    } catch (err) {
      console.error("Query error:", err);
      return null;
    }
  }

  private async getAllAsync() {
    try {
      const query = this.convertQuery(this.query);
      return await this.sql.unsafe(query, this.params);
    } catch (err) {
      console.error("Query error:", err);
      return [];
    }
  }

  private convertQuery(q: string): string {
    let converted = q;
    converted = converted.replace(/\?/g, () => {
      return "$" + (this.params.indexOf("") + 1);
    });
    let paramIndex = 1;
    converted = q.replace(/@(\w+)/g, () => {
      return "$" + paramIndex++;
    });
    return converted;
  }
}

export function createQueryHelper(sql: postgres.Sql) {
  return {
    prepare: (query: string) => {
      const builder = new QueryBuilder(sql);
      return builder.prepare(query);
    },
  };
}
