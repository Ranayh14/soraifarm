import React, { useEffect, useState, useRef } from 'react';
import { CloudRain, Sun, Wind, Droplets, MapPin, AlertTriangle, Loader2, Printer, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getClimateAnalytics } from '../services/geminiService';
import { ClimateData } from '../types';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface ClimateViewProps {
  onNavigate: (screen: any) => void;
  location?: string;
}

type Period = 'daily' | 'weekly' | 'monthly';
type Metric = 'temp' | 'humidity' | 'rain';

const ClimateView: React.FC<ClimateViewProps> = ({ onNavigate, location = "Bojongsoang, Bandung" }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClimateData | null>(null);
  const [period, setPeriod] = useState<Period>('weekly');
  const [metric, setMetric] = useState<Metric>('temp');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getClimateAnalytics(location, period);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch climate data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location, period]);

  const handleDownloadPdf = async () => {
    if (!contentRef.current) return;
    
    setIsGeneratingPdf(true);
    try {
      const element = contentRef.current;
      
      // Use html2canvas to capture the element
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        backgroundColor: '#ffffff', // Ensure white background
        logging: false,
        onclone: (document) => {
             // Optional: You can manipulate the DOM before capture here if needed
             // e.g., ensure everything is visible
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate ratio to fit page width
      const ratio = pdfWidth / imgWidth;
      const finalHeight = imgHeight * ratio;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalHeight);
      
      // Save PDF
      const fileName = `Laporan_Cuaca_${data?.location.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Terjadi kesalahan saat membuat laporan PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getMetricColor = () => {
    switch (metric) {
      case 'temp': return '#22c55e'; // Green
      case 'humidity': return '#3b82f6'; // Blue
      case 'rain': return '#64748b'; // Slate
      default: return '#22c55e';
    }
  };

  const getMetricLabel = () => {
    switch (metric) {
      case 'temp': return 'Suhu (°C)';
      case 'humidity': return 'Kelembapan (%)';
      case 'rain': return 'Curah Hujan (%)';
      default: return 'Suhu';
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'daily': return 'Harian';
      case 'weekly': return 'Mingguan';
      case 'monthly': return 'Bulanan';
      default: return 'Mingguan';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 size={48} className="text-primary-500 animate-spin" />
        <p className="text-gray-500 font-medium">Mengambil data cuaca {getPeriodLabel().toLowerCase()} untuk {location}...</p>
      </div>
    );
  }

  if (!data) return <div className="text-center p-10">Gagal memuat data.</div>;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Printable Content Area */}
      <div ref={contentRef} className="bg-white p-4 md:p-6 -m-4 md:-m-6 rounded-3xl">
        <div className="space-y-6 md:space-y-8">
          {/* Header info for PDF only (visually hidden or small on screen, prominent in PDF) */}
          <div className="flex justify-between items-center mb-4 md:hidden">
             <h2 className="text-lg font-bold">Laporan Cuaca</h2>
             <span className="text-xs text-gray-500">{new Date().toLocaleDateString()}</span>
          </div>

          {/* Top Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Main Weather Card */}
            <div className="bg-primary-500 text-white p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[280px]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center space-x-2 opacity-90 text-sm mb-2 bg-black/10 w-fit px-3 py-1 rounded-full">
                      <MapPin size={14} />
                      <span>{data.location}</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tighter">{data.currentTemp}°C</h1>
                    <p className="text-lg md:text-xl font-medium opacity-90 mt-1">{data.condition}</p>
                  </div>
                  <Sun size={64} className="text-yellow-300 animate-pulse hidden md:block" />
                  <Sun size={48} className="text-yellow-300 animate-pulse md:hidden" />
                </div>
                
                <div className="flex space-x-4 mb-6">
                  <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-xl text-sm backdrop-blur-sm">
                    <Droplets size={16} />
                    <span className="font-semibold">{data.humidity}%</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-xl text-sm backdrop-blur-sm">
                    <Wind size={16} />
                    <span className="font-semibold">{data.windSpeed} km/jam</span>
                  </div>
                </div>

                <div className={`flex items-start space-x-3 p-4 rounded-2xl border-2 border-dashed ${data.isExtreme ? 'bg-red-500/20 border-red-200' : 'bg-white/10 border-white/30'}`}>
                  <div className="bg-white/20 p-1.5 rounded-full shrink-0">
                    {data.isExtreme ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-white">
                    {data.isExtreme ? `PERINGATAN: ${data.extremeMessage}` : data.extremeMessage || "Cuaca relatif aman. Kondisi mendukung untuk tanaman sorgum."}
                  </p>
                </div>
              </div>
            </div>

            {/* Chart Card */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Prakiraan {getPeriodLabel()}</h3>
                  <div className="flex space-x-2 mt-2" data-html2canvas-ignore>
                      {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                            period === p 
                            ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                            : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'
                          }`}
                        >
                          {p === 'daily' ? 'Harian' : p === 'weekly' ? 'Mingguan' : 'Bulanan'}
                        </button>
                      ))}
                  </div>
                </div>
                <div className="w-full md:w-auto" data-html2canvas-ignore>
                  <select 
                    value={metric}
                    onChange={(e) => setMetric(e.target.value as Metric)}
                    className="w-full md:w-auto bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="temp">Suhu (°C)</option>
                    <option value="humidity">Kelembapan (%)</option>
                    <option value="rain">Curah Hujan (%)</option>
                  </select>
                </div>
              </div>
              <div className="h-64 md:h-full w-full flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.forecast}>
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={getMetricColor()} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={getMetricColor()} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#9ca3af'}} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{stroke: getMetricColor(), strokeWidth: 2}}
                      formatter={(value: number) => [`${value}`, getMetricLabel()]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={metric} 
                      stroke={getMetricColor()} 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorMetric)" 
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Forecast Grid Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.forecast?.slice(0, 4)?.map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
                <p className="text-gray-400 text-xs mb-1">{item.name}</p>
                <CloudRain size={24} className="mx-auto text-blue-400 mb-2" />
                <p className="font-bold text-gray-800">{item.temp}°C</p>
                <div className="flex justify-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{item.rain}% Hujan</span>
                  <span className="text-[10px] text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded">{item.humidity}% Lembap</span>
                </div>
              </div>
            ))}
          </div>

           {/* Footer for Report */}
          <div className="text-center mt-10 text-gray-400 text-sm">
            <p>Laporan Cuaca SorAIFarm - {new Date().toLocaleDateString()}</p>
            <p>Lokasi: {data.location} | Periode: {getPeriodLabel()}</p>
          </div>
        </div>
      </div>

      {/* Actions (Outside of Capture Ref) */}
      <div className="flex flex-col md:flex-row md:justify-end gap-4 mt-6">
        <button 
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className={`order-2 md:order-1 px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium shadow-sm hover:bg-gray-50 active:scale-95 transition-transform flex items-center justify-center space-x-2 ${isGeneratingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
          <span>{isGeneratingPdf ? 'Sedang Membuat PDF...' : 'Simpan Laporan PDF'}</span>
        </button>
        <button 
          onClick={() => onNavigate('PLANTING')}
          className="order-1 md:order-2 px-8 py-3 bg-primary-600 text-white rounded-xl font-medium shadow-lg shadow-green-200 hover:bg-primary-700 active:scale-95 transition-transform flex items-center justify-center space-x-2"
        >
           <span>Analisis Dampak Tanam</span>
        </button>
      </div>
    </div>
  );
};

export default ClimateView;