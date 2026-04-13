export interface FileSystemAdapter {
  readFile(path: string): Promise<string>
  readDir(path: string): Promise<string[]>
  exists(path: string): Promise<boolean>
  stat(path: string): Promise<{ mtime: Date; size: number }>
}

export interface UsageFileWatcher {
  watch(paths: string[], onChange: (filePath: string) => void): void
  stop(): void
}
