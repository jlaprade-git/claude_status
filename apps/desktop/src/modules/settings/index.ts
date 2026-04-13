import type { UserSettings } from '@claude-status/core'
import { DatabaseManager } from './database'
import { DEFAULT_SETTINGS, mergeWithDefaults } from './defaults'

export class SettingsManager {
  private db: DatabaseManager
  private cache: UserSettings

  constructor(db: DatabaseManager) {
    this.db = db
    this.cache = this.load()
  }

  get(): UserSettings {
    return { ...this.cache }
  }

  update(partial: Partial<UserSettings>): UserSettings {
    this.cache = mergeWithDefaults({ ...this.cache, ...partial })
    this.db.setSetting('user_settings', JSON.stringify(this.cache))
    return this.get()
  }

  private load(): UserSettings {
    const raw = this.db.getSetting('user_settings')
    if (!raw) return DEFAULT_SETTINGS
    try {
      const parsed = JSON.parse(raw) as Partial<UserSettings>
      return mergeWithDefaults(parsed)
    } catch {
      return DEFAULT_SETTINGS
    }
  }
}
