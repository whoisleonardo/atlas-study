import * as Notifications from 'expo-notifications';
import { getDb } from './db';
import { getAllItemsWithDates } from './itemRepo';
import type { Lembrete } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleItemNotifications(): Promise<void> {
  const items = await getAllItemsWithDates();
  for (const item of items) {
    if (!item.data_prevista || item.status === 'CONCLUIDO') continue;
    const date = new Date(item.data_prevista);
    date.setHours(9, 0, 0, 0);
    if (date <= new Date()) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Estudos — prazo chegando',
        body: item.titulo,
        data: { itemId: item.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  }
}

export async function scheduleLembrete(lembrete: Lembrete): Promise<string[]> {
  const [hour, minute] = lembrete.hora.split(':').map(Number);
  const ids: string[] = [];

  if (lembrete.frequencia === 'DIARIO') {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: 'Hora de estudar!', body: 'Seu lembrete diário.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
    ids.push(id);
  } else if (lembrete.frequencia === 'SEMANAL' || lembrete.frequencia === 'CUSTOM') {
    const dias: string[] = JSON.parse(lembrete.dias ?? '[]');
    const dayMap: Record<string, number> = {
      SUN: 1, MON: 2, TUE: 3, WED: 4, THU: 5, FRI: 6, SAT: 7,
    };
    for (const dia of dias) {
      const weekday = dayMap[dia];
      if (!weekday) continue;
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: 'Hora de estudar!', body: 'Seu lembrete.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute },
      });
      ids.push(id);
    }
  }
  return ids;
}

export async function cancelLembrete(lembrete: Lembrete): Promise<void> {
  if (!lembrete.expo_notification_ids) return;
  const ids: string[] = JSON.parse(lembrete.expo_notification_ids);
  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}

export async function rescheduleAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await scheduleItemNotifications();
  const db = getDb();
  const lembretes = await db.getAllAsync<Lembrete>('SELECT * FROM lembretes WHERE ativo = 1');
  for (const l of lembretes) {
    const ids = await scheduleLembrete(l);
    await db.runAsync(
      'UPDATE lembretes SET expo_notification_ids = ? WHERE id = ?',
      [JSON.stringify(ids), l.id]
    );
  }
}
