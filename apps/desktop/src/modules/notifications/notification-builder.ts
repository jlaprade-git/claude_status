import { Notification } from 'electron'

export type NotificationUrgency = 'info' | 'warning' | 'critical' | 'success'

export class NotificationBuilder {
  build(title: string, body: string, urgency: NotificationUrgency): Notification {
    return new Notification({
      title,
      body,
      silent: urgency === 'info',
      urgency: this.mapUrgency(urgency),
      timeoutType: urgency === 'critical' ? 'never' : 'default',
    })
  }

  private mapUrgency(urgency: NotificationUrgency): 'low' | 'normal' | 'critical' {
    switch (urgency) {
      case 'info':
      case 'success':
        return 'low'
      case 'warning':
        return 'normal'
      case 'critical':
        return 'critical'
    }
  }
}
