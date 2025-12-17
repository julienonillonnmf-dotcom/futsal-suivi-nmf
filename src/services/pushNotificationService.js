// src/services/pushNotificationService.js
// Service simplifié pour gérer les notifications push sans VAPID

export const initializePushNotifications = async () => {
  console.log('🔔 Initializing push notifications...');

  try {
    // Vérifier que le Service Worker est bien enregistré
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker ready');

    // Demander les permissions de notifications
    if (!('Notification' in window)) {
      console.warn('⚠️ This browser does not support notifications');
      return {
        success: false,
        error: 'Browser does not support notifications'
      };
    }

    // Si les permissions sont déjà accordées
    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      return {
        success: true,
        permission: 'granted',
        message: 'Notifications already enabled'
      };
    }

    // Si pas encore demandées
    if (Notification.permission !== 'denied') {
      console.log('📋 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);

      if (permission === 'granted') {
        console.log('✅ Notification permission granted!');
        return {
          success: true,
          permission: 'granted'
        };
      } else {
        console.warn('⚠️ Notification permission denied by user');
        return {
          success: false,
          error: 'User denied notification permission'
        };
      }
    }

    console.warn('⚠️ Notification permission previously denied');
    return {
      success: false,
      error: 'Notification permission denied'
    };
  } catch (error) {
    console.error('❌ Error initializing push notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Sauvegarder le token/permission status en base de données
 */
export const saveDeviceToken = async (supabase, playerId, status = 'enabled') => {
  try {
    if (!playerId) {
      console.warn('⚠️ No player ID provided');
      return false;
    }

    console.log('💾 Saving notification status for player:', playerId);

    const { error } = await supabase
      .from('players')
      .update({
        notifications_enabled: status === 'enabled',
        notification_updated_at: new Date().toISOString()
      })
      .eq('id', playerId);

    if (error) {
      console.error('Error saving notification status:', error);
      return false;
    }

    console.log('✅ Notification status saved successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving notification status:', error);
    return false;
  }
};

/**
 * Demander explicitement la permission des notifications
 */
export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.warn('⚠️ This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      console.log('📋 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    console.warn('⚠️ Notification permission denied');
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Tester les notifications (envoyer une notification de test)
 */
export const sendTestNotification = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;

    if (!registration) {
      console.warn('⚠️ Service Worker not ready');
      return false;
    }

    console.log('🧪 Sending test notification...');

    // Envoyer une notification depuis le Service Worker
    registration.showNotification('Test Futsal NMF', {
      body: 'Ceci est une notification de test!',
      icon: '/Logo NMF Rose.png',
      badge: '/Logo NMF Rose.png',
      tag: 'test-notification',
      requireInteraction: false
    });

    console.log('✅ Test notification sent');
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

/**
 * Obtenir le statut des permissions
 */
export const getNotificationPermissionStatus = () => {
  if (!('Notification' in window)) {
    return 'not-supported';
  }
  return Notification.permission; // 'granted', 'denied', or 'default'
};

/**
 * Vérifier si les notifications sont activées
 */
export const areNotificationsEnabled = () => {
  return 'Notification' in window && Notification.permission === 'granted';
};

console.log('✅ Push Notification Service loaded');
