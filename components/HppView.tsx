import React, { useState } from 'react';
import { Calculator, DollarSign, PieChart, Info } from 'lucide-react';

const HppView: React.FC<{ onNavigate: (screen: any) => void }> = ({ onNavigate }) => {
  const [costs, setCosts] = useState({
    raw: 100000,
    packaging: 5000,
    operational: 20000
  });
  const [units, setUnits] = useState(10);
  const [margin, setMargin] = useState(30);

  const totalCost = costs.raw + costs.packaging + costs.operational;
  const hppPerUnit = units > 0 ? totalCost / units : 0;
  const sellingPrice = hppPerUnit * (1 + margin / 100);

  return (
    <div className="space-y-6 md:space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Kalkulator HPP</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* INPUT SECTION */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center mb-6 text-lg">
            <div className="bg-primary-100 p-2 rounded-lg text-primary-600 mr-3">
               <Calculator size={20} />
            </div>
            Input Biaya Produksi
          </h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Bahan Baku</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">Rp</span>
                <input 
                  type="number" value={costs.raw}
                  onChange={e => setCosts({...costs, raw: Number(e.target.value)})}
                  className="w-full pl-10 p-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                />
              </div>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Kemasan</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">Rp</span>
                <input 
                  type="number" value={costs.packaging}
                  onChange={e => setCosts({...costs, packaging: Number(e.target.value)})}
                  className="w-full pl-10 p-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                />
              </div>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Operasional (Gas, Tenaga, dll)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">Rp</span>
                <input 
                  type="number" value={costs.operational}
                  onChange={e => setCosts({...costs, operational: Number(e.target.value)})}
                  className="w-full pl-10 p-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-6">
             {/* Total Units - Changed to Manual Input */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Total Unit Diproduksi</label>
               <div className="relative">
                 <input 
                   type="number" 
                   min="1"
                   value={units}
                   onChange={e => setUnits(Number(e.target.value))}
                   className="w-full pl-4 pr-12 p-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                   placeholder="Masukkan jumlah unit"
                 />
                 <span className="absolute right-4 top-2.5 text-gray-500 text-sm font-bold">pcs</span>
               </div>
            </div>

             {/* Margin Slider remains */}
             <div>
               <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Margin Keuntungan</label>
                <span className="text-sm font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{margin}%</span>
              </div>
              <input 
                type="range" min="0" max="100" step="5"
                value={margin} onChange={e => setMargin(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
            </div>
          </div>
        </div>

        {/* RESULT SECTION */}
        <div className="flex flex-col gap-6 sticky top-24">
          <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl shadow-gray-200 text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-gray-800 rounded-full -mr-20 -mt-20 opacity-50"></div>
             <div className="relative z-10">
               <p className="text-gray-400 text-sm uppercase tracking-widest font-bold mb-2">Rekomendasi Harga Jual</p>
               <div className="text-5xl font-bold mb-6 text-emerald-400">Rp {Math.round(sellingPrice).toLocaleString()}</div>
               
               <div className="flex justify-center gap-8 border-t border-gray-800 pt-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">HPP per Unit</p>
                    <p className="font-bold text-xl">Rp {Math.round(hppPerUnit).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Profit per Unit</p>
                    <p className="font-bold text-xl text-emerald-400">+Rp {Math.round(sellingPrice - hppPerUnit).toLocaleString()}</p>
                  </div>
               </div>
             </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4">
            <Info className="text-blue-500 shrink-0 mt-1" size={20} />
            <div>
              <h4 className="font-bold text-blue-900 text-sm">Tips Harga</h4>
              <p className="text-sm text-blue-700/80 mt-1 leading-relaxed">
                Margin 30% adalah standar industri untuk produk olahan makanan. Pastikan harga jual Anda kompetitif dengan mengecek fitur Analisis Pasar.
              </p>
            </div>
          </div>

          <button 
            onClick={() => onNavigate('MARKET')}
            className="w-full bg-white border-2 border-primary-500 text-primary-700 py-4 rounded-xl font-bold shadow-sm hover:bg-primary-50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Bandingkan Kompetitor</span>
            <DollarSign size={18} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default HppView;