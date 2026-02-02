// src/services/alertService.js - Système d'alertes Discord
import { supabase } from '../supabaseClient';

/**
 * Envoyer une alerte Discord
 */
const sendDiscordAlert = async (webhookUrl, title, message) => {
  if (!webhookUrl) {
    console.log('Discord webhook non configuré');
    return { success: false, error: 'Webhook non configuré' };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `🚨 ${title}`,
          description: message,
          color: 15158332, // Rouge
          timestamp: new Date().toISOString(),
          footer: {
            text: 'NMF Futsal - Système d\'alertes'
          }
        }]
      })
    });

    if (response.ok || response.status === 204) {
      console.log('✅ Alerte Discord envoyée');
      return { success: true };
    } else {
      throw new Error(`Discord error: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erreur envoi Discord:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Vérifier les variations importantes par rapport aux moyennes
 */
const checkVariations = async (playerId, playerName, currentData, threshold, alerts) => {
  try {
    const { data: history } = await supabase
      .from('responses')
      .select('data')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!history || history.length < 3) return;

    const metrics = ['motivation', 'fatigue', 'intensite_rpe', 'plaisir', 'confiance'];

    metrics.forEach(metric => {
      const values = history
        .map(r => r.data?.[metric])
        .filter(v => v != null && !isNaN(v))
        .map(v => Number(v));

      if (values.length >= 3 && currentData[metric] != null) {
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        const current = Number(currentData[metric]);
        const diff = current - avg;

        if (Math.abs(diff) >= threshold) {
          const direction = diff > 0 ? 'Augmentation' : 'Diminution';
          const emoji = diff > 0 ? '📈' : '📉';
          
          const metricLabels = {
            motivation: 'Motivation',
            fatigue: 'Fatigue',
            intensite_rpe: 'RPE',
            plaisir: 'Plaisir',
            confiance: 'Confiance'
          };
          
          alerts.push({
            type: 'variation',
            title: `${emoji} VARIATION ${metricLabels[metric] || metric}`,
            message: `**${playerName}**\n${direction}: **${Math.abs(diff).toFixed(1)} pts**\nActuel: ${current}/20 | Moyenne: ${avg.toFixed(1)}/20`
          });
        }
      }
    });
  } catch (error) {
    console.error('Erreur vérification variations:', error);
  }
};

/**
 * FONCTION PRINCIPALE : Analyser et envoyer les alertes
 */
export const checkAndSendAlerts = async (playerId, playerName, responseType, responseData) => {
  try {
    // 1. Récupérer les paramètres d'alertes
    const { data: settings, error: settingsError } = await supabase
      .from('alert_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError || !settings || !settings.discord_webhook) {
      console.log('Système d\'alertes non configuré ou inactif');
      return;
    }

    const alerts = [];

    // 2. Vérifier les blessures
    if (settings.alert_injury && responseData.injuries && responseData.injuries.length > 0) {
      const activeInjuries = responseData.injuries.filter(inj => 
        inj.status === 'active' || inj.active === true
      );
      
      if (activeInjuries.length > 0) {
        activeInjuries.forEach(injury => {
          const zone = injury.location || injury.zone || 'Non spécifiée';
          const douleur = injury.intensity || injury.douleur || 0;
          
          alerts.push({
            type: 'injury',
            title: '🚑 NOUVELLE BLESSURE',
            message: `**${playerName}**\nZone: **${zone}**\nDouleur: **${douleur}/10**${injury.description ? `\n_${injury.description}_` : ''}`
          });
        });
      }
    }

    // 3. Vérifier la fatigue (échelle inversée : faible = fatigué)
    if (settings.alert_fatigue && responseData.fatigue != null) {
      if (responseData.fatigue <= settings.fatigue_threshold) {
        alerts.push({
          type: 'fatigue',
          title: '😴 ALERTE FATIGUE ÉLEVÉE',
          message: `**${playerName}**\nNiveau: **${responseData.fatigue}/20**\n⚠️ Joueuse très fatiguée`
        });
      }
    }

    // 4. Vérifier la motivation
    if (settings.alert_motivation && responseData.motivation != null) {
      if (responseData.motivation <= settings.motivation_threshold) {
        alerts.push({
          type: 'motivation',
          title: '📉 ALERTE MOTIVATION BASSE',
          message: `**${playerName}**\nNiveau: **${responseData.motivation}/20**\n⚠️ Motivation très faible`
        });
      }
    }

    // 5. Vérifier le RPE (intensité perçue)
    if (settings.alert_rpe && responseData.intensite_rpe != null) {
      if (responseData.intensite_rpe >= settings.rpe_threshold) {
        alerts.push({
          type: 'rpe',
          title: '💥 ALERTE RPE TRÈS ÉLEVÉ',
          message: `**${playerName}**\nIntensité: **${responseData.intensite_rpe}/20**\n⚠️ Risque de surcharge`
        });
      }
    }

    // 6. Vérifier les variations importantes
    if (settings.alert_variation) {
      await checkVariations(playerId, playerName, responseData, settings.variation_threshold, alerts);
    }

    // 7. Envoyer les alertes Discord
    if (alerts.length > 0) {
      for (const alert of alerts) {
        const result = await sendDiscordAlert(
          settings.discord_webhook,
          alert.title,
          alert.message
        );

        // Enregistrer dans l'historique
        await supabase.from('alert_history').insert({
          player_id: playerId,
          alert_type: alert.type,
          message: `${alert.title}\n${alert.message}`,
          status: result.success ? 'sent' : 'failed'
        });
      }
      
      console.log(`✅ ${alerts.length} alerte(s) envoyée(s) à Discord`);
    }

  } catch (error) {
    console.error('❌ Erreur système d\'alertes:', error);
  }
};

/**
 * Récupérer l'historique des alertes
 */
export const getAlertHistory = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('alert_history')
      .select(`
        *,
        players (name)
      `)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur récupération historique alertes:', error);
    return [];
  }
};

/**
 * Tester le webhook Discord
 */
export const testDiscordWebhook = async (webhookUrl) => {
  return await sendDiscordAlert(
    webhookUrl,
    '✅ TEST RÉUSSI',
    '**Webhook Discord configuré correctement !**\n\nVous recevrez désormais les alertes en temps réel.'
  );
};

/**
 * Envoyer une demande de retour coach via notification push Expo
 */
export const sendFeedbackRequest = async (playerId, playerName) => {
  try {
    console.log(`📩 Envoi demande de retour de ${playerName} aux admins...`);
    
    // 1. Récupérer les IDs des staff (admins)
    const { data: staffData, error: staffError } = await supabase
      .from('players')
      .select('id')
      .eq('is_staff', true);
    
    if (staffError || !staffData || staffData.length === 0) {
      console.log('⚠️ Aucun staff trouvé');
      return { success: false, error: 'Aucun staff trouvé' };
    }
    
    const staffIds = staffData.map(s => s.id);
    console.log(`   ${staffIds.length} admin(s) trouvé(s)`);
    
    // 2. Récupérer les tokens push des admins
    const { data: tokensData, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token')
      .in('player_id', staffIds)
      .eq('is_active', true);
    
    if (tokensError || !tokensData || tokensData.length === 0) {
      console.log('⚠️ Aucun token push trouvé pour les admins');
      return { success: false, error: 'Aucun token push admin' };
    }
    
    const tokens = tokensData
      .map(t => t.token)
      .filter(token => token && token.startsWith('ExponentPushToken['));
    
    console.log(`   ${tokens.length} token(s) Expo valide(s)`);
    
    if (tokens.length === 0) {
      console.log('⚠️ Aucun token Expo valide');
      return { success: false, error: 'Aucun token Expo valide' };
    }
    
    // 3. Créer les messages pour Expo
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: '📝 Demande de retour',
      body: `${playerName} souhaite un retour sur sa séance`,
      data: {
        type: 'feedback_request',
        playerId,
        playerName,
        screen: 'AdminResponses'
      },
      priority: 'high',
      channelId: 'default',
    }));
    
    // 4. Envoyer via Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });
    
    const result = await response.json();
    console.log('   Réponse Expo:', result);
    
    let sentCount = 0;
    if (result.data) {
      result.data.forEach(ticket => {
        if (ticket.status === 'ok') sentCount++;
      });
    }
    
    console.log(`✅ Notification envoyée à ${sentCount}/${tokens.length} admin(s)`);
    
    // 5. Enregistrer dans l'historique des alertes
    await supabase.from('alert_history').insert({
      player_id: playerId,
      alert_type: 'feedback_request',
      message: `📝 DEMANDE DE RETOUR\n${playerName} souhaite un retour personnalisé`,
      status: sentCount > 0 ? 'sent' : 'failed'
    });
    
    return { success: sentCount > 0, sent: sentCount };
    
  } catch (error) {
    console.error('❌ Erreur envoi demande de retour:', error);
    return { success: false, error: error.message };
  }
};
