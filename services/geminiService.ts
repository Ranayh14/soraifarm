
import { GoogleGenAI, Type } from "@google/genai";
import { PlantingRecommendation, MarketInsight, ClimateData, Recipe, EducationContent } from "../types";

// Initialize the Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Helper for delay with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Wrapper to handle API calls with retry logic for rate limits
async function safeGenerateContent(model: string, contents: any, config: any) {
  let retries = 0;
  const maxRetries = 2; // Max retries to avoid long waits
  
  while (true) {
    try {
      return await ai.models.generateContent({ model, contents, config });
    } catch (error: any) {
      // Check for Rate Limit (429) or Service Unavailable (503)
      const isTransient = error?.status === 429 || error?.code === 429 || error?.status === 503 || error?.message?.includes('429') || error?.message?.includes('quota');
      
      if (isTransient) {
        retries++;
        if (retries > maxRetries) {
          // Throw specific error to be caught by the service function
          throw new Error("QuotaExceeded");
        }
        const waitTime = 2000 * Math.pow(2, retries - 1); // 2s, 4s
        console.warn(`Gemini API Busy/Rate Limit (Attempt ${retries}/${maxRetries}). Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
}

export const getClimateAnalytics = async (location: string, period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<ClimateData> => {
  try {
    let timePrompt = "";
    if (period === 'daily') {
      timePrompt = "prakiraan cuaca per 3 jam untuk 24 jam ke depan (format jam: 06:00, 09:00, dst)";
    } else if (period === 'monthly') {
      timePrompt = "prakiraan cuaca ringkasan per minggu untuk 4 minggu ke depan (Week 1, Week 2, dst)";
    } else {
      timePrompt = "prakiraan cuaca harian untuk 7 hari ke depan (nama hari singkatan Indonesia)";
    }

    const prompt = `Berikan data cuaca real-time (simulasi realistis berdasarkan iklim Indonesia saat ini) untuk lokasi: ${location}. 
    Sertakan suhu saat ini, kondisi (Cerah/Hujan/Mendung), kelembapan (%), kecepatan angin (km/jam), status peringatan ekstrem (boolean).
    
    FIELD 'extremeMessage': WAJIB memberikan analisis singkat mengenai dampak cuaca ini terhadap tanaman SORGUM, khususnya kewaspadaan jelang panen.
    - Jika aman: "Cuaca relatif aman. Kondisi cerah mendukung pengeringan biji sorgum dan persiapan panen."
    - Jika hujan: "Waspada hujan intensitas tinggi, tunda panen untuk menghindari biji sorgum jamuran atau tumbuh tunas di malai."
    - Jika angin: "Waspada angin kencang berisiko merobohkan tanaman sorgum yang tinggi."
    
    PENTING: Berikan data 'forecast' yang berisi ${timePrompt}. Setiap item forecast harus memiliki: name (label waktu), temp (suhu), rain (peluang hujan %), dan humidity (kelembapan %).`;

    const response = await safeGenerateContent(
      "gemini-2.5-flash",
      prompt,
      {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING },
            currentTemp: { type: Type.NUMBER },
            condition: { type: Type.STRING },
            humidity: { type: Type.NUMBER },
            windSpeed: { type: Type.NUMBER },
            isExtreme: { type: Type.BOOLEAN },
            extremeMessage: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            forecast: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  temp: { type: Type.NUMBER },
                  rain: { type: Type.NUMBER },
                  humidity: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    );

    if (response.text) {
      return JSON.parse(response.text) as ClimateData;
    }
    throw new Error("No data returned");
  } catch (error: any) {
    if (error.message === "QuotaExceeded" || error.message?.includes('429')) {
       console.warn("Climate AI: Quota exceeded. Using offline fallback data.");
    } else {
       console.error("Climate AI Error:", error);
    }
    
    // Fallback data
    return {
      location: location,
      currentTemp: 29,
      condition: "Cerah Berawan",
      humidity: 70,
      windSpeed: 10,
      isExtreme: false,
      extremeMessage: "Cuaca relatif aman. Kelembapan terjaga, baik untuk fase pengisian biji sorgum.",
      recommendation: "Lanjutkan pemantauan rutin.",
      forecast: [
        { name: 'Sen', temp: 29, rain: 20, humidity: 65 },
        { name: 'Sel', temp: 28, rain: 40, humidity: 70 },
        { name: 'Rab', temp: 27, rain: 60, humidity: 75 },
        { name: 'Kam', temp: 28, rain: 30, humidity: 68 },
        { name: 'Jum', temp: 29, rain: 10, humidity: 60 },
        { name: 'Sab', temp: 30, rain: 0, humidity: 55 },
        { name: 'Min', temp: 29, rain: 10, humidity: 62 },
      ]
    };
  }
};

export const getPlantingRecommendation = async (
  location: string,
  soilType: string,
  variety: string
): Promise<PlantingRecommendation> => {
  try {
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const prompt = `Analisis kesesuaian lahan tanaman sorgum untuk lokasi: ${location}, jenis tanah: ${soilType}, varietas: ${variety}. 
    Asumsikan tanggal tanam adalah hari ini (${today}). 
    Berikan persentase kesesuaian, tingkat risiko, tanggal estimasi panen (harus tahun 2025 atau lebih), dan 3 langkah utama budidaya. Jawab dalam Bahasa Indonesia.`;

    const response = await safeGenerateContent(
      "gemini-2.5-flash",
      prompt,
      {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suitability: { type: Type.NUMBER, description: "Persentase kesesuaian 0-100" },
            risk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            harvestDate: { type: Type.STRING, description: "Estimasi tanggal panen (DD MMM YYYY)" },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                }
              }
            }
          }
        }
      }
    );

    if (response.text) {
      return JSON.parse(response.text) as PlantingRecommendation;
    }
    throw new Error("No data returned");
  } catch (error: any) {
    if (error.message === "QuotaExceeded" || error.message?.includes('429')) {
       console.warn("Planting AI: Quota exceeded. Using offline fallback data.");
    } else {
       console.error("Planting AI Error:", error);
    }

    // Fallback mock data if API fails or key is missing
    return {
      suitability: 85,
      risk: "Low",
      harvestDate: "15 Agu 2025",
      steps: [
        { title: "Persiapan Lahan", description: "Pastikan drainase cukup baik untuk menghindari genangan." },
        { title: "Pemupukan", description: "Gunakan pupuk NPK 15-15-15 secara berimbang." },
        { title: "Pemantauan", description: "Cek hama setiap minggu, terutama kutu daun." }
      ]
    };
  }
};

export const getMarketStrategy = async (
  commodity: string,
  location: string
): Promise<MarketInsight> => {
  try {
    const prompt = `Anda adalah Market Intelligence AI yang ahli dalam menganalisis tren pasar komoditas pertanian, khususnya SORGUM di Indonesia untuk TAHUN 2025.
    
    KONTEKS WAKTU: Saat ini adalah tahun 2025.
    
    KONTEKS PENTING HARGA:
    - Harga pasar Sorgum di Indonesia tahun 2025 mengalami kenaikan karena tren pangan sehat dan substitusi gandum.
    - Range harga: Rp 15.000 - Rp 25.000 per kg.

    Tugas Utama Output:
    1. MARKET METRICS:
       - Tentukan 'currentPrice' (rata-rata nasional 2025).
       - Tentukan 'priceChangePercentage' (tren positif).
       - Buat 'priceHistory' untuk 6 bulan terakhir (Januari 2025 s.d Juni 2025). Format nama bulan: "Jan 25", "Feb 25", dst.
       - Buat 'profitComparison' (Mentah vs Olahan).

    2. INTELLIGENCE REPORT (Naratif Detail):
       - 'marketSummary': Ringkasan tren pasar global & nasional tahun 2025.
       - 'demandSupply': Analisis volume produksi vs kebutuhan industri 2025.
       - 'priceAnalysis': Analisis faktor harga 2025.
       - 'opportunities': List 3-4 peluang pasar baru 2025.
       - 'prediction': Insight prediktif untuk akhir tahun 2025.
       - 'stakeholderActions': Rekomendasi strategi spesifik.

    Output dalam Bahasa Indonesia. Gunakan bahasa bisnis yang lugas.`;

    const response = await safeGenerateContent(
      "gemini-2.5-flash",
      prompt,
      {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            currentPrice: { type: Type.NUMBER },
            priceChangePercentage: { type: Type.NUMBER },
            lastUpdated: { type: Type.STRING },
            trend: { type: Type.STRING, enum: ["Up", "Down", "Stable"] },
            
            // Charts Data
            priceHistory: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER }
                }
              }
            },
            profitComparison: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  profit: { type: Type.NUMBER }
                }
              }
            },

            // Detailed Report Fields
            marketSummary: { type: Type.STRING, description: "Ringkasan tren pasar global & nasional." },
            demandSupply: { type: Type.STRING, description: "Analisis supply & demand." },
            priceAnalysis: { type: Type.STRING, description: "Analisis faktor harga." },
            opportunities: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List peluang pasar baru."
            },
            prediction: { type: Type.STRING, description: "Proyeksi 6-12 bulan ke depan." },
            stakeholderActions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        role: { type: Type.STRING, enum: ['Petani', 'UMKM', 'Startup'] },
                        action: { type: Type.STRING }
                    }
                }
            }
          }
        }
      }
    );

    if (response.text) {
      return JSON.parse(response.text) as MarketInsight;
    }
    throw new Error("No data");
  } catch (error: any) {
    if (error.message === "QuotaExceeded" || error.message?.includes('429')) {
       console.warn("Market AI: Quota exceeded. Using offline fallback data.");
    } else {
       console.error("Market AI Error:", error);
    }
    
    // Updated Fallback data for 2025
    return {
      currentPrice: 18500,
      priceChangePercentage: 8.5,
      priceHistory: [
        { name: 'Jan 25', price: 16500 },
        { name: 'Feb 25', price: 16800 },
        { name: 'Mar 25', price: 17200 },
        { name: 'Apr 25', price: 17800 },
        { name: 'Mei 25', price: 18200 },
        { name: 'Jun 25', price: 18500 },
      ],
      profitComparison: [
        { name: 'Mentah', profit: 6500 },
        { name: 'Olahan', profit: 22000 },
      ],
      lastUpdated: "Juni 2025",
      trend: "Up",
      
      // Fallback for new fields
      marketSummary: "Di tahun 2025, pasar sorgum Indonesia tumbuh pesat sebesar 15% YoY. Pemerintah menetapkan sorgum sebagai pilar ketahanan pangan nasional baru pengganti gandum.",
      demandSupply: "Permintaan industri HOREKA (Hotel, Resto, Kafe) untuk menu gluten-free meningkat 40%. Supply dari NTT dan Jawa Timur mulai stabil berkat program ekstensifikasi lahan 2024.",
      priceAnalysis: "Harga stabil tinggi (Rp 18.000+) didorong oleh kenaikan harga gandum impor dan tren gaya hidup sehat pasca-pandemi yang terus berlanjut.",
      opportunities: [
          "Susu nabati berbasis sorgum (Sorgum Milk).",
          "Beras sorgum instan untuk ransum darurat/bencana.",
          "Ekspor biji sorgum premium ke pasar Australia dan Jepang."
      ],
      prediction: "Q3-Q4 2025 diprediksi harga akan tembus Rp 20.000/kg seiring masuknya investasi pabrik pengolahan gula batang sorgum (bioetanol).",
      stakeholderActions: [
          { role: 'Petani', action: "Gunakan varietas Samurai-2 (rilis 2024) yang tahan hama karat daun. Lakukan kontrak farming dengan off-taker industri." },
          { role: 'UMKM', action: "Fokus branding 'Superfood Lokal 2025'. Kemas produk dalam pouch ziplock modern." },
          { role: 'Startup', action: "Kembangkan IoT untuk monitoring gudang penyimpanan sorgum guna menekan losses pascapanen di bawah 5%." }
      ]
    };
  }
};

// New Type for Extended Recipe to match UI needs
export interface AIRecipeResult extends Recipe {
  time: string;
  servings: string;
  difficulty: string;
}

export const generateSorghumRecipe = async (
  dishName: string,
  ingredients: string,
  preference: string
): Promise<AIRecipeResult> => {
  try {
    // STEP 1: Generate Recipe Text
    const textPrompt = `Anda adalah Chef profesional spesialis pengolahan Sorgum.
    User meminta resep dengan detail berikut:
    1. Nama Masakan yang diinginkan: "${dishName ? dishName : "Terserah Chef (Kreasi Unik Bebas)"}"
    2. Bahan tambahan yang tersedia: "${ingredients ? ingredients : "Gunakan bahan standar umum"}"
    3. Preferensi/Catatan: "${preference ? preference : "Tidak ada, yang penting enak"}"

    INSTRUKSI UTAMA:
    - Buatlah satu resep yang SESUAI dengan permintaan di atas.
    - WAJIB: Resep ini HARUS menggunakan SORGUM (biji/tepung/nira) sebagai bahan utama atau pengganti.
    - Jika user tidak menyebutkan nama masakan, ciptakan nama masakan yang menarik dan modern.
    
    Output harus dalam Bahasa Indonesia.
    Field 'image' biarkan string kosong.
    Field 'category' pilih salah satu: 'Food', 'Drink', atau 'Snack'.
    Field 'difficulty' pilih salah satu: 'Mudah', 'Sedang', 'Sulit'.
    Field 'time' contoh: '30 mnt'.
    Field 'servings' contoh: '2 porsi'.
    Field 'id' gunakan string random 'ai-gen-123'.
    `;

    const textResponse = await safeGenerateContent(
      "gemini-2.5-flash",
      textPrompt,
      {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['Food', 'Drink', 'Snack'] },
            image: { type: Type.STRING },
            time: { type: Type.STRING },
            servings: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ['Mudah', 'Sedang', 'Sulit'] },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.STRING }
                }
              }
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    );

    if (!textResponse.text) {
      throw new Error("Failed to generate recipe text");
    }

    const data = JSON.parse(textResponse.text) as AIRecipeResult;
    let finalImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'; // Fallback

    // STEP 2: Generate Image using gemini-2.5-flash-image
    try {
      const imagePrompt = `A professional food photography shot of ${data.title}. ${data.description}. 
      Key elements: ${data.ingredients.slice(0, 3).map(i => i.name).join(', ')}.
      Style: High resolution, 4k, appetizing, photorealistic, cinematic lighting, beautifully plated, shallow depth of field.`;
      
      const imageResponse = await safeGenerateContent(
        'gemini-2.5-flash-image',
        { parts: [{ text: imagePrompt }] },
        {
          // No responseMimeType for image models
        }
      );

      // Extract Base64 Image from response parts
      if (imageResponse.candidates && imageResponse.candidates.length > 0) {
        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
             finalImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
             break;
          }
        }
      }
    } catch (imgError: any) {
      if (imgError.message === "QuotaExceeded" || imgError.message?.includes('429')) {
        console.warn("Image Gen Quota Exceeded. Using stock image.");
      } else {
        console.warn("Failed to generate AI image, falling back to stock:", imgError);
      }
      
      // Fallback logic for stock images based on category if AI image fails
      if (data.category === 'Drink') {
          finalImage = 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80';
      } else if (data.category === 'Snack') {
          finalImage = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80';
      }
    }

    return { ...data, image: finalImage, id: `ai-${Date.now()}` };

  } catch (error: any) {
    if (error.message === "QuotaExceeded" || error.message?.includes('429')) {
       console.warn("Recipe AI: Quota exceeded.");
    } else {
       console.error("Recipe AI Error:", error);
    }
    throw error;
  }
};

export const getEducationContent = async (
  location: string
): Promise<EducationContent> => {
  const prompt = `Anda adalah Agriculture Expert AI untuk wilayah Indonesia. Tugas Anda memberikan panduan budidaya SORGUM untuk lokasi: ${location}.
  
  INSTRUKSI KHUSUS:
  1. JAWABLAH DENGAN RINGKAS DAN PADAT.
  2. Fokus pada poin-poin penting saja.
  
  Struktur Output JSON Wajib (Isi dengan singkat):
  1. 'agroAnalysis': Analisis Agroklimat singkat (max 30 kata).
  2. 'plantingTime': Rekomendasi Waktu Tanam (max 15 kata).
  3. 'cultivationSteps': Array 4-5 langkah budidaya (title, description max 20 kata).
  4. 'fertilization': Rekomendasi Pemupukan (max 30 kata).
  5. 'pestControl': Pengendalian Hama Utama (max 30 kata).
  6. 'weatherRiskManagement': Mitigasi Risiko Cuaca (max 30 kata).
  7. 'harvestGuide': Panduan Panen (max 30 kata).
  8. 'valueAddedProducts': Array string (3 item) ide olahan.
  9. 'localTips': Satu tips lokal praktis (max 20 kata).

  TAMBAHAN KONTEN EDUKASI (Pustaka):
  10. 'varieties': Sebutkan 3 varietas unggul sorgum di Indonesia (contoh: Bioguma, Numbu, Kawali) beserta deskripsi super singkat keunggulannya (max 15 kata per item).
  11. 'nutritionFacts': Sebutkan 3 kandungan gizi/manfaat utama sorgum (title: nama zat/manfaat, value: deskripsi singkat).
  12. 'faqs': 3 Pertanyaan umum (FAQ) petani pemula tentang sorgum beserta jawabannya yang singkat.
  `;

  try {
    const response = await safeGenerateContent(
      "gemini-2.5-flash",
      prompt,
      {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            agroAnalysis: { type: Type.STRING },
            plantingTime: { type: Type.STRING },
            cultivationSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            },
            fertilization: { type: Type.STRING },
            pestControl: { type: Type.STRING },
            weatherRiskManagement: { type: Type.STRING },
            harvestGuide: { type: Type.STRING },
            valueAddedProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
            localTips: { type: Type.STRING },
            
            // New Fields
            varieties: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  desc: { type: Type.STRING }
                }
              }
            },
            nutritionFacts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  value: { type: Type.STRING }
                }
              }
            },
            faqs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  q: { type: Type.STRING },
                  a: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    );

    if (response.text) {
      return JSON.parse(response.text) as EducationContent;
    }
    throw new Error("No education data generated");
  } catch (error: any) {
    if (error.message === "QuotaExceeded" || error.message?.includes('429')) {
       console.warn("Education AI: Quota exceeded. Using offline fallback data.");
    } else {
       console.error("Education AI Error:", error);
    }

    // Fallback data if AI fails or response is truncated
    return {
      agroAnalysis: `Analisis untuk ${location} tidak tersedia. Sorgum cocok di lahan kering.`,
      plantingTime: "Awal musim hujan.",
      cultivationSteps: [
        { title: "Persiapan Lahan", description: "Bajak tanah 20cm, bersihkan gulma." },
        { title: "Penanaman", description: "Tanam 3-5cm, jarak 70x20cm." },
        { title: "Pemeliharaan", description: "Penyiangan usia 3-4 minggu." }
      ],
      fertilization: "Urea 100kg/ha & NPK 200kg/ha bertahap.",
      pestControl: "Waspada burung pipit, pasang jaring.",
      weatherRiskManagement: "Buat drainase hindari genangan.",
      harvestGuide: "Panen saat biji keras & daun kering.",
      valueAddedProducts: ["Tepung Sorgum", "Beras Sorgum", "Pakan Silase"],
      localTips: "Gabung kelompok tani untuk pasar.",
      
      // New Fallback Data
      varieties: [
        { name: "Bioguma", desc: "Potensi hasil tinggi hingga 9 ton/ha, tahan rebah." },
        { name: "Numbu", desc: "Tahan kekeringan dan lahan masam, cocok di lahan kering." },
        { name: "Kawali", desc: "Kandungan gula batang tinggi, cocok untuk nira/bioetanol." }
      ],
      nutritionFacts: [
        { title: "Bebas Gluten", value: "Aman untuk penderita celiac & intoleransi gluten." },
        { title: "Kaya Serat", value: "Baik untuk pencernaan dan diet." },
        { title: "Antioksidan Tinggi", value: "Mengandung tanin & flavonoid penangkal radikal bebas." }
      ],
      faqs: [
        { q: "Apakah sorgum butuh banyak air?", a: "Tidak, sorgum sangat hemat air dibanding padi/jagung." },
        { q: "Berapa lama umur panen sorgum?", a: "Rata-rata 3-4 bulan (90-110 hari) tergantung varietas." },
        { q: "Apa itu ratun?", a: "Sorgum bisa dipanen 2-3 kali sekali tanam dengan memangkas batang (ratun)." }
      ]
    };
  }
};
