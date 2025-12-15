
import React, { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface HarvestViewProps {
  onNavigate: (screen: any) => void;
}

const HarvestView: React.FC<HarvestViewProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<'INPUT' | 'RESULT'>('INPUT');
  const [params, setParams] = useState({ size: '', dist: '', prod: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const calculate = async () => {
     if (!params.size || !params.dist || !params.prod) {
        alert("Mohon lengkapi semua field");
        return;
     }

     setLoading(true);
     try {
       const response = await fetch('http://localhost:3001/api/harvest/calculate', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           landSize: parseFloat(params.size),
           plantingDistance: parseFloat(params.dist),
           productivity: parseFloat(params.prod)
         })
       });

       // FIXED: Check if response is OK and content-type is JSON
       if (!response.ok) {
         const text = await response.text();
         console.error('Server error:', response.status, text);
         throw new Error(`Server error: ${response.status}. Pastikan backend server berjalan di http://localhost:3001`);
       }

       const contentType = response.headers.get('content-type');
       if (!contentType || !contentType.includes('application/json')) {
         const text = await response.text();
         console.error('Invalid response type:', contentType, text);
         throw new Error('Server mengembalikan response non-JSON. Pastikan endpoint benar.');
       }

       const data = await response.json();
       if (data.success && data.result) {
         setResult(data.result);
         setStep('RESULT');
       } else {
         alert(data.message || 'Gagal menghitung estimasi panen');
       }
     } catch (error: any) {
       console.error('Error calculating harvest:', error);
       const errorMsg = error.message || 'Terjadi kesalahan saat menghitung. Pastikan backend server berjalan.';
       alert(errorMsg);
     } finally {
       setLoading(false);
     }
  };

  if (step === 'INPUT') {
    return (
      <div className="px-6 space-y-6">
         <h3 className="font-bold text-xl text-gray-900">Input Parameters</h3>
         
         <div className="space-y-6">
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
               <label className="block font-bold text-gray-800 mb-2">Land Size (m²)</label>
               <input 
                  type="number" 
                  value={params.size} 
                  onChange={e => setParams({...params, size: e.target.value})}
                  placeholder="e.g., 1000"
                  className="w-full bg-white border border-gray-200 p-4 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-[#22c55e]"
               />
               <p className="text-xs text-gray-400 mt-2">Enter the total area of your land in square meters.</p>
            </div>

            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
               <label className="block font-bold text-gray-800 mb-2">Planting Distance (m)</label>
               <input 
                  type="number" 
                  step="0.1"
                  value={params.dist} 
                  onChange={e => setParams({...params, dist: e.target.value})}
                  placeholder="e.g., 0.5 (for 50cm)"
                  className="w-full bg-white border border-gray-200 p-4 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-[#22c55e]"
               />
               <p className="text-xs text-gray-400 mt-2">Average distance between sorghum plants in meters.</p>
            </div>

            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
               <label className="block font-bold text-gray-800 mb-2">Estimated Productivity (kg/plant)</label>
               <input 
                  type="number" 
                  step="0.1"
                  value={params.prod} 
                  onChange={e => setParams({...params, prod: e.target.value})}
                  placeholder="e.g., 0.8 (for 800g)"
                  className="w-full bg-white border border-gray-200 p-4 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-[#22c55e]"
               />
               <p className="text-xs text-gray-400 mt-2">Average expected yield per sorghum plant in kilograms.</p>
            </div>
         </div>

         <div className="pt-4">
            <button 
               onClick={calculate}
               disabled={loading}
               className="w-full bg-[#22c55e] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-200 active:scale-95 transition-all disabled:opacity-50"
            >
               {loading ? 'Calculating...' : 'Calculate Estimation'}
            </button>
         </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="px-6 space-y-8 text-center pt-4">
       
       {/* Green Card */}
       <div className="bg-gradient-to-br from-[#4ade80] to-[#22c55e] rounded-[2.5rem] p-10 text-white shadow-xl shadow-green-200 relative overflow-hidden">
          <div className="relative z-10">
             <p className="text-green-50 font-medium mb-2">Estimasi Total Hasil</p>
             <h1 className="text-7xl font-bold tracking-tighter mb-4">{result.totalYield} <span className="text-4xl font-normal opacity-90">Ton</span></h1>
             <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20 text-sm font-bold">
                ± {result.marginError} Ton Margin Error
             </div>
          </div>
       </div>

       {/* Projection */}
       <div className="text-left space-y-4">
          <h3 className="font-bold text-gray-900 text-lg">Proyeksi Keuangan</h3>
          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
             <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Estimasi Harga Pasar</span>
                <span className="font-bold text-gray-900">Rp {result.marketPrice.toLocaleString('id-ID')}/kg</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Potensi Pendapatan Bruto</span>
                <span className="font-bold text-[#22c55e] text-lg">Rp {result.grossRevenue.toLocaleString('id-ID')}</span>
             </div>
             <p className="text-xs text-gray-400 mt-6 italic leading-relaxed">
               *Estimasi berdasarkan tren pasar Jawa Barat saat ini. Hasil aktual dapat bervariasi tergantung cuaca dan penanganan.
             </p>
          </div>
       </div>

       <button 
          onClick={() => onNavigate('MARKET')}
          className="w-full bg-[#22c55e] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-200 active:scale-95 transition-all"
       >
          Analyze Market Potential
       </button>
       
       <button onClick={() => setStep('INPUT')} className="text-gray-400 text-sm font-bold flex items-center justify-center gap-2 mx-auto">
          <RotateCcw size={14} /> Recalculate
       </button>

    </div>
  );
};

export default HarvestView;
