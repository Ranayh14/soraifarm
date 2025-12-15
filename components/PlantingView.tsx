
import React, { useState, useEffect } from 'react';
import { Sprout, CheckCircle2, X, Edit3 } from 'lucide-react';
import { getPlantingRecommendation } from '../services/geminiService';
import { LandData, PlantingRecommendation } from '../types';

const PlantingView: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedLand, setSelectedLand] = useState<LandData | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [lands, setLands] = useState<LandData[]>([]);
  const [fetchingLands, setFetchingLands] = useState(true);

  // Get user from localStorage
  const getUser = () => {
    const stored = localStorage.getItem('user_session');
    return stored ? JSON.parse(stored) : null;
  };

  useEffect(() => {
    const user = getUser();
    if (user?.id) {
      fetchLands(user.id);
    }
  }, []);

  const fetchLands = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/lands/${userId}`);
      const data = await response.json();
      // Transform database data to LandData format
      const transformedLands = data.map((land: any) => ({
        id: String(land.id),
        name: land.name,
        area: land.area,
        variety: land.variety,
        soilType: land.soil_type,
        date: new Date(land.created_at).toLocaleDateString('id-ID', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        }) + ' • ' + new Date(land.created_at).toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        score: land.suitability_score,
        status: land.status as 'Sangat Cocok' | 'Cukup Cocok' | 'Perlu Perbaikan'
      }));
      setLands(transformedLands);
    } catch (error) {
      console.error('Failed to fetch lands:', error);
    } finally {
      setFetchingLands(false);
    }
  };

  const [formData, setFormData] = useState({ name: '', area: '', soil: 'Lempung', variety: 'Bioguma' });

  const handleAnalyze = async (land?: LandData) => {
     setLoading(true);
     const user = getUser();
     if (!user?.id) {
       alert('Silakan login terlebih dahulu');
       setLoading(false);
       return;
     }

     const targetLand = land || { 
       name: formData.name, 
       area: Number(formData.area), 
       soilType: formData.soil, 
       variety: formData.variety 
     };
     
     try {
       // Get AI recommendation
       const result = await getPlantingRecommendation(
         targetLand.name || "New Land", 
         targetLand.soilType, 
         targetLand.variety
       );
       
       // Calculate suitability score
       const suitabilityScore = result.suitability || 85;
       let status: 'Sangat Cocok' | 'Cukup Cocok' | 'Perlu Perbaikan' = 'Cukup Cocok';
       if (suitabilityScore >= 80) status = 'Sangat Cocok';
       else if (suitabilityScore < 60) status = 'Perlu Perbaikan';

       const augmentedResult = {
         ...result,
         ph: 6.5,
         moisture: 45,
         suitability: suitabilityScore,
         status
       };

       // Save to database if new land
       if (!land) {
         const response = await fetch('http://localhost:3001/api/lands', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             user_id: user.id,
             name: formData.name,
             area: Number(formData.area),
             soil_type: formData.soil,
             variety: formData.variety,
             suitability_score: suitabilityScore,
             status: status,
             ph: 6.5,
             moisture: 45,
             recommendation_steps: result.steps || []
           })
         });

         if (response.ok) {
           const data = await response.json();
           // Refresh lands list
           fetchLands(user.id);
         }
       }

       setAnalysis(augmentedResult);
       if (!land) setShowForm(false);
     } catch (e) {
       console.error('Error analyzing:', e);
       alert("Error analyzing");
     } finally {
       setLoading(false);
     }
  };

  // Result View
  if (analysis) {
    const currentLand = selectedLand || {
      name: formData.name,
      area: formData.area,
      soilType: formData.soil,
      variety: formData.variety
    };

    return (
      <div className="px-6 py-4 space-y-6">
        {/* Header Data */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Data Lahan</h3>
              <Edit3 size={16} className="text-[#22c55e]" />
           </div>
           <div className="grid grid-cols-3 gap-4">
              <div>
                 <p className="text-xs text-gray-500">Luas</p>
                 <p className="font-bold text-gray-900">{currentLand.area} m²</p>
              </div>
              <div>
                 <p className="text-xs text-gray-500">Tanah</p>
                 <p className="font-bold text-gray-900">{currentLand.soilType}</p>
              </div>
              <div>
                 <p className="text-xs text-gray-500">Varietas</p>
                 <p className="font-bold text-gray-900">{currentLand.variety}</p>
              </div>
           </div>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-lg text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-3 bg-[#22c55e]"></div>
           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#22c55e]">
              <CheckCircle2 size={32} />
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">Sangat Cocok ({analysis.suitability}%)</h2>
           <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
             Lahan Anda memiliki kondisi optimal untuk varietas Sorghum {currentLand.variety}.
           </p>

           <div className="flex gap-4">
              <div className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                 <p className="text-xs text-gray-400 uppercase mb-1">PH Tanah</p>
                 <div className="flex items-center justify-center gap-2">
                    <span className="text-xl font-bold">6.5</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Ideal</span>
                 </div>
              </div>
              <div className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                 <p className="text-xs text-gray-400 uppercase mb-1">Kelembapan</p>
                 <div className="flex items-center justify-center gap-2">
                    <span className="text-xl font-bold">45%</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Baik</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Langkah Rekomendasi</h3>
              <span className="text-[10px] bg-green-50 text-[#22c55e] px-2 py-1 rounded font-bold border border-green-100">AI GENERATED</span>
           </div>
           
           <div className="relative pl-4 space-y-8">
              <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-gray-100"></div>
              {analysis.steps?.map((step: any, idx: number) => (
                 <div key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-0 w-10 h-10 bg-green-100 text-[#22c55e] rounded-full flex items-center justify-center font-bold text-sm border-4 border-white z-10">
                       {idx + 1}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{step.title || `Langkah ${idx + 1}`}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.description || step}</p>
                 </div>
              ))}
           </div>
        </div>

        <button 
          onClick={() => {
            setAnalysis(null);
            setSelectedLand(null);
          }} 
          className="w-full bg-white border border-[#22c55e] text-[#22c55e] py-3.5 rounded-xl font-bold"
        >
           Simpan Analisis
        </button>
      </div>
    );
  }

  // List View (Default)
  return (
    <div className="px-6 space-y-4">
      
      {/* List */}
      {fetchingLands ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : lands.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-400 mb-4">Belum ada lahan terdaftar</p>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-[#22c55e] text-white px-6 py-2 rounded-xl font-bold"
          >
            Tambah Lahan Pertama
          </button>
        </div>
      ) : (
        lands.map((land) => (
          <div 
            key={land.id} 
            onClick={() => {
              setSelectedLand(land);
              handleAnalyze(land);
            }}
            className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer"
          >
            {/* Status Color Strip */}
            <div className={`absolute top-0 left-0 bottom-0 w-2 ${
              land.status === 'Sangat Cocok' ? 'bg-[#22c55e]' : 
              land.status === 'Cukup Cocok' ? 'bg-yellow-400' : 'bg-red-400'
            }`}></div>
            
            <div className="pl-4">
               <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">{land.name}</h3>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                     land.status === 'Sangat Cocok' ? 'bg-green-100 text-green-700' : 
                     land.status === 'Cukup Cocok' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                     {land.status}
                  </span>
               </div>
               <p className="text-xs text-gray-400 mb-4">{land.date}</p>
               
               <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 rounded-lg p-2">
                     <p className="text-[10px] text-gray-400">Luas</p>
                     <p className="font-bold text-gray-800 text-sm">{land.area} m²</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                     <p className="text-[10px] text-gray-400">Varietas</p>
                     <p className="font-bold text-gray-800 text-sm">{land.variety}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                     <p className="text-[10px] text-gray-400">Tanah</p>
                     <p className="font-bold text-gray-800 text-sm">{land.soilType}</p>
                  </div>
               </div>
            </div>
          </div>
        ))
      )}

      {/* FAB */}
      <button 
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#22c55e] text-white rounded-full shadow-lg shadow-green-200 flex items-center justify-center hover:scale-105 transition-transform z-40"
      >
        <Sprout size={24} />
      </button>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative animate-in slide-in-from-bottom-10">
              <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={24} /></button>
              
              <h2 className="text-xl font-bold text-gray-900 mb-1">Enter Planting Details</h2>
              <p className="text-gray-500 text-sm mb-6">Provide details about your land for AI-powered recommendations.</p>

              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lahan</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="e.g., Lahan 1" 
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22c55e] outline-none" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Land Area (m²)</label>
                    <input 
                      type="number" 
                      value={formData.area} 
                      onChange={e => setFormData({...formData, area: e.target.value})} 
                      placeholder="e.g., 5000" 
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22c55e] outline-none" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Soil Type</label>
                    <select 
                      value={formData.soil} 
                      onChange={e => setFormData({...formData, soil: e.target.value})} 
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22c55e] outline-none bg-white"
                    >
                       <option value="Lempung">Lempung</option>
                       <option value="Liat">Liat</option>
                       <option value="Pasir">Pasir</option>
                       <option value="Berpasir">Berpasir</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Sorghum Variety</label>
                    <select 
                      value={formData.variety} 
                      onChange={e => setFormData({...formData, variety: e.target.value})} 
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22c55e] outline-none bg-white"
                    >
                       <option value="Bioguma">Bioguma</option>
                       <option value="Numbu">Numbu</option>
                       <option value="Kawali">Kawali</option>
                    </select>
                 </div>
              </div>

              <button 
                 onClick={() => handleAnalyze()}
                 disabled={loading || !formData.name || !formData.area}
                 className="w-full bg-[#22c55e] text-white py-4 rounded-xl font-bold mt-8 shadow-lg shadow-green-200 active:scale-95 transition-all disabled:opacity-50"
              >
                 {loading ? 'Analyzing...' : 'Analyze'}
              </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default PlantingView;
