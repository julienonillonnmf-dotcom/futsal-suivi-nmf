// components/PlayerFeedback.jsx
import React, { useState, useEffect } from 'react';
import { MessageCircle, Target, AlertCircle, RefreshCw } from 'lucide-react';

const PlayerFeedback = ({ 
  supabase, 
  playerId, 
  playerName,
  objectifsIndividuels = '',
  objectifsMentaux = ''
}) => {
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Charger les messages au montage
  useEffect(() => {
    loadMessages();
  }, [playerId]);

  const loadMessages = async () => {
    if (!playerId) {
      console.log('⚠️ Pas de playerId!');
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Recherche messages pour playerId:', playerId);
      
      // Récupérer les messages pour cette joueuse
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      console.log('✅ Requête réussie');
      console.log('Messages reçus:', data?.length);
      console.log('Données complètes:', data);

      if (fetchError) {
        console.error('❌ Erreur Supabase:', fetchError);
        setError('Impossible de charger les retours');
        setMessages([]);
      } else {
        console.log(`✅ ${data?.length || 0} message(s) chargé(s) pour ${playerName}`);
        setMessages(data || []);
      }
    } catch (err) {
      console.error('❌ Erreur catch:', err);
      setError('Erreur lors du chargement des retours');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les messages
  const filteredMessages = messages.filter(msg => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'seances') return msg.type === 'retour_séance';
    if (selectedFilter === 'objectifs') return msg.type === 'retour_objectif';
    return true;
  });

  // Déterminer le badge de type
  const getMessageTypeBadge = (messageType) => {
    const types = {
      'retour_séance': { bg: 'bg-blue-100', text: 'text-blue-800', label: '⚽ Séance' },
      'retour_objectif': { bg: 'bg-purple-100', text: 'text-purple-800', label: '🎯 Objectif' },
      'autre': { bg: 'bg-gray-100', text: 'text-gray-800', label: '💬 Retour' }
    };
    return types[messageType] || types['autre'];
  };

  return (
    <div className="space-y-6">
      
      {/* Section: Mes Objectifs */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center" style={{color: '#1D2945'}}>
          <Target className="mr-2" size={28} />
          Mes Objectifs
        </h2>

        <div className="space-y-4">
          {/* Objectif Individuel */}
          <div className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded">
            <h3 className="font-semibold text-gray-800 flex items-center mb-2">
              <Target size={18} className="mr-2" />
              Objectif Individuel
            </h3>
            {objectifsIndividuels && objectifsIndividuels.trim() ? (
              <p className="text-gray-700 leading-relaxed">{objectifsIndividuels}</p>
            ) : (
              <p className="text-gray-500 italic">Pas encore d'objectif défini</p>
            )}
          </div>

          {/* Objectif Mental */}
          <div className="border-l-4 border-purple-500 pl-4 py-3 bg-purple-50 rounded">
            <h3 className="font-semibold text-gray-800 flex items-center mb-2">
              <AlertCircle size={18} className="mr-2" />
              Objectif Mental
            </h3>
            {objectifsMentaux && objectifsMentaux.trim() ? (
              <p className="text-gray-700 leading-relaxed">{objectifsMentaux}</p>
            ) : (
              <p className="text-gray-500 italic">Pas encore d'objectif mental défini</p>
            )}
          </div>
        </div>
      </div>

      {/* Section: Retours du Coach */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center" style={{color: '#1D2945'}}>
            <MessageCircle className="mr-2" size={28} />
            Retours du Coach
          </h2>
          <button
            onClick={loadMessages}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all disabled:opacity-50"
            title="Rafraîchir les retours"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="text-sm">Actualiser</span>
          </button>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedFilter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tous ({filteredMessages.length})
          </button>
          <button
            onClick={() => setSelectedFilter('seances')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedFilter === 'seances'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            Séances
          </button>
          <button
            onClick={() => setSelectedFilter('objectifs')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedFilter === 'objectifs'
                ? 'bg-purple-500 text-white'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            Objectifs
          </button>
        </div>

        {/* Affichage des messages */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <RefreshCw size={32} className="text-blue-500" />
            </div>
            <p className="text-gray-600 mt-4">Chargement des retours...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
            <AlertCircle className="inline mr-2 text-red-600" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <MessageCircle className="inline mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 font-medium">Aucun retour pour le moment</p>
            <p className="text-gray-500 text-sm">Les retours du coach apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => {
              const badgeStyle = getMessageTypeBadge(message.type);
              
              return (
                <div
                  key={message.id}
                  className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Badge Type */}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeStyle.bg} ${badgeStyle.text}`}>
                        {badgeStyle.label}
                      </span>
                      
                      {/* Badge Collectif/Individuel */}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        message.is_collective 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {message.is_collective ? '👥 Collectif' : '👤 Individuel'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {message.title && (
                    <h4 className="font-bold text-gray-800 mb-2" style={{color: '#1D2945'}}>
                      {message.title}
                    </h4>
                  )}

                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                    {message.body}
                  </p>

                  {/* Affichage des objectifs associés */}
                  <div className="bg-white rounded p-3 border border-gray-200 text-sm">
                    <p className="font-semibold text-gray-700 mb-2">📋 Objectifs associés à cette date:</p>
                    <div className="space-y-2 text-xs text-gray-600">
                      {objectifsIndividuels && objectifsIndividuels.trim() && (
                        <div className="pl-2 border-l-2 border-blue-300">
                          <span className="font-medium">Objectif Individuel:</span> {objectifsIndividuels}
                        </div>
                      )}
                      {objectifsMentaux && objectifsMentaux.trim() && (
                        <div className="pl-2 border-l-2 border-purple-300">
                          <span className="font-medium">Objectif Mental:</span> {objectifsMentaux}
                        </div>
                      )}
                      {(!objectifsIndividuels || !objectifsIndividuels.trim()) && 
                       (!objectifsMentaux || !objectifsMentaux.trim()) && (
                        <p className="italic text-gray-500">Aucun objectif défini à cette date</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerFeedback;
