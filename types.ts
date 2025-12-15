
export enum Screen {
  SPLASH = 'SPLASH',
  AUTH = 'AUTH',
  HOME = 'HOME',
  CLIMATE = 'CLIMATE',
  PLANTING = 'PLANTING',
  HARVEST = 'HARVEST',
  EDUCATION = 'EDUCATION',
  RECIPES = 'RECIPES',
  HPP = 'HPP',
  MARKET = 'MARKET',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS'
}

export interface UserProfile {
  name: string;
  email: string;
  location: string;
  landArea: string;
  avatar: string;
  recipesCount: number;
}

export interface WeatherData {
  day: string;
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
}

export interface LandData {
  id: string;
  name: string;
  area: number;
  soilType: string;
  variety: string;
  date: string;
  score?: number;
  status: 'Sangat Cocok' | 'Cukup Cocok' | 'Perlu Perbaikan';
}

export interface PlantingRecommendation {
  suitability: number; // 0-100
  risk: 'Low' | 'Medium' | 'High';
  steps: { title: string; description: string }[];
  harvestDate: string;
  ph?: number;
  moisture?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: 'Food' | 'Drink' | 'Snack' | 'All';
  image: string;
  ingredients: { name: string; amount: string }[];
  steps: string[];
  time?: string;
  servings?: string;
  difficulty?: string;
  author?: string;
  authorAvatar?: string;
  likes?: number;
}

export interface StakeholderRecommendation {
  role: 'Petani' | 'UMKM' | 'Startup';
  action: string;
}

export interface MarketInsight {
  // Basic Metrics
  currentPrice: number;
  priceChangePercentage: number;
  lastUpdated: string;
  trend: 'Up' | 'Down' | 'Stable';
  
  // Charts
  priceHistory: { name: string; price: number }[];
  profitComparison: { name: string; profit: number }[];
  
  // Detailed Analysis (New Structure)
  marketSummary: string; // Ringkasan Tren
  demandSupply: string; // Analisis Permintaan & Penawaran
  priceAnalysis: string; // Analisis Harga mendalam
  opportunities: string[]; // List Peluang Pasar Baru
  prediction: string; // Proyeksi 6-12 bulan
  stakeholderActions: StakeholderRecommendation[]; // Rekomendasi spesifik
}

export interface DailyForecast {
  name: string; // Hari (Sen, Sel, dst) atau Jam (09:00)
  temp: number;
  rain: number; // Curah hujan dalam mm atau %
  humidity: number; // Kelembapan dalam %
}

export interface ClimateData {
  location: string;
  currentTemp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  isExtreme: boolean;
  extremeMessage: string;
  forecast: DailyForecast[];
  recommendation: string;
}

export interface EducationContent {
  // Existing AI Analysis
  agroAnalysis: string;
  plantingTime: string;
  cultivationSteps: { title: string; description: string }[];
  fertilization: string;
  pestControl: string;
  weatherRiskManagement: string;
  harvestGuide: string;
  valueAddedProducts: string[];
  localTips: string;
  
  // New Content
  varieties: { name: string; desc: string }[];
  nutritionFacts: { title: string; value: string }[];
  faqs: { q: string; a: string }[];
}
