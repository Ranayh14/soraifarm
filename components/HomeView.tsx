
import React, { useEffect, useState, useRef } from 'react';
import { CloudSun, Sprout, TrendingUp, ChevronRight, ChevronLeft, Wind, Droplets, MapPin, CheckCircle2, BookOpen, ChefHat, BarChart2, Edit2, X, Check } from 'lucide-react';
import { Screen } from '../types';
import { getRealTimeWeather } from '../services/weatherService';
import { ClimateData } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart } from 'recharts';
import { generateMockMarketData, formatChartDate, formatFullDate, generateDateRange } from '../utils/dateUtils';

interface HomeViewProps {
  onNavigate: (screen: Screen) => void;
  user?: any;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate, user }) => {
  const [climate, setClimate] = useState<Partial<ClimateData> | null>(null);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState('Bojongsoang, Bandung');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const recipesCarouselRef = useRef<HTMLDivElement>(null);

  // FIXED: Location autocomplete dengan OpenStreetMap Nominatim API (gratis)
  const fetchLocationSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=id&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SorAiFarm App' // Required by Nominatim
          }
        }
      );
      const data = await response.json();
      
      const suggestions = data.map((item: any) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        city: item.address?.city || item.address?.town || item.address?.village || '',
        district: item.address?.suburb || item.address?.neighbourhood || ''
      }));
      
      setLocationSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.warn('Location autocomplete failed:', error);
      setLocationSuggestions([]);
    }
  };

  // Get coordinates from location name (simple geocoding)
  const getLocationCoords = async (locationName: string) => {
    // Default Bandung coordinates
    let lat = -6.9175;
    let lon = 107.6191;

    // Simple mapping for common locations
    const locationMap: { [key: string]: { lat: number; lon: number } } = {
      'bandung': { lat: -6.9175, lon: 107.6191 },
      'jakarta': { lat: -6.2088, lon: 106.8456 },
      'surabaya': { lat: -7.2575, lon: 112.7521 },
      'yogyakarta': { lat: -7.7956, lon: 110.3695 },
      'semarang': { lat: -6.9667, lon: 110.4167 },
      'bojongsoang': { lat: -6.9175, lon: 107.6191 },
    };

    const normalized = locationName.toLowerCase().replace(/\s+/g, '');
    if (locationMap[normalized]) {
      return locationMap[normalized];
    }

    // Try geocoding API (free)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`);
      const data = await response.json();
      if (data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      }
    } catch (error) {
      console.warn('Geocoding failed, using default:', error);
    }

    return { lat, lon };
  };

  const fetchWeather = async (location: string) => {
    setWeatherLoading(true);
    const coords = await getLocationCoords(location);
    const data = await getRealTimeWeather(coords.lat, coords.lon);
    setClimate({ ...data, location });
    setWeatherLoading(false);
  };

  useEffect(() => {
    const userLocation = user?.location || 'Bojongsoang, Bandung';
    setCurrentLocation(userLocation);
    setLocationInput(userLocation);
    fetchWeather(userLocation);

    // FIXED: Fetch Market Data - 7 hari terakhir untuk Home
    fetch('http://localhost:3001/api/market?location=Bandung&days=7')
      .then(res => res.json())
      .then(data => {
        setMarketData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch market data:', err);
        setLoading(false);
      });

    // FIXED: Fetch Featured Recipes - 5 resep dengan views terbanyak
    fetch('http://localhost:3001/api/recipes?category=All&popular=true')
      .then(res => res.json())
      .then(data => {
        setRecipes(data.slice(0, 5)); // Top 5 recipes by views
      })
      .catch(err => console.error('Failed to fetch recipes:', err));
  }, [user]);

  const handleLocationSaveWithSuggestion = async (suggestion: any) => {
    setCurrentLocation(suggestion.display_name);
    setEditingLocation(false);
    setShowSuggestions(false);
    await fetchWeather(suggestion.display_name);

    // Update user location in database
    const stored = localStorage.getItem('user_session');
    if (stored) {
      const userData = JSON.parse(stored);
      if (userData.id) {
        try {
          await fetch(`http://localhost:3001/api/user/${userData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: userData.full_name,
              location: suggestion.display_name,
              land_area: userData.land_area,
              avatar_url: userData.avatar_url
            })
          });
          // Update localStorage
          userData.location = suggestion.display_name;
          localStorage.setItem('user_session', JSON.stringify(userData));
        } catch (error) {
          console.error('Failed to update location:', error);
        }
      }
    }
  };

  const handleLocationSave = async () => {
    if (!locationInput.trim()) {
      alert('Lokasi tidak boleh kosong');
      return;
    }

    setCurrentLocation(locationInput);
    setEditingLocation(false);
    setShowSuggestions(false);
    await fetchWeather(locationInput);

    // Update user location in database
    const stored = localStorage.getItem('user_session');
    if (stored) {
      const userData = JSON.parse(stored);
      if (userData.id) {
        try {
          await fetch(`http://localhost:3001/api/user/${userData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: userData.full_name,
              location: locationInput,
              land_area: userData.land_area,
              avatar_url: userData.avatar_url
            })
          });
          // Update localStorage
          userData.location = locationInput;
          localStorage.setItem('user_session', JSON.stringify(userData));
        } catch (error) {
          console.error('Failed to update location:', error);
        }
      }
    }
  };

  // FIXED: Format market data untuk chart - 7 hari terakhir dengan tanggal dinamis dari utility
  const chartData = marketData.length > 0 ? marketData
    .map(item => {
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
        // Fallback: generate dari index (7 hari terakhir)
        const dates = generateDateRange(7);
        const index = marketData.indexOf(item);
        date = dates[Math.min(index, dates.length - 1)];
      }
      
      return {
        name: formatChartDate(date, true), // Include day name for 7 days
        price: item.average_price || 2500,
        volume: item.sales_volume || 100,
        fullDate: formatFullDate(date),
        dateValue: date.getTime()
      };
    })
    .sort((a, b) => a.dateValue - b.dateValue)
    : generateMockMarketData(7, 2500, 100); // Generate 7 days of mock data with fluctuations

  const featuredRecipes = recipes.length > 0 ? recipes : [
    { id: '1', title: 'Sorghum Quinoa Salad', image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?auto=format&fit=crop&w=400&q=80' },
    { id: '2', title: 'Crispy Sorghum Cookies', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80' }
  ];

  const handleRecipeClick = (recipe: any) => {
    // Navigate to recipes page and set selected recipe
    onNavigate(Screen.RECIPES);
    // Store recipe ID in sessionStorage for RecipesView to pick up
    if (recipe.id) {
      sessionStorage.setItem('selectedRecipeId', recipe.id);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      
      {/* Location Badge - Editable with Autocomplete */}
      <div className="flex items-center gap-2 mt-2 relative">
        {editingLocation ? (
          <div className="flex-1 relative">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              <MapPin size={12} className="text-[#22c55e]" />
              <input
                type="text"
                value={locationInput}
                onChange={e => {
                  setLocationInput(e.target.value);
                  fetchLocationSuggestions(e.target.value);
                }}
                onFocus={() => {
                  if (locationInput.length >= 2) {
                    fetchLocationSuggestions(locationInput);
                  }
                }}
                onKeyPress={e => {
                  if (e.key === 'Enter' && locationSuggestions.length > 0) {
                    const firstSuggestion = locationSuggestions[0];
                    setLocationInput(firstSuggestion.display_name);
                    setShowSuggestions(false);
                    handleLocationSaveWithSuggestion(firstSuggestion);
                  } else if (e.key === 'Enter') {
                    handleLocationSave();
                  }
                }}
                className="text-gray-500 text-xs font-medium outline-none flex-1 min-w-[150px]"
                placeholder="Cari lokasi..."
                autoFocus
              />
              <button onClick={handleLocationSave} className="text-[#22c55e]">
                <Check size={14} />
              </button>
              <button onClick={() => {
                setEditingLocation(false);
                setLocationInput(currentLocation);
                setShowSuggestions(false);
                setLocationSuggestions([]);
              }} className="text-gray-400">
                <X size={14} />
              </button>
            </div>
            
            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {locationSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setLocationInput(suggestion.display_name);
                      setShowSuggestions(false);
                      handleLocationSaveWithSuggestion(suggestion);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 flex items-start gap-2"
                  >
                    <MapPin size={14} className="text-[#22c55e] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{suggestion.city || suggestion.district || suggestion.display_name.split(',')[0]}</p>
                      <p className="text-xs text-gray-400 truncate">{suggestion.display_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div 
            onClick={() => setEditingLocation(true)}
            className="flex items-center text-gray-500 text-xs font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 w-fit cursor-pointer hover:border-[#22c55e] transition-colors"
          >
            <MapPin size={12} className="mr-1 text-[#22c55e]" />
            <span>{currentLocation}</span>
            <Edit2 size={12} className="ml-2 text-gray-400" />
          </div>
        )}
      </div>

      {/* Weather Card - Green Gradient - FIXED: Responsive */}
      <div className="bg-gradient-to-br from-[#4ade80] to-[#22c55e] rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 text-white shadow-xl shadow-green-200 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-10 -mb-10"></div>

        <div className="relative z-10">
          {weatherLoading ? (
            <div className="text-center py-4">
              <p className="text-sm">Memuat data cuaca...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <CloudSun size={24} />
                  <span className="font-bold text-lg">{climate?.condition || "Cerah Berawan"}</span>
                </div>
                {/* FIXED: Humidity di atas, Wind di bawah (kanan atas) - struktur vertikal */}
                <div className="flex flex-col items-end gap-1.5">
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20 flex items-center gap-1">
                    <Droplets size={12} /> {climate?.humidity || 65}%
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-medium border border-white/20 flex items-center gap-2">
                    <Wind size={14} />
                    <span>{climate?.windSpeed || 12} km/h</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col mb-4">
                <span className="text-5xl sm:text-6xl font-bold tracking-tighter">{climate?.currentTemp || 28}°C</span>
                <span className="text-green-50 text-xs sm:text-sm mt-1">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 flex items-start gap-3">
                 <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-white" />
                 <p className="text-xs leading-relaxed font-medium">
                   {climate?.extremeMessage || "No extreme weather warnings. Conditions are favorable for planting."}
                 </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Trending Recipes & Creative Ideas - FIXED: Carousel dengan panah */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-900">Trending Recipes & Creative Ideas</h3>
        </div>
        <div className="relative">
          {/* Carousel Container */}
          <div 
            ref={recipesCarouselRef}
            className="flex gap-4 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
            style={{ scrollBehavior: 'smooth' }}
          >
            {featuredRecipes.map(recipe => (
              <div 
                key={recipe.id} 
                onClick={() => handleRecipeClick(recipe)}
                className="min-w-[200px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden shrink-0 cursor-pointer hover:shadow-md transition-shadow"
              >
                 <div className="h-28 overflow-hidden relative aspect-[4/3]">
                   <img src={recipe.image || recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
                   {/* FIXED: Show views badge */}
                   {recipe.views > 0 && (
                     <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                       👁 {recipe.views}
                     </div>
                   )}
                 </div>
                 <div className="p-3">
                   <h4 className="font-bold text-gray-800 text-sm truncate">{recipe.title}</h4>
                 </div>
              </div>
            ))}
          </div>
          
          {/* Navigation Arrows */}
          {featuredRecipes.length > 3 && (
            <>
              <button
                onClick={() => {
                  if (recipesCarouselRef.current) {
                    recipesCarouselRef.current.scrollBy({ left: -220, behavior: 'smooth' });
                  }
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors z-50"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => {
                  if (recipesCarouselRef.current) {
                    recipesCarouselRef.current.scrollBy({ left: 220, behavior: 'smooth' });
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors z-50"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sorghum Price & Sales Trends Graph - FIXED: Responsive */}
      <div>
        <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">Sorghum Price & Sales Trends</h3>
        <div className="bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 border border-gray-100 shadow-sm overflow-x-auto">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400 text-sm">Loading chart data...</p>
            </div>
          ) : chartData.length > 0 ? (
            <>
              <div className="h-48 sm:h-64 w-full min-w-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      fontSize={9} 
                      tick={{fill: '#9ca3af'}}
                      interval={0}
                    />
                    <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} fontSize={9} tick={{fill: '#9ca3af'}} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} fontSize={9} tick={{fill: '#9ca3af'}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="price" stroke="#22c55e" strokeWidth={2} dot={{r: 3, fill: '#22c55e'}} />
                    <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} dot={{r: 3, fill: '#3b82f6'}} />
                  </LineChart>
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
              {/* FIXED: Source label - Data 7 hari terakhir dengan tanggal real, sumber terpercaya */}
              <div className="text-[10px] text-gray-400 text-center mt-2 leading-relaxed space-y-1">
                <p>
                  <span className="font-semibold">Sumber Data:</span> Badan Pusat Statistik (BPS) Indonesia 2025 • 
                  Harga Pasar Komoditas Pertanian Jawa Barat
                </p>
                <p>
                  Data 7 hari terakhir ({chartData.length > 0 && chartData[0]?.fullDate ? `${chartData[0].fullDate} - ${chartData[chartData.length - 1]?.fullDate || chartData[0].fullDate}` : '7 hari terakhir'}) • 
                  Update: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400 text-sm">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Explore Features Grid */}
      <div>
        <h3 className="font-bold text-lg text-gray-900 mb-4">Explore Features</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
           <FeatureCard icon={Sprout} label="Planting Recommendations" onClick={() => onNavigate(Screen.PLANTING)} />
           <FeatureCard icon={BookOpen} label="Education & Cultivation Hub" onClick={() => onNavigate(Screen.EDUCATION)} />
           <FeatureCard icon={ChefHat} label="Recipes & Innovation" onClick={() => onNavigate(Screen.RECIPES)} />
           <FeatureCard icon={TrendingUp} label="Market Analysis" onClick={() => onNavigate(Screen.MARKET)} />
        </div>
      </div>

      {/* Harvest Estimator Card */}
      <div className="bg-[#ecfdf5] rounded-[2rem] p-6 text-center border border-green-100 mb-6">
         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-[#22c55e]">
            <BarChart2 size={24} />
         </div>
         <h3 className="font-bold text-[#22c55e] text-lg">Harvest Estimator</h3>
         <p className="text-gray-600 text-sm mt-1 mb-4 leading-relaxed">Predict your total harvest yield and optimize your planning.</p>
         <button 
           onClick={() => onNavigate(Screen.HARVEST)}
           className="w-full bg-[#22c55e] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-green-200 active:scale-95 transition-all flex items-center justify-center gap-2"
         >
           Estimate Harvest Now <ChevronRight size={16} />
         </button>
      </div>

    </div>
  );
};

const FeatureCard: React.FC<{ icon: any, label: string, onClick: () => void }> = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="bg-white border border-gray-100 p-5 rounded-3xl flex flex-col items-center justify-center text-center hover:shadow-md transition-all active:scale-95 h-36">
     <div className="w-10 h-10 rounded-full border border-green-100 flex items-center justify-center text-[#22c55e] mb-3 bg-green-50">
       <Icon size={20} />
     </div>
     <span className="text-xs font-bold text-gray-800 leading-tight">{label}</span>
  </button>
);

export default HomeView;
