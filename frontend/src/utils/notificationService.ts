// Notification service for birthday reminders

export interface BirthdayNotification {
  id: string;
  name: string;
  turningAge: number;
  daysUntil: 0 | 3 | 7;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private notifiedBirthdays: Set<string> = new Set();
  private storageKey = 'birthday_notifications_sent';

  constructor() {
    this.loadNotifiedBirthdays();
    this.refreshPermissionFromBrowser();
  }

  // Load previously notified birthdays from localStorage
  private loadNotifiedBirthdays(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        // Only keep notifications from today
        const today = new Date().toDateString();
        if (data.date === today) {
          this.notifiedBirthdays = new Set(data.birthdays);
        } else {
          // Clear old notifications
          localStorage.removeItem(this.storageKey);
        }
      }
    } catch (error) {
      console.error('Error loading notified birthdays:', error);
    }
  }

  // Save notified birthdays to localStorage
  private saveNotifiedBirthdays(): void {
    try {
      const data = {
        date: new Date().toDateString(),
        birthdays: Array.from(this.notifiedBirthdays),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving notified birthdays:', error);
    }
  }

  /** Always read from the browser — cached `this.permission` can go stale vs `Notification.permission`. */
  private refreshPermissionFromBrowser(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  // Request notification permission from user
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    this.refreshPermissionFromBrowser();
    console.log('Current permission before request:', Notification.permission);

    if (this.permission === 'granted') {
      console.log('Permission already granted');
      return true;
    }

    if (this.permission === 'denied') {
      console.log('Permission was previously denied');
      return false;
    }

    try {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Check if notifications are supported and permitted
  isSupported(): boolean {
    if (!('Notification' in window)) {
      return false;
    }
    this.refreshPermissionFromBrowser();
    return this.permission === 'granted';
  }

  // Generate notification key for tracking
  private getNotificationKey(birthday: BirthdayNotification): string {
    return `${birthday.id}-${birthday.daysUntil}`;
  }

  // Check if notification was already sent
  private wasNotified(birthday: BirthdayNotification): boolean {
    return this.notifiedBirthdays.has(this.getNotificationKey(birthday));
  }

  // Mark notification as sent
  private markAsNotified(birthday: BirthdayNotification): void {
    this.notifiedBirthdays.add(this.getNotificationKey(birthday));
    this.saveNotifiedBirthdays();
  }

  /**
   * Android Chrome (and some other mobile browsers) reliably shows system notifications
   * when they are created from the active service worker. Plain `new Notification()` in the
   * page works on desktop but is often suppressed on mobile without this path.
   */
  private async displayNotification(
    title: string,
    options: NotificationOptions,
    daysUntil: BirthdayNotification['daysUntil']
  ): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('service-worker-ready-timeout')), 4000)
          ),
        ]);
        await registration.showNotification(title, options);
        if (daysUntil !== 0 && options.tag) {
          const closeTag = options.tag;
          setTimeout(async () => {
            try {
              const open = await registration.getNotifications({ tag: closeTag });
              open.forEach((n) => n.close());
            } catch {
              /* ignore */
            }
          }, 10000);
        }
        return true;
      } catch {
        /* fall back to window Notification */
      }
    }

    try {
      const notification = new Notification(title, options);
      if (daysUntil !== 0) {
        setTimeout(() => notification.close(), 10000);
      }
      return true;
    } catch (error) {
      console.error('Error showing notification (window fallback):', error);
      return false;
    }
  }

  // Send a birthday notification. Returns false if blocked, skipped as duplicate, or creation failed.
  async sendBirthdayNotification(
    birthday: BirthdayNotification,
    skipDuplicateCheck = false
  ): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported or not permitted');
      return false;
    }

    // Don't send duplicate notifications (unless explicitly skipped for testing)
    if (!skipDuplicateCheck && this.wasNotified(birthday)) {
      return true;
    }

    try {
      let title: string;
      let body: string;

      if (birthday.daysUntil === 0) {
        title = '🎉 Birthday Today!';
        body = `It's ${birthday.name}'s birthday – turning ${birthday.turningAge}!`;
      } else if (birthday.daysUntil === 3) {
        title = '🎂 Birthday Reminder';
        body = `${birthday.name}'s birthday is in 3 days – turning ${birthday.turningAge}`;
      } else if (birthday.daysUntil === 7) {
        title = '📅 Birthday Coming Up';
        body = birthday.name === 'System' 
          ? 'Notifications are now enabled! You\'ll receive birthday reminders here.'
          : `${birthday.name}'s birthday is in 7 days – turning ${birthday.turningAge}`;
      } else {
        return false;
      }

      const options: NotificationOptions = {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: this.getNotificationKey(birthday),
        requireInteraction: birthday.daysUntil === 0, // Keep today's notifications visible
      };

      const shown = await this.displayNotification(title, options, birthday.daysUntil);
      if (!shown) {
        return false;
      }

      // Mark as notified (unless it's a test notification)
      if (!skipDuplicateCheck) {
        this.markAsNotified(birthday);
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // Send multiple birthday notifications
  async sendBirthdayNotifications(birthdays: BirthdayNotification[]): Promise<void> {
    for (const birthday of birthdays) {
      await this.sendBirthdayNotification(birthday);
    }
  }

  // Clear notification history (useful for testing)
  clearNotificationHistory(): void {
    this.notifiedBirthdays.clear();
    localStorage.removeItem(this.storageKey);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
