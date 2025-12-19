// components/AdminMessageSender.jsx
import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle, X } from 'lucide-react';

const AdminMessageSender = ({ supabase, players }) => {
  const [activeTab, setActiveTab] = useState('collectif');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [messageType, setMessageType] = useState('retour_séance');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const messageTypes = [
    { value: 'retour_séance', label: '⚽ Retour de séance' },
    { value: 'retour_objectif', label: '🎯 Retour d\'objectif' },
    { value: 'autre', label: '💬 Autre' }
  ];

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
          coach_id: 'coach', // À adapter selon ton système
          title: title,
          body: content,
          type: messageType,
          is_read: false
        }));

        console.log(`📝 ${messagesToInsert.length} message(s) à insérer`);
        console.log('Exemple:', messagesToInsert[0]);

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
          coach_id: 'coach', // À adapter selon ton système
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6" style={{color: '#1D2945'}}>
        <Send className="inline mr-2" size={24} />
        Envoyer un Retour
      </h2>

      {/* Sous-onglets: Collectif vs Individuel */}
      <div className="flex gap-2 mb-6 border-b">
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

      {/* Contenu de l'onglet */}
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
