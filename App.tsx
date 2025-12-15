
import React, { useState, useEffect } from 'react';
import { Home, Sprout, BookOpen, ChefHat, Store, User, Settings, Wheat, ChevronLeft } from 'lucide-react';
import { Screen } from './types';
import { ToastProvider, setGlobalToast } from './components/Toast';

// Components
import HomeView from './components/HomeView';
import ClimateView from './components/ClimateView';
import PlantingView from './components/PlantingView';
import HarvestView from './components/HarvestView';
import EducationView from './components/EducationView';
import RecipesView from './components/RecipesView';
import HppView from './components/HppView';
import MarketView from './components/MarketView';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.SPLASH);
  const [history, setHistory] = useState<Screen[]>([]);
  const [session, setSession] = useState<any>(null);

  // Initialize global toast
  useEffect(() => {
    // This will be set by ToastProvider
    const checkToast = setInterval(() => {
      if ((window as any).showToast) {
        setGlobalToast((window as any).showToast);
        clearInterval(checkToast);
      }
    }, 100);
    return () => clearInterval(checkToast);
  }, []);

  // Initialize Session (Check LocalStorage instead of Supabase)
  useEffect(() => {
    const checkSession = () => {
        const storedUser = localStorage.getItem('user_session');
        if (storedUser) {
            setSession({ user: JSON.parse(storedUser) });
            setScreen(Screen.HOME);
        } else {
            setSession(null);
            // Wait for splash animation before showing Auth
            setTimeout(() => {
                if(screen === Screen.SPLASH) setScreen(Screen.AUTH);
            }, 2500);
        }
    };
    
    // Simulate initial load
    checkSession();
  }, []);

  // FIXED: Listen untuk perubahan localStorage (ketika avatar diupdate)
  useEffect(() => {
    const handleUserUpdate = () => {
      const storedUser = localStorage.getItem('user_session');
      if (storedUser) {
        setSession({ user: JSON.parse(storedUser) });
      }
    };

    // Custom event untuk update dari komponen yang sama
    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  const handleLoginSuccess = (user: any) => {
      setSession({ user });
      setScreen(Screen.HOME);
  };

  const handleLogout = () => {
      localStorage.removeItem('user_session');
      setSession(null);
      setScreen(Screen.AUTH);
  };

  const navigate = (nextScreen: Screen) => {
    setHistory([...history, screen]);
    setScreen(nextScreen);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setScreen(prev);
    } else {
      setScreen(Screen.HOME);
    }
  };

  // Render Splash
  if (screen === Screen.SPLASH) {
    return (
      <div className="min-h-screen bg-[#22c55e] flex flex-col items-center justify-center text-white relative">
        <div className="bg-white rounded-[2rem] p-6 mb-6 shadow-xl animate-in fade-in zoom-in duration-700">
           <Wheat size={64} className="text-[#22c55e]" strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">SorAiFarm</h1>
        <p className="text-green-100 font-medium opacity-90">Smart Sorghum Farming</p>
      </div>
    );
  }

  // Render Auth
  if (screen === Screen.AUTH) {
    return <AuthView onLogin={handleLoginSuccess} />;
  }

  // Header Title Logic
  const getHeaderTitle = () => {
    switch(screen) {
      case Screen.HOME: return "SorAiFarm";
      case Screen.PLANTING: return "Planting Recommendations";
      case Screen.HARVEST: return "Harvest Estimator";
      case Screen.EDUCATION: return "Education & Cultivation";
      case Screen.RECIPES: return "Recipes & Innovation";
      case Screen.MARKET: return "Market Analysis";
      case Screen.PROFILE: return "Profile";
      case Screen.SETTINGS: return "Pengaturan";
      case Screen.HPP: return "HPP Calculator";
      default: return "";
    }
  };

  const showBottomNav = [Screen.HOME, Screen.PLANTING, Screen.EDUCATION, Screen.RECIPES, Screen.MARKET].includes(screen);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 flex justify-center font-sans text-gray-900">
        {/* FIXED: Responsive layout dengan max-width container untuk desktop */}
        <div className="w-full max-w-md md:max-w-7xl md:mx-auto md:px-4 lg:px-8 bg-white min-h-screen shadow-2xl relative flex flex-col">
        
        {/* HEADER - FIXED: Z-index untuk tidak tertutup, responsive padding */}
        <header className={`px-4 sm:px-6 pt-8 sm:pt-12 pb-3 sm:pb-4 flex items-center justify-between bg-white z-30 sticky top-0 ${screen === Screen.HOME ? '' : 'border-b border-gray-50'}`}>
          {screen === Screen.HOME ? (
            <>
               <div className="flex items-center space-x-2 text-[#22c55e]">
                 <div className="bg-green-50 p-2 rounded-xl border border-green-100">
                    <Wheat size={24} className="text-[#22c55e]" />
                 </div>
                 <h1 className="text-xl font-bold tracking-tight text-gray-900">SorAiFarm</h1>
               </div>
               <div className="flex items-center space-x-4">
                  <button onClick={() => navigate(Screen.SETTINGS)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Settings size={22} />
                  </button>
                  <button onClick={() => navigate(Screen.PROFILE)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    {/* Show Avatar if available, else Icon */}
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                        {session?.user?.avatar_url ? (
                            <img src={session.user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={18} />
                        )}
                    </div>
                  </button>
               </div>
            </>
          ) : (
            <>
              <button onClick={goBack} className="p-2 -ml-2 text-gray-800 hover:bg-gray-50 rounded-full transition-colors">
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-lg font-bold text-gray-900 absolute left-1/2 -translate-x-1/2 w-max">
                {getHeaderTitle()}
              </h1>
              <div className="w-8"></div>
            </>
          )}
        </header>

        {/* CONTENT */}
        {/* FIXED: Tambah padding-bottom untuk bottom nav yang fixed */}
        <main className={`flex-1 overflow-y-auto no-scrollbar ${showBottomNav ? 'pb-24' : 'pb-6'}`}>
          {screen === Screen.HOME && <HomeView onNavigate={navigate} user={session?.user} />}
          {screen === Screen.CLIMATE && <ClimateView onNavigate={navigate} />}
          {screen === Screen.PLANTING && <PlantingView />}
          {screen === Screen.HARVEST && <HarvestView onNavigate={navigate} />}
          {screen === Screen.EDUCATION && <EducationView />}
          {screen === Screen.RECIPES && <RecipesView onNavigate={navigate} />}
          {screen === Screen.HPP && <HppView onNavigate={navigate} />}
          {screen === Screen.MARKET && <MarketView />}
          {screen === Screen.PROFILE && <ProfileView session={session} />}
          {screen === Screen.SETTINGS && <SettingsView onLogout={handleLogout} />}
        </main>

        {/* BOTTOM NAV - FIXED: Responsive untuk semua device dengan z-index yang benar */}
        {showBottomNav && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-screen-xl bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-end z-40 pb-6 sm:pb-8 safe-area-bottom">
            <NavButton icon={Home} label="Home" active={screen === Screen.HOME} onClick={() => navigate(Screen.HOME)} />
            <NavButton icon={Sprout} label="Tanam" active={screen === Screen.PLANTING} onClick={() => navigate(Screen.PLANTING)} />
            <NavButton icon={BookOpen} label="Edukasi" active={screen === Screen.EDUCATION} onClick={() => navigate(Screen.EDUCATION)} />
            <NavButton icon={ChefHat} label="Resep" active={screen === Screen.RECIPES} onClick={() => navigate(Screen.RECIPES)} />
            <NavButton icon={Store} label="Pasar" active={screen === Screen.MARKET} onClick={() => navigate(Screen.MARKET)} />
          </nav>
        )}

      </div>
    </div>
    </ToastProvider>
  );
};

const NavButton: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${active ? 'text-[#22c55e] -translate-y-1' : 'text-gray-400 hover:text-gray-600'}`}>
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className={`text-[10px] font-medium tracking-tight ${active ? 'font-bold' : ''}`}>{label}</span>
  </button>
);

export default App;
