// components/AdminMessageSender.jsx
import React, { useState, useEffect } from 'react';
import { Send, AlertCircle, CheckCircle, X, Trash2, RefreshCw } from 'lucide-react';

const AdminMessageSender = ({ supabase, players }) => {
  const [activeTab, setActiveTab] = useState('collectif');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [messageType, setMessageType] = useState('retour_séance');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Pour l'onglet "Dernier retour"
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const messageTypes = [
    { value: 'retour_séance', label: '⚽ Retour de séance' },
    { value: 'retour_objectif', label: '🎯 Retour d\'objectif' },
    { value: 'autre', label: '💬 Autre' }
  ];

  // Charger les derniers messages
  useEffect(() => {
    if (activeTab === 'dernier') {
      loadRecentMessages();
    }
  }, [activeTab]);

  const loadRecentMessages = async () => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erreur chargement messages:', error);
        setMessages([]);
      } else {
        console.log(`✅ ${data?.length || 0} message(s) chargé(s)`);
        setMessages(data || []);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const clearForm = () => {
    setTitle('');
    setContent('');
    setSelectedPlayer('');
    setMessageType('retour_séance');
  };

  const handleSendMessage = async () => {
    // Validations
    if (!title.trim()) {
      setMessage({ type: 'error', text: '⚠️ Veuillez entrer un titre' });
      return;
    }

    if (!content.trim()) {
      setMessage({ type: 'error', text: '⚠️ Veuillez entrer le contenu du retour' });
      return;
    }

    if (activeTab === 'individuel' && !selectedPlayer) {
      setMessage({ type: 'error', text: '⚠️ Veuillez sélectionner une joueuse' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (activeTab === 'collectif') {
        // Envoyer à TOUTES les joueuses actives
        console.log('📤 Envoi message collectif à toutes les joueuses...');
        
        const activePlayers = players.filter(p => p.is_active !== false);
        
        // Créer un message pour chaque joueuse
        const messagesToInsert = activePlayers.map(player => ({
          player_id: player.id,
          coach_id: 'coach',
          title: title,
          body: content,
          type: messageType,
          is_read: false
        }));

        console.log(`📝 ${messagesToInsert.length} message(s) à insérer`);

        const { error: insertError } = await supabase
          .from('messages')
          .insert(messagesToInsert);

        if (insertError) {
          console.error('❌ Erreur insertion:', insertError);
          setMessage({ 
            type: 'error', 
            text: `❌ Erreur: ${insertError.message}` 
          });
          return;
        }

        console.log('✅ Messages collectifs envoyés!');
        setMessage({ 
          type: 'success', 
          text: `✅ Retour envoyé à ${activePlayers.length} joueuse(s)!` 
        });
        
      } else {
        // Envoyer à une joueuse spécifique
        console.log(`📤 Envoi message individuel à ${selectedPlayer}...`);
        
        const playerObj = players.find(p => p.id === selectedPlayer);
        
        if (!playerObj) {
          setMessage({ type: 'error', text: '❌ Joueuse non trouvée' });
          return;
        }

        const messageData = {
          player_id: selectedPlayer,
          coach_id: 'coach',
          title: title,
          body: content,
          type: messageType,
          is_read: false
        };

        console.log('📝 Envoi:', messageData);

        const { error: insertError } = await supabase
          .from('messages')
          .insert([messageData]);

        if (insertError) {
          console.error('❌ Erreur insertion:', insertError);
          setMessage({ 
            type: 'error', 
            text: `❌ Erreur: ${insertError.message}` 
          });
          return;
        }

        console.log('✅ Message envoyé!');
        setMessage({ 
          type: 'success', 
          text: `✅ Retour envoyé à ${playerObj.name}!` 
        });
      }

      // Vider le formulaire après succès
      setTimeout(() => {
        clearForm();
        setMessage({ type: '', text: '' });
      }, 2000);

    } catch (error) {
      console.error('❌ Erreur:', error);
      setMessage({ 
        type: 'error', 
        text: `❌ Erreur inattendue: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer ce retour?')) {
      return;
    }

    setDeletingId(messageId);
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('❌ Erreur suppression:', error);
        alert('❌ Erreur lors de la suppression');
      } else {
        console.log('✅ Message supprimé');
        // Retirer le message de la liste
        setMessages(messages.filter(m => m.id !== messageId));
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  // Fonction pour obtenir le nom de la joueuse
  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Joueuse inconnue';
  };

  // Fonction pour obtenir le label du type
  const getTypeLabel = (type) => {
    const typeObj = messageTypes.find(t => t.value === type);
    return typeObj?.label || type;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6" style={{color: '#1D2945'}}>
        <Send className="inline mr-2" size={24} />
        Envoyer un Retour
      </h2>

      {/* Sous-onglets: Collectif vs Individuel vs Dernier Retour */}
      <div className="flex gap-2 mb-6 border-b flex-wrap">
        <button
          onClick={() => {
            setActiveTab('collectif');
            clearForm();
          }}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'collectif'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          👥 Collectif (Toutes les joueuses)
        </button>
        <button
          onClick={() => {
            setActiveTab('individuel');
            clearForm();
          }}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'individuel'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          👤 Individuel (Une joueuse)
        </button>
        <button
          onClick={() => setActiveTab('dernier')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'dernier'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📋 Derniers Retours
        </button>
      </div>

      {/* Message de feedback */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border-l-4 border-green-500' 
            : 'bg-red-50 border-l-4 border-red-500'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          ) : (
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          )}
          <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </span>
        </div>
      )}

      {/* ONGLET: COLLECTIF & INDIVIDUEL */}
      {(activeTab === 'collectif' || activeTab === 'individuel') && (
        <div className="space-y-4">
          
          {/* Sélection de joueuse (uniquement pour individuel) */}
          {activeTab === 'individuel' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                👤 Sélectionner une joueuse *
              </label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">-- Choisir une joueuse --</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type de retour */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type de retour *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {messageTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setMessageType(type.value)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    messageType === type.value
                      ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Titre du retour *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Bon match! ou Amélioration défense"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Contenu */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contenu du retour *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écris ici ton retour, ton feedback, tes observations..."
              rows={6}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {content.length} caractères
            </p>
          </div>

          {/* Bouton d'envoi */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSendMessage}
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <Send size={18} />
              <span>{loading ? 'Envoi...' : '📤 Envoyer le retour'}</span>
            </button>
            <button
              onClick={clearForm}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50 font-semibold"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ONGLET: DERNIERS RETOURS */}
      {activeTab === 'dernier' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              📋 Historique des retours
            </h3>
            <button
              onClick={loadRecentMessages}
              disabled={loadingMessages}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={loadingMessages ? 'animate-spin' : ''} />
              <span className="text-sm">Actualiser</span>
            </button>
          </div>

          {loadingMessages ? (
            <div className="text-center py-8">
              <RefreshCw className="inline animate-spin text-blue-500 mb-2" size={32} />
              <p className="text-gray-600">Chargement des retours...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <AlertCircle className="inline text-gray-400 mb-2" size={48} />
              <p className="text-gray-600">Aucun retour envoyé pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">
                          {getPlayerName(msg.player_id)}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                          {msg.type === 'retour_séance' ? '⚽ Séance' :
                           msg.type === 'retour_objectif' ? '🎯 Objectif' :
                           '💬 Autre'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-800">
                        {msg.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      disabled={deletingId === msg.id}
                      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all disabled:opacity-50 flex items-center space-x-1 text-sm"
                    >
                      <Trash2 size={14} />
                      <span>{deletingId === msg.id ? 'Suppression...' : 'Supprimer'}</span>
                    </button>
                  </div>

                  <p className="text-gray-700 text-sm line-clamp-2 mb-2">
                    {msg.body}
                  </p>

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      📅 {new Date(msg.created_at).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className={msg.is_read ? 'text-blue-600' : 'text-gray-500'}>
                      {msg.is_read ? '✅ Lu' : '📨 Non lu'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info sur la base de données */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>ℹ️ Info:</strong> Les retours sont stockés dans la table 'messages' avec les colonnes: player_id, coach_id, title, body, type, created_at, is_read
        </p>
      </div>
    </div>
  );
};

export default AdminMessageSender;
