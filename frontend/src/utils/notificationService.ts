// Notification service for birthday reminders

/** Must be a real image URL. A missing path (e.g. SPA fallback to index.html) breaks Android Chrome. */
const NOTIFICATION_ICON = '/pwa-192x192.png';

/** Large image for expanded notification (shade); improves visibility on Android. */
const NOTIFICATION_IMAGE = '/pwa-512x512.png';

/** DOM typings lag Chrome; SW `showNotification` supports `image` and `actions`. */
type ServiceWorkerShowNotificationOptions = NotificationOptions & {
  image?: string;
  timestamp?: number;
  vibrate?: number | number[];
  actions?: Array<{ action: string; title: string; icon?: string }>;
};

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
   * `actions` are not reliably supported on the window `Notification` constructor; strip them for fallback.
   */
  private withoutActions(options: ServiceWorkerShowNotificationOptions): NotificationOptions {
    const { actions: _omit, ...rest } = options;
    return rest as NotificationOptions;
  }

  /**
   * Android 15+ (incl. Pixel / Android 16) uses compact heads-up: the floating preview still hides after a few
   * seconds by OS design. The entry usually remains in the notification shade until dismissed; the web
   * platform cannot keep the heads-up bubble on screen like desktop Chrome.
   */
  private buildNotificationOptions(
    birthday: BirthdayNotification,
    body: string
  ): ServiceWorkerShowNotificationOptions {
    const openUrl = new URL('/settings', window.location.origin).href;
    return {
      body,
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_ICON,
      image: NOTIFICATION_IMAGE,
      tag: this.getNotificationKey(birthday),
      requireInteraction: true,
      timestamp: Date.now(),
      vibrate: [200, 100, 200],
      data: { url: openUrl },
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };
  }

  /**
   * Android Chrome (and some other mobile browsers) reliably shows system notifications
   * when they are created from the active service worker. Plain `new Notification()` in the
   * page works on desktop but is often suppressed on mobile without this path.
   */
  private async displayNotification(
    title: string,
    options: ServiceWorkerShowNotificationOptions
  ): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('service-worker-ready-timeout')), 12000)
          ),
        ]);
        await registration.showNotification(title, options as NotificationOptions);
        return true;
      } catch (err) {
        console.warn('[notifications] service worker showNotification failed:', err);
        /* fall back to window Notification (often suppressed on Android) */
      }
    }

    try {
      new Notification(title, this.withoutActions(options));
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

      const options = this.buildNotificationOptions(birthday, body);

      const shown = await this.displayNotification(title, options);
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
