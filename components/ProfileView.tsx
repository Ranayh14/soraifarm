
import React, { useState, useEffect, useRef } from 'react';
import { Edit2, MapPin, Mail, User, Camera, Loader2 } from 'lucide-react';
import { showToast } from './Toast';

interface ProfileViewProps {
  session: any;
}

const ProfileView: React.FC<ProfileViewProps> = ({ session }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user_session');
    const userData = stored ? JSON.parse(stored) : null;
    
    if (userData?.id) {
      fetchUserProfile(userData.id);
    } else {
      setUser(userData);
      setLoading(false);
    }
  }, [session]);

  const fetchUserProfile = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/user/${userId}`);
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      } else {
        // Fallback to session data
        const stored = localStorage.getItem('user_session');
        setUser(stored ? JSON.parse(stored) : null);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      const stored = localStorage.getItem('user_session');
      setUser(stored ? JSON.parse(stored) : null);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Upload profile picture
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Hanya file gambar yang diizinkan', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file maksimal 5MB', 'error');
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('http://localhost:3001/api/upload/profile', {
        method: 'POST',
        body: formData
      });

      // FIXED: Check response status and content-type
      if (!response.ok) {
        const text = await response.text();
        console.error('Upload failed:', response.status, text);
        throw new Error(`Server error: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Invalid response type:', contentType, text);
        throw new Error('Server mengembalikan response non-JSON');
      }

      const data = await response.json();
      if (data.success && user?.id) {
        // Update user profile dengan URL baru
        const updateResponse = await fetch(`http://localhost:3001/api/user/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: user.full_name,
            location: user.location,
            land_area: user.land_area,
            avatar_url: data.url
          })
        });

        if (updateResponse.ok) {
          const updatedUser = { ...user, avatar_url: data.url };
          setUser(updatedUser);
          localStorage.setItem('user_session', JSON.stringify(updatedUser));
          // FIXED: Dispatch custom event untuk update App.tsx session
          window.dispatchEvent(new Event('userUpdated'));
          showToast('Foto profil berhasil diupdate!', 'success');
        } else {
          showToast('Gagal mengupdate profil', 'error');
        }
      } else {
        showToast(data.message || 'Gagal mengupload foto profil', 'error');
      }
    } catch (error: any) {
      console.error('Failed to upload avatar:', error);
      const errorMsg = error.message || 'Gagal mengupload foto profil. Pastikan backend server berjalan.';
      showToast(errorMsg, 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpdate = async (field: string) => {
    if (!user?.id) return;

    const updateData: any = { ...user };
    updateData[field] = editValue;

    try {
      const response = await fetch(`http://localhost:3001/api/user/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: updateData.full_name,
          location: updateData.location,
          land_area: updateData.land_area,
          avatar_url: updateData.avatar_url
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(updateData);
          // Update localStorage
          localStorage.setItem('user_session', JSON.stringify(updateData));
          setEditing(null);
        }
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast('Gagal mengupdate profil', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const fullName = user?.full_name || user?.user_metadata?.full_name || 'Budi Santoso';
  const email = user?.email || 'budisantoso@gmail.com';
  const location = user?.location || 'Bojongsoang, Bandung';
  // FIXED: Gunakan data dari database (total_land_area_ha atau land_area)
  const landArea = user?.total_land_area_ha || user?.land_area || '0';
  const recipeCount = user?.recipe_count || 0;

  return (
    <div className="relative">
      {/* Header Background */}
      <div className="bg-gradient-to-b from-[#4ade80] to-[#22c55e] h-48 rounded-b-[3rem] relative z-0">
      </div>
      
      {/* Profile Card Overlay */}
      <div className="px-6 -mt-16 relative z-10 text-center">
         <div className="relative w-32 h-32 mx-auto mb-4">
            <div className="w-32 h-32 bg-gray-200 rounded-full border-4 border-white shadow-md flex items-center justify-center text-gray-400 overflow-hidden">
               {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
               ) : (
                  <User size={48} className="text-gray-400" />
               )}
            </div>
            {/* FIXED: Upload button overlay */}
            <button
               onClick={() => fileInputRef.current?.click()}
               disabled={uploadingAvatar}
               className="absolute bottom-0 right-0 w-10 h-10 bg-[#22c55e] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#16a34a] transition-colors disabled:opacity-50"
            >
               {uploadingAvatar ? (
                  <Loader2 size={18} className="animate-spin" />
               ) : (
                  <Camera size={18} />
               )}
            </button>
            <input
               ref={fileInputRef}
               type="file"
               accept="image/*"
               onChange={handleAvatarUpload}
               className="hidden"
            />
         </div>
         <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
         <p className="text-gray-500 text-sm">Petani Sorghum • Jawa Barat</p>
      </div>

      <div className="px-6 mt-8 space-y-8">
         {/* Stats - FIXED: Data dari database */}
         <div className="flex gap-4">
            <div className="flex-1 bg-gray-50 rounded-2xl p-4 text-center">
               <span className="block text-[#22c55e] font-bold text-xl mb-1">{landArea}ha</span>
               <span className="text-gray-400 text-xs font-medium">Luas lahan</span>
            </div>
            <div className="flex-1 bg-gray-50 rounded-2xl p-4 text-center">
               <span className="block text-[#22c55e] font-bold text-xl mb-1">{recipeCount}</span>
               <span className="text-gray-400 text-xs font-medium">Resep</span>
            </div>
         </div>

         {/* Personal Info */}
         <div>
            <h3 className="font-bold text-gray-900 mb-4">Info pribadi</h3>
            <div className="space-y-4">
               
               <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="text-green-600"><User size={20} /></div>
                     <div className="text-left">
                        <p className="text-xs text-gray-400">Nama Lengkap</p>
                        {editing === 'full_name' ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => {
                              if (editValue) handleUpdate('full_name');
                            }}
                            onKeyPress={e => {
                              if (e.key === 'Enter' && editValue) {
                                handleUpdate('full_name');
                              }
                            }}
                            className="font-bold text-gray-800 text-sm bg-white border border-gray-200 rounded-lg px-2 py-1"
                            autoFocus
                          />
                        ) : (
                          <p className="font-bold text-gray-800 text-sm">{fullName}</p>
                        )}
                     </div>
                  </div>
                  <button onClick={() => {
                    setEditing('full_name');
                    setEditValue(fullName);
                  }}>
                    <Edit2 size={16} className="text-[#22c55e]" />
                  </button>
               </div>

               <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="text-green-600"><MapPin size={20} /></div>
                     <div className="text-left">
                        <p className="text-xs text-gray-400">Lokasi</p>
                        {editing === 'location' ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => {
                              if (editValue) handleUpdate('location');
                            }}
                            onKeyPress={e => {
                              if (e.key === 'Enter' && editValue) {
                                handleUpdate('location');
                              }
                            }}
                            className="font-bold text-gray-800 text-sm bg-white border border-gray-200 rounded-lg px-2 py-1"
                            autoFocus
                          />
                        ) : (
                          <p className="font-bold text-gray-800 text-sm">{location}</p>
                        )}
                     </div>
                  </div>
                  <button onClick={() => {
                    setEditing('location');
                    setEditValue(location);
                  }}>
                    <Edit2 size={16} className="text-[#22c55e]" />
                  </button>
               </div>

               <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="text-green-600"><Mail size={20} /></div>
                     <div className="text-left">
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="font-bold text-gray-800 text-sm">{email}</p>
                     </div>
                  </div>
                  <Edit2 size={16} className="text-gray-300" />
               </div>

            </div>
         </div>
      </div>
    </div>
  );
};

export default ProfileView;
