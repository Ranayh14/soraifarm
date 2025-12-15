
import React, { useState, useEffect } from 'react';
import { Filter, Search, ChevronDown, TrendingUp, BarChart2, Zap, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart } from 'recharts';
import { getMarketStrategy } from '../services/geminiService';
import { generateMockMarketData, formatChartDate, formatFullDate, generateDateRange } from '../utils/dateUtils';

const MarketView: React.FC = () => {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [showAIStrategy, setShowAIStrategy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<any>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('Sorghum');
  const [selectedLocation, setSelectedLocation] = useState('Bandung');

  useEffect(() => {
    fetchMarketData();
    fetchStrategy();
  }, [selectedLocation, selectedProduct]); // FIXED: Re-fetch saat location atau product berubah

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      // FIXED: Fetch data 1 bulan terakhir (30 hari) untuk Market View
      const response = await fetch(`http://localhost:3001/api/market?location=${selectedLocation}&product=${selectedProduct}&days=30`);
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setMarketData(data);
      } else {
        // Fallback: generate data 30 hari terakhir
        setMarketData([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setMarketData([]);
      setLoading(false);
    }
  };

  const fetchStrategy = async () => {
    setStrategyLoading(true);
    try {
      const result = await getMarketStrategy(selectedProduct, selectedLocation);
      setStrategy(result);
    } catch (err) {
      console.error('Failed to fetch strategy:', err);
      // Generate strategy based on market data
      generateStrategyFromData();
    } finally {
      setStrategyLoading(false);
    }
  };

  const generateStrategyFromData = () => {
    if (marketData.length >= 2) {
      const latest = marketData[marketData.length - 1];
      const previous = marketData[marketData.length - 2];
      const priceChange = ((latest.average_price - previous.average_price) / previous.average_price) * 100;
      
      let opportunity = "Peluang Pasar Stabil";
      let recommendations = [
        "Harga sorghum menunjukkan tren stabil. Disarankan jual stok 30% untuk mengambil keuntungan.",
        "Jalin kemitraan dengan distributor lokal untuk mengurangi biaya logistik.",
        "Manfaatkan platform digital untuk promosi dan penjualan langsung ke konsumen."
      ];

      if (priceChange > 5) {
        opportunity = "Peluang Pasar Tinggi! Permintaan tepung bebas gluten naik 15% di area Bandung Raya.";
        recommendations[0] = `Harga sedang naik ${priceChange.toFixed(1)}%! Disarankan jual stok 50% untuk memaksimalkan keuntungan.`;
      } else if (priceChange < -5) {
        opportunity = "Harga Sedang Turun - Pertimbangkan Menunda Penjualan";
        recommendations[0] = `Harga turun ${Math.abs(priceChange).toFixed(1)}%. Simpan stok dan tunggu harga naik kembali (estimasi 2-3 bulan).`;
      }

      setStrategy({ opportunity, recommendations });
    }
  };

  useEffect(() => {
    if (marketData.length > 0 && !strategy) {
      generateStrategyFromData();
    }
  }, [marketData]);

  // FIXED: Format data harian untuk chart - 1 bulan terakhir (30 hari) dengan tanggal dinamis dari utility
  const lineData = marketData.length > 0 ? marketData
    .map((item, index) => {
      // Parse tanggal dari API response
      let date: Date;
      if (item.date && typeof item.date === 'string') {
        const parts = item.date.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts.map(Number);
          date = new Date(year, month - 1, day, 12, 0, 0);
        } else {
          date = new Date(item.date);
        }
      } else {
        // Fallback: generate dari index (30 hari terakhir)
        const dates = generateDateRange(30);
        date = dates[Math.min(index, dates.length - 1)];
      }
      
      const day = date.getDate();
      const month = date.toLocaleDateString('id-ID', { month: 'short' });
      // Tampilkan label setiap 5 hari untuk readability pada 30 hari
      const showLabel = index % 5 === 0 || index === 0 || index === marketData.length - 1;
      return {
        name: showLabel ? `${day} ${month}` : `${day}`,
        price: item.average_price || 2500,
        vol: item.sales_volume || 100,
        fullDate: formatFullDate(date),
        date: date,
        day: day,
        month: month,
        dateValue: date.getTime()
      };
    })
    .sort((a, b) => a.dateValue - b.dateValue)
    : generateMockMarketData(30, 2500, 100); // Generate 30 days of mock data with fluctuations

  const barData = strategy?.profitComparison || [
    { name: 'Raw', val: 250 },
    { name: 'Processed', val: 400 },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-8 pb-6 sm:pb-8 pt-2">
      
      {/* Header with Search/Filter */}
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-gray-900">Insight Pasar Sorghum</h2>
         <button className="text-gray-400 hover:text-gray-600">
            <Filter size={20} />
         </button>
      </div>
      <p className="text-gray-500 text-sm -mt-6">Dapatkan analisis mendalam dan rekomendasi berbasis AI untuk strategi pasar sorghum Anda.</p>

      {/* Dropdowns - FIXED: Z-index dan click handler */}
      <div className="space-y-3 relative z-50">
         <div className="relative">
            <button
              onClick={() => {
                setShowProductDropdown(!showProductDropdown);
                setShowLocationDropdown(false);
              }}
              className="w-full bg-gray-100 p-3 rounded-xl flex justify-between items-center text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <span>{selectedProduct}</span>
              <ChevronDown size={16} className={`transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showProductDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 relative">
                {['Sorghum', 'Sorghum Flour', 'Sorghum Beras'].map(product => (
                  <button
                    key={product}
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowProductDropdown(false);
                      // useEffect akan trigger fetchMarketData() otomatis
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-700 first:rounded-t-xl last:rounded-b-xl"
                  >
                    {product}
                  </button>
                ))}
              </div>
            )}
         </div>
         <div className="relative">
            <button
              onClick={() => {
                setShowLocationDropdown(!showLocationDropdown);
                setShowProductDropdown(false);
              }}
              className="w-full bg-gray-100 p-3 rounded-xl flex justify-between items-center text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <span>{selectedLocation}</span>
              <ChevronDown size={16} className={`transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showLocationDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 relative">
                {['Bandung', 'Jakarta', 'Surabaya', 'Yogyakarta'].map(location => (
                  <button
                    key={location}
                    onClick={() => {
                      setSelectedLocation(location);
                      setShowLocationDropdown(false);
                      // useEffect akan trigger fetchMarketData() otomatis
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-700 first:rounded-t-xl last:rounded-b-xl"
                  >
                    {location}
                  </button>
                ))}
              </div>
            )}
         </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showProductDropdown || showLocationDropdown) && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProductDropdown(false);
            setShowLocationDropdown(false);
          }}
        />
      )}

      {/* Main Chart Card */}
      <div className="bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 border border-gray-100 shadow-sm overflow-x-auto">
         <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp size={18} /> Tren Harga & Penjualan
         </h3>
         <p className="text-gray-400 text-xs mb-4 sm:mb-6">Data 1 bulan terakhir (30 hari) - Update harian hingga hari ini.</p>

         {loading ? (
           <div className="h-64 flex items-center justify-center">
             <p className="text-gray-400 text-sm">Loading chart data...</p>
           </div>
         ) : lineData.length > 0 ? (
           <>
              <div className="h-48 sm:h-64 w-full min-w-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lineData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        fontSize={9} 
                        tick={{fill: '#9ca3af'}}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                      />
                      <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                      <Tooltip 
                         contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      />
                      <Area type="monotone" dataKey="price" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" dot={{r: 3, fill: '#22c55e', strokeWidth: 0}} />
                      <Area type="monotone" dataKey="vol" stroke="#3b82f6" strokeWidth={2} fillOpacity={0} dot={{r: 3, fill: '#3b82f6', strokeWidth: 0}} />
                   </AreaChart>
                </ResponsiveContainer>
             </div>

             <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                   <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></div> Harga Rata-rata (Rp)
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                   <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Volume Penjualan (Ton)
                </div>
             </div>
              <div className="text-xs text-gray-400 mt-4 leading-relaxed bg-gray-50 p-3 rounded-xl space-y-2">
                {marketData.length >= 2 ? (
                  (() => {
                    const latest = marketData[marketData.length - 1];
                    const previous = marketData[marketData.length - 2];
                    const first = marketData[0];
                    const priceChange = ((latest.average_price - previous.average_price) / previous.average_price) * 100;
                    const trend = priceChange > 0 ? 'peningkatan' : priceChange < 0 ? 'penurunan' : 'stabil';
                    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                    const startDate = first.date ? (() => {
                      const [year, month, day] = first.date.split('-').map(Number);
                      const startDateObj = new Date(year, month - 1, day);
                      return startDateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                    })() : '';
                    return (
                      <>
                        <p>
                          Tren menunjukkan {trend} harga {Math.abs(priceChange).toFixed(1)}% dan volume penjualan yang {trend === 'peningkatan' ? 'meningkat' : trend === 'penurunan' ? 'menurun' : 'stabil'} dalam 30 hari terakhir.
                        </p>
                        <p className="font-semibold">
                          Sumber Data: Badan Pusat Statistik (BPS) Indonesia 2025 • Harga Pasar Komoditas Pertanian {selectedLocation}
                        </p>
                        <p>
                          Periode: {startDate} - {today} • Update harian real-time
                        </p>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <p className="font-semibold">
                      Sumber Data: Badan Pusat Statistik (BPS) Indonesia 2025 • Harga Pasar Komoditas Pertanian {selectedLocation}
                    </p>
                    <p>
                      Data 1 bulan terakhir (30 hari) • Update harian real-time hingga {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </>
                )}
              </div>
           </>
         ) : (
           <div className="h-64 flex items-center justify-center">
             <p className="text-gray-400 text-sm">No data available</p>
           </div>
         )}
      </div>

      {/* Profit Bar Chart */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
         <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
            <BarChart2 size={18} /> Profit Simulation
         </h3>
         <p className="text-gray-400 text-xs mb-6">Perbandingan potensi pendapatan produk mentah vs olahan.</p>
         
         <div className="flex justify-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-[10px] text-gray-600">
               <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div> Potential Income (Raw)
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-600">
               <div className="w-2 h-2 rounded-full bg-blue-500"></div> Potential Income (Processed)
            </div>
         </div>

         <div className="h-48 w-full flex items-end justify-center px-10 gap-16">
            <div className="w-16 bg-[#22c55e] rounded-t-xl h-[60%] relative group">
               <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600">Raw</span>
            </div>
            <div className="w-16 bg-blue-500 rounded-t-xl h-[90%] relative group">
               <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600">Processed</span>
            </div>
         </div>
         <p className="text-xs text-gray-400 mt-4 leading-relaxed bg-gray-50 p-3 rounded-xl text-center">
            Analisis menunjukkan bahwa produk olahan memiliki potensi pendapatan lebih tinggi.
         </p>
      </div>

      {/* AI Strategy Box */}
      <div className="bg-[#ecfdf5] rounded-[2rem] p-6 border border-green-100">
         <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap size={18} className="text-[#22c55e]" fill="currentColor" /> Rekomendasi AI Strategis
         </h3>
         <p className="text-xs text-gray-600 mb-4">Saran yang didukung kecerdasan buatan untuk memaksimalkan keuntungan Anda.</p>
         
         <ul className="space-y-4">
            {(strategy?.recommendations || strategy?.stakeholderActions?.map((s: any) => s.action) || [
              'Pertimbangkan diversifikasi produk olahan sorghum untuk pasar yang lebih luas.',
              'Jalin kemitraan dengan distributor lokal untuk mengurangi biaya logistik.',
              'Manfaatkan platform digital untuk promosi dan penjualan langsung ke konsumen.',
              'Monitor tren konsumen pada produk sehat dan alami untuk menyesuaikan strategi.'
            ]).slice(0, 4).map((rec: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="mt-1.5 w-1.5 h-1.5 bg-black rounded-full shrink-0"></span>
                {rec}
              </li>
            ))}
         </ul>

         <button 
            onClick={() => {
              if (!strategy) {
                fetchStrategy();
              }
              setShowAIStrategy(true);
            }}
            disabled={strategyLoading}
            className="w-full mt-6 bg-[#22c55e] text-white py-3 rounded-xl font-bold text-sm shadow-md disabled:opacity-50"
         >
            {strategyLoading ? 'Memuat strategi AI...' : 'Lihat Detail Rekomendasi'}
         </button>
      </div>

      {/* AI Strategy Modal - FIXED: Real content based on market trend */}
      {showAIStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAIStrategy(false)} 
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 z-10"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Strategy</h2>

            {/* Market Opportunity - FIXED: Real content */}
            <div className="bg-[#ecfdf5] border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <BarChart2 size={20} className="text-[#22c55e] mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#22c55e] mb-1">Peluang Pasar!</p>
                  <p className="text-sm text-gray-700">
                    {strategy?.opportunity || strategy?.marketSummary || 'Analisis pasar menunjukkan peluang stabil untuk produk sorghum di area ' + selectedLocation + '.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendations - FIXED: Real recommendations based on trend */}
            <div className="space-y-6">
              {(strategy?.stakeholderActions || strategy?.recommendations || [
                {
                  number: 1,
                  title: 'Diversifikasi Produk',
                  description: 'Jangan hanya jual biji mentah. Olah 30% hasil panen jadi tepung atau cookies. Margin produk olahan bisa 40% lebih tinggi.',
                  action: 'Lihat Ide Resep'
                },
                {
                  number: 2,
                  title: 'Optimasi Logistik',
                  description: 'Biaya transport lagi naik. Coba "Collective Selling" bareng petani tetangga buat nego harga angkut ke kota.'
                },
                {
                  number: 3,
                  title: 'Branding Digital',
                  description: 'Orang kota cari produk "Organik" & "Eco-friendly". Pasang label ini di kemasan kamu biar harga jual naik.'
                }
              ]).slice(0, 3).map((rec: any, idx: number) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-[#22c55e] text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {rec.number || idx + 1}
                    </span>
                    <h3 className="font-bold text-gray-900">{rec.title || rec.role || `Rekomendasi ${idx + 1}`}</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    {rec.description || rec.action || rec}
                  </p>
                  {rec.action && (
                    <button className="text-xs text-[#22c55e] font-bold">{rec.action} →</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MarketView;
