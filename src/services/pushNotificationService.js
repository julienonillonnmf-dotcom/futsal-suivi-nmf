// src/services/pushNotificationService.js
// Service pour gérer les notifications push Firebase dans la PWA

/**
 * Initialiser les notifications push
 * À appeler une fois au démarrage de l'app
 */
export const initializePushNotifications = async (firebaseSenderId) => {
  console.log('🔔 Initializing push notifications...');

  try {
    // Vérifier que le Service Worker est bien enregistré
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker ready');

    // Demander les permissions
    const permission = await Notification.requestPermission();
    console.log('📋 Notification permission:', permission);

    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission not granted');
      return false;
    }

    // Créer la clé publique Firebase (à fournir)
    const publicKey = firebaseSenderId; // À remplacer par ta vraie clé

    // Subscribe aux push notifications
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      console.log('✅ Push subscription successful');
      console.log('Subscription:', subscription);

      // Récupérer le token
      const token = subscription.endpoint.split('/').pop();
      console.log('📱 Device token:', token);

      return {
        success: true,
        token: token,
        subscription: subscription
      };
    } catch (subscriptionError) {
      console.error('❌ Push subscription failed:', subscriptionError);
      // Continue même si subscription échoue
      return {
        success: false,
        error: subscriptionError.message
      };
    }
  } catch (error) {
    console.error('❌ Error initializing push notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Sauvegarder le token en base de données
 */
export const saveDeviceToken = async (supabase, playerId, token) => {
  try {
    if (!token) {
      console.warn('⚠️ No token to save');
      return false;
    }

    console.log('💾 Saving device token for player:', playerId);

    const { error } = await supabase
      .from('players')
      .update({
        device_token: token,
        device_platform: 'web-pwa',
        device_updated_at: new Date().toISOString()
      })
      .eq('id', playerId);

    if (error) {
      console.error('Error saving device token:', error);
      return false;
    }

    console.log('✅ Device token saved successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving device token:', error);
    return false;
  }
};

/**
 * Demander la permission des notifications
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('⚠️ This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Notification permission already granted');
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  console.warn('⚠️ Notification permission denied');
  return false;
};

/**
 * Envoyer une notification de test (pour dev)
 */
export const sendTestNotification = async (supabase, title = 'Test', body = 'Ceci est une notification de test') => {
  try {
    console.log('🧪 Sending test notification...');

    const response = await supabase.functions.invoke('send-push-notification', {
      body: {
        title,
        body,
        type: 'test'
      }
    });

    if (response.error) {
      console.error('Error:', response.error);
      return false;
    }

    console.log('✅ Test notification sent');
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

/**
 * Convertir base64 string en Uint8Array
 * Nécessaire pour Firebase Cloud Messaging
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Vérifier le statut de la permission
 */
export const getNotificationPermissionStatus = () => {
  if (!('Notification' in window)) {
    return 'not-supported';
  }
  return Notification.permission;
};

/**
 * Nettoyer les notifications (optionnel)
 */
export const unsubscribePushNotifications = async () => {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Workers not supported');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Unsubscribed from push notifications');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return false;
  }
};

console.log('✅ Push Notification Service loaded');
