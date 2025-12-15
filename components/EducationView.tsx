
import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Clock, Loader2, ArrowRight } from 'lucide-react';

// Type for DB Record
interface EducationModule {
  id: number;
  title: string;
  category: string;
  description: string;
  image_url: string;
  duration: string;
  level: string;
  content?: string;
}

const EducationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Cultivation' | 'Post-Harvest'>('Cultivation');
  const [modules, setModules] = useState<EducationModule[]>([]);
  const [allModules, setAllModules] = useState<EducationModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<EducationModule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  // --- INTEGRASI BACKEND ---
  useEffect(() => {
    fetchModules();
  }, [activeTab, searchQuery]);

  const fetchModules = async () => {
    setLoading(true);
    try {
        // Fetch dari API Node.js lokal
        const response = await fetch('http://localhost:3001/api/education');
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        setAllModules(data || []);
        
        // Filter berdasarkan activeTab dan searchQuery
        let filtered = data.filter((module: EducationModule) => {
          if (activeTab === 'Cultivation') {
            return module.category === 'Cultivation';
          } else {
            return module.category === 'Post-Harvest';
          }
        });

        // FIXED: Search functionality
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter((module: EducationModule) => 
            module.title.toLowerCase().includes(query) ||
            module.description.toLowerCase().includes(query) ||
            module.category.toLowerCase().includes(query)
          );
        }
        
        setModules(filtered || []);
    } catch (err) {
        console.error("Failed to fetch modules:", err);
        setModules(FALLBACK_MODULES); // Fallback jika server mati
    } finally {
        setLoading(false);
    }
  };

  // Detail View
  if (selectedModule) {
    return (
      <div className="bg-white min-h-screen pb-10">
        {/* Header Image */}
        <div className="relative h-64 w-full">
          <img 
            src={selectedModule.image_url} 
            alt={selectedModule.title} 
            className="w-full h-full object-cover" 
            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x200?text=No+Image')}
          />
          <button 
            onClick={() => setSelectedModule(null)} 
            className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md"
          >
            <ArrowRight className="rotate-180 text-gray-800" size={20} />
          </button>
          <span className={`absolute top-6 left-20 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold ${
            selectedModule.category === 'Cultivation' ? 'text-[#22c55e]' : 'text-orange-600'
          }`}>
            {selectedModule.category === 'Cultivation' ? 'Teknik Tanam' : 'Pasca Panen'}
          </span>
        </div>

        <div className="px-6 -mt-8 relative z-10">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{selectedModule.title}</h1>
            <div className="flex space-x-4 text-gray-500 text-sm font-medium mb-4">
              <span className="flex items-center gap-1">
                <Clock size={16} /> {selectedModule.duration}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen size={16} /> {selectedModule.level || 'Beginner'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 mt-8 space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-3">Deskripsi</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{selectedModule.description}</p>
          </div>

          {/* Content (if available) */}
          {selectedModule.content && (
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-3">Konten Lengkap</h3>
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {selectedModule.content}
              </div>
            </div>
          )}

          {/* Sample Content based on category */}
          {!selectedModule.content && (
            <div className="space-y-6">
              {selectedModule.category === 'Cultivation' ? (
                <>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-3">1. Persiapan Tanah</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Bajak lahan sedalam 20-25 cm. Pastikan tanah gembur dan bebas dari bongkahan besar. Campurkan pupuk organik (5 ton/ha) saat pembajakan terakhir.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-3">2. Pemilihan Benih</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Pilih varietas unggul seperti Bioguma atau Numbu. Berikan perlakuan fungisida pada benih sebelum tanam.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-3">3. Jarak Tanam</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Gunakan jarak tanam 70 cm x 20 cm. Ini memastikan sirkulasi udara yang baik dan mengurangi risiko hama.
                    </p>
                  </div>
                  <div className="bg-[#ecfdf5] border-l-4 border-[#22c55e] p-4 rounded-r-xl">
                    <p className="text-sm text-gray-700 italic">
                      "Jarak tanam yang tepat dapat meningkatkan hasil hingga 15% dibandingkan sistem sebar acak."
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-3">1. Pengeringan Matahari</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Hamparkan malai di atas terpal bersih atau lantai jemur. Hindari kontak langsung dengan tanah. Bolak-balik setiap 2-3 jam.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-3">2. Perontokan</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Lakukan perontokan setelah malai kering. Gunakan mesin perontok atau cara manual dengan hati-hati agar biji tidak pecah.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-3">3. Penyimpanan</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Simpan dalam karung hermetik (kedap udara) atau silo. Bersihkan gudang dari sisa panen lama untuk mencegah kutu.
                    </p>
                  </div>
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl">
                    <p className="text-sm text-gray-700 italic">
                      "Jangan simpan sorghum dengan kadar air di atas 13% karena akan cepat rusak."
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* Header */}
      <div className="px-6 pt-2 pb-4">
        <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search topics..." 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
            </div>
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`p-3 rounded-xl border transition-colors ${
                showFilter ? 'bg-[#22c55e] text-white border-[#22c55e]' : 'bg-gray-50 border-gray-100 text-gray-600'
              }`}
            >
                <Filter size={18} />
            </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
                onClick={() => {
                  setActiveTab('Cultivation');
                  setSearchQuery('');
                }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'Cultivation' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Cultivation
            </button>
            <button 
                onClick={() => {
                  setActiveTab('Post-Harvest');
                  setSearchQuery('');
                }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'Post-Harvest' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Post-Harvest
            </button>
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="animate-spin text-[#22c55e]" />
                <span className="text-xs text-gray-400">Mengambil data dari localhost:3001...</span>
            </div>
        ) : modules.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">Tidak ada modul ditemukan</p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-[#22c55e] text-sm mt-2"
                >
                  Hapus filter pencarian
                </button>
              )}
            </div>
        ) : (
            modules.map((module) => (
                <div 
                  key={module.id} 
                  onClick={() => setSelectedModule(module)}
                  className="group cursor-pointer"
                >
                    {/* Image Card */}
                    <div className="relative h-48 rounded-2xl overflow-hidden mb-3">
                        <img 
                            src={module.image_url} 
                            alt={module.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x200?text=No+Image')}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>
                        
                        <span className={`absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${
                          module.category === 'Cultivation' ? 'text-[#22c55e]' :
                          module.category === 'Post-Harvest' ? 'text-orange-600' :
                          'text-[#22c55e]'
                        }`}>
                            {module.category === 'Cultivation' ? 'Teknik Tanam' : 
                             module.category === 'Post-Harvest' ? 'Pasca Panen' :
                             module.category || 'Teknik Tanam'}
                        </span>
                    </div>

                    {/* Text Content */}
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2 group-hover:text-[#22c55e] transition-colors">
                            {module.title}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3">
                            {module.description}
                        </p>
                        
                        <div className="flex items-center text-xs text-gray-400 gap-4">
                            <span className="flex items-center gap-1">
                                <Clock size={12} /> {module.duration}
                            </span>
                            <span className="flex items-center gap-1">
                                <BookOpen size={12} /> {module.level || 'Beginner'}
                            </span>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

// Fallback data (Jaga-jaga jika server Node.js belum jalan)
const FALLBACK_MODULES: EducationModule[] = [
    {
        id: 1,
        title: "Server Error / Not Connected",
        category: "System",
        description: "Pastikan file server.js sudah dijalankan dengan 'node server.js' dan MySQL XAMPP aktif.",
        image_url: "https://images.unsplash.com/photo-1625246333195-09d9b630f067?auto=format&fit=crop&w=800&q=80",
        duration: "0 min",
        level: "Error"
    }
];

export default EducationView;
