// views/AdminPlayerDetail.jsx - VERSION COMPLÈTE FUSIONNÉE
// Inclut: Suivi longitudinal des blessures + Filtres métriques avancés + Cycle menstruel
import React, { useState, useRef, useMemo } from 'react';
import { 
  ChevronLeft, 
  Camera, 
  Edit3, 
  Save, 
  X, 
  Upload,
  User,
  Target,
  Brain,
  Calendar,
  BarChart3,
  MessageSquare,
  Filter
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ============================================
// FONCTION 1: Traitement longitudinal des blessures
// ============================================
const processInjuryTracking = (responses, injuryStartDate, injuryEndDate) => {
  const injuryTracking = new Map();
  
  const injuryResponses = responses.filter(r => {
    const responseDate = new Date(r.created_at);
    if (injuryStartDate && new Date(injuryStartDate) > responseDate) return false;
    if (injuryEndDate && new Date(injuryEndDate) < responseDate) return false;
    
    return r.type === 'injury' || (r.data?.injuries && r.data.injuries.length > 0);
  });

  injuryResponses.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  injuryResponses.forEach(response => {
    const date = new Date(response.created_at);
    const injuries = response.data?.injuries || [];
    
    injuries.forEach(injury => {
      const zone = (injury.location || injury.zone || 'Non spécifiée').toLowerCase().trim();
      const douleur = Number(injury.intensity || injury.douleur || 0);
      const status = injury.status || injury.active || 'unknown';
      const isActive = status === 'active' || status === 'oui' || injury.active === true;
      
      if (!injuryTracking.has(zone)) {
        injuryTracking.set(zone, []);
      }
      
      injuryTracking.get(zone).push({
        date: date,
        dateStr: date.toLocaleDateString('fr-FR'),
        douleur: douleur,
        isActive: isActive,
        description: injury.description || ''
      });
    });
  });

  const uniqueInjuries = [];
  const DAYS_GAP_THRESHOLD = 14;
  
  injuryTracking.forEach((timeline, zone) => {
    timeline.sort((a, b) => a.date - b.date);
    
    let currentInjury = null;
    
    timeline.forEach((entry, index) => {
      const shouldCreateNew = !currentInjury || 
        (index > 0 && 
         (entry.date - timeline[index - 1].date) / (1000 * 60 * 60 * 24) > DAYS_GAP_THRESHOLD);
      
      if (shouldCreateNew) {
        currentInjury = {
          zone: zone,
          zoneDisplay: zone.charAt(0).toUpperCase() + zone.slice(1),
          startDate: entry.date,
          lastUpdate: entry.date,
          timeline: [entry],
          isCurrentlyActive: entry.isActive,
          initialDouleur: entry.douleur,
          currentDouleur: entry.douleur,
          peakDouleur: entry.douleur,
          totalReports: 1
        };
        uniqueInjuries.push(currentInjury);
      } else {
        currentInjury.timeline.push(entry);
        currentInjury.lastUpdate = entry.date;
        currentInjury.isCurrentlyActive = entry.isActive;
        currentInjury.currentDouleur = entry.douleur;
        currentInjury.peakDouleur = Math.max(currentInjury.peakDouleur, entry.douleur);
        currentInjury.totalReports++;
      }
    });
  });

  uniqueInjuries.sort((a, b) => b.lastUpdate - a.lastUpdate);
  return uniqueInjuries;
};

const AdminPlayerDetail = ({ 
  selectedPlayer,
  setSelectedPlayer,
  setCurrentView,
  loading,
  setLoading,
  playerStats,
  objectifsIndividuels,
  setObjectifsIndividuels,
  objectifsMentaux,
  setObjectifsMentaux,
  players,
  setPlayers,
  supabase
}) => {
  
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [editingTechnical, setEditingTechnical] = useState(false);
  const [editingMental, setEditingMental] = useState(false);
  const [tempTechnicalObjectives, setTempTechnicalObjectives] = useState('');
  const [tempMentalObjectives, setTempMentalObjectives] = useState('');
  const fileInputRef = useRef(null);
  
  // Filtres pour les blessures
  const [injuryStartDate, setInjuryStartDate] = useState('');
  const [injuryEndDate, setInjuryEndDate] = useState('');
  const [expandedInjury, setExpandedInjury] = useState(null);
  
  // Filtres pour les métriques
  const [metricsStartDate, setMetricsStartDate] = useState('');
  const [metricsEndDate, setMetricsEndDate] = useState('');
  const [selectedMetricsToDisplay, setSelectedMetricsToDisplay] = useState(['motivation', 'fatigue', 'intensite_rpe', 'plaisir']);

  // Filtres pour le cycle menstruel
  const [menstrualStartDate, setMenstrualStartDate] = useState('');
  const [menstrualEndDate, setMenstrualEndDate] = useState('');

  if (!selectedPlayer) return null;

  const stats = playerStats[selectedPlayer.id] || {};

  // Options de métriques disponibles
  const availableMetrics = [
    { value: 'motivation', label: 'Motivation', color: '#2563eb' },
    { value: 'fatigue', label: 'Fatigue', color: '#dc2626' },
    { value: 'intensite_rpe', label: 'RPE', color: '#f59e0b' },
    { value: 'plaisir', label: 'Plaisir', color: '#10b981' },
    { value: 'plaisir_seance', label: 'Plaisir séance', color: '#059669' },
    { value: 'confiance', label: 'Confiance', color: '#8b5cf6' },
    { value: 'technique', label: 'Technique', color: '#ec4899' },
    { value: 'tactique', label: 'Tactique', color: '#6366f1' },
    { value: 'atteinte_objectifs', label: 'Atteinte objectifs', color: '#f97316' },
    { value: 'influence_groupe', label: 'Influence groupe', color: '#14b8a6' }
  ];

  // ============================================
  // FONCTION 2: Calcul EMA (Moyenne Mobile Exponentielle)
  // ============================================
  const calculateEMA = (data, period = 7) => {
    if (data.length === 0) return [];
    const multiplier = 2 / (period + 1);
    const ema = [];
    ema.push(data[0]);
    for (let i = 1; i < data.length; i++) {
      const emaValue = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
      ema.push(emaValue);
    }
    return ema;
  };

  // ============================================
  // TRAITEMENT DES DONNÉES DE MÉTRIQUES
  // ============================================
  const processedChartData = useMemo(() => {
    if (!stats.chartData || stats.chartData.length === 0) return { chartData: [], averages: {}, emaData: {} };
    
    let filteredData = stats.chartData.filter(item => {
      const [day, month, year] = item.date.split('/');
      const itemDate = new Date(year, month - 1, day);
      
      if (metricsStartDate) {
        const startDate = new Date(metricsStartDate);
        if (itemDate < startDate) return false;
      }
      
      if (metricsEndDate) {
        const endDate = new Date(metricsEndDate);
        if (itemDate > endDate) return false;
      }
      
      return true;
    });
    
    filteredData.sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split('/');
      const [dayB, monthB, yearB] = b.date.split('/');
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return dateA - dateB;
    });
    
    const averages = {};
    const emaData = {};
    
    selectedMetricsToDisplay.forEach(metric => {
      const values = filteredData
        .map(item => item[metric])
        .filter(val => val != null && !isNaN(val))
        .map(val => Number(val));
      
      if (values.length > 0) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        averages[metric] = Number(avg.toFixed(1));
        const emaValues = calculateEMA(values, 7);
        emaData[metric] = emaValues;
      }
    });
    
    const enrichedData = filteredData.map((item, index) => {
      const enriched = { ...item };
      
      selectedMetricsToDisplay.forEach(metric => {
        if (averages[metric] != null) {
          enriched[`${metric}_avg`] = averages[metric];
        }
        
        const metricValues = filteredData
          .slice(0, index + 1)
          .map(d => d[metric])
          .filter(v => v != null && !isNaN(v));
        
        if (metricValues.length > 0) {
          const emaForMetric = calculateEMA(metricValues, 7);
          enriched[`${metric}_ema`] = Number(emaForMetric[emaForMetric.length - 1].toFixed(1));
        }
      });
      
      return enriched;
    });
    
    return { chartData: enrichedData, averages, emaData };
  }, [stats.chartData, metricsStartDate, metricsEndDate, selectedMetricsToDisplay]);

  // ============================================
  // TRAITEMENT DES BLESSURES LONGITUDINALES
  // ============================================
  const uniqueInjuries = useMemo(() => {
    if (!selectedPlayer || !selectedPlayer.responses) return [];
    return processInjuryTracking(selectedPlayer.responses, injuryStartDate, injuryEndDate);
  }, [selectedPlayer, injuryStartDate, injuryEndDate]);

  const injuryStats = useMemo(() => {
    const activeInjuries = uniqueInjuries.filter(inj => inj.isCurrentlyActive).length;
    const totalInjuries = uniqueInjuries.length;
    const healedInjuries = totalInjuries - activeInjuries;
    const zonesAffected = new Set(uniqueInjuries.map(inj => inj.zone)).size;
    return { activeInjuries, totalInjuries, healedInjuries, zonesAffected };
  }, [uniqueInjuries]);

  // Initialiser les objectifs
  React.useEffect(() => {
    setTempTechnicalObjectives(objectifsIndividuels[selectedPlayer.id] || '');
    setTempMentalObjectives(objectifsMentaux[selectedPlayer.id] || '');
  }, [selectedPlayer.id, objectifsIndividuels, objectifsMentaux]);

  // ============================================
  // FONCTIONS DE GESTION
  // ============================================
  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Maximum 5MB.');
        return;
      }
      const fileExt = 'jpg';
      const fileName = `${selectedPlayer.id}-${Date.now()}.${fileExt}`;
      const filePath = `player-photos/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);
      const { error: updateError } = await supabase
        .from('players')
        .update({ photo_url: publicUrl.publicUrl })
        .eq('id', selectedPlayer.id);
      if (updateError) throw updateError;
      const updatedPlayer = { ...selectedPlayer, photo_url: publicUrl.publicUrl };
      setSelectedPlayer(updatedPlayer);
      setPlayers(prev => prev.map(p => 
        p.id === selectedPlayer.id ? updatedPlayer : p
      ));
      setEditingPhoto(false);
      alert('Photo mise à jour avec succès !');
    } catch (error) {
      console.error('Erreur upload photo:', error);
      alert('Erreur lors de la mise à jour de la photo: ' + error.message);
    }
    setLoading(false);
  };

  const saveTechnicalObjectives = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('players')
        .update({ objectifs_individuels: tempTechnicalObjectives || null })
        .eq('id', selectedPlayer.id);
      if (error) throw error;
      setObjectifsIndividuels(prev => ({
        ...prev,
        [selectedPlayer.id]: tempTechnicalObjectives
      }));
      setEditingTechnical(false);
      alert('Objectifs techniques sauvegardés !');
    } catch (error) {
      console.error('Erreur sauvegarde objectifs techniques:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    }
    setLoading(false);
  };

  const saveMentalObjectives = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('players')
        .update({ objectifs_mentaux: tempMentalObjectives || null })
        .eq('id', selectedPlayer.id);
      if (error) throw error;
      setObjectifsMentaux(prev => ({
        ...prev,
        [selectedPlayer.id]: tempMentalObjectives
      }));
      setEditingMental(false);
      alert('Objectifs mentaux sauvegardés !');
    } catch (error) {
      console.error('Erreur sauvegarde objectifs mentaux:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    }
    setLoading(false);
  };

  // ============================================
  // FONCTIONS UTILITAIRES BLESSURES
  // ============================================
  const getDuration = (startDate, endDate) => {
    const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Signalée aujourd'hui";
    if (days === 1) return "1 jour de suivi";
    return `${days} jours de suivi`;
  };

  const getEvolutionTrend = (injury) => {
    if (injury.timeline.length < 2) return 'neutral';
    const first = injury.initialDouleur;
    const last = injury.currentDouleur;
    const diff = last - first;
    if (diff <= -2) return 'improving';
    if (diff >= 2) return 'worsening';
    return 'stable';
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'improving': return '📉 Amélioration';
      case 'worsening': return '📈 Aggravation';
      case 'stable': return '➡️ Stable';
      default: return '❓';
    }
  };

  const getTrendColor = (trend) => {
    switch(trend) {
      case 'improving': return 'text-green-600 bg-green-50 border-green-300';
      case 'worsening': return 'text-red-600 bg-red-50 border-red-300';
      case 'stable': return 'text-blue-600 bg-blue-50 border-blue-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
      <div className="max-w-6xl mx-auto p-4">
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentView('admin')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
            >
              <ChevronLeft size={20} />
              <span>Retour Administration</span>
            </button>
            <h1 className="text-2xl font-bold" style={{color: '#1D2945'}}>
              Administration - {selectedPlayer.name}
            </h1>
            <div className="w-32"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLONNE 1 : Photo et Statistiques */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold" style={{color: '#1D2945'}}>
                  <User className="inline mr-2" size={16} />
                  Photo de Profil
                </h2>
                <button
                  onClick={() => setEditingPhoto(!editingPhoto)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-all ${
                    editingPhoto 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                >
                  {editingPhoto ? <X size={12} /> : <Edit3 size={12} />}
                  <span>{editingPhoto ? 'Annuler' : 'Modifier'}</span>
                </button>
              </div>

              <div className="text-center">
                <div 
                  className="mx-auto mb-2 overflow-hidden border-2 border-gray-200 bg-gray-100" 
                  style={{
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%',
                    flexShrink: 0
                  }}
                >
                  {selectedPlayer.photo_url ? (
                    <img 
                      src={selectedPlayer.photo_url} 
                      alt={selectedPlayer.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <div 
                      className="flex items-center justify-center text-white text-sm font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)',
                        width: '60px',
                        height: '60px'
                      }}
                    >
                      {selectedPlayer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-semibold mb-2" style={{color: '#1D2945'}}>
                  {selectedPlayer.name}
                </h3>

                {editingPhoto && (
                  <div className="space-y-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file);
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="flex items-center space-x-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-all disabled:opacity-50 mx-auto"
                    >
                      <Upload size={10} />
                      <span>{loading ? 'Upload...' : 'Photo'}</span>
                    </button>
                    <p className="text-xs text-gray-400" style={{fontSize: '10px'}}>
                      Max 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4" style={{color: '#1D2945'}}>
                <BarChart3 className="inline mr-2" size={20} />
                Statistiques
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Réponses totales:</span>
                  <span className="font-semibold">{stats.total_responses || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Motivation moyenne:</span>
                  <span className="font-semibold">{stats.avg_motivation || 0}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fatigue moyenne:</span>
                  <span className="font-semibold">{stats.avg_fatigue || 0}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">RPE moyen:</span>
                  <span className="font-semibold">{stats.avg_rpe || 0}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dernière réponse:</span>
                  <span className="font-semibold text-sm">{stats.last_response_date || 'Aucune'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE 2 : Objectifs */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{color: '#1D2945'}}>
                  <Target className="inline mr-2" size={20} />
                  Objectifs Techniques
                </h2>
                <button
                  onClick={() => {
                    if (editingTechnical) {
                      setTempTechnicalObjectives(objectifsIndividuels[selectedPlayer.id] || '');
                    }
                    setEditingTechnical(!editingTechnical);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    editingTechnical 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                >
                  {editingTechnical ? <X size={16} /> : <Edit3 size={16} />}
                  <span>{editingTechnical ? 'Annuler' : 'Modifier'}</span>
                </button>
              </div>

              {editingTechnical ? (
                <div className="space-y-4">
                  <textarea
                    value={tempTechnicalObjectives}
                    onChange={(e) => setTempTechnicalObjectives(e.target.value)}
                    placeholder="Définissez les objectifs techniques pour cette joueuse..."
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={6}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={saveTechnicalObjectives}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg min-h-[120px]">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {objectifsIndividuels[selectedPlayer.id] || 'Aucun objectif technique défini.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{color: '#1D2945'}}>
                  <Brain className="inline mr-2" size={20} />
                  Objectifs Mentaux
                </h2>
                <button
                  onClick={() => {
                    if (editingMental) {
                      setTempMentalObjectives(objectifsMentaux[selectedPlayer.id] || '');
                    }
                    setEditingMental(!editingMental);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    editingMental 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                >
                  {editingMental ? <X size={16} /> : <Edit3 size={16} />}
                  <span>{editingMental ? 'Annuler' : 'Modifier'}</span>
                </button>
              </div>

              {editingMental ? (
                <div className="space-y-4">
                  <textarea
                    value={tempMentalObjectives}
                    onChange={(e) => setTempMentalObjectives(e.target.value)}
                    placeholder="Définissez les objectifs mentaux pour cette joueuse..."
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={6}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={saveMentalObjectives}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg min-h-[120px]">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {objectifsMentaux[selectedPlayer.id] || 'Aucun objectif mental défini.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLONNE 3 : Graphiques, Cycle, Blessures, Réponses */}
          <div className="space-y-6">
            
            {/* Section Évolution des Métriques avec filtres avancés */}
            {stats.chartData && stats.chartData.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4" style={{color: '#1D2945'}}>
                  <Calendar className="inline mr-2" size={20} />
                  Évolution des Métriques
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                      <Filter size={16} className="mr-2" />
                      Filtres
                    </h4>
                    <button
                      onClick={() => {
                        setMetricsStartDate('');
                        setMetricsEndDate('');
                        setSelectedMetricsToDisplay(['motivation', 'fatigue', 'intensite_rpe', 'plaisir']);
                      }}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-all"
                    >
                      Réinitialiser
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Période</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={metricsStartDate}
                        onChange={(e) => setMetricsStartDate(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        value={metricsEndDate}
                        onChange={(e) => setMetricsEndDate(e.target.value)}
                        min={metricsStartDate}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Métriques à afficher</label>
                    <div className="space-y-1">
                      {availableMetrics.map(metric => (
                        <label key={metric.value} className="flex items-center space-x-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMetricsToDisplay.includes(metric.value)}
                            onChange={() => {
                              if (selectedMetricsToDisplay.includes(metric.value)) {
                                setSelectedMetricsToDisplay(prev => prev.filter(m => m !== metric.value));
                              } else {
                                setSelectedMetricsToDisplay(prev => [...prev, metric.value]);
                              }
                            }}
                            className="w-3 h-3 rounded"
                          />
                          <div className="w-3 h-3 rounded" style={{backgroundColor: metric.color}}></div>
                          <span>{metric.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {processedChartData.averages && Object.keys(processedChartData.averages).length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Moyennes sur la période</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selectedMetricsToDisplay.map(metric => {
                        const metricInfo = availableMetrics.find(m => m.value === metric);
                        const avg = processedChartData.averages[metric];
                        if (!avg) return null;
                        
                        return (
                          <div key={metric} className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded" style={{backgroundColor: metricInfo?.color}}></div>
                              <span className="text-gray-700">{metricInfo?.label}:</span>
                            </div>
                            <span className="font-semibold">{avg}/20</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {processedChartData.chartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={processedChartData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{fontSize: 10}} 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                        />
                        <YAxis domain={[0, 20]} />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length > 0) {
                              const responseData = processedChartData.chartData.find(item => item.date === label);
                              
                              return (
                                <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg max-w-xs">
                                  <h4 className="font-semibold mb-2 text-gray-800 text-sm">
                                    {label}
                                  </h4>
                                  
                                  <div className="space-y-1 text-xs">
                                    {selectedMetricsToDisplay.map(metric => {
                                      const metricInfo = availableMetrics.find(m => m.value === metric);
                                      const value = responseData?.[metric];
                                      const ema = responseData?.[`${metric}_ema`];
                                      
                                      if (value == null) return null;
                                      
                                      return (
                                        <div key={metric}>
                                          <div className="flex justify-between items-center">
                                            <span style={{color: metricInfo?.color}} className="font-medium">
                                              {metricInfo?.label}:
                                            </span>
                                            <span className="font-semibold">{value}/20</span>
                                          </div>
                                          {ema && (
                                            <div className="flex justify-between items-center pl-2">
                                              <span className="text-gray-500 italic">EMA-7:</span>
                                              <span className="text-gray-600">{ema}/20</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        
                        {selectedMetricsToDisplay.map(metric => {
                          const metricInfo = availableMetrics.find(m => m.value === metric);
                          return (
                            <Line 
                              key={metric}
                              type="monotone" 
                              dataKey={metric} 
                              stroke={metricInfo?.color} 
                              strokeWidth={2}
                              dot={{ fill: metricInfo?.color, strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                              connectNulls
                            />
                          );
                        })}
                        
                        {selectedMetricsToDisplay.map(metric => {
                          const metricInfo = availableMetrics.find(m => m.value === metric);
                          if (!processedChartData.averages[metric]) return null;
                          
                          return (
                            <Line 
                              key={`${metric}_avg`}
                              type="monotone" 
                              dataKey={`${metric}_avg`} 
                              stroke={metricInfo?.color} 
                              strokeWidth={1.5}
                              strokeDasharray="5 5"
                              dot={false}
                              activeDot={false}
                              opacity={0.5}
                            />
                          );
                        })}
                        
                        {selectedMetricsToDisplay.map(metric => {
                          const metricInfo = availableMetrics.find(m => m.value === metric);
                          return (
                            <Line 
                              key={`${metric}_ema`}
                              type="monotone" 
                              dataKey={`${metric}_ema`} 
                              stroke={metricInfo?.color} 
                              strokeWidth={2}
                              strokeDasharray="10 3"
                              dot={false}
                              activeDot={false}
                              opacity={0.7}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                    
                    <div className="mt-4 space-y-3">
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Valeurs réelles (lignes pleines)</h5>
                        <div className="flex flex-wrap gap-3 text-xs">
                          {selectedMetricsToDisplay.map(metric => {
                            const metricInfo = availableMetrics.find(m => m.value === metric);
                            return (
                              <div key={metric} className="flex items-center space-x-1">
                                <div className="w-4 h-1 rounded" style={{backgroundColor: metricInfo?.color}}></div>
                                <span>{metricInfo?.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Moyenne période (pointillés courts)</h5>
                        <p className="text-xs text-gray-600">Moyenne simple sur toute la période affichée</p>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">EMA-7 jours (tirets longs)</h5>
                        <p className="text-xs text-gray-600">Moyenne mobile exponentielle sur 7 jours (tendance récente)</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucune donnée pour les filtres sélectionnés</p>
                  </div>
                )}
              </div>
            )}

            {/* Section Cycle menstruel */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-pink-600 flex items-center">
                🌸 Suivi Cycle Menstruel
              </h2>

              <div className="bg-pink-50 rounded-lg p-3 mb-4 border border-pink-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-pink-700">Période d'analyse</label>
                  <button
                    onClick={() => {
                      setMenstrualStartDate('');
                      setMenstrualEndDate('');
                    }}
                    className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded hover:bg-pink-200"
                  >
                    Tout
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={menstrualStartDate}
                    onChange={(e) => setMenstrualStartDate(e.target.value)}
                    className="w-full px-2 py-1 border border-pink-300 rounded text-xs focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="date"
                    value={menstrualEndDate}
                    onChange={(e) => setMenstrualEndDate(e.target.value)}
                    min={menstrualStartDate}
                    className="w-full px-2 py-1 border border-pink-300 rounded text-xs focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {(() => {
                const responses = selectedPlayer.responses || [];
                const preResponses = responses.filter(r => {
                  if (r.type !== 'pre') return false;
                  
                  const responseDate = new Date(r.created_at);
                  if (menstrualStartDate && new Date(menstrualStartDate) > responseDate) return false;
                  if (menstrualEndDate && new Date(menstrualEndDate) < responseDate) return false;
                  
                  return true;
                });

                const menstrualData = [];
                const phaseCount = {
                  'oui': 0,
                  'non': 0,
                  '': 0
                };
                const impactValues = [];

                preResponses.forEach(response => {
                  if (response.data?.cycle_phase !== undefined) {
                    const phase = response.data.cycle_phase || '';
                    
                    if (phase !== '') {
                      phaseCount[phase] = (phaseCount[phase] || 0) + 1;
                      
                      if (response.data.cycle_impact != null) {
                        impactValues.push(Number(response.data.cycle_impact));
                      }

                      menstrualData.push({
                        date: new Date(response.created_at).toLocaleDateString('fr-FR'),
                        phase: phase,
                        impact: response.data.cycle_impact || 10
                      });
                    } else {
                      phaseCount[''] = (phaseCount[''] || 0) + 1;
                    }
                  }
                });

                const avgImpact = impactValues.length > 0 
                  ? (impactValues.reduce((sum, v) => sum + v, 0) / impactValues.length).toFixed(1)
                  : 0;

                const phaseLabels = {
                  'oui': 'Oui (règles)',
                  'non': 'Non (pas de règles)',
                  '': 'Non renseigné'
                };

                const phaseColors = {
                  'oui': '#dc2626',
                  'non': '#10b981',
                  '': '#9ca3af'
                };

                return menstrualData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm font-medium">Aucune donnée de cycle</p>
                    <p className="text-xs mt-2">La joueuse n'a pas renseigné cette information</p>
                    <p className="text-xs text-pink-600 mt-2 italic">Section optionnelle et confidentielle</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
                        <p className="text-xs text-pink-600 font-medium">Entrées totales</p>
                        <p className="text-2xl font-bold text-pink-700 mt-1">{menstrualData.length}</p>
                      </div>

                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-xs text-purple-600 font-medium">Impact moyen</p>
                        <p className="text-2xl font-bold text-purple-700 mt-1">{avgImpact}/20</p>
                        <p className="text-xs text-gray-500">10 = neutre</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold mb-3 text-gray-700">Distribution des réponses</h4>
                      <div className="space-y-2">
                        {Object.entries(phaseCount)
                          .filter(([_, count]) => count > 0)
                          .map(([phase, count]) => {
                            const totalWithData = menstrualData.length + phaseCount[''];
                            const percentage = (count / totalWithData) * 100;
                            return (
                              <div key={phase}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded" style={{backgroundColor: phaseColors[phase]}}></div>
                                    <span className="text-xs font-medium">{phaseLabels[phase]}</span>
                                  </div>
                                  <span className="text-xs font-semibold">{count} ({percentage.toFixed(0)}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor: phaseColors[phase]
                                    }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold mb-3 text-gray-700">Impact moyen par statut</h4>
                      {(() => {
                        const impactByPhase = {};
                        menstrualData.forEach(d => {
                          if (!impactByPhase[d.phase]) {
                            impactByPhase[d.phase] = [];
                          }
                          impactByPhase[d.phase].push(d.impact);
                        });

                        return (
                          <div className="space-y-2">
                            {Object.entries(impactByPhase).map(([phase, impacts]) => {
                              const avg = (impacts.reduce((sum, v) => sum + v, 0) / impacts.length).toFixed(1);
                              return (
                                <div key={phase} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded" style={{backgroundColor: phaseColors[phase]}}></div>
                                    <span className="text-xs">{phaseLabels[phase]}</span>
                                  </div>
                                  <span className="text-xs font-semibold text-pink-600">{avg}/20</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="bg-pink-50 border-l-4 border-pink-500 p-3">
                      <p className="text-xs text-pink-800">
                        <strong>Confidentiel:</strong> Ces données sont sensibles. Ne les partagez pas sans accord de la joueuse.
                      </p>
                    </div>

                    <details className="mt-4">
                      <summary className="cursor-pointer text-xs font-medium text-gray-700 py-2">
                        Voir le détail ({menstrualData.length} entrées)
                      </summary>
                      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                        {menstrualData.slice().reverse().map((entry, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded" style={{backgroundColor: phaseColors[entry.phase]}}></div>
                              <span>{phaseLabels[entry.phase]}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-500">{entry.date}</span>
                              <span className="ml-2 font-semibold text-pink-600">{entry.impact}/20</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </>
                );
              })()}
            </div>

            {/* Section Suivi Longitudinal des Blessures - VERSION COMPLÈTE */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-red-600 flex items-center">
                🚑 Suivi Longitudinal des Blessures
              </h2>

              <div className="bg-red-50 rounded-lg p-4 mb-6 border-2 border-red-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-red-800 flex items-center">
                    <Calendar size={16} className="mr-2" />
                    Période d'analyse
                  </h3>
                  <button
                    onClick={() => {
                      setInjuryStartDate('');
                      setInjuryEndDate('');
                    }}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-all"
                  >
                    Réinitialiser
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Du</label>
                    <input
                      type="date"
                      value={injuryStartDate}
                      onChange={(e) => setInjuryStartDate(e.target.value)}
                      className="w-full px-2 py-1 border-2 border-red-200 rounded text-sm focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Au</label>
                    <input
                      type="date"
                      value={injuryEndDate}
                      onChange={(e) => setInjuryEndDate(e.target.value)}
                      min={injuryStartDate}
                      className="w-full px-2 py-1 border-2 border-red-200 rounded text-sm focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 font-medium">Blessures uniques</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">{injuryStats.totalInjuries}</p>
                </div>

                <div className="p-3 bg-orange-50 border-2 border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-600 font-medium">Actives</p>
                  <p className="text-2xl font-bold text-orange-700 mt-1">{injuryStats.activeInjuries}</p>
                </div>

                <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">Guéries</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{injuryStats.healedInjuries}</p>
                </div>

                <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Zones touchées</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{injuryStats.zonesAffected}</p>
                </div>
              </div>

              {uniqueInjuries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium">✅ Aucune blessure signalée</p>
                  <p className="text-sm mt-2">Excellente nouvelle pour cette joueuse</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {uniqueInjuries.map((injury, index) => {
                    const trend = getEvolutionTrend(injury);
                    const isExpanded = expandedInjury === index;
                    
                    return (
                      <div 
                        key={index}
                        className={`border-2 rounded-lg overflow-hidden transition-all ${
                          injury.isCurrentlyActive 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-green-300 bg-green-50'
                        }`}
                      >
                        <div 
                          className="p-4 cursor-pointer hover:bg-white/50 transition-all"
                          onClick={() => setExpandedInjury(isExpanded ? null : index)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-bold text-gray-900">
                                  {injury.zoneDisplay}
                                </h4>
                                {injury.isCurrentlyActive ? (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                    🔴 Active
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                    ✅ Guérie
                                  </span>
                                )}
                                <span className={`px-2 py-1 text-xs rounded-full font-medium border ${getTrendColor(trend)}`}>
                                  {getTrendIcon(trend)}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-600">Début :</span>
                                  <span className="font-semibold ml-1">{injury.startDate.toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Durée :</span>
                                  <span className="font-semibold ml-1">{getDuration(injury.startDate, injury.lastUpdate)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Signalements :</span>
                                  <span className="font-semibold ml-1">{injury.totalReports}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Douleur actuelle :</span>
                                  <span className="font-semibold ml-1">{injury.currentDouleur}/10</span>
                                </div>
                              </div>
                            </div>
                            
                            <button className="text-gray-400 hover:text-gray-600 ml-4">
                              {isExpanded ? '▼' : '▶'}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t-2 border-gray-200 bg-white p-4">
                            <div className="mb-4">
                              <h5 className="text-sm font-semibold text-gray-700 mb-3">
                                📊 Évolution de la douleur
                              </h5>
                              <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={injury.timeline}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis 
                                    dataKey="dateStr" 
                                    tick={{fontSize: 10}} 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={60}
                                  />
                                  <YAxis domain={[0, 10]} />
                                  <Tooltip 
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length > 0) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-white p-3 border-2 border-red-300 rounded-lg shadow-lg">
                                            <p className="font-semibold text-gray-800">{data.dateStr}</p>
                                            <p className="text-sm text-red-600">
                                              Douleur: <strong>{data.douleur}/10</strong>
                                            </p>
                                            <p className="text-xs text-gray-600">
                                              Statut: {data.isActive ? '🔴 Active' : '✅ Guérie'}
                                            </p>
                                            {data.description && (
                                              <p className="text-xs text-gray-500 mt-1 italic">"{data.description}"</p>
                                            )}
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Line 
                                    type="monotone" 
                                    dataKey="douleur" 
                                    stroke="#dc2626" 
                                    strokeWidth={3}
                                    dot={{ fill: '#dc2626', strokeWidth: 2, r: 5 }}
                                    name="Niveau de douleur"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                <p className="text-xs text-gray-600">Douleur initiale</p>
                                <p className="text-lg font-bold text-gray-800">{injury.initialDouleur}/10</p>
                              </div>
                              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                <p className="text-xs text-gray-600">Douleur max</p>
                                <p className="text-lg font-bold text-orange-600">{injury.peakDouleur}/10</p>
                              </div>
                              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                <p className="text-xs text-gray-600">Douleur actuelle</p>
                                <p className="text-lg font-bold text-blue-600">{injury.currentDouleur}/10</p>
                              </div>
                            </div>

                            <details className="mb-2">
                              <summary className="cursor-pointer text-xs font-medium text-gray-700 py-2 hover:text-gray-900">
                                📝 Historique complet ({injury.timeline.length} entrées)
                              </summary>
                              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                {injury.timeline.slice().reverse().map((entry, idx) => (
                                  <div key={idx} className="flex items-start justify-between p-2 bg-gray-50 rounded text-xs border border-gray-200">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">
                                        {entry.dateStr} - Douleur: {entry.douleur}/10
                                      </p>
                                      {entry.description && (
                                        <p className="text-gray-600 italic mt-1">"{entry.description}"</p>
                                      )}
                                    </div>
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                      entry.isActive 
                                        ? 'bg-red-100 text-red-700' 
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                      {entry.isActive ? '🔴 Active' : '✅ Guérie'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </details>

                            {injury.isCurrentlyActive && (
                              <div className="bg-orange-50 border-l-4 border-orange-500 p-3 mt-3">
                                <p className="text-xs text-orange-800">
                                  <strong>⚠️ Blessure active :</strong> Suivi médical recommandé. 
                                  {injury.totalReports >= 3 && ' Cette blessure persiste depuis plusieurs signalements.'}
                                  {trend === 'worsening' && ' ⚠️ Aggravation constatée - Consultation urgente recommandée.'}
                                  {trend === 'improving' && ' ✅ Évolution positive - Continuer le suivi.'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-800 mb-2">ℹ️ Comment fonctionne le suivi ?</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Les blessures à la <strong>même zone</strong> signalées dans un <strong>délai de 14 jours</strong> sont regroupées</li>
                  <li>• Chaque signalement met à jour le suivi de la blessure (évolution de la douleur)</li>
                  <li>• Si plus de 14 jours entre deux signalements → nouvelle blessure créée</li>
                  <li>• Le statut "Guérie" est défini quand la joueuse indique que la blessure n'est plus active</li>
                </ul>
              </div>
            </div>

            {/* Section Réponses Récentes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4" style={{color: '#1D2945'}}>
                <MessageSquare className="inline mr-2" size={20} />
                Réponses Récentes
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {selectedPlayer.responses && selectedPlayer.responses.length > 0 ? (
                  selectedPlayer.responses.slice(0, 8).map((response, index) => (
                    <div 
                      key={index} 
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group"
                      onClick={() => {
                        let dataText = '';
                        
                        if (response.data?.injuries && Array.isArray(response.data.injuries)) {
                          dataText += '🚑 BLESSURES:\n';
                          response.data.injuries.forEach((injury, idx) => {
                            dataText += `\n  Blessure ${idx + 1}:\n`;
                            dataText += `  • Zone: ${injury.location || injury.zone || 'Non spécifiée'}\n`;
                            dataText += `  • Douleur: ${injury.intensity || injury.douleur || 0}/10\n`;
                            dataText += `  • Statut: ${injury.status === 'active' || injury.active ? 'Active' : 'Inactive'}\n`;
                            if (injury.description) dataText += `  • Description: ${injury.description}\n`;
                          });
                          dataText += '\n';
                        }
                        
                        const otherData = Object.entries(response.data || {})
                          .filter(([key, value]) => {
                            if (key === 'injuries') return false;
                            return value !== null && value !== undefined && value !== '';
                          })
                          .map(([key, value]) => {
                            const labels = {
                              activite: '🏃 Activité',
                              motivation: '🔥 Motivation',
                              fatigue: '😴 Fatigue',
                              intensite_rpe: '💪 Intensité RPE',
                              plaisir: '😊 Plaisir',
                              plaisir_seance: '😊 Plaisir séance',
                              confiance: '💪 Confiance',
                              technique: '⚽ Technique',
                              tactique: '🎯 Tactique',
                              influence_groupe: '👥 Influence groupe',
                              cycle_phase: '🌸 Règles',
                              cycle_impact: '🌸 Impact cycle',
                              commentaires_libres: '💭 Commentaires'
                            };
                            
                            if (key === 'activite') {
                              const activiteLabels = {
                                'futsal': '⚽ Futsal',
                                'foot': '⚽ Football',
                                'autre': '🏃 Autre'
                              };
                              return `${labels[key] || key}: ${activiteLabels[value] || value}`;
                            }
                            
                            if (key === 'cycle_phase') {
                              return `${labels[key] || key}: ${value === 'oui' ? 'Oui' : value === 'non' ? 'Non' : value}`;
                            }
                            
                            return `${labels[key] || key}: ${value}${typeof value === 'number' && key !== 'cycle_impact' ? '/20' : ''}`;
                          })
                          .join('\n');
                        
                        if (otherData) {
                          dataText += otherData;
                        }
                        
                        const modalContent = `
                          DÉTAIL DE LA RÉPONSE
                          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                          
                          📅 Date: ${new Date(response.created_at).toLocaleDateString('fr-FR')} à ${new Date(response.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                          👤 Joueuse: ${selectedPlayer.name}
                          📋 Type: ${response.type === 'pre' ? 'Pré-séance' : response.type === 'post' ? 'Post-séance' : response.type === 'match' ? 'Match' : 'Suivi blessure'}
                          
                          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                          
                          DONNÉES COLLECTÉES:
                          ${dataText || 'Aucune donnée'}
                          
                          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        `;
                        
                        alert(modalContent);
                      }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            response.type === 'pre' ? 'bg-blue-100 text-blue-800' :
                            response.type === 'post' ? 'bg-green-100 text-green-800' :
                            response.type === 'match' ? 'bg-purple-100 text-purple-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {response.type === 'pre' ? 'Pré-séance' :
                             response.type === 'post' ? 'Post-séance' :
                             response.type === 'match' ? 'Match' : 'Blessure'}
                          </span>
                          {response.data?.activite && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {response.data.activite === 'futsal' ? '⚽ Futsal' :
                               response.data.activite === 'foot' ? '⚽ Foot' :
                               '🏃 Autre'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {new Date(response.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            👁️ Voir détail
                          </span>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        {response.data?.motivation && (
                          <p><span className="font-medium">Motivation:</span> {response.data.motivation}/20</p>
                        )}
                        {response.data?.fatigue && (
                          <p><span className="font-medium">Fatigue:</span> {response.data.fatigue}/20</p>
                        )}
                        {response.data?.intensite_rpe && (
                          <p><span className="font-medium">RPE:</span> {response.data.intensite_rpe}/20</p>
                        )}
                        {response.data?.plaisir && (
                          <p><span className="font-medium">Plaisir:</span> {response.data.plaisir}/20</p>
                        )}
                        {response.data?.cycle_phase && (
                          <p className="text-pink-600 font-medium">
                            🌸 Règles: {response.data.cycle_phase === 'oui' ? 'Oui' : 'Non'}
                          </p>
                        )}
                        {response.data?.commentaires_libres && (
                          <p className="text-gray-600 italic">"{response.data.commentaires_libres}"</p>
                        )}
                        {response.data?.blessure_actuelle === 'oui' && (
                          <p className="text-red-600 font-medium">⚠️ Blessure signalée</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Aucune réponse enregistrée pour cette joueuse.
                  </p>
                )}
              </div>
              
              {selectedPlayer.responses && selectedPlayer.responses.length > 8 && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => {
                      const allResponses = selectedPlayer.responses.map((response, index) => 
                        `${index + 1}. ${response.type === 'pre' ? 'Pré-séance' : response.type === 'post' ? 'Post-séance' : response.type === 'match' ? 'Match' : 'Blessure'} - ${new Date(response.created_at).toLocaleDateString('fr-FR')}`
                      ).join('\n');
                      
                      alert(`TOUTES LES RÉPONSES (${selectedPlayer.responses.length})\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${allResponses}\n\n💡 Cliquez sur une réponse individuelle pour voir le détail complet.`);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Voir toutes les réponses ({selectedPlayer.responses.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPlayerDetail;
