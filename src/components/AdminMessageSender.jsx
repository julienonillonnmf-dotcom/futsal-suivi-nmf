// src/components/AdminMessageSender.jsx
// Composant pour envoyer des messages de retour (pour AdminPanel)

import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';
import { sendMessageToPlayer, sendCollectiveMessage } from '../services/messageService';

/**
 * Composant AdminMessageSender
 * À ajouter dans AdminPanel
 */
export const AdminMessageSender = ({ supabase, players }) => {
  const [activeTab, setActiveTab] = useState('collective'); // 'collective' ou 'individual'
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [messageType, setMessageType] = useState('retour_séance');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // ============================================================
  // ENVOYER MESSAGE COLLECTIF
  // ============================================================
  const handleSendCollective = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !body.trim()) {
      setMessage({ type: 'error', text: 'Titre et message sont requis' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log('📢 Sending collective message...');
      
      const result = await sendCollectiveMessage(supabase, title, body, messageType);

      if (result.success) {
        setMessage({
          type: 'success',
          text: `✅ Message envoyé à ${result.count} joueuses!`
        });
        
        // Réinitialiser le formulaire
        setTitle('');
        setBody('');
        setMessageType('retour_séance');
        
        // Masquer le message après 3 secondes
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: 'error',
          text: `❌ Erreur: ${result.error}`
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage({
        type: 'error',
        text: `❌ Erreur: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ENVOYER MESSAGE INDIVIDUEL
  // ============================================================
  const handleSendIndividual = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !body.trim()) {
      setMessage({ type: 'error', text: 'Titre et message sont requis' });
      return;
    }

    if (!selectedPlayerId) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une joueuse' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log('💬 Sending individual message to:', selectedPlayerId);
      
      const selectedPlayer = players.find(p => p.id === selectedPlayerId);
      
      const result = await sendMessageToPlayer(supabase, selectedPlayerId, title, body, messageType);

      if (result.success) {
        setMessage({
          type: 'success',
          text: `✅ Message envoyé à ${selectedPlayer?.name}!`
        });
        
        // Réinitialiser le formulaire
        setTitle('');
        setBody('');
        setMessageType('retour_séance');
        setSelectedPlayerId('');
        
        // Masquer le message après 3 secondes
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: 'error',
          text: `❌ Erreur: ${result.error}`
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage({
        type: 'error',
        text: `❌ Erreur: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4" style={{color: '#1D2945'}}>
        💬 Envoyer un Retour
      </h2>

      {/* Message de statut */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          onClick={() => setActiveTab('collective')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'collective'
              ? 'border-b-2'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          style={activeTab === 'collective' ? { borderBottomColor: '#1D2945', color: '#1D2945' } : {}}
        >
          📢 Collectif
        </button>
        <button
          onClick={() => setActiveTab('individual')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'individual'
              ? 'border-b-2'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          style={activeTab === 'individual' ? { borderBottomColor: '#1D2945', color: '#1D2945' } : {}}
        >
          💬 Individuel
        </button>
      </div>

      {/* Formulaire Collectif */}
      {activeTab === 'collective' && (
        <form onSubmit={handleSendCollective} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type de retour
            </label>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              disabled={loading}
            >
              <option value="retour_séance">Retour de séance</option>
              <option value="retour_objectif">Retour sur l'objectif</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Titre du message
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Objectifs du groupe mis à jour"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Écrivez votre message..."
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim() || !body.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{background: loading ? '#999' : '#1D2945'}}
          >
            <Send size={18} />
            {loading ? 'Envoi en cours...' : 'Envoyer à toutes'}
          </button>
        </form>
      )}

      {/* Formulaire Individuel */}
      {activeTab === 'individual' && (
        <form onSubmit={handleSendIndividual} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sélectionner une joueuse
            </label>
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              disabled={loading}
            >
              <option value="">-- Choisir une joueuse --</option>
              {players && players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type de retour
            </label>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              disabled={loading}
            >
              <option value="retour_séance">Retour de séance</option>
              <option value="retour_objectif">Retour sur l'objectif</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Titre du message
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Retour personnel"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Écrivez votre message personnalisé..."
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim() || !body.trim() || !selectedPlayerId}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{background: loading ? '#999' : '#1D2945'}}
          >
            <Send size={18} />
            {loading ? 'Envoi en cours...' : 'Envoyer'}
          </button>
        </form>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
        <strong>ℹ️ Info:</strong> Les messages seront affichés dans la section "Mes retours" de chaque joueuse.
      </div>
    </div>
  );
};

export default AdminMessageSender;
