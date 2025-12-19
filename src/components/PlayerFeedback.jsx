// src/components/PlayerFeedback.jsx
// Composant pour afficher objectifs + retours du coach (onglet Mes Retours)

import React, { useState, useEffect } from 'react';
import { Mail, Target, Brain, AlertCircle } from 'lucide-react';
import { getPlayerMessages, markMessageAsRead, deleteMessage } from '../services/messageService';

/**
 * Composant PlayerFeedback
 * Affiche:
 * 1. L'objectif individuel de la joueuse
 * 2. L'objectif mental
 * 3. Tous les retours du coach
 * 
 * À ajouter comme onglet dans PlayerDetail
 */
export const PlayerFeedback = ({ supabase, player, objectifIndividuel, objectifMental }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // ============================================================
  // CHARGER LES MESSAGES
  // ============================================================
  useEffect(() => {
    loadMessages();
  }, [player?.id]);

  const loadMessages = async () => {
    if (!player?.id) {
      setError('Aucune joueuse sélectionnée');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📬 Loading messages for player:', player.id);
      const data = await getPlayerMessages(supabase, player.id);
      setMessages(data);
      console.log(`✅ Loaded ${data.length} messages`);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // MARQUER COMME LU
  // ============================================================
  const handleMarkAsRead = async (messageId) => {
    try {
      const success = await markMessageAsRead(supabase, messageId);
      if (success) {
        setMessages(messages.map(msg =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        ));
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // ============================================================
  // SUPPRIMER UN MESSAGE
  // ============================================================
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message?')) {
      return;
    }

    try {
      const success = await deleteMessage(supabase, messageId);
      if (success) {
        setMessages(messages.filter(msg => msg.id !== messageId));
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // ============================================================
  // FILTRER LES MESSAGES
  // ============================================================
  const getFilteredMessages = () => {
    let filtered = messages;

    if (filterType === 'unread') {
      filtered = filtered.filter(msg => !msg.is_read);
    } else if (filterType !== 'all') {
      filtered = filtered.filter(msg => msg.type === filterType);
    }

    return filtered;
  };

  const filteredMessages = getFilteredMessages();
  const unreadCount = messages.filter(msg => !msg.is_read).length;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6 pb-8">
      {/* SECTION 1: OBJECTIFS */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6" style={{color: '#1D2945'}}>
          🎯 Mes Objectifs
        </h2>

        {/* Objectif Individuel */}
        <div className="mb-6 p-4 rounded-lg bg-blue-50 border-l-4" style={{borderColor: '#1D2945'}}>
          <div className="flex items-start gap-3">
            <Target size={24} style={{color: '#1D2945'}} className="flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Objectif Individuel</h3>
              {objectifIndividuel && objectifIndividuel.trim() ? (
                <p className="text-gray-700 whitespace-pre-wrap">{objectifIndividuel}</p>
              ) : (
                <p className="text-gray-500 italic">Pas encore d'objectif défini</p>
              )}
            </div>
          </div>
        </div>

        {/* Objectif Mental */}
        <div className="p-4 rounded-lg bg-purple-50 border-l-4 border-purple-500">
          <div className="flex items-start gap-3">
            <Brain size={24} className="text-purple-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Objectif Mental</h3>
              {objectifMental && objectifMental.trim() ? (
                <p className="text-gray-700 whitespace-pre-wrap">{objectifMental}</p>
              ) : (
                <p className="text-gray-500 italic">Pas encore d'objectif mental défini</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: RETOURS DU COACH */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{color: '#1D2945'}}>
            💬 Retours du Coach
          </h2>
          {unreadCount > 0 && (
            <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white" style={{backgroundColor: '#E74C3C'}}>
              {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
            </span>
          )}
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              filterType === 'all'
                ? 'text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            style={filterType === 'all' ? {backgroundColor: '#1D2945'} : {}}
          >
            Tous ({messages.length})
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => setFilterType('unread')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                filterType === 'unread'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Non lus ({unreadCount})
            </button>
          )}
          <button
            onClick={() => setFilterType('retour_séance')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              filterType === 'retour_séance'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Séances
          </button>
          <button
            onClick={() => setFilterType('retour_objectif')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              filterType === 'retour_objectif'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Objectifs
          </button>
        </div>

        {/* Messages ou message vide */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full mb-4"></div>
              <p className="text-gray-600">Chargement des retours...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-100 text-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <Mail size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Aucun retour pour le moment</p>
            <p className="text-gray-400 text-sm">Les retours du coach s'afficheront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedMessage(msg);
                  if (!msg.is_read) {
                    handleMarkAsRead(msg.id);
                  }
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  msg.is_read
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-blue-300 bg-blue-50'
                } ${selectedMessage?.id === msg.id ? 'ring-2' : ''}`}
                style={{
                  borderColor: !msg.is_read ? '#1D2945' : '#E5E7EB',
                  backgroundColor: !msg.is_read ? '#F0F9FF' : '#F9FAFB',
                  ...(selectedMessage?.id === msg.id ? {ringColor: '#1D2945'} : {})
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {!msg.is_read && (
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#1D2945'}}></div>
                      )}
                      <h3 className="font-semibold text-gray-900">{msg.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{msg.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      {msg.type && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          msg.type === 'retour_séance' ? 'bg-green-100 text-green-800' :
                          msg.type === 'retour_objectif' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {msg.type === 'retour_séance' ? '🎯 Séance' :
                           msg.type === 'retour_objectif' ? '🏆 Objectif' :
                           '📌 Autre'}
                        </span>
                      )}
                      {msg.is_read && (
                        <span className="text-xs text-green-600">✓ Lu</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal message détaillé */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold" style={{color: '#1D2945'}}>
                {selectedMessage.title}
              </h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              {selectedMessage.type && (
                <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium mb-3 ${
                  selectedMessage.type === 'retour_séance' ? 'bg-green-100 text-green-800' :
                  selectedMessage.type === 'retour_objectif' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedMessage.type === 'retour_séance' ? '🎯 Retour de séance' :
                   selectedMessage.type === 'retour_objectif' ? '🏆 Retour d\'objectif' :
                   '📌 Autre'}
                </span>
              )}
              <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.body}</p>
            </div>

            <div className="text-xs text-gray-500 pt-4 border-t">
              {new Date(selectedMessage.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>

            <button
              onClick={() => setSelectedMessage(null)}
              className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerFeedback;
