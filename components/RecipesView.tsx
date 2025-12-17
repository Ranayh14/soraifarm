
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Check, ArrowRight, Clock, Calculator } from 'lucide-react';
import { Recipe } from '../types';
import { Screen } from '../types';
import { showToast } from './Toast';

const RecipesView: React.FC<{ onNavigate?: (screen: Screen) => void }> = ({ onNavigate }) => {
  const [view, setView] = useState<'LIST' | 'DETAIL' | 'HPP'>('LIST');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState(''); // FIXED: State untuk search query
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]); // FIXED: Store all recipes untuk filtering
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [hppResult, setHppResult] = useState<any>(null);
  const [hppInputs, setHppInputs] = useState({
    rawMaterials: '',
    packaging: '',
    operational: '',
    units: '',
    margin: 20
  });

  // New Recipe State
  const [newRecipeTitle, setNewRecipeTitle] = useState('');
  const [newRecipeDesc, setNewRecipeDesc] = useState('');
  const [newRecipeCategory, setNewRecipeCategory] = useState('Snack');
  const [newRecipeImage, setNewRecipeImage] = useState<File | null>(null);
  const [newRecipeImagePreview, setNewRecipeImagePreview] = useState<string>('');
  const [newIngredients, setNewIngredients] = useState<{name: string, amount: string}[]>([{name: '', amount: ''}]);
  const [newSteps, setNewSteps] = useState<string[]>(['']);
  const [newTime, setNewTime] = useState('');
  const [newDifficulty, setNewDifficulty] = useState('Mudah');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // FIXED: Track views increment untuk menghindari double-count
  const viewsIncrementedRef = useRef<Set<string>>(new Set());
  const viewStartTimeRef = useRef<number | null>(null);

  // FIXED: Fungsi untuk filter recipes berdasarkan search query dan category
  const applyFilters = (recipesToFilter: Recipe[], query: string, cat: string) => {
    let filtered = [...recipesToFilter];

    // Filter berdasarkan category
    if (cat && cat !== 'All') {
      filtered = filtered.filter(r => r.category === cat);
    }

    // Filter berdasarkan search query
    if (query && query.trim() !== '') {
      const lowerQuery = query.toLowerCase().trim();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(lowerQuery) ||
        r.description?.toLowerCase().includes(lowerQuery) ||
        r.author?.toLowerCase().includes(lowerQuery)
      );
    }

    setRecipes(filtered);
  };

  useEffect(() => {
    fetchRecipes();
    
    // FIXED: Check if coming from HomeView
    const selectedId = sessionStorage.getItem('selectedRecipeId');
    if (selectedId) {
      sessionStorage.removeItem('selectedRecipeId');
      fetchRecipeById(selectedId);
    }
  }, [category]);

  // FIXED: Apply filters ketika allRecipes, searchQuery, atau category berubah
  useEffect(() => {
    if (allRecipes.length > 0) {
      applyFilters(allRecipes, searchQuery, category);
    }
  }, [allRecipes, searchQuery, category]);

  // FIXED: Track waktu ketika user membuka detail resep dan increment views setelah 3 menit
  useEffect(() => {
    // Reset timer jika user keluar dari detail atau pindah ke resep lain
    if (view !== 'DETAIL' || !selectedRecipe) {
      viewStartTimeRef.current = null;
      return;
    }

    const recipeId = selectedRecipe.id;
    
    // Skip jika sudah pernah increment views untuk resep ini di session ini
    if (viewsIncrementedRef.current.has(recipeId)) {
      return;
    }

    // Set waktu mulai
    viewStartTimeRef.current = Date.now();

    // Set timer untuk increment views setelah 3 menit (180000 ms)
    const timer = setTimeout(() => {
      // Double check: masih di detail view dan resep yang sama
      if (view === 'DETAIL' && selectedRecipe && selectedRecipe.id === recipeId) {
        // Skip jika sudah pernah increment
        if (viewsIncrementedRef.current.has(recipeId)) {
          return;
        }

        // Mark sebagai sudah increment
        viewsIncrementedRef.current.add(recipeId);

        // Increment views di database
        fetch(`http://localhost:3001/api/recipes/${recipeId}/increment-views`, {
          method: 'PUT'
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              // Update views di state
              setSelectedRecipe(prev => prev ? { ...prev, views: data.views } : null);
              // Update views di recipes list juga jika ada
              setRecipes(prevRecipes => 
                prevRecipes.map(r => r.id === recipeId ? { ...r, views: data.views } : r)
              );
            }
          })
          .catch(err => {
            console.error('Failed to increment views:', err);
            // Remove from set jika gagal, agar bisa dicoba lagi
            viewsIncrementedRef.current.delete(recipeId);
          });
      }
    }, 180000); // 3 menit = 180000 ms

    // Cleanup timer jika component unmount atau view berubah
    return () => {
      clearTimeout(timer);
    };
  }, [view, selectedRecipe]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const url = category === 'All' 
        ? 'http://localhost:3001/api/recipes'
        : `http://localhost:3001/api/recipes?category=${category}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Transform to Recipe format
      const transformedRecipes = data.map((r: any) => ({
        id: String(r.id),
        title: r.title,
        description: r.description,
        category: r.category as 'Food' | 'Drink' | 'Snack' | 'All',
        image: r.image_url,
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        steps: Array.isArray(r.steps) ? r.steps : [],
        time: r.time,
        difficulty: r.difficulty,
        servings: r.servings,
        author: r.author,
        authorAvatar: r.author_avatar,
        likes: r.likes || 0,
        views: r.views || 0,
        created_at: r.created_at // FIXED: Include created_at for sorting
      }));

      // FIXED: Store all recipes untuk filtering
      // Filter akan diterapkan melalui useEffect ketika allRecipes di-set
      setAllRecipes(transformedRecipes);
      // Latest submissions: 10 resep terbaru (sudah sorted by created_at DESC dari server)
      setSubmissions(transformedRecipes.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUser = () => {
    const stored = localStorage.getItem('user_session');
    return stored ? JSON.parse(stored) : null;
  };

  const fetchRecipeById = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/recipes/${id}`);
      const data = await response.json();
      if (data.success) {
        const recipe = {
          id: String(data.recipe.id),
          title: data.recipe.title,
          description: data.recipe.description,
          category: data.recipe.category,
          image: data.recipe.image_url,
          ingredients: Array.isArray(data.recipe.ingredients) ? data.recipe.ingredients : [],
          steps: Array.isArray(data.recipe.steps) ? data.recipe.steps : [],
          time: data.recipe.time,
          difficulty: data.recipe.difficulty,
          servings: data.recipe.servings,
          author: data.recipe.author,
          authorAvatar: data.recipe.author_avatar,
          likes: data.recipe.likes || 0,
          views: data.recipe.views || 0 // FIXED: Include views from database
        };
        setSelectedRecipe(recipe);
        setView('DETAIL');
      }
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
      // Try to find in current recipes list
      const found = recipes.find(r => String(r.id) === id);
      if (found) {
        setSelectedRecipe(found);
        setView('DETAIL');
      }
    }
  };

  const handleRecipeClick = (r: Recipe) => {
    // FIXED: Selalu fetch dari API untuk konsistensi dan memastikan data terbaru (termasuk views)
    // Ini memastikan semua cara membuka detail resep menggunakan cara yang sama
    fetchRecipeById(r.id);
  };

  // FIXED: Handler untuk search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(allRecipes, query, category);
  };

  const handleAddIngredient = () => {
    setNewIngredients([...newIngredients, {name: '', amount: ''}]);
  };

  const handleIngredientChange = (idx: number, field: 'name' | 'amount', val: string) => {
    const arr = [...newIngredients];
    arr[idx][field] = val;
    setNewIngredients(arr);
  };

  const handleAddStep = () => {
    setNewSteps([...newSteps, '']);
  };

  const handleStepChange = (idx: number, val: string) => {
    const arr = [...newSteps];
    arr[idx] = val;
    setNewSteps(arr);
  };

  const calculateHPP = () => {
    const raw = parseFloat(hppInputs.rawMaterials) || 0;
    const packaging = parseFloat(hppInputs.packaging) || 0;
    const operational = parseFloat(hppInputs.operational) || 0;
    const units = parseFloat(hppInputs.units) || 1;

    const totalCost = raw + packaging + operational;
    const hppPerUnit = totalCost / units;
    const sellingPrice = hppPerUnit * (1 + hppInputs.margin / 100);

    setHppResult({
      hppPerUnit: Math.round(hppPerUnit),
      sellingPrice: Math.round(sellingPrice),
      profitPerUnit: Math.round(sellingPrice - hppPerUnit),
      totalCost
    });
  };

  // HPP Calculator View
  if (view === 'HPP' && selectedRecipe) {
    return (
      <div className="px-6 py-4 space-y-6">
        <button onClick={() => setView('DETAIL')} className="flex items-center gap-2 text-gray-600 mb-4">
          <ArrowRight className="rotate-180" size={20} />
          <span>Kembali ke Resep</span>
        </button>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">HPP Calculator</h2>
          <p className="text-gray-500 text-sm">Hitung Harga Pokok Produksi untuk: {selectedRecipe.title}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Biaya Bahan Baku (Rp)</label>
            <input
              type="number"
              value={hppInputs.rawMaterials}
              onChange={e => setHppInputs({...hppInputs, rawMaterials: e.target.value})}
              placeholder="e.g., 100000"
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Total cost for all raw materials used to produce selected recipe items.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Biaya Kemasan (Rp)</label>
            <input
              type="number"
              value={hppInputs.packaging}
              onChange={e => setHppInputs({...hppInputs, packaging: e.target.value})}
              placeholder="e.g., 5000"
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Cost per unit for packaging materials.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Biaya Operasional (Rp)</label>
            <input
              type="number"
              value={hppInputs.operational}
              onChange={e => setHppInputs({...hppInputs, operational: e.target.value})}
              placeholder="e.g., 20000"
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Total overhead and miscellaneous operational expenses.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah Unit Diproduksi</label>
            <input
              type="number"
              min="1"
              value={hppInputs.units}
              onChange={e => setHppInputs({...hppInputs, units: e.target.value})}
              placeholder="e.g., 10"
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-bold text-gray-700">Margin Keuntungan</label>
              <span className="text-sm font-bold text-[#22c55e] bg-green-50 px-2 py-1 rounded">{hppInputs.margin}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={hppInputs.margin}
              onChange={e => setHppInputs({...hppInputs, margin: Number(e.target.value)})}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#22c55e]"
            />
          </div>
        </div>

        <button
          onClick={calculateHPP}
          className="w-full bg-[#22c55e] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-200"
        >
          Calculate HPP
        </button>

        {hppResult && (
          <div className="bg-[#ecfdf5] rounded-3xl p-6 border border-green-100">
            <h3 className="font-bold text-gray-900 mb-4">Hasil Perhitungan</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">HPP per Unit</span>
                <span className="font-bold text-lg">Rp {hppResult.hppPerUnit.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Harga Jual (dengan margin {hppInputs.margin}%)</span>
                <span className="font-bold text-lg text-[#22c55e]">Rp {hppResult.sellingPrice.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-green-200">
                <span className="text-gray-600">Profit per Unit</span>
                <span className="font-bold text-lg text-[#22c55e]">+Rp {hppResult.profitPerUnit.toLocaleString('id-ID')}</span>
              </div>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate(Screen.MARKET)}
                className="w-full mt-4 bg-white border-2 border-[#22c55e] text-[#22c55e] py-3 rounded-xl font-bold"
              >
                Compare with Market Price
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // FIXED: Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setNewRecipeImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewRecipeImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRecipe = async () => {
    if (!newRecipeTitle || !newRecipeDesc) {
      showToast('Judul dan deskripsi wajib diisi', 'warning');
      return;
    }

    const user = getUser();
    if (!user?.id) {
      showToast('Silakan login terlebih dahulu', 'warning');
      return;
    }

    setSubmitting(true);
    let imageUrl = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'; // Default

    // FIXED: Upload image jika ada dengan error handling yang proper
    if (newRecipeImage) {
      setUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append('image', newRecipeImage);

        const uploadResponse = await fetch('http://localhost:3001/api/upload/recipe', {
          method: 'POST',
          body: formData
        });

        // FIXED: Check response status and content-type
        if (!uploadResponse.ok) {
          const text = await uploadResponse.text();
          console.error('Upload failed:', uploadResponse.status, text);
          throw new Error(`Server error: ${uploadResponse.status}`);
        }

        const contentType = uploadResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await uploadResponse.text();
          console.error('Invalid response type:', contentType, text);
          throw new Error('Server mengembalikan response non-JSON');
        }

        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          imageUrl = uploadData.url;
          showToast('Gambar berhasil diupload', 'success');
        } else {
          showToast('Gagal mengupload gambar, menggunakan gambar default', 'warning');
        }
      } catch (error: any) {
        console.error('Failed to upload image:', error);
        const errorMsg = error.message || 'Gagal mengupload gambar, menggunakan gambar default';
        showToast(errorMsg, 'warning');
      } finally {
        setUploadingImage(false);
      }
    }

    try {
      const response = await fetch('http://localhost:3001/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          title: newRecipeTitle,
          description: newRecipeDesc,
          category: newRecipeCategory,
          image_url: imageUrl,
          ingredients: newIngredients.filter(ing => ing.name),
          steps: newSteps.filter(step => step),
          time: newTime,
          difficulty: newDifficulty,
          servings: ''
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast('Resep berhasil ditambahkan!', 'success');
        setShowAddModal(false);
        // Reset form
        setNewRecipeTitle('');
        setNewRecipeDesc('');
        setNewRecipeImage(null);
        setNewRecipeImagePreview('');
        setNewIngredients([{name: '', amount: ''}]);
        setNewSteps(['']);
        setNewTime('');
        setNewDifficulty('Mudah');
        // Refresh recipes
        await fetchRecipes();
      } else {
        const errorMsg = data.message || 'Gagal menambahkan resep';
        showToast(errorMsg, 'error');
        console.error('API Error:', data);
      }
    } catch (error: any) {
      console.error('Error submitting recipe:', error);
      const errorMsg = error.message || 'Terjadi kesalahan saat menghubungi server. Pastikan backend berjalan di http://localhost:3001';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Detail View
  if (view === 'DETAIL' && selectedRecipe) {
    return (
      <div className="bg-white min-h-screen pb-10">
        {/* Header Image */}
        <div className="relative h-72 w-full">
           <img src={selectedRecipe.image} className="w-full h-full object-cover" alt={selectedRecipe.title} />
           <button onClick={() => setView('LIST')} className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
              <ArrowRight className="rotate-180 text-gray-800" size={20} />
           </button>
           <span className="absolute top-6 left-20 bg-[#22c55e] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
             {selectedRecipe.category}
           </span>
        </div>

        <div className="px-6 -mt-8 relative z-10">
           <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{selectedRecipe.title}</h1>
              <div className="flex space-x-4 text-gray-500 text-sm font-medium mb-4">
                 <span className="flex items-center gap-1"><Check className="text-[#22c55e]" size={16} /> {selectedRecipe.difficulty || 'Mudah'}</span>
                 <span className="flex items-center gap-1"><Clock size={16} /> {selectedRecipe.time || '30 Menit'}</span>
              </div>
              <button 
                onClick={() => setView('HPP')}
                className="w-full border border-[#22c55e] text-[#22c55e] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <Calculator size={18} /> Hitung HPP
              </button>
           </div>
        </div>

        <div className="px-6 mt-8 space-y-8">
           {/* Ingredients */}
           <div>
              <h3 className="font-bold text-lg text-gray-900 mb-4">Bahan-bahan</h3>
              <div className="space-y-3">
                 {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 ? (
                   selectedRecipe.ingredients.map((ing, i) => (
                     <div key={i} className="flex items-center p-3 bg-gray-50 rounded-xl">
                        <div className="w-2.5 h-2.5 bg-[#22c55e] rounded-full mr-3"></div>
                        <span className="text-gray-700 font-medium text-sm">
                          {typeof ing === 'string' ? ing : `${ing.name} ${ing.amount || ''}`}
                        </span>
                     </div>
                   ))
                 ) : (
                   <p className="text-gray-400 text-sm">Tidak ada bahan yang tercantum</p>
                 )}
              </div>
           </div>

           {/* Steps Timeline - FIXED: Alignment timeline dan nomor sejajar vertikal */}
           <div>
              <h3 className="font-bold text-lg text-gray-900 mb-6">Cara Membuat</h3>
              {selectedRecipe.steps && selectedRecipe.steps.length > 0 ? (
                <div className="relative space-y-8">
                   {/* FIXED: Garis timeline di center nomor - w-8 (32px) + border-4 (4px per sisi = 8px total) = 40px, center = 20px */}
                   <div className="absolute left-[20px] top-2 bottom-4 w-0.5 bg-[#22c55e]/30"></div>
                   {selectedRecipe.steps.map((step, i) => (
                      <div key={i} className="relative pl-10">
                         {/* FIXED: Nomor timeline - w-8 (32px) dengan border-4, center di 20px dari left-0 */}
                         <div className="absolute left-0 top-0 w-8 h-8 bg-[#dcfce7] text-[#22c55e] rounded-full flex items-center justify-center text-sm font-bold border-4 border-white z-10">
                            {i+1}
                         </div>
                         <p className="text-gray-600 text-sm leading-relaxed">{step}</p>
                      </div>
                   ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Tidak ada langkah yang tercantum</p>
              )}
           </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="px-6 pt-2 pb-8 space-y-6">
      
      {/* Search - FIXED: Tambahkan handler untuk search */}
      <div className="relative">
         <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
         <input 
           type="text" 
           placeholder="Search recipes or ideas..." 
           value={searchQuery}
           onChange={handleSearchChange}
           className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#22c55e]" 
         />
      </div>

      {/* Categories */}
      <div>
         <h3 className="font-bold text-gray-900 mb-3">Recipe Categories</h3>
         <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['All', 'Food', 'Drink', 'Snack'].map(cat => (
               <button 
                  key={cat} 
                  onClick={() => {
                    const newCategory = cat === 'All' ? 'All' : cat;
                    setCategory(newCategory);
                    applyFilters(allRecipes, searchQuery, newCategory);
                  }}
                  className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    category === cat ? 'bg-[#22c55e] text-white' : 'border border-gray-200 text-gray-600'
                  }`}
               >
                  {cat}
               </button>
            ))}
         </div>
      </div>

      {/* Add Recipe Card */}
      <div className="border-2 border-dashed border-gray-200 rounded-[2rem] p-8 text-center bg-gray-50/50">
         <h3 className="font-bold text-gray-900 text-lg mb-2">Share Your Sorghum Creation!</h3>
         <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">Have a delicious sorghum recipe or creative idea? Share it with our community and inspire other farmers.</p>
         <button 
           onClick={() => setShowAddModal(true)} 
           className="bg-[#22c55e] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto"
         >
            <Plus size={18} /> Add New Recipe
         </button>
      </div>

      {/* Featured Recipes */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : (
        <>
          <div>
             <h3 className="font-bold text-gray-900 mb-4">Our Featured Recipes</h3>
             <div className="space-y-6">
                {recipes.map(recipe => (
                   <div 
                     key={recipe.id} 
                     onClick={() => handleRecipeClick(recipe)} 
                     className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                   >
                      <div className="h-48 overflow-hidden">
                         <img src={recipe.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={recipe.title} />
                      </div>
                      <div className="p-5">
                         <h4 className="font-bold text-xl text-gray-900 mb-2">{recipe.title}</h4>
                         <p className="text-gray-500 text-sm line-clamp-2 mb-4">{recipe.description}</p>
                         <button className="w-full py-2.5 rounded-xl border border-gray-200 text-[#22c55e] font-bold text-sm hover:bg-green-50 transition-colors">View Recipe</button>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Latest Submissions */}
          {submissions.length > 0 && (
            <div>
               <h3 className="font-bold text-gray-900 mb-4">Latest Submissions</h3>
               <div className="space-y-4">
                  {submissions.map((submission: any) => (
                     <div key={submission.id} className="bg-gray-50 p-4 rounded-2xl flex items-start gap-4">
                        <img 
                          src={submission.authorAvatar || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80'} 
                          className="w-10 h-10 rounded-full object-cover" 
                          alt={submission.author}
                        />
                        <div className="flex-1">
                           <h4 className="font-bold text-gray-900 text-sm">{submission.author || 'Anonymous'}</h4>
                           <p className="text-xs text-gray-400 mb-3">
                              {submission.created_at 
                                ? (() => {
                                    const date = new Date(submission.created_at);
                                    const now = new Date();
                                    const diffMs = now.getTime() - date.getTime();
                                    const diffMins = Math.floor(diffMs / 60000);
                                    const diffHours = Math.floor(diffMins / 60);
                                    const diffDays = Math.floor(diffHours / 24);
                                    
                                    if (diffMins < 1) return 'Baru saja';
                                    if (diffMins < 60) return `${diffMins} menit yang lalu`;
                                    if (diffHours < 24) return `${diffHours} jam yang lalu`;
                                    if (diffDays < 7) return `${diffDays} hari yang lalu`;
                                    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                                  })()
                                : 'Tidak diketahui'}
                           </p>
                           <div className="flex gap-3">
                              <img src={submission.image} className="w-16 h-16 rounded-xl object-cover" alt={submission.title} />
                              <div>
                                 <h5 className="font-bold text-gray-800 text-sm">{submission.title}</h5>
                                 <p className="text-xs text-gray-500 mt-1 line-clamp-2">{submission.description}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          )}
        </>
      )}

      {/* Add Recipe Modal */}
      {showAddModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl p-0 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg">Tambah Resep Baru</h3>
                  <button onClick={() => setShowAddModal(false)}><X className="text-gray-400" size={24} /></button>
               </div>
               <div className="p-6 overflow-y-auto space-y-6">
                  {/* FIXED: Image Upload */}
                  <div>
                     <label className="block text-sm font-bold text-gray-900 mb-2">Foto Resep</label>
                     {newRecipeImagePreview ? (
                        <div className="relative">
                           <img src={newRecipeImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                           <button
                              onClick={() => {
                                 setNewRecipeImage(null);
                                 setNewRecipeImagePreview('');
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                           >
                              <X size={16} />
                           </button>
                        </div>
                     ) : (
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
                           <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-[#22c55e]">
                                 <Plus size={24} />
                              </div>
                              <p className="mb-2 text-sm text-gray-500 font-medium">Klik untuk upload foto</p>
                              <p className="text-xs text-gray-400">PNG, JPG, GIF (Max. 5MB)</p>
                           </div>
                           <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                     )}
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-gray-900 mb-2">Judul Resep</label>
                     <input 
                       type="text" 
                       value={newRecipeTitle}
                       onChange={e => setNewRecipeTitle(e.target.value)}
                       className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#22c55e]" 
                       placeholder="Contoh: Salad Sorghum" 
                     />
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-gray-900 mb-2">Deskripsi</label>
                     <textarea 
                       value={newRecipeDesc}
                       onChange={e => setNewRecipeDesc(e.target.value)}
                       className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#22c55e] h-24" 
                       placeholder="Ceritakan tentang masakan Anda..."
                     ></textarea>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-gray-900 mb-2">Kategori</label>
                     <select 
                       value={newRecipeCategory}
                       onChange={e => setNewRecipeCategory(e.target.value)}
                       className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#22c55e]"
                     >
                       <option value="Snack">Snack</option>
                       <option value="Food">Food</option>
                       <option value="Drink">Drink</option>
                     </select>
                  </div>

                  <div>
                     <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-gray-900">Bahan-bahan</label>
                        <button onClick={handleAddIngredient} className="text-xs text-[#22c55e] font-bold flex items-center gap-1">Tambah <Plus size={12}/></button>
                     </div>
                     <div className="space-y-3">
                        {newIngredients.map((ing, i) => (
                           <div key={i} className="flex gap-2">
                              <input 
                                type="text" 
                                value={ing.name}
                                onChange={e => handleIngredientChange(i, 'name', e.target.value)}
                                className="flex-1 bg-gray-50 border-none p-3 rounded-xl text-sm" 
                                placeholder="Bahan" 
                              />
                              <input 
                                type="text" 
                                value={ing.amount}
                                onChange={e => handleIngredientChange(i, 'amount', e.target.value)}
                                className="w-24 bg-gray-50 border-none p-3 rounded-xl text-sm" 
                                placeholder="Jml" 
                              />
                           </div>
                        ))}
                     </div>
                  </div>

                  <div>
                     <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-gray-900">Langkah-langkah</label>
                        <button onClick={handleAddStep} className="text-xs text-[#22c55e] font-bold flex items-center gap-1">Tambah <Plus size={12}/></button>
                     </div>
                     <div className="space-y-3">
                        {newSteps.map((step, i) => (
                           <textarea
                             key={i}
                             value={step}
                             onChange={e => handleStepChange(i, e.target.value)}
                             className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm"
                             placeholder={`Langkah ${i + 1}`}
                             rows={2}
                           />
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Waktu</label>
                        <input 
                          type="text" 
                          value={newTime}
                          onChange={e => setNewTime(e.target.value)}
                          className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm" 
                          placeholder="45 Menit" 
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Tingkat Kesulitan</label>
                        <select 
                          value={newDifficulty}
                          onChange={e => setNewDifficulty(e.target.value)}
                          className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm"
                        >
                          <option value="Mudah">Mudah</option>
                          <option value="Sedang">Sedang</option>
                          <option value="Sulit">Sulit</option>
                        </select>
                     </div>
                  </div>

                  <button 
                    onClick={handleSubmitRecipe}
                    disabled={submitting}
                    className="w-full bg-[#22c55e] text-white py-4 rounded-xl font-bold shadow-lg shadow-green-200 disabled:opacity-50"
                  >
                     {submitting ? 'Mengirim...' : 'Kirim Resep'}
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default RecipesView;
