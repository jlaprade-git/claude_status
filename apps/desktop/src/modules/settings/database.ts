import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

export class DatabaseManager {
  private db: Database.Database

  constructor(dbPath?: string) {
    const path = dbPath ?? join(app.getPath('userData'), 'claude-status.db')
    this.db = new Database(path)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    this.initialize()
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS usage_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        project_name TEXT NOT NULL,
        session_id TEXT,
        model TEXT NOT NULL,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        cache_write_tokens INTEGER NOT NULL DEFAULT 0,
        cache_read_tokens INTEGER NOT NULL DEFAULT 0,
        total_tokens INTEGER NOT NULL DEFAULT 0,
        estimated_cost_usd REAL,
        source TEXT NOT NULL DEFAULT 'local-file',
        confidence TEXT NOT NULL DEFAULT 'medium',
        UNIQUE(timestamp, session_id, model)
      );

      CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_records(timestamp);
      CREATE INDEX IF NOT EXISTS idx_usage_project ON usage_records(project_name);
      CREATE INDEX IF NOT EXISTS idx_usage_model ON usage_records(model);

      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        impact TEXT,
        source TEXT NOT NULL,
        confidence REAL,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        resolved_at TEXT
      );

      CREATE TABLE IF NOT EXISTS incident_updates (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL REFERENCES incidents(id),
        status TEXT NOT NULL,
        body TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notification_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        incident_id TEXT
      );
    `)

    // Record initial schema version
    const versionRow = this.db.prepare('SELECT MAX(version) as v FROM schema_version').get() as { v: number | null } | undefined
    if (!versionRow?.v) {
      this.db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(1)
    }
  }

  getDb(): Database.Database {
    return this.db
  }

  // Usage records
  insertUsageRecord(record: {
    timestamp: string
    projectName: string
    sessionId?: string
    model: string
    inputTokens: number
    outputTokens: number
    cacheWriteTokens: number
    cacheReadTokens: number
    totalTokens: number
    estimatedCostUsd?: number
    source: string
    confidence: string
  }): void {
    this.db
      .prepare(
        `INSERT OR IGNORE INTO usage_records
         (timestamp, project_name, session_id, model, input_tokens, output_tokens,
          cache_write_tokens, cache_read_tokens, total_tokens, estimated_cost_usd, source, confidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.timestamp,
        record.projectName,
        record.sessionId ?? null,
        record.model,
        record.inputTokens,
        record.outputTokens,
        record.cacheWriteTokens,
        record.cacheReadTokens,
        record.totalTokens,
        record.estimatedCostUsd ?? null,
        record.source,
        record.confidence,
      )
  }

  getUsageRecordsSince(since: string): Array<Record<string, unknown>> {
    return this.db
      .prepare('SELECT * FROM usage_records WHERE timestamp >= ? ORDER BY timestamp DESC')
      .all(since) as Array<Record<string, unknown>>
  }

  // Settings
  getSetting(key: string): string | undefined {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value
  }

  setSetting(key: string, value: string): void {
    this.db
      .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run(key, value)
  }

  // Notification log
  logNotification(type: string, title: string, body?: string, incidentId?: string): void {
    this.db
      .prepare(
        'INSERT INTO notification_log (type, title, body, incident_id) VALUES (?, ?, ?, ?)',
      )
      .run(type, title, body ?? null, incidentId ?? null)
  }

  close(): void {
    this.db.close()
  }
}
