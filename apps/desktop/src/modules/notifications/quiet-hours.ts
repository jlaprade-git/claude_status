export class QuietHoursManager {
  private enabled = false
  private startHour = 22
  private startMinute = 0
  private endHour = 7
  private endMinute = 0

  update(enabled: boolean, start?: string, end?: string): void {
    this.enabled = enabled
    if (start) {
      const [h, m] = start.split(':').map(Number)
      this.startHour = h
      this.startMinute = m
    }
    if (end) {
      const [h, m] = end.split(':').map(Number)
      this.endHour = h
      this.endMinute = m
    }
  }

  isActive(): boolean {
    if (!this.enabled) return false

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const startMinutes = this.startHour * 60 + this.startMinute
    const endMinutes = this.endHour * 60 + this.endMinute

    if (startMinutes <= endMinutes) {
      // Same day range (e.g., 09:00 - 17:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes
    } else {
      // Overnight range (e.g., 22:00 - 07:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes
    }
  }
}
