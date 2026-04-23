import { useEffect, useRef } from 'react';
import axios from 'axios';
import { notificationService, BirthdayNotification } from '../utils/notificationService';

interface UpcomingBirthdays {
  today: Array<{
    id: string;
    name: string;
    turningAge: number;
  }>;
  in3Days: Array<{
    id: string;
    name: string;
    turningAge: number;
  }>;
  in7Days: Array<{
    id: string;
    name: string;
    turningAge: number;
  }>;
}

export const useBirthdayNotifications = () => {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasRequestedPermission = useRef(false);

  const checkUpcomingBirthdays = async () => {
    try {
      const response = await axios.get<UpcomingBirthdays>('/api/birthdays/upcoming', {
        withCredentials: true,
      });

      const notifications: BirthdayNotification[] = [];

      // Add today's birthdays
      response.data.today.forEach(birthday => {
        notifications.push({
          id: birthday.id,
          name: birthday.name,
          turningAge: birthday.turningAge,
          daysUntil: 0,
        });
      });

      // Add 3-day reminders
      response.data.in3Days.forEach(birthday => {
        notifications.push({
          id: birthday.id,
          name: birthday.name,
          turningAge: birthday.turningAge,
          daysUntil: 3,
        });
      });

      // Add 7-day reminders
      response.data.in7Days.forEach(birthday => {
        notifications.push({
          id: birthday.id,
          name: birthday.name,
          turningAge: birthday.turningAge,
          daysUntil: 7,
        });
      });

      // Send notifications
      if (notifications.length > 0) {
        await notificationService.sendBirthdayNotifications(notifications);
      }
    } catch (error) {
      console.error('Error checking upcoming birthdays:', error);
    }
  };

  const requestPermissionAndStart = async () => {
    if (hasRequestedPermission.current) {
      return;
    }

    hasRequestedPermission.current = true;

    // Request permission
    const granted = await notificationService.requestPermission();

    if (granted) {
      // Check immediately
      await checkUpcomingBirthdays();

      // Check every hour
      checkIntervalRef.current = setInterval(checkUpcomingBirthdays, 60 * 60 * 1000);
    }
  };

  useEffect(() => {
    // Start checking after a short delay (to avoid blocking initial render)
    const timeoutId = setTimeout(requestPermissionAndStart, 2000);

    return () => {
      clearTimeout(timeoutId);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  return {
    checkNow: checkUpcomingBirthdays,
    requestPermission: requestPermissionAndStart,
  };
};
