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

  useEffect(() => {
    loadMessages();
  }, [playerId]);

  const loadMessages = async () => {
    if (!playerId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError('Impossible de charger les retours');
        setMessages([]);
      } else {
        setMessages(data || []);
      }
    } catch (err) {
      setError('Erreur lors du chargement des retours');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'seances') return msg.type === 'retour_séance';
    if (selectedFilter === 'objectifs') return msg.type === 'retour_objectif';
    return true;
  });

  const getMessageTypeBadge = (messageType) => {
    const types = {
      'retour_séance': { bg: '#dbeafe', text: '#1e40af', label: '⚽ Séance' },
      'retour_objectif': { bg: '#f3e8ff', text: '#6b21a8', label: '🎯 Objectif' },
      'autre': { bg: '#f3f4f6', text: '#374151', label: '💬 Retour' }
    };
    return types[messageType] || types['autre'];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Section: Mes Objectifs */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        padding: '1.5rem'
      }}>
        <h2 style={{
          fontSize: '1.875rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: '#1D2945',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Target style={{ marginRight: '0.5rem', width: 28, height: 28 }} />
          Mes Objectifs
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Objectif Individuel */}
          <div style={{
            borderLeft: '4px solid #3b82f6',
            paddingLeft: '1rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
            backgroundColor: '#eff6ff',
            borderRadius: '0.25rem'
          }}>
            <h3 style={{
              fontWeight: '600',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <Target style={{ marginRight: '0.5rem', width: 18, height: 18 }} />
              Objectif Individuel
            </h3>
            {objectifsIndividuels && objectifsIndividuels.trim() ? (
              <p style={{ color: '#374151', lineHeight: 1.5 }}>{objectifsIndividuels}</p>
            ) : (
              <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Pas encore d'objectif défini</p>
            )}
          </div>

          {/* Objectif Mental */}
          <div style={{
            borderLeft: '4px solid #a855f7',
            paddingLeft: '1rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
            backgroundColor: '#faf5ff',
            borderRadius: '0.25rem'
          }}>
            <h3 style={{
              fontWeight: '600',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <AlertCircle style={{ marginRight: '0.5rem', width: 18, height: 18 }} />
              Objectif Mental
            </h3>
            {objectifsMentaux && objectifsMentaux.trim() ? (
              <p style={{ color: '#374151', lineHeight: 1.5 }}>{objectifsMentaux}</p>
            ) : (
              <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Pas encore d'objectif mental défini</p>
            )}
          </div>
        </div>
      </div>

      {/* Section: Retours du Coach */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        padding: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#1D2945',
            display: 'flex',
            alignItems: 'center',
            margin: 0
          }}>
            <MessageCircle style={{ marginRight: '0.5rem', width: 28, height: 28 }} />
            Retours du Coach
          </h2>
          <button
            onClick={loadMessages}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              paddingLeft: '0.75rem',
              paddingRight: '0.75rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#bfdbfe')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#dbeafe')}
          >
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Filtres */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setSelectedFilter('all')}
            style={{
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              borderRadius: '9999px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: selectedFilter === 'all' ? '#1f2937' : '#e5e7eb',
              color: selectedFilter === 'all' ? '#ffffff' : '#374151'
            }}
          >
            Tous ({filteredMessages.length})
          </button>
          <button
            onClick={() => setSelectedFilter('seances')}
            style={{
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              borderRadius: '9999px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: selectedFilter === 'seances' ? '#3b82f6' : '#dbeafe',
              color: selectedFilter === 'seances' ? '#ffffff' : '#1e40af'
            }}
          >
            Séances
          </button>
          <button
            onClick={() => setSelectedFilter('objectifs')}
            style={{
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              borderRadius: '9999px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: selectedFilter === 'objectifs' ? '#a855f7' : '#f3e8ff',
              color: selectedFilter === 'objectifs' ? '#ffffff' : '#6b21a8'
            }}
          >
            Objectifs
          </button>
        </div>

        {/* Affichage des messages */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            paddingTop: '3rem',
            paddingBottom: '3rem'
          }}>
            <div style={{
              display: 'inline-block',
              animation: 'spin 1s linear infinite'
            }}>
              <RefreshCw size={32} style={{ color: '#3b82f6' }} />
            </div>
            <p style={{
              color: '#4b5563',
              marginTop: '1rem'
            }}>Chargement des retours...</p>
          </div>
        ) : error ? (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '2px solid #fca5a5',
            borderRadius: '0.5rem',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <AlertCircle style={{
              display: 'inline',
              marginRight: '0.5rem',
              color: '#dc2626'
            }} size={20} />
            <p style={{
              color: '#b91c1c',
              display: 'inline'
            }}>{error}</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div style={{
            backgroundColor: '#f9fafb',
            border: '2px dashed #d1d5db',
            borderRadius: '0.5rem',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <MessageCircle style={{
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: '1rem',
              color: '#9ca3af'
            }} size={48} />
            <p style={{
              color: '#4b5563',
              fontWeight: '500'
            }}>Aucun retour pour le moment</p>
            <p style={{
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>Les retours du coach apparaîtront ici</p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {filteredMessages.map((message) => {
              const badgeStyle = getMessageTypeBadge(message.type);
              
              return (
                <div
                  key={message.id}
                  style={{
                    borderLeft: '4px solid #3b82f6',
                    backgroundColor: '#eff6ff',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    transition: 'box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'}
                >
                  {/* Badges Type + Collectif/Individuel */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Badge Type */}
                      <span style={{
                        paddingLeft: '0.75rem',
                        paddingRight: '0.75rem',
                        paddingTop: '0.25rem',
                        paddingBottom: '0.25rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: badgeStyle.bg,
                        color: badgeStyle.text
                      }}>
                        {badgeStyle.label}
                      </span>
                      
                      {/* Badge Collectif/Individuel */}
                      <span style={{
                        paddingLeft: '0.75rem',
                        paddingRight: '0.75rem',
                        paddingTop: '0.25rem',
                        paddingBottom: '0.25rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: message.is_collective ? '#fef3c7' : '#f3e8ff',
                        color: message.is_collective ? '#92400e' : '#6b21a8'
                      }}>
                        {message.is_collective ? '👥 Collectif' : '👤 Individuel'}
                      </span>
                    </div>
                    
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      {new Date(message.created_at).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Titre */}
                  {message.title && (
                    <h4 style={{
                      fontWeight: 'bold',
                      color: '#1D2945',
                      marginBottom: '0.5rem'
                    }}>
                      {message.title}
                    </h4>
                  )}

                  {/* Contenu */}
                  <p style={{
                    color: '#374151',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    marginBottom: '0.75rem'
                  }}>
                    {message.body}
                  </p>

                  {/* Objectifs associés */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '0.25rem',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.875rem'
                  }}>
                    <p style={{
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem',
                      margin: 0
                    }}>📋 Objectifs associés à cette date:</p>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#4b5563',
                      marginTop: '0.5rem'
                    }}>
                      {objectifsIndividuels && objectifsIndividuels.trim() && (
                        <div style={{
                          paddingLeft: '0.5rem',
                          borderLeft: '2px solid #3b82f6'
                        }}>
                          <span style={{ fontWeight: '500' }}>Objectif Individuel:</span> {objectifsIndividuels}
                        </div>
                      )}
                      {objectifsMentaux && objectifsMentaux.trim() && (
                        <div style={{
                          paddingLeft: '0.5rem',
                          borderLeft: '2px solid #a855f7'
                        }}>
                          <span style={{ fontWeight: '500' }}>Objectif Mental:</span> {objectifsMentaux}
                        </div>
                      )}
                      {(!objectifsIndividuels || !objectifsIndividuels.trim()) && 
                       (!objectifsMentaux || !objectifsMentaux.trim()) && (
                        <p style={{ fontStyle: 'italic', color: '#9ca3af' }}>Aucun objectif défini à cette date</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PlayerFeedback;
