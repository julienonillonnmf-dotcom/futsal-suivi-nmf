// src/services/messageService.js
// Service pour gérer les messages de retour du coach

/**
 * Envoyer un message de retour à une joueuse
 */
export const sendMessageToPlayer = async (supabase, playerId, title, body, type = 'autre') => {
  try {
    if (!playerId || !title || !body) {
      console.warn('⚠️ Missing required fields');
      return {
        success: false,
        error: 'Title, body et player_id sont requis'
      };
    }

    console.log('📨 Sending message to player:', playerId);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        player_id: playerId,
        title,
        body,
        type,
        created_at: new Date().toISOString(),
        is_read: false
      })
      .select();

    if (error) {
      console.error('❌ Error sending message:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Message sent successfully');
    return {
      success: true,
      data: data[0]
    };
  } catch (error) {
    console.error('❌ Error in sendMessageToPlayer:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Envoyer un message collectif (à toutes les joueuses)
 */
export const sendCollectiveMessage = async (supabase, title, body, type = 'autre') => {
  try {
    if (!title || !body) {
      console.warn('⚠️ Missing required fields');
      return {
        success: false,
        error: 'Title et body sont requis'
      };
    }

    console.log('📢 Sending collective message');

    // D'abord, récupérer tous les IDs des joueuses actives (hors staff)
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id')
      .eq('is_active', true)
      .eq('is_staff', false);

    if (playersError) {
      console.error('Error fetching players:', playersError);
      return {
        success: false,
        error: playersError.message
      };
    }

    if (!players || players.length === 0) {
      return {
        success: false,
        error: 'Aucune joueuse active trouvée'
      };
    }

    // Créer un message pour chaque joueuse
    const messages = players.map(player => ({
      player_id: player.id,
      title,
      body,
      type,
      created_at: new Date().toISOString(),
      is_read: false
    }));

    const { data, error } = await supabase
      .from('messages')
      .insert(messages)
      .select();

    if (error) {
      console.error('❌ Error sending collective message:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log(`✅ Collective message sent to ${data.length} players`);
    return {
      success: true,
      count: data.length,
      data
    };
  } catch (error) {
    console.error('❌ Error in sendCollectiveMessage:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Récupérer tous les messages pour une joueuse
 */
export const getPlayerMessages = async (supabase, playerId) => {
  try {
    if (!playerId) {
      console.warn('⚠️ No player ID provided');
      return [];
    }

    console.log('📬 Fetching messages for player:', playerId);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    console.log(`✅ Found ${data.length} messages`);
    return data || [];
  } catch (error) {
    console.error('❌ Error in getPlayerMessages:', error);
    return [];
  }
};

/**
 * Récupérer les messages non lus pour une joueuse
 */
export const getUnreadMessages = async (supabase, playerId) => {
  try {
    if (!playerId) {
      console.warn('⚠️ No player ID provided');
      return [];
    }

    console.log('📭 Fetching unread messages for player:', playerId);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('player_id', playerId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching unread messages:', error);
      return [];
    }

    console.log(`✅ Found ${data.length} unread messages`);
    return data || [];
  } catch (error) {
    console.error('❌ Error in getUnreadMessages:', error);
    return [];
  }
};

/**
 * Marquer un message comme lu
 */
export const markMessageAsRead = async (supabase, messageId) => {
  try {
    if (!messageId) {
      console.warn('⚠️ No message ID provided');
      return false;
    }

    console.log('✋ Marking message as read:', messageId);

    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) {
      console.error('Error marking message as read:', error);
      return false;
    }

    console.log('✅ Message marked as read');
    return true;
  } catch (error) {
    console.error('❌ Error in markMessageAsRead:', error);
    return false;
  }
};

/**
 * Supprimer un message
 */
export const deleteMessage = async (supabase, messageId) => {
  try {
    if (!messageId) {
      console.warn('⚠️ No message ID provided');
      return false;
    }

    console.log('🗑️ Deleting message:', messageId);

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      return false;
    }

    console.log('✅ Message deleted');
    return true;
  } catch (error) {
    console.error('❌ Error in deleteMessage:', error);
    return false;
  }
};

/**
 * Compter les messages non lus
 */
export const countUnreadMessages = async (supabase, playerId) => {
  try {
    if (!playerId) {
      return 0;
    }

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('player_id', playerId)
      .eq('is_read', false);

    if (error) {
      console.error('Error counting unread messages:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('❌ Error in countUnreadMessages:', error);
    return 0;
  }
};

console.log('✅ Message Service loaded');
