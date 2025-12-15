
import React from 'react';
import { Bell, Globe, Shield, HelpCircle, LogOut, ChevronRight } from 'lucide-react';

interface SettingsViewProps {
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onLogout }) => {
  return (
    <div className="px-6 space-y-8 pt-4">
      
      {/* Section: Umum */}
      <div>
         <h3 className="font-bold text-lg text-gray-900 mb-4">Umum</h3>
         <div className="space-y-3">
            <button className="w-full bg-gray-50 p-4 rounded-2xl flex items-center justify-between group active:bg-gray-100 transition-colors">
               <div className="flex items-center gap-4">
                  <Bell size={20} className="text-gray-700" />
                  <span className="font-bold text-gray-800 text-sm">Notifikasi</span>
               </div>
               <ChevronRight size={20} className="text-gray-400" />
            </button>
            <button className="w-full bg-gray-50 p-4 rounded-2xl flex items-center justify-between group active:bg-gray-100 transition-colors">
               <div className="flex items-center gap-4">
                  <Globe size={20} className="text-gray-700" />
                  <span className="font-bold text-gray-800 text-sm">Bahasa</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-medium">Indonesia</span>
                  <ChevronRight size={20} className="text-gray-400" />
               </div>
            </button>
         </div>
      </div>

      {/* Section: Bantuan & Keamanan */}
      <div>
         <h3 className="font-bold text-lg text-gray-900 mb-4">Bantuan & Keamanan</h3>
         <div className="space-y-3">
            <button className="w-full bg-gray-50 p-4 rounded-2xl flex items-center justify-between group active:bg-gray-100 transition-colors">
               <div className="flex items-center gap-4">
                  <Shield size={20} className="text-gray-700" />
                  <span className="font-bold text-gray-800 text-sm">Keamanan Akun</span>
               </div>
               <ChevronRight size={20} className="text-gray-400" />
            </button>
            <button className="w-full bg-gray-50 p-4 rounded-2xl flex items-center justify-between group active:bg-gray-100 transition-colors">
               <div className="flex items-center gap-4">
                  <HelpCircle size={20} className="text-gray-700" />
                  <span className="font-bold text-gray-800 text-sm">Bantuan & Dukungan</span>
               </div>
               <ChevronRight size={20} className="text-gray-400" />
            </button>
         </div>
      </div>

      {/* Logout */}
      <button 
         onClick={onLogout}
         className="w-full bg-red-50 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 mt-8 active:bg-red-100 transition-colors"
      >
         <LogOut size={20} /> Keluar Aplikasi
      </button>

      <div className="text-center mt-6">
         <p className="text-xs text-gray-400 font-medium">Versi 1.0.2 • SorAiFarm Inc.</p>
      </div>

    </div>
  );
};

export default SettingsView;
