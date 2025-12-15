
import React, { useState } from 'react';
import { Wheat, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

interface AuthViewProps {
  onLogin: (userData?: any) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'WELCOME' | 'LOGIN' | 'REGISTER'>('WELCOME');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // FIXED: Email validation dengan regex
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // --- INTEGRASI BACKEND ---
  const handleAuth = async () => {
    setErrorMsg('');
    
    // FIXED: Validasi email ketat untuk register
    if (mode === 'REGISTER') {
      if (!email || !password || !fullName) {
        setErrorMsg('Semua field wajib diisi');
        return;
      }
      
      if (!validateEmail(email)) {
        setErrorMsg('Format email tidak valid. Contoh: petani@contoh.com');
        return;
      }
      
      // Reject dummy emails
      const dummyEmails = ['test@test', 'a@a', 'email@email', '123@123', 'asd@asd'];
      if (dummyEmails.some(dummy => email.toLowerCase().includes(dummy))) {
        setErrorMsg('Email tidak valid. Gunakan email yang benar.');
        return;
      }
      
      if (password.length < 6) {
        setErrorMsg('Password minimal 6 karakter');
        return;
      }
    } else {
      if (!email || !password) {
        setErrorMsg('Email dan password wajib diisi');
        return;
      }
    }
    
    setLoading(true);
    
    try {
        const endpoint = mode === 'LOGIN' ? 'http://localhost:3001/api/login' : 'http://localhost:3001/api/register';
        const payload = mode === 'LOGIN' 
            ? { email, password }
            : { email, password, full_name: fullName };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Terjadi kesalahan.');
        }

        // Simpan sesi sederhana di localStorage (untuk demo)
        // Di produksi, gunakan Context atau Redux
        localStorage.setItem('user_session', JSON.stringify(data.user));
        
        // Callback ke App.tsx
        onLogin(data.user);

    } catch (error: any) {
        setErrorMsg(error.message || 'Gagal menghubungi server.');
    } finally {
        setLoading(false);
    }
  };

  if (mode === 'WELCOME') {
    return (
      <div className="min-h-screen bg-[#f0fdf4] relative overflow-hidden flex flex-col justify-end">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-2/3 flex items-center justify-center">
           <div className="w-64 h-64 bg-white rounded-[3rem] flex items-center justify-center shadow-xl shadow-green-100 transform rotate-12">
             <Wheat size={100} className="text-[#22c55e] -rotate-12" strokeWidth={1.5} />
           </div>
        </div>

        <div className="bg-white rounded-t-[3rem] p-8 pb-12 z-10 text-center shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
           <h1 className="text-3xl font-bold text-gray-900 mb-2">
             Revolusi Pertanian <br />
             <span className="text-[#22c55e]">Sorghum</span> Modern
           </h1>
           <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
             Tingkatkan hasil panen dengan rekomendasi AI, akses pasar yang lebih luas, dan komunitas petani cerdas.
           </p>

           <button 
             onClick={() => setMode('REGISTER')}
             className="w-full bg-[#22c55e] text-white py-4 rounded-xl font-bold text-lg mb-4 flex items-center justify-center gap-2 shadow-lg shadow-green-200 active:scale-95 transition-all"
           >
             Mulai Sekarang <ArrowRight size={20} />
           </button>
           
           <button 
             onClick={() => setMode('LOGIN')}
             className="w-full bg-white text-[#22c55e] py-4 rounded-xl font-bold border border-[#22c55e] active:scale-95 transition-all"
           >
             Sudah Punya Akun? Masuk
           </button>
        </div>
      </div>
    );
  }

  const isLogin = mode === 'LOGIN';

  return (
    <div className="min-h-screen bg-white p-8 flex flex-col">
      <div className="mt-8 mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {isLogin ? 'Selamat Datang.' : 'Buat Akun.'}
        </h1>
        <p className="text-gray-400 text-lg">
          {isLogin ? 'Masuk untuk mengelola lahan Anda.' : 'Mulai perjalanan bertani cerdas.'}
        </p>
      </div>

      <div className="space-y-6 flex-1">
        {!isLogin && (
          <div>
            <label className="block text-gray-600 font-bold mb-2 text-sm">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-4 top-4 text-gray-300" size={20} />
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama Petani" 
                className="w-full bg-gray-50 p-4 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22c55e] transition-all" 
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-gray-600 font-bold mb-2 text-sm">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-gray-300" size={20} />
            <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="petani@contoh.com" 
                className="w-full bg-gray-50 p-4 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22c55e] transition-all" 
            />
          </div>
        </div>

        <div>
           <label className="block text-gray-600 font-bold mb-2 text-sm">Password</label>
           <div className="relative">
             <Lock className="absolute left-4 top-4 text-gray-300" size={20} />
             <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-gray-50 p-4 pl-12 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22c55e] transition-all" 
             />
             <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-300 hover:text-gray-600">
               {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
             </button>
           </div>
        </div>

        {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                {errorMsg}
            </div>
        )}

        <button 
           onClick={handleAuth}
           disabled={loading}
           className="w-full bg-[#22c55e] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-200 hover:shadow-xl active:scale-95 transition-all mt-6 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Masuk' : 'Daftar')}
        </button>

      </div>

      <div className="mt-8 text-center text-sm font-medium text-gray-600">
         {isLogin ? "Belum punya akun? " : "Sudah Punya akun? "}
         <button onClick={() => {setMode(isLogin ? 'REGISTER' : 'LOGIN'); setErrorMsg('');}} className="text-[#22c55e] font-bold hover:underline">
           {isLogin ? 'Daftar Sekarang' : 'Masuk'}
         </button>
      </div>
    </div>
  );
};

export default AuthView;
