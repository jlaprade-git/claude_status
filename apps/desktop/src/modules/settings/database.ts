import initSqlJs, { type Database } from 'sql.js'
import { app } from 'electron'
import { join, dirname } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

export class DatabaseManager {
  private db: Database
  private dbPath: string
  private saveTimer: ReturnType<typeof setInterval> | null = null

  private constructor(db: Database, dbPath: string) {
    this.db = db
    this.dbPath = dbPath
  }

  static async create(dbPath?: string): Promise<DatabaseManager> {
    const path = dbPath ?? join(app.getPath('userData'), 'claude-status.db')

    // Ensure directory exists
    const dir = dirname(path)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    // Locate WASM file next to the main process bundle
    const wasmPath = join(__dirname, 'sql-wasm.wasm')
    const SQL = await initSqlJs({
      locateFile: () => wasmPath,
    })

    let db: Database
    if (existsSync(path)) {
      const buffer = readFileSync(path)
      db = new SQL.Database(buffer)
    } else {
      db = new SQL.Database()
    }

    db.run('PRAGMA journal_mode = WAL')
    db.run('PRAGMA foreign_keys = ON')

    const manager = new DatabaseManager(db, path)
    manager.initialize()

    // Auto-save every 30 seconds
    manager.saveTimer = setInterval(() => manager.save(), 30_000)

    return manager
  }

  private initialize(): void {
    this.db.run(`
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
    const rows = this.db.exec('SELECT MAX(version) as v FROM schema_version')
    const version = rows.length > 0 && rows[0].values.length > 0 ? rows[0].values[0][0] : null
    if (!version) {
      this.db.run('INSERT INTO schema_version (version) VALUES (?)', [1])
    }
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
    this.db.run(
      `INSERT OR IGNORE INTO usage_records
       (timestamp, project_name, session_id, model, input_tokens, output_tokens,
        cache_write_tokens, cache_read_tokens, total_tokens, estimated_cost_usd, source, confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ],
    )
  }

  getUsageRecordsSince(since: string): Array<Record<string, unknown>> {
    const stmt = this.db.prepare('SELECT * FROM usage_records WHERE timestamp >= ? ORDER BY timestamp DESC')
    stmt.bind([since])
    const results: Array<Record<string, unknown>> = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()
    return results
  }

  // Settings
  getSetting(key: string): string | undefined {
    const rows = this.db.exec('SELECT value FROM settings WHERE key = ?', [key])
    if (rows.length > 0 && rows[0].values.length > 0) {
      return rows[0].values[0][0] as string
    }
    return undefined
  }

  setSetting(key: string, value: string): void {
    this.db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
  }

  // Notification log
  logNotification(type: string, title: string, body?: string, incidentId?: string): void {
    this.db.run(
      'INSERT INTO notification_log (type, title, body, incident_id) VALUES (?, ?, ?, ?)',
      [type, title, body ?? null, incidentId ?? null],
    )
  }

  private save(): void {
    try {
      const data = this.db.export()
      writeFileSync(this.dbPath, Buffer.from(data))
    } catch (err) {
      console.error('[DatabaseManager] Failed to save database:', err)
    }
  }

  close(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer)
      this.saveTimer = null
    }
    this.save()
    this.db.close()
  }
}
