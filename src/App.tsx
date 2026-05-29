import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Logo } from './components/Logo';
import { 
  Home, 
  Search, 
  Calendar, 
  BookOpen, 
  User, 
  Plus, 
  Edit2,
  MapPin, 
  Star, 
  CheckCircle2, 
  MessageCircle,
  Instagram,
  Facebook,
  Link,
  Award, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Globe,
  ArrowLeft,
  Filter,
  Languages,
  ArrowRight,
  Clock,
  Euro,
  Share2,
  Heart,
  Bell,
  Lock,
  CreditCard,
  Gift,
  Shield,
  ShieldCheck,
  UserPlus,
  HelpCircle,
  Info,
  LogOut,
  ShoppingBag,
  Tag,
  Camera,
  RotateCcw,
  Loader2,
  X,
  Upload,
  Mail,
  Phone,
  Rocket,
  AlertCircle,
  FileText,
  Trash2,
  Users,
  HeartPulse,
  Briefcase,
  Lightbulb,
  Sparkles,
  Trophy,
  Palmtree,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  Send,
  Car,
  Smartphone,
  Shirt,
  Gamepad,
  Coffee,
  Building2,
  Fuel,
  Umbrella,
  Monitor,
  Armchair,
  Bike,
  MessageSquare,
  Check,
  MoreHorizontal,
  Eye,
  EyeOff,
  XCircle,
  Flag,
  Ban
} from 'lucide-react';
import { storageService } from './lib/storage';
import { marketplaceService, Ad } from './services/marketplaceService';
import { compressImage } from './services/imageService';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { APIProvider, Map, AdvancedMarker, Pin, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useProfessionals } from './hooks/useProfessionals';
import { proService } from './services/proService';
import { eventService } from './services/eventService';
import { authService, Profile } from './services/authService';
import { chatService, Conversation, Message } from './services/chatService';
import Markdown from 'react-markdown';
import { documentService } from './services/documentService';
import { guideService, MOCK_GUIDE_CATEGORIES_DATA } from './services/guide_service';
import { feedbackService } from './services/feedbackService';
import { GoogleGenAI, Type } from "@google/genai";

import { supabase, isSupabaseConfigured } from './lib/supabase';

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

const LANGUAGES_LIST = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Chinese', 'Japanese', 'Arabic'];

function AddressAutocomplete({ 
  value, 
  onChange, 
  onSelect 
}: { 
  value: string; 
  onChange: (val: string) => void;
  onSelect: (location: string, lat: number, lng: number) => void;
}) {
  const placesLib = useMapsLibrary('places');
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!placesLib) return;
    setAutocompleteService(new placesLib.AutocompleteService());
    setPlacesService(new placesLib.PlacesService(document.createElement('div')));
  }, [placesLib]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (val.length > 2 && autocompleteService) {
      autocompleteService.getPlacePredictions({
        input: val,
        locationBias: { radius: 10000, center: { lat: 39.4699, lng: -0.3763 } }, // Better bias syntax
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          setPredictions(results || []);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      });
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    onChange(prediction.description);
    setShowPredictions(false);
    if (placesService) {
      placesService.getDetails({
        placeId: prediction.place_id,
        fields: ['formatted_address', 'geometry']
      }, (place) => {
        if (place && place.geometry && place.geometry.location) {
          onSelect(
            place.formatted_address || prediction.description,
            place.geometry.location.lat(),
            place.geometry.location.lng()
          );
        }
      });
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <input 
        value={value}
        onChange={handleInputChange}
        onFocus={() => predictions.length > 0 && setShowPredictions(true)}
        placeholder="Type address..."
        className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-display text-sm"
      />
      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-100 rounded-[24px] shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {predictions.map(p => (
            <button
              key={p.place_id}
              type="button"
              onClick={() => handleSelectPrediction(p)}
              className="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-300 mt-0.5 group-hover:text-rose-500 transition-colors" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 text-sm">{p.structured_formatting.main_text}</div>
                  <div className="text-[10px] text-slate-400 tracking-tight">{p.structured_formatting.secondary_text}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LanguageSelector({ 
  selected, 
  onToggle 
}: { 
  selected: string[]; 
  onToggle: (lang: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-slate-50 rounded-3xl border border-slate-100 max-h-60 overflow-y-auto">
      {LANGUAGES_LIST.map(lang => {
        const isSelected = selected.includes(lang);
        return (
          <button
            key={lang}
            type="button"
            onClick={() => onToggle(lang)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left",
              isSelected 
                ? "bg-white text-brand-blue shadow-sm border border-brand-blue/20" 
                : "text-slate-500 hover:bg-white/50 border border-transparent"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
              isSelected 
                ? "bg-brand-blue border-brand-blue shadow-sm shadow-brand-blue/20" 
                : "bg-white border-slate-200"
            )}>
              {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
            </div>
            <span className={cn(
              "text-[11px] font-semibold tracking-tight",
              isSelected ? "text-brand-blue" : "text-slate-600"
            )}>{lang}</span>
          </button>
        );
      })}
    </div>
  );
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatName(name: string | null | undefined): string {
  if (!name) return '';
  const rawName = name.trim();
  const parts = rawName.split(/\s+/);
  if (parts.length > 1) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    const formattedFirst = first.charAt(0).toUpperCase() + first.slice(1);
    const formattedLastInitial = last.charAt(0).toUpperCase() + '.';
    return `${formattedFirst} ${formattedLastInitial}`;
  }
  return rawName.charAt(0).toUpperCase() + rawName.slice(1);
}

function formatRelativeTime(dateString: string | undefined) {
  if (!dateString) return '';
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return 'just now';
    if (diffInSeconds < 60) return 'just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  } catch (e) {
    return '';
  }
}

// --- Types ---

type View = 'home' | 'explore' | 'events' | 'guides' | 'profile' | 'community' | 'marketplace' | 'community-thread' | 'messages' | 'admin' | 'login' | 'complete-profile';

interface Professional {
  id: string;
  name: string;
  company_name?: string;
  category: string;
  rating: number;
  review_count?: number;
  languages: string[];
  image: string;
  bio: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  is_highlighted?: boolean;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location: string;
  category: string;
  image: string;
  description?: string;
  coordinates?: { lat: number, lng: number };
  is_highlighted?: boolean;
}

interface GuideStep {
  id: string;
  title: string;
  description: string;
  pros: string[]; // Professional IDs
}

interface Classified {
  id: string;
  title: string;
  price: string;
  category: string;
  image: string;
  condition?: string;
  location?: string;
}

// --- Mock Data ---

const MOCK_PROS: Professional[] = [];

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Beach Cleanup & Meetup',
    date: 'MAY 20',
    time: '10:00 AM',
    location: 'Playa de la Malvarrosa, Valencia',
    category: 'Community',
    image: 'https://images.unsplash.com/photo-1595113330231-5098c99ee602?auto=format&fit=crop&q=80&w=800',
    description: 'Join us for our monthly beach cleanup at Malvarrosa! We\'ll meet near the main promenade to pick up plastic and trash, then head to a nearby chiringuito for drinks and networking. It\'s a great way to give back to the city and meet fellow expats.',
    coordinates: { lat: 39.4795, lng: -0.3235 }
  },
  {
    id: '2',
    title: 'Tech Expat Networking',
    date: 'JUN 05',
    time: '07:00 PM',
    location: 'Lanzadera, Marina de Valencia',
    category: 'Networking',
    image: 'https://images.unsplash.com/photo-1540575861501-7ad058133a31?auto=format&fit=crop&q=80&w=800',
    description: 'Connect with Valencia\'s booming tech scene at Lanzadera. This networking event is specifically for tech professionals, entrepreneurs, and digital nomads who have recently moved to the city. Complementary drinks and appetizers provided.',
    coordinates: { lat: 39.4628, lng: -0.3262 }
  },
  {
    id: '3',
    title: 'Spanish Tapas Workshop',
    date: 'JUN 12',
    time: '06:30 PM',
    location: 'Mercado Central, Valencia',
    category: 'Culture',
    image: 'https://images.unsplash.com/photo-1515442261904-6c301f1b008a?auto=format&fit=crop&q=80&w=800',
    description: 'Master the art of Spanish tapas in this hands-on workshop right in the heart of Valencia\'s historic Central Market. You\'ll learn to prepare five classic dishes and pair them with local wines. Small group setting for personal attention.',
    coordinates: { lat: 39.4735, lng: -0.3788 }
  }
];

const MOCK_FEED: any[] = [];

const MOCK_CLASSIFIEDS: Classified[] = [];

interface GuideArticle {
  id: string;
  title: string;
  excerpt: string;
  tag?: string;
  content?: string;
  imageUrl?: string;
  businessName?: string;
  author?: {
    name: string;
    role?: string;
    businessName?: string;
    website?: string;
    email?: string;
    phone?: string;
  };
}

interface GuideCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  articles: GuideArticle[];
}

// --- Custom Multi-color Icons for Guides ---

const RocketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill="#EF4444" stroke="#EF4444" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" fill="#FBBF24" stroke="#F59E0B" />
    <circle cx="15" cy="9" r="1" fill="white" />
  </svg>
);

const PaperworkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M4 4h16v16H4z" fill="#3B82F6" stroke="#2563EB" />
    <path d="M8 8h8" stroke="white" />
    <path d="M8 12h8" stroke="white" />
    <path d="M8 16h5" stroke="white" />
    <path d="M18 4v4h-4" fill="#60A5FA" stroke="#2563EB" />
  </svg>
);

const FamilyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <circle cx="9" cy="7" r="4" fill="#EC4899" stroke="#DB2777" />
    <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" fill="#EC4899" stroke="#DB2777" />
    <circle cx="17" cy="8" r="3" fill="#8B5CF6" stroke="#7C3AED" />
    <path d="M13 21v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" fill="#8B5CF6" stroke="#7C3AED" />
  </svg>
);

const HealthIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="#F472B6" stroke="#E11D48" />
    <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" stroke="#E11D48" strokeWidth="1.5" />
  </svg>
);

const WorkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" fill="#6366F1" stroke="#4F46E5" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="#F59E0B" />
    <path d="M2 12h20" stroke="#4F46E5" />
    <circle cx="12" cy="14" r="1" fill="#FBBF24" />
  </svg>
);

const TipsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M9 18h6" stroke="#F59E0B" />
    <path d="M10 22h4" stroke="#F59E0B" />
    <path d="M15.09 14c.18-.98.37-1.74.37-2.5a3.5 3.5 0 0 0-7 0c0 .76.19 1.52.37 2.5H15.09Z" fill="#FDE047" stroke="#F59E0B" />
    <path d="M12 2v1" stroke="#F59E0B" />
    <path d="M5 5l1 1" stroke="#F59E0B" />
    <path d="M2 12h1" stroke="#F59E0B" />
    <path d="M19 5l-1 1" stroke="#F59E0B" />
    <path d="M22 12h-1" stroke="#F59E0B" />
  </svg>
);

const CityFunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M6 3h12l-6 9Z" fill="#F97316" stroke="#EA580C" />
    <path d="M12 12v8" stroke="#94A3B8" />
    <path d="M9 21h6" stroke="#94A3B8" />
    <circle cx="18" cy="5" r="3" fill="#FBBF24" stroke="#F59E0B" />
    <path d="M18 13v6" stroke="#EC4899" />
    <circle cx="16" cy="19" r="2" fill="#EC4899" stroke="#DB2777" />
    <path d="M18 13l3-1" stroke="#EC4899" />
  </svg>
);

const MOCK_GUIDE: GuideStep[] = [
  { id: '1', title: 'Get your NIE', description: 'The essential ID number for living in Spain.', pros: [] },
  { id: '2', title: 'Open a Bank Account', description: 'Necessary for utilities and rent.', pros: [] },
  { id: '3', title: 'Empadronamiento', description: 'Registering at the town hall.', pros: [] },
  { id: '4', title: 'Health Insurance', description: 'Private or public health coverage.', pros: [] }
];

// --- Components ---

function OrientationLock() {
  return (
    <div className="orientation-lock-overlay">
      <div className="bg-slate-50 p-6 rounded-3xl mb-6 shadow-sm border border-slate-100 flex items-center justify-center">
        <Smartphone className="w-12 h-12 text-brand-blue animate-bounce" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Please rotate your device</h3>
      <p className="text-slate-500 text-sm max-w-[240px] leading-relaxed">
        Unlocked is optimized for portrait mode. Please rotate your phone to continue.
      </p>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const { professionals: allPros, loading: prosLoading, refetch: refetchPros } = useProfessionals([]);
  const [activeView, setActiveView] = useState<View>('home');
  const [previousView, setPreviousView] = useState<View>('home');
  const [authLoading, setAuthLoading] = useState(true);
  const [initialEventId, setInitialEventId] = useState<string | null>(null);
  const [initialProId, setInitialProId] = useState<string | null>(null);
  const [initialGuideId, setInitialGuideId] = useState<string | null>(null);
  const [initialChat, setInitialChat] = useState<any | null>(null);
  const [initialSearch, setInitialSearch] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<{ query: string; location: string; category: string; filters?: any }>({ query: '', location: '', category: 'All' });
  const [unreadConversations, setUnreadConversations] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [usersWhoBlockedMe, setUsersWhoBlockedMe] = useState<string[]>([]);
  const [globalAlert, setGlobalAlert] = useState<{type: 'error' | 'info' | 'success', text: string} | null>(null);

  const [highlightedProId, setHighlightedProId] = useState<string | null>(() => localStorage.getItem('highlighted_pro_id'));
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(() => localStorage.getItem('highlighted_event_id'));
  const [highlightedArticleId, setHighlightedArticleId] = useState<string | null>(() => localStorage.getItem('highlighted_article_id') || 'gs-1');
  const [highlightedTestimonyId, setHighlightedTestimonyId] = useState<string | null>(() => localStorage.getItem('highlighted_testimony_id'));

  const [highlightedProIds, setHighlightedProIds] = useState<string[]>(() => {
    const list = localStorage.getItem('highlighted_pro_ids');
    if (list) return list.split(',').filter(Boolean);
    const legacy = localStorage.getItem('highlighted_pro_id');
    return legacy ? [legacy] : [];
  });

  const [highlightedEventIds, setHighlightedEventIds] = useState<string[]>(() => {
    const list = localStorage.getItem('highlighted_event_ids');
    if (list) return list.split(',').filter(Boolean);
    const legacy = localStorage.getItem('highlighted_event_id');
    return legacy ? [legacy] : [];
  });

  const [highlightedArticleIds, setHighlightedArticleIds] = useState<string[]>(() => {
    const list = localStorage.getItem('highlighted_article_ids');
    if (list) return list.split(',').filter(Boolean);
    const legacy = localStorage.getItem('highlighted_article_id') || 'gs-1';
    return legacy ? [legacy] : ['gs-1'];
  });

  const [highlightedTestimoniesIds, setHighlightedTestimoniesIds] = useState<string[]>(() => {
    const list = localStorage.getItem('highlighted_testimony_ids');
    if (list) return list.split(',').filter(Boolean);
    const legacy = localStorage.getItem('highlighted_testimony_id');
    return legacy ? [legacy] : [];
  });

  useEffect(() => {
    if (globalAlert) {
      const timer = setTimeout(() => setGlobalAlert(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [globalAlert]);

  const handleMarkChatAsRead = React.useCallback((chatId: string) => {
    setUnreadConversations(prev => {
      if (!prev.includes(chatId)) return prev;
      return prev.filter(id => id !== chatId);
    });
  }, []);

  const fetchAndCheckUnread = React.useCallback(async () => {
    if (!currentUser) return;
    try {
      const [convs, blocks, blockedMe] = await Promise.all([
        chatService.getUserConversations(currentUser.id),
        chatService.getBlockedUsers(currentUser.id),
        chatService.getUsersWhoBlockedMe(currentUser.id)
      ]);

      setConversations(convs);
      setBlockedUsers(blocks);
      setUsersWhoBlockedMe(blockedMe);
      
      if (convs.length === 0) {
        setUnreadConversations([]);
        return;
      }
      
      const { data: unreadMessages, error: unreadError } = await supabase
        .from('messages')
        .select('conversation_id')
        .eq('is_read', false)
        .or(`receiver_id.eq.${currentUser.id},and(receiver_id.is.null,sender_id.neq.${currentUser.id})`)
        .in('conversation_id', convs.map(c => c.id));

      if (!unreadError && unreadMessages) {
        const unreadIds = Array.from(new Set(unreadMessages.map(m => m.conversation_id)));
        setUnreadConversations(unreadIds);
      } else {
        const unreadIds = convs.filter(conv => {
          const lastRead = localStorage.getItem(`chat_last_read_${conv.id}`);
          if (!lastRead) return true;
          return new Date(conv.last_message_at).getTime() > new Date(lastRead).getTime();
        }).map(c => c.id);
        setUnreadConversations(unreadIds);
      }
    } catch (err) {
      console.warn('Error fetching unread count:', err);
    }
  }, [currentUser, userProfile]);

  // Handle auth enforcement for protected views
  useEffect(() => {
    const protectedViews: View[] = ['profile', 'messages', 'complete-profile'];
    if (!authLoading && !currentUser && protectedViews.includes(activeView)) {
      setActiveView('login');
    }
  }, [authLoading, currentUser, activeView]);

  // Real-time unread count logic
  useEffect(() => {
    if (!currentUser) {
      setUnreadConversations([]);
      setConversations([]);
      return;
    }

    fetchAndCheckUnread();
    
    // 2. Real-time subscription to conversations and blocks
    const channel = supabase
      .channel('app_realtime_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_blocks'
        },
        () => fetchAndCheckUnread()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `participant_1=eq.${currentUser.id}`
        },
        () => fetchAndCheckUnread()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `participant_2=eq.${currentUser.id}`
        },
        () => fetchAndCheckUnread()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => fetchAndCheckUnread()
      )
      .subscribe();

    // 3. Poll occasionally as fallback (30 seconds)
    const interval = setInterval(fetchAndCheckUnread, 30000); 

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [currentUser, fetchAndCheckUnread]);

  const [showAddPro, setShowAddPro] = useState(false);
  const [showAddAd, setShowAddAd] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | any>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [events, setEvents] = useState<Event[]>(isSupabaseConfigured ? [] : MOCK_EVENTS);
  const [guideCategories, setGuideCategories] = useState<any[]>([]);
  const allArticles = useMemo(() => {
    const map = new globalThis.Map<string, any>();
    const mockArticles = MOCK_GUIDE_CATEGORIES_DATA.flatMap(cat => cat.articles || []);
    mockArticles.forEach(art => {
      map.set(String(art.id), {
        ...art,
        imageUrl: art.imageUrl
      });
    });
    const dbArticles = guideCategories.flatMap(cat => cat.articles || []);
    dbArticles.forEach(art => {
      map.set(String(art.id), {
        ...art,
        imageUrl: art.imageUrl || art.image_url
      });
    });
    return Array.from(map.values()) as any[];
  }, [guideCategories]);

  useEffect(() => {
    let active = true;
    const loadGuides = async () => {
      try {
        const raw = await guideService.getGuideCategories();
        if (active) {
          setGuideCategories(raw || []);
        }
      } catch (err) {
        console.error('Failed to load guides at root:', err);
      }
    };
    loadGuides();
    return () => { active = false; };
  }, []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [city, setCity] = useState('Valencia');
  const [showCitySelector, setShowCitySelector] = useState(false);



  const [isLocating, setIsLocating] = useState(false);

  const getNearestMajorCity = async (city: string, region: string, country: string) => {
    try {
      if (!city) return 'Valencia';
      
      const cacheKey = `city_norm_${city}_${region}_${country}`.toLowerCase().replace(/\s+/g, '_');
      const cached = localStorage.getItem(cacheKey);
      if (cached) return cached;

      // Try calling server-side API first
      try {
        const response = await fetch("/api/city-normalization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city, region, country }),
        });
        
        if (response.ok) {
          const data = await response.json();
          const result = data.result?.trim();
          if (result) {
            localStorage.setItem(cacheKey, result);
            return result;
          }
        }
      } catch (srvErr) {
        console.warn("[City Normalization] Server endpoint failed, attempting fallback:", srvErr);
      }

      // If server failed (e.g. Vercel 404), attempt client-side fallback if an API key is available
      const localKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';
      if (localKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: localKey });
          const locationContext = `${city}, ${region || ''}, ${country || ''}`;
          
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Target: Identify the nearest major metropolitan city for "${locationContext}". 
            Rules: 
            1. Return ONLY the name of the major city.
            2. No punctuation, no sentences.
            3. If the location is already a major city, return its name.
            4. Example: "La Eliana, Valencian Community, Spain" -> "Valencia".`,
          });
          
          const result = response.text?.trim();
          if (result) {
            localStorage.setItem(cacheKey, result);
            return result;
          }
        } catch (clientErr) {
          console.error("[City Normalization] Client-side fallback failed:", clientErr);
        }
      }

      // Default return
      return city || 'Valencia';
    } catch (error) {
      console.error('Error normalizing city:', error);
      return city || 'Valencia';
    }
  };

  const refreshLocation = () => {
    if (!("geolocation" in navigator)) {
      setCity('Valencia');
      return;
    }

    setIsLocating(true);
    const geoOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await response.json();
          
          const rawCity = data.city || data.locality || '';
          const region = data.principalSubdivision || '';
          const country = data.countryName || '';
          
          const majorCity = await getNearestMajorCity(rawCity, region, country);
          setCity(majorCity);
        } catch (error) {
          console.error('Error fetching city:', error);
          setCity('Valencia');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setCity('Valencia');
        setIsLocating(false);
      },
      geoOptions
    );
  };

  useEffect(() => {
    // City is hardcoded to Valencia for now
    setCity('Valencia');
  }, []);

  // Form states for Pro
  const [proName, setProName] = useState('');
  const [proCompany, setProCompany] = useState('');
  const [proCategory, setProCategory] = useState('');
  const [proEmail, setProEmail] = useState('');
  const [proPhone, setProPhone] = useState('');
  const [proRecommendation, setProRecommendation] = useState('');
  const [recommendationSent, setRecommendationSent] = useState(false);
  const [isSubmittingPro, setIsSubmittingPro] = useState(false);
  const [proError, setProError] = useState<string | null>(null);

  // Form states for Ad
  const [adTitle, setAdTitle] = useState('');
  const [adPrice, setAdPrice] = useState('');
  const [adCategory, setAdCategory] = useState('Vehicles');
  const [adCondition, setAdCondition] = useState('Good');
  const [adLocation, setAdLocation] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adHousingType, setAdHousingType] = useState<'Rent' | 'Sale'>('Rent');
  const [adFuelType, setAdFuelType] = useState('Petrol');
  const [adPropertyType, setAdPropertyType] = useState('Apartment');
  const [adContractType, setAdContractType] = useState('Full-time');
  const [adSize, setAdSize] = useState('M');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refetchEvents = React.useCallback(async () => {
    try {
      const data = await eventService.getEvents();
      if (data && data.length > 0) {
        setEvents(data);
      } else if (!isSupabaseConfigured) {
        setEvents(MOCK_EVENTS);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      if (!isSupabaseConfigured) setEvents(MOCK_EVENTS);
    }
  }, []);

  useEffect(() => {
    fetchAds();
    refetchEvents();
  }, [refetchEvents]);

  const fetchAds = async () => {
    try {
      const data = await marketplaceService.getAds();
      setAds(data);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const handlePostPro = async () => {
    if ((!proName && !proCompany) || !proCategory || (!proEmail.trim() && !proPhone.trim())) return;
    
    setIsSubmittingPro(true);
    setProError(null);
    
    try {
      await proService.submitRecommendation({
        user_email: "vincentdurroux@gmail.com",
        pro_name: proName,
        company_name: proCompany,
        pro_category: proCategory,
        pro_email: proEmail,
        pro_phone: proPhone,
        notes: proRecommendation
      });
      
      // Reset form
      setProName('');
      setProCompany('');
      setProCategory('');
      setProEmail('');
      setProPhone('');
      setProRecommendation('');
      setRecommendationSent(true);
      
      // Auto close after 5 seconds
      setTimeout(() => {
        if (showAddPro) {
          setShowAddPro(false);
          setRecommendationSent(false);
        }
      }, 5000);
    } catch (error) {
      console.error('Error submitting pro recommendation:', error);
      setProError('Failed to send recommendation. Please try again.');
    } finally {
      setIsSubmittingPro(false);
    }
  };

  const handlePostAd = async () => {
    const isPriceRequired = adCategory !== 'Jobs' && adCategory !== 'Services';
    if (!adTitle || (isPriceRequired && !adPrice)) return;
    
    setIsUploading(true);
    try {
      await marketplaceService.createAd({
        title: adTitle,
        price: adPrice,
        category: adCategory,
        condition: adCondition,
        location: adLocation,
        description: adDescription,
        type: adCategory === 'Real Estate' ? adHousingType : undefined,
        fuel_type: adCategory === 'Vehicles' ? adFuelType : undefined,
        property_type: adCategory === 'Real Estate' ? adPropertyType : undefined,
        contract_type: adCategory === 'Jobs' ? adContractType : undefined,
        size: adCategory === 'Clothing' ? adSize : undefined,
        image_url: uploadedImageUrls[0] || '',
        images: uploadedImageUrls
      });
      
      // Reset form
      setAdTitle('');
      setAdPrice('');
      setAdCategory('Vehicles');
      setAdCondition('Good');
      setAdLocation('');
      setAdDescription('');
      setAdHousingType('Rent');
      setAdFuelType('Petrol');
      setAdPropertyType('Apartment');
      setAdContractType('Full-time');
      setAdSize('M');
      setUploadedImageUrls([]);
      setShowAddAd(false);
      
      // Refresh list
      fetchAds();
    } catch (error) {
      console.error('Error posting ad:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = 3 - uploadedImageUrls.length;
    if (remainingSlots <= 0) {
      alert('Maximum 3 photos allowed');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);
    
    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        // Sanitize filename
        const sanitizedName = file.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9.]/g, '_')
          .replace(/_{2,}/g, '_');

        const fileName = `${Date.now()}-${sanitizedName}`;
        const path = `ads/${fileName}`;
        return await storageService.uploadFile('images', path, file);
      });

      const newUrls = await Promise.all(uploadPromises);
      setUploadedImageUrls(prev => [...prev, ...newUrls]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload one or more images.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isAdmin = proService.isAdmin(currentUser?.email || "") || userProfile?.is_admin;

  const handleNavigate = async (view: View | 'back', params?: { eventId?: string, proId?: string, guideId?: string, searchQuery?: string, chat?: any }) => {
    if (view === 'back') {
      navigateTo(previousView);
      return;
    }
    const finalView = view as View;
    // Auth guard for specific views
    if ((finalView === 'profile' || finalView === 'messages') && !currentUser) {
      navigateTo('login');
      return;
    }

    // Admin guard
    if (finalView === 'admin' && !isAdmin) {
      navigateTo('home');
      return;
    }

    // Pre-navigation chat guard
    if (finalView === 'messages') {
      if (userProfile?.chat_enabled === false) {
        setGlobalAlert({ type: 'error', text: 'You have disabled chat participation.' });
        return;
      }

      if (params?.chat) {
        const targetId = params.chat.userId || params.chat.otherUser?.id;
        const targetName = params.chat.name || params.chat.otherUser?.full_name;
        
        let targetProfile = null;
        try {
          if (targetId) {
            targetProfile = await authService.getProfile(targetId);
          } else if (targetName) {
            targetProfile = await chatService.getProfileByName(targetName);
          }
          
          if (targetProfile && targetProfile.chat_enabled === false) {
            setGlobalAlert({ type: 'error', text: 'This member has disabled chat participation.' });
            return;
          }
        } catch (e) {
          console.warn('Silent chat pre-flight check failed:', e);
        }
      }
    }

    if (params?.eventId) setInitialEventId(params.eventId);
    if (params?.proId) setInitialProId(params.proId);
    if (params?.guideId) setInitialGuideId(params.guideId);
    if (params?.searchQuery) setInitialSearch(params.searchQuery);
    if (params?.chat) setInitialChat(params.chat);
    navigateTo(finalView);
  };

  // Bottom Nav Items
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Find Pro', icon: Search },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'guides', label: 'Guides', icon: BookOpen },
    { id: 'marketplace', label: 'Market', icon: ShoppingBag },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const [direction, setDirection] = useState(0);

  const mainNavIds = navItems.map(item => item.id);

  const handleSearch = (query: string, location: string, category: string, filters?: any) => {
    setSearchParams({ query, location, category, filters });
    // No longer navigating to searchResults view, MarketplaceView will handle it internally
  };

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  };

  const navigateTo = (view: View) => {
    if (view !== activeView) {
      setPreviousView(activeView);
    }
    const currentIndex = mainNavIds.indexOf(activeView);
    const newIndex = mainNavIds.indexOf(view);

    if (currentIndex !== -1 && newIndex !== -1) {
      setDirection(newIndex > currentIndex ? 1 : -1);
    } else if (view === 'messages' || view === 'community-thread' || view === 'community') {
      setDirection(1); // Forward to sub-view
    } else if (activeView === 'messages' || activeView === 'community-thread' || activeView === 'community') {
      setDirection(-1); // Back from sub-view
    } else {
      setDirection(0);
    }
    setActiveView(view);
    scrollToTop();
  };

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (session?.user) {
        setCurrentUser(session.user);
        loadProfile(session.user.id, event);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setAuthLoading(false);
      }
    });

    // Check current session
    authService.getCurrentUser().then(user => {
      if (user) {
        setCurrentUser(user);
        loadProfile(user.id);
      } else {
        setAuthLoading(false);
      }
    }).catch(() => {
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string, event?: string) => {
    try {
      const profile = await authService.getProfile(userId);
      setUserProfile(profile);
      
      console.log(`[Onboarding Check] Profile for User ${userId}:`, { 
        exists: !!profile, 
        name: profile?.full_name,
        created: profile?.created_at,
        updated: profile?.updated_at,
        event 
      });

      if (!profile) {
        console.log('[Onboarding] Profile missing, forcing flow.');
        setActiveView('complete-profile');
        return;
      }

      const createdDate = profile.created_at ? new Date(profile.created_at).getTime() : 0;
      const updatedDate = profile.updated_at ? new Date(profile.updated_at).getTime() : 0;
      const isVeryNew = (new Date().getTime() - createdDate) < 1800000; // 30 minutes
      const isUntouched = Math.abs(updatedDate - createdDate) < 5000; // 5 seconds margin
      
      if (!profile.full_name || event === 'SIGNED_UP' || (isVeryNew && isUntouched)) {
        console.log('[Onboarding] Fresh untouched profile detected, showing setup.');
        setActiveView('complete-profile');
      } else {
        if (activeView === 'login' || activeView === 'complete-profile') {
          setActiveView('home');
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    // Special cases for sub-views
    if (activeView === 'messages' && direction === 'right') {
      navigateTo('explore');
      return;
    }
    if (activeView === 'community-thread' && direction === 'right') {
      navigateTo('community');
      return;
    }

    const currentIndex = mainNavIds.indexOf(activeView);
    if (currentIndex === -1) return;

    if (direction === 'left' && currentIndex < mainNavIds.length - 1) {
      navigateTo(mainNavIds[currentIndex + 1] as View);
    } else if (direction === 'right' && currentIndex > 0) {
      navigateTo(mainNavIds[currentIndex - 1] as View);
    }
  };

  useEffect(() => {
    if (mainRef.current) {
      // Defer the scroll-to-top to let the previous view finish its exit animation
      // before resetting the scroll position of the shared container.
      const timer = setTimeout(() => {
        if (mainRef.current) {
          mainRef.current.scrollTo(0, 0);
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [activeView, selectedAd, selectedPost, initialEventId, initialProId, initialGuideId]);

  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly">
      <div className="flex flex-col h-screen h-[100dvh] bg-white w-full mx-auto shadow-2xl overflow-hidden relative">
        <OrientationLock />
      
        <AnimatePresence>
          {globalAlert && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none w-[90%] max-w-sm">
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl shadow-xl border",
                  globalAlert.type === 'error' ? "bg-rose-50 border-rose-100 text-rose-600" :
                  globalAlert.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                  "bg-blue-50 border-blue-100 text-blue-600"
                )}
              >
                {globalAlert.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                <p className="text-xs font-bold leading-tight">{globalAlert.text}</p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {authLoading ? (
        <div className="flex-1 bg-white">
           <div />
        </div>
      ) : (
        <>
      {/* Header */}
      {activeView !== 'login' && (
        <header className="bg-white px-4 md:px-6 pt-4 pb-2 md:pt-3 md:pb-3 flex justify-between items-center border-b border-slate-100 flex-shrink-0 z-30">
          <div className="flex flex-col md:flex-row items-center md:items-center gap-0.5 md:gap-6">
            <div 
              onClick={() => navigateTo('home')}
              className="hover:opacity-80 transition-opacity cursor-pointer flex flex-col items-center md:items-start"
            >
              <Logo className="items-center md:items-start" />
            </div>
            

          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            
            <motion.button 
              onClick={() => {
                if (!currentUser) {
                  handleNavigate('login');
                } else {
                  setShowAddPro(true);
                }
              }}
            animate={{
              scale: [1, 1.04, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center group flex-shrink-0 ml-2"
          >
            {/* Central Button */}
            <div className="absolute inset-1.5 bg-brand-yellow rounded-full shadow-lg shadow-brand-yellow/30 flex items-center justify-center z-10 transition-all duration-300 group-hover:scale-110 group-active:scale-95">
              <Plus className="w-5 h-5 text-white" />
            </div>
            
            {/* Circular Text */}
            <div className="absolute inset-0 w-full h-full">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                <defs>
                  <path
                    id="circlePath"
                    d="M 50, 50 m -43, 0 a 43,43 0 1,1 86,0 a 43,43 0 1,1 -86,0"
                  />
                </defs>
                <text className="text-[19px] font-black fill-brand-yellow tracking-[0.08em] uppercase">
                  <textPath xlinkHref="#circlePath">
                    Recommend a Pro •
                  </textPath>
                </text>
              </svg>
            </div>
          </motion.button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar relative pb-24">
        <div className="min-h-full w-full max-w-full">
              <motion.div 
                animate={activeView === 'home' ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.995 }}
                initial={{ opacity: 0, y: 12, scale: 0.995 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className={activeView === 'home' ? 'block w-full' : 'hidden w-full'}
              >
                <HomeView 
                  key="home" 
                  allPros={allPros}
                  events={events}
                  onNavigate={handleNavigate}
                  userProfile={userProfile}
                  currentUser={currentUser}
                  onAddPro={() => {
                    if (!currentUser) {
                      handleNavigate('login');
                    } else {
                      setShowAddPro(true);
                    }
                  }} 
                  ads={ads} 
                  onSelectAd={setSelectedAd} 
                  onSelectPost={(post) => { setSelectedPost(post); navigateTo('community-thread'); }}
                  scrollToTop={scrollToTop}
                  onProUpdate={refetchPros}
                  unreadConversations={unreadConversations}
                  blockedUsers={blockedUsers}
                  usersWhoBlockedMe={usersWhoBlockedMe}
                  highlightedProIds={highlightedProIds}
                  highlightedEventIds={highlightedEventIds}
                  highlightedArticleIds={highlightedArticleIds}
                  highlightedTestimoniesIds={highlightedTestimoniesIds}
                  allArticles={allArticles}
                />
              </motion.div>
              <motion.div 
                animate={activeView === 'explore' ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.995 }}
                initial={{ opacity: 0, y: 12, scale: 0.995 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className={activeView === 'explore' ? 'block w-full' : 'hidden w-full'}
              >
                <ExploreView 
                  allPros={allPros}
                  onNavigate={handleNavigate} 
                  initialProId={initialProId}
                  initialSearch={initialSearch}
                  onModalClose={() => {
                    setInitialProId(null);
                    setInitialSearch(null);
                  }}
                  scrollToTop={scrollToTop}
                  onProUpdate={refetchPros}
                  currentUser={currentUser}
                  userProfile={userProfile}
                  isActive={activeView === 'explore'}
                />
              </motion.div>
              {activeView === 'events' && (
                <EventsView 
                  key="events" 
                  initialEventId={initialEventId}
                  onModalClose={() => setInitialEventId(null)}
                  scrollToTop={scrollToTop}
                  events={events}
                />
              )}
              {activeView === 'guides' && (
                <GuidesView 
                  key="guides" 
                  initialGuideId={initialGuideId}
                  onModalClose={() => setInitialGuideId(null)}
                  scrollToTop={scrollToTop}
                />
              )}
              {activeView === 'profile' && (
                <ProfileView 
                  key="profile" 
                  scrollToTop={scrollToTop}
                  onNavigate={handleNavigate}
                  currentUser={currentUser}
                  userProfile={userProfile}
                  onProfileUpdate={() => currentUser && loadProfile(currentUser.id)}
                  onAddPro={() => setShowAddPro(true)}
                  allPros={allPros}
                  unreadConversations={unreadConversations}
                />
              )}
              {activeView === 'login' && (
                <LoginView 
                  key="login"
                  onBack={() => navigateTo('home')}
                  onLoginSuccess={() => navigateTo('home')}
                  onSetUser={setCurrentUser}
                  currentUser={currentUser}
                />
              )}

              {activeView === 'complete-profile' && (
                <ProfileSetupView
                  key="complete-profile"
                  currentUser={currentUser}
                  onComplete={(profile) => {
                    setUserProfile(profile);
                    navigateTo('home');
                  }}
                />
              )}
              {activeView === 'admin' && (
                <AdminView 
                  key="admin" 
                  onRefetchPros={refetchPros}
                  scrollToTop={scrollToTop}
                  currentUser={currentUser}
                  events={events}
                  onRefetchEvents={refetchEvents}
                  allPros={allPros}
                  highlightedProId={highlightedProId}
                  setHighlightedProId={setHighlightedProId}
                  highlightedEventId={highlightedEventId}
                  setHighlightedEventId={setHighlightedEventId}
                  highlightedArticleId={highlightedArticleId}
                  setHighlightedArticleId={setHighlightedArticleId}
                  highlightedTestimonyId={highlightedTestimonyId}
                  setHighlightedTestimonyId={setHighlightedTestimonyId}
                  highlightedProIds={highlightedProIds}
                  setHighlightedProIds={setHighlightedProIds}
                  highlightedEventIds={highlightedEventIds}
                  setHighlightedEventIds={setHighlightedEventIds}
                  highlightedArticleIds={highlightedArticleIds}
                  setHighlightedArticleIds={setHighlightedArticleIds}
                  highlightedTestimoniesIds={highlightedTestimoniesIds}
                  setHighlightedTestimoniesIds={setHighlightedTestimoniesIds}
                  guideCategories={guideCategories}
                  setGuideCategories={setGuideCategories}
                  allArticles={allArticles}
                />
              )}
              {activeView === 'marketplace' && (
                <MarketplaceView 
                  key="marketplace" 
                  onAddAd={() => setShowAddAd(true)} 
                  ads={ads} 
                  onSelectAd={setSelectedAd} 
                  scrollToTop={scrollToTop}
                />
              )}
              {activeView === 'messages' && (
                <MessagesView 
                  key="messages" 
                  scrollToTop={scrollToTop} 
                  initialChat={initialChat}
                  onClearInitial={() => setInitialChat(null)}
                  onNavigate={handleNavigate}
                  currentUser={currentUser}
                  userProfile={userProfile}
                  unreadConversations={unreadConversations}
                  blockedUsers={blockedUsers}
                  usersWhoBlockedMe={usersWhoBlockedMe}
                  onBlockedUsersUpdate={fetchAndCheckUnread}
                  onMarkChatAsRead={handleMarkChatAsRead}
                />
              )}
        </div>

        {/* Modals contained in this area */}
        <AnimatePresence>
          {showAddPro && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-x-0 top-[60px] bottom-[80px] md:inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] overflow-y-auto overscroll-contain"
              onClick={() => setShowAddPro(false)}
            >
              <div className="min-h-full flex items-start justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden relative shadow-2xl flex flex-col my-auto border border-slate-100"
                  onClick={e => e.stopPropagation()}
                >
                {/* Modal Header */}
                <div className="px-8 pt-10 pb-4 flex flex-col items-center text-center relative">
                  <div className="w-12 h-12 bg-brand-yellow/10 flex items-center justify-center rounded-full mb-4">
                    <Plus className="w-6 h-6 text-brand-yellow" />
                  </div>
                  
                  <h2 className="text-2xl font-bold font-display text-brand-navy tracking-tight">
                    Recommend a Pro
                  </h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">Share a great service with the community</p>
                  
                  <button 
                    onClick={() => setShowAddPro(false)}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-full transition-all active:scale-95"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8 pt-4 space-y-6">
                  <div className="p-4 bg-brand-yellow/10 border border-brand-yellow/20 rounded-2xl">
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                      Unlocked is built on <span className="font-bold underline decoration-brand-yellow">trusted member recommendations</span>. 
                      Please only recommend professionals you have <span className="font-bold">personally used</span> and genuinely endorse. 
                      Self-promotion or recommending your own business is not permitted, as this undermines the integrity of our community.
                    </p>
                  </div>

                  {proError && (
                    <div className="p-3 bg-red-50 text-red-500 text-xs font-semibold rounded-xl border border-red-100">
                      {proError}
                    </div>
                  )}

                  {recommendationSent ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6">
                      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-slate-900 font-display">Thank You!</h3>
                        <p className="text-slate-500 leading-relaxed font-medium">
                          Your recommendation has been received. 
                          Our team will review it shortly to help grow our curated community.
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setShowAddPro(false);
                          setRecommendationSent(false);
                        }}
                        className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-brand-navy transition-all shadow-lg shadow-brand-blue/20"
                      >
                        Great, thanks!
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-5">
                        {/* Basic Info Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Professional Identity</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Full Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Maria Gonzalez" 
                            value={proName}
                            onChange={(e) => setProName(e.target.value)}
                            className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border border-slate-100 focus:border-brand-yellow/30 focus:bg-white focus:ring-4 focus:ring-brand-yellow/5 outline-none text-sm font-semibold transition-all placeholder:text-slate-300" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Company Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Legal Experts SL" 
                            value={proCompany}
                            onChange={(e) => setProCompany(e.target.value)}
                            className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border border-slate-100 focus:border-brand-yellow/30 focus:bg-white focus:ring-4 focus:ring-brand-yellow/5 outline-none text-sm font-semibold transition-all placeholder:text-slate-300" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Profession</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Attorney, Plumber, Doctor" 
                            value={proCategory}
                            onChange={(e) => setProCategory(e.target.value)}
                            className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border border-slate-100 focus:border-brand-yellow/30 focus:bg-white focus:ring-4 focus:ring-brand-yellow/5 outline-none text-sm font-semibold transition-all placeholder:text-slate-300" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Info Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Contact Details</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input 
                          type="email" 
                          placeholder="Email (Optional)" 
                          value={proEmail}
                          onChange={(e) => setProEmail(e.target.value)}
                          className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border border-slate-100 focus:border-brand-yellow/30 focus:bg-white focus:ring-4 focus:ring-brand-yellow/5 outline-none text-sm font-semibold transition-all placeholder:text-slate-300" 
                        />
                        <input 
                          type="tel" 
                          placeholder="Phone (Optional)" 
                          value={proPhone}
                          onChange={(e) => setProPhone(e.target.value)}
                          className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border border-slate-100 focus:border-brand-yellow/30 focus:bg-white focus:ring-4 focus:ring-brand-yellow/5 outline-none text-sm font-semibold transition-all placeholder:text-slate-300" 
                        />
                      </div>
                    </div>

                    {/* Recommendation Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Your Recommendation</p>
                      </div>
                      <textarea 
                        placeholder="Why do you recommend them?" 
                        value={proRecommendation}
                        onChange={(e) => setProRecommendation(e.target.value)}
                        className="w-full p-4 bg-slate-50/50 rounded-2xl border border-slate-100 focus:border-brand-yellow/30 focus:bg-white focus:ring-4 focus:ring-brand-yellow/5 outline-none h-28 text-sm font-medium resize-none transition-all leading-relaxed placeholder:text-slate-300" 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      className="w-full py-4 bg-brand-yellow text-white text-sm font-bold rounded-2xl shadow-lg shadow-brand-yellow/20 hover:shadow-brand-yellow/30 active:scale-[0.98] transition-all disabled:opacity-40 disabled:grayscale disabled:shadow-none uppercase tracking-widest" 
                      onClick={handlePostPro}
                      disabled={isSubmittingPro || (!proName && !proCompany) || !proCategory || (!proEmail.trim() && !proPhone.trim())}
                    >
                      {isSubmittingPro ? 'Sending...' : 'Post Recommendation'}
                    </button>
                    <button 
                      onClick={() => setShowAddPro(false)}
                      className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-500 transition-all uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {/* Form Footer */}
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        <AnimatePresence>
          {showAddAd && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-x-0 top-[60px] bottom-[80px] md:inset-0 bg-slate-900/80 backdrop-blur-md z-[100] overflow-y-auto overscroll-contain touch-pan-y"
              onClick={() => setShowAddAd(false)}
            >
              <div className="min-h-full flex items-start justify-center p-4 sm:p-6">
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="bg-white w-full max-w-lg rounded-[32px] p-6 sm:p-8 space-y-6 relative shadow-2xl my-auto"
                  onClick={e => e.stopPropagation()}
                >
                <button 
                  onClick={() => setShowAddAd(false)}
                  className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold font-display text-brand-navy">Post a New Ad</h2>
                    <span className="text-xs font-medium text-slate-400">{uploadedImageUrls.length}/3 photos</span>
                  </div>
                  <p className="text-slate-500 text-sm">Share what you're selling or looking for.</p>
                </div>
                <div className="space-y-6">
                  {/* Photo Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Photos</label>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {uploadedImageUrls.length}/3
                      </span>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      multiple
                      onChange={handleImageUpload}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      {uploadedImageUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm group">
                          <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setUploadedImageUrls(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 backdrop-blur text-red-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {uploadedImageUrls.length < 3 && (
                        <button 
                          onClick={() => !isUploading && fileInputRef.current?.click()}
                          disabled={isUploading}
                          className={cn(
                            "aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-1.5 cursor-pointer hover:bg-slate-100 hover:border-brand-blue/20 hover:text-brand-blue transition-all active:scale-95",
                            isUploading && "opacity-50 cursor-wait"
                          )}
                        >
                          {isUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
                          ) : (
                            <>
                              <Camera className="w-6 h-6" />
                              <span className="text-[10px] font-bold">Add Photo</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Basic Information</label>
                    <div className="space-y-3">
                      <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="What are you listing?" 
                          value={adTitle}
                          onChange={(e) => setAdTitle(e.target.value)}
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium" 
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder={adCategory === 'Jobs' || adCategory === 'Services' ? "Price (Optional)" : "Price"} 
                            value={adPrice}
                            onChange={(e) => setAdPrice(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium" 
                          />
                        </div>
                        <div className="relative">
                          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select 
                            value={adCategory}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdCategory(val);
                              if (val === 'Jobs' || val === 'Services') {
                                setAdCondition('N/A');
                              } else if (val === 'Real Estate') {
                                setAdCondition('N/A');
                              } else {
                                setAdCondition('Good');
                              }
                            }}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium appearance-none"
                          >
                            <option value="Vehicles">Vehicles</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Home">Home</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Leisure">Leisure</option>
                            <option value="Services">Services</option>
                            <option value="Jobs">Jobs</option>
                          </select>
                        </div>
                      </div>

                      {adCategory === 'Real Estate' && (
                        <div className="space-y-3">
                          <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
                            {(['Rent', 'Sale'] as const).map((type) => (
                              <button
                                key={type}
                                onClick={() => setAdHousingType(type)}
                                className={cn(
                                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                                  adHousingType === type 
                                    ? "bg-white text-brand-blue shadow-sm" 
                                    : "text-slate-400 hover:text-slate-600"
                                )}
                              >
                                For {type}
                              </button>
                            ))}
                          </div>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select 
                              value={adPropertyType}
                              onChange={(e) => setAdPropertyType(e.target.value)}
                              className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium appearance-none"
                            >
                              <option value="Apartment">Apartment</option>
                              <option value="House">House</option>
                              <option value="Studio">Studio</option>
                              <option value="Office">Office</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {adCategory === 'Vehicles' && (
                        <div className="relative">
                          <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select 
                            value={adFuelType}
                            onChange={(e) => setAdFuelType(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium appearance-none"
                          >
                            <option value="Petrol">Petrol</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Electric">Electric</option>
                            <option value="Hybrid">Hybrid</option>
                          </select>
                        </div>
                      )}

                      {adCategory === 'Jobs' && (
                        <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select 
                            value={adContractType}
                            onChange={(e) => setAdContractType(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium appearance-none"
                          >
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Internship">Internship</option>
                          </select>
                        </div>
                      )}

                      {adCategory === 'Clothing' && (
                        <div className="relative">
                          <Shirt className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select 
                            value={adSize}
                            onChange={(e) => setAdSize(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium appearance-none"
                          >
                            <option value="XS">XS</option>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details</label>
                    <div className={cn(
                      "grid gap-3",
                      (adCategory === 'Jobs' || adCategory === 'Services') ? "grid-cols-1" : "grid-cols-2"
                    )}>
                      {(adCategory !== 'Jobs' && adCategory !== 'Services') && (
                        <div className="relative">
                          <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select 
                            value={adCondition}
                            onChange={(e) => setAdCondition(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium appearance-none"
                          >
                            <option value="New">New</option>
                            <option value="Like New">Like New</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="N/A">N/A</option>
                          </select>
                        </div>
                      )}
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Location" 
                          value={adLocation}
                          onChange={(e) => setAdLocation(e.target.value)}
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                    <textarea 
                      placeholder="Tell us more about it..." 
                      value={adDescription}
                      onChange={(e) => setAdDescription(e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none h-32 text-sm font-medium resize-none" 
                    />
                  </div>

                  <button 
                    className="w-full btn-primary py-4 text-lg font-bold rounded-2xl shadow-xl shadow-brand-blue/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none" 
                    onClick={handlePostAd}
                    disabled={isUploading || !adTitle || !adPrice}
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Posting...</span>
                      </div>
                    ) : (
                      'Post Listing'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        <AnimatePresence>
          {selectedAd && (
            <AdDetailModal 
              key="ad-detail-modal"
              ad={selectedAd} 
              onClose={() => setSelectedAd(null)} 
            />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {activeView !== 'login' && (
        <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 safe-area-bottom z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between px-2 py-2 max-w-xl mx-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id as View)}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95 min-w-0",
                  (activeView === item.id) ? "text-brand-blue" : "text-slate-400"
                )}
              >
                {(activeView === item.id) && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-x-1 inset-y-0.5 bg-brand-blue/5 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative">
                  <item.icon className={cn(
                    "w-7 h-7 transition-all", 
                    (activeView === item.id) ? "stroke-[2.5px] text-brand-blue" : "stroke-[1.5px] text-slate-400"
                  )} />
                  {item.id === 'messages' && unreadConversations.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 bg-rose-600 rounded-full border-2 border-white shadow-sm" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-bold text-center truncate w-full px-1 transition-all",
                  (activeView === item.id) ? "text-brand-blue" : "text-slate-400 font-medium"
                )}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      )}
      </>
      )}
      </div>
    </APIProvider>
  );
}

// --- Components ---

function AdDetailModal({ ad, onClose }: { ad: Ad | any, onClose: () => void }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const price = ad.price.includes('€') ? ad.price : `${ad.price}€`;
  const images = ad.images && ad.images.length > 0 ? ad.images : [ad.image_url || ad.image];
  const createdAt = 'created_at' in ad ? ad.created_at : new Date().toISOString();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [ad.id]);

  const nextImage = (e?: any) => {
    e?.stopPropagation();
    setDirection(1);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: any) => {
    e?.stopPropagation();
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const onDragEnd = (event: any, info: any) => {
    if (images.length <= 1) return;
    const swipeThreshold = 50;
    const velocityThreshold = 500;
    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      nextImage();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      prevImage();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={scrollContainerRef}
      className="fixed inset-x-0 top-[60px] bottom-[80px] md:inset-0 z-50 overflow-y-auto overscroll-contain touch-pan-y"
    >
      <div 
        className="min-h-full flex items-start justify-center p-4 py-12"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md -z-10"
        />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col my-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={onClose}
              className="p-2 bg-white/90 backdrop-blur rounded-full shadow-lg text-slate-900 hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <div 
              className="h-56 sm:h-80 overflow-hidden relative group cursor-zoom-in touch-pan-y no-swipe"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, x: direction * 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 100 }}
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                drag={images.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={onDragEnd}
                className="w-full h-full cursor-grab active:cursor-grabbing select-none"
                onClick={() => setIsFullScreen(true)}
              >
                <img 
                  src={images[currentImageIndex]} 
                  alt={ad.title} 
                  className="w-full h-full object-cover pointer-events-none select-none"
                />
              </motion.div>
              
              {images.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_: any, i: number) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          i === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-1">
                    {ad.category}
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 font-display">{ad.title}</h3>
                </div>
                <div className="text-2xl font-semibold text-brand-blue">
                  {price}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {ad.location && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    <MapPin className="w-3.5 h-3.5" />
                    {ad.location}
                  </div>
                )}
                {ad.condition && ad.condition !== 'N/A' && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    <Tag className="w-3.5 h-3.5" />
                    {ad.condition}
                  </div>
                )}
                {ad.type && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue/10 rounded-full text-xs font-bold text-brand-blue">
                    For {ad.type}
                  </div>
                )}
                {ad.fuel_type && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    <Fuel className="w-3.5 h-3.5" />
                    {ad.fuel_type}
                  </div>
                )}
                {ad.property_type && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    <Building2 className="w-3.5 h-3.5" />
                    {ad.property_type}
                  </div>
                )}
                {ad.contract_type && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    <Briefcase className="w-3.5 h-3.5" />
                    {ad.contract_type}
                  </div>
                )}
                {ad.size && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    <Shirt className="w-3.5 h-3.5" />
                    Size: {ad.size}
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                  <Clock className="w-3.5 h-3.5" />
                  {formatRelativeTime(createdAt)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900">Description</h4>
              <p className="text-slate-600 leading-relaxed">
                {ad.description || "No description provided for this item."}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button 
                className="flex-1 bg-brand-blue text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/20 active:scale-[0.98] transition-transform"
                onClick={() => {
                  window.location.href = `mailto:seller@example.com?subject=Inquiry about ${ad.title}`;
                }}
              >
                Send Email to Seller
              </button>
              <button className="p-4 bg-slate-100 text-slate-600 rounded-2xl font-bold active:scale-[0.98] transition-transform">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            </div>
          </div>
        </motion.div>

        {/* Full Screen Image Portal */}
        <AnimatePresence>
          {isFullScreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
              onClick={() => setIsFullScreen(false)}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setIsFullScreen(false); }}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all z-[110]"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative w-full h-full flex items-center justify-center p-4 no-swipe">
                <motion.img
                  key={currentImageIndex}
                  initial={{ scale: 0.9, opacity: 0, x: direction * 200 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{ scale: 0.9, opacity: 0, x: -direction * 200 }}
                  transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                  drag={images.length > 1 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={onDragEnd}
                  src={images[currentImageIndex]}
                  alt={ad.title}
                  className="max-w-full max-h-full object-contain shadow-2xl cursor-grab active:cursor-grabbing select-none"
                  onClick={(e) => e.stopPropagation()}
                />

                {images.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all"
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all"
                    >
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
);
}

function RecommendationItem({ rec, onUpdate, onStartAdding }: { rec: any, onUpdate: () => void, onStartAdding: (rec: any) => void }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRefuseForm, setShowRefuseForm] = useState(false);
  const [refuseReason, setRefuseReason] = useState(rec.admin_notes || '');
  const [error, setError] = useState<string | null>(null);

  const handleUpdateStatus = async (status: 'validated' | 'refused' | 'pending') => {
    console.log('Attempting to update status:', { id: rec.id, status, refuseReason });
    setIsUpdating(true);
    setError(null);
    try {
      const result = await proService.updateRecommendationStatus(rec.id, status, status === 'refused' ? refuseReason : null);
      console.log('Update successful:', result);
      if (status === 'pending') setRefuseReason('');
      onUpdate();
      setShowRefuseForm(false);
    } catch (err: any) {
      console.error('Update failed:', err);
      setError(err?.message || "Failed to update status. Make sure columns 'status' and 'admin_notes' exist in your Supabase table.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'refused': return 'text-red-500 bg-red-50 border-red-100';
      default: return 'text-amber-500 bg-amber-50 border-amber-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'refused': return <X className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-white p-5 md:p-6 rounded-[28px] md:rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-4 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex gap-4 w-full sm:w-auto">
          {rec.pro_image_url && (
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm">
              <img src={rec.pro_image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h3 className="font-bold text-base md:text-lg text-slate-900 truncate max-w-[200px]">{rec.pro_name || rec.company_name}</h3>
              {rec.pro_name && rec.company_name && (
                <span className="text-slate-400 font-medium text-xs md:text-sm">at {rec.company_name}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-slate-100 text-[9px] md:text-[10px] font-bold uppercase text-slate-500 rounded-full tracking-wider">{rec.pro_category}</span>
              <div className={cn(
                "px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1",
                getStatusColor(rec.status)
              )}>
                {getStatusIcon(rec.status)}
                {rec.status || 'pending'}
              </div>
            </div>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-bold uppercase sm:ml-auto whitespace-nowrap">{rec.created_at ? new Date(rec.created_at).toLocaleDateString() : 'Recently'}</span>
      </div>
      
      {rec.status !== 'refused' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-slate-50/50 p-4 rounded-2xl">
          {rec.pro_email && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </p>
              <p className="font-medium text-slate-700 truncate">{rec.pro_email}</p>
            </div>
          )}
          {rec.pro_phone && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
              </p>
              <p className="font-medium text-slate-700">{rec.pro_phone}</p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Suggested by</p>
            <p className="font-medium text-brand-blue truncate">{rec.user_email}</p>
          </div>
        </div>
      )}

      {rec.status !== 'refused' && rec.notes && (
        <div className="bg-slate-50 p-4 rounded-2xl">
          <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-2">Member Notes</p>
          <p className="text-slate-600 text-sm leading-relaxed italic">"{rec.notes}"</p>
        </div>
      )}

      {rec.status === 'refused' && (
        <div className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100/50">
          <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <AlertCircle className="w-3 h-3" /> Recommended Pro Refused
          </p>
          <p className="text-xs text-slate-500 font-medium">This recommendation is currently hidden from the live app. You can reset it to move it back to the moderation queue.</p>
        </div>
      )}

      {rec.admin_notes && (
        <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100">
          <p className="text-[10px] uppercase font-semibold text-red-500 tracking-wider mb-2">Admin Explanation</p>
          <p className="text-red-700 text-sm leading-relaxed">{rec.admin_notes}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs text-red-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="pt-4 border-t border-slate-50 flex flex-wrap items-center gap-3">
        {!showRefuseForm ? (
          <>
            {rec.status === 'validated' ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">
                <CheckCircle2 className="w-3.5 h-3.5" /> Validated
              </div>
            ) : rec.status !== 'refused' && (
              <button 
                disabled={isUpdating}
                onClick={() => onStartAdding(rec)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Start adding pro
              </button>
            )}
            {rec.status === 'pending' && (
              <button 
                disabled={isUpdating}
                onClick={() => setShowRefuseForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" /> Refuse
              </button>
            )}
            {rec.status !== 'pending' && (
              <button 
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('pending')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-50 hover:text-amber-500 transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset pending
              </button>
            )}
          </>
        ) : (
          <div className="w-full space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Refusal Reason / Explanation</label>
              <textarea 
                value={refuseReason}
                onChange={e => setRefuseReason(e.target.value)}
                placeholder="Explain why this professional was refused..."
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-100 text-sm h-24"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                disabled={isUpdating || !refuseReason.trim()}
                onClick={() => handleUpdateStatus('refused')}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
              >
                Confirm refusal
              </button>
              <button 
                onClick={() => setShowRefuseForm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminView({ 
  scrollToTop, 
  onRefetchPros, 
  currentUser, 
  events = [], 
  onRefetchEvents, 
  allPros = [],
  highlightedProId,
  setHighlightedProId,
  highlightedEventId,
  setHighlightedEventId,
  highlightedArticleId,
  setHighlightedArticleId,
  highlightedTestimonyId,
  setHighlightedTestimonyId,
  highlightedProIds,
  setHighlightedProIds,
  highlightedEventIds,
  setHighlightedEventIds,
  highlightedArticleIds,
  setHighlightedArticleIds,
  highlightedTestimoniesIds,
  setHighlightedTestimoniesIds,
  guideCategories = [],
  setGuideCategories,
  allArticles = []
}: { 
  scrollToTop?: () => void, 
  onRefetchPros?: () => Promise<void>, 
  currentUser?: any, 
  events?: Event[], 
  onRefetchEvents?: () => Promise<void>, 
  allPros?: Professional[],
  highlightedProId: string | null,
  setHighlightedProId: React.Dispatch<React.SetStateAction<string | null>>,
  highlightedEventId: string | null,
  setHighlightedEventId: React.Dispatch<React.SetStateAction<string | null>>,
  highlightedArticleId: string | null,
  setHighlightedArticleId: React.Dispatch<React.SetStateAction<string | null>>,
  highlightedTestimonyId: string | null,
  setHighlightedTestimonyId: React.Dispatch<React.SetStateAction<string | null>>,
  highlightedProIds: string[],
  setHighlightedProIds: React.Dispatch<React.SetStateAction<string[]>>,
  highlightedEventIds: string[],
  setHighlightedEventIds: React.Dispatch<React.SetStateAction<string[]>>,
  highlightedArticleIds: string[],
  setHighlightedArticleIds: React.Dispatch<React.SetStateAction<string[]>>,
  highlightedTestimoniesIds: string[],
  setHighlightedTestimoniesIds: React.Dispatch<React.SetStateAction<string[]>>,
  guideCategories?: any[],
  setGuideCategories: React.Dispatch<React.SetStateAction<any[]>>,
  allArticles?: any[]
}) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardCategory, setDashboardCategory] = useState<'pros' | 'events' | 'testimonies' | 'reported_users' | 'highlights' | 'guides'>('pros');
  const [activeTab, setActiveTab ] = useState<'recommendations' | 'add_pro' | 'edit_pro' | 'add_event' | 'completed' | 'refused'>('recommendations');
  const [activeRecId, setActiveRecId] = useState<string | null>(null);
  const [editingProId, setEditingProId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [completedPros, setCompletedPros] = useState<Professional[]>([]);
  const [allTestimonies, setAllTestimonies] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const [loadingGuides, setLoadingGuides] = useState(false);
  const [editingArticle, setEditingArticle] = useState<GuideArticle | null>(null);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [guideFormCategory, setGuideFormCategory] = useState('getting-started');

  const [articleFormTitle, setArticleFormTitle] = useState('');
  const [articleFormExcerpt, setArticleFormExcerpt] = useState('');
  const [articleFormTag, setArticleFormTag] = useState('');
  const [articleFormContent, setArticleFormContent] = useState('');
  const [articleFormImageUrl, setArticleFormImageUrl] = useState('');
  const [articleFormBusinessName, setArticleFormBusinessName] = useState('');

  const [articleFormAuthorName, setArticleFormAuthorName] = useState('');
  const [articleFormAuthorRole, setArticleFormAuthorRole] = useState('');
  const [articleFormAuthorBusiness, setArticleFormAuthorBusiness] = useState('');
  const [articleFormAuthorWebsite, setArticleFormAuthorWebsite] = useState('');
  const [articleFormAuthorEmail, setArticleFormAuthorEmail] = useState('');
  const [articleFormAuthorPhone, setArticleFormAuthorPhone] = useState('');

  const [savingArticle, setSavingArticle] = useState(false);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);
  const [uploadingArticleImg, setUploadingArticleImg] = useState(false);

  const handleArticleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingArticleImg(true);
    try {
      const path = `articles/${Date.now()}_${file.name}`;
      const publicUrl = await storageService.uploadFile('images', path, file);
      setArticleFormImageUrl(publicUrl);
      setMsg({ type: 'success', text: 'Image uploaded successfully!' });
    } catch (err: any) {
      console.error('Error uploading article image:', err);
      setMsg({ type: 'error', text: 'Failed to upload image. Please try again.' });
    } finally {
      setUploadingArticleImg(false);
    }
  };

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<any>(null);

  const handlePreviewArticle = () => {
    const categoryTitle = guideCategories.find(c => c.id === guideFormCategory)?.title || 'Guide';
    const previewArt = {
      id: editingArticle ? editingArticle.id : 'preview-id',
      title: articleFormTitle || 'Untitled Preview Article',
      excerpt: articleFormExcerpt || 'No excerpt provided yet.',
      tag: articleFormTag || undefined,
      content: articleFormContent || 'No content written yet.',
      imageUrl: articleFormImageUrl || undefined,
      businessName: articleFormBusinessName || undefined,
      categoryTitle: categoryTitle,
      author: articleFormAuthorName.trim() ? {
        name: articleFormAuthorName,
        role: articleFormAuthorRole || undefined,
        businessName: articleFormAuthorBusiness || undefined,
        website: articleFormAuthorWebsite || undefined,
        email: articleFormAuthorEmail || undefined,
        phone: articleFormAuthorPhone || undefined
      } : undefined
    };

    setPreviewArticle(previewArt);
    setShowPreviewModal(true);
  };

  const fetchGuides = async () => {
    setLoadingGuides(true);
    try {
      const raw = await guideService.getGuideCategories();
      setGuideCategories(raw || []);
    } catch (error) {
      console.error('Error fetching guides:', error);
    } finally {
      setLoadingGuides(false);
    }
  };

  const handleEditArticleClick = (art: any, categoryId: string) => {
    setEditingArticle(art);
    setGuideFormCategory(categoryId);
    setArticleFormTitle(art.title || '');
    setArticleFormExcerpt(art.excerpt || '');
    setArticleFormTag(art.tag || '');
    setArticleFormContent(art.content || '');
    setArticleFormImageUrl(art.imageUrl || art.image_url || '');
    setArticleFormBusinessName(art.businessName || art.business_name || '');
    
    if (art.author) {
      setArticleFormAuthorName(art.author.name || '');
      setArticleFormAuthorRole(art.author.role || '');
      setArticleFormAuthorBusiness(art.author.businessName || art.author.business_name || '');
      setArticleFormAuthorWebsite(art.author.website || '');
      setArticleFormAuthorEmail(art.author.email || '');
      setArticleFormAuthorPhone(art.author.phone || '');
    } else {
      setArticleFormAuthorName('');
      setArticleFormAuthorRole('');
      setArticleFormAuthorBusiness('');
      setArticleFormAuthorWebsite('');
      setArticleFormAuthorEmail('');
      setArticleFormAuthorPhone('');
    }
    
    setShowArticleForm(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleFormTitle.trim() || !articleFormExcerpt.trim()) {
      setMsg({ type: 'error', text: 'Please fill in Title and Excerpt.' });
      return;
    }

    setSavingArticle(true);
    try {
      const authorObj = articleFormAuthorName.trim() ? {
        name: articleFormAuthorName,
        role: articleFormAuthorRole || undefined,
        businessName: articleFormAuthorBusiness || undefined,
        website: articleFormAuthorWebsite || undefined,
        email: articleFormAuthorEmail || undefined,
        phone: articleFormAuthorPhone || undefined
      } : undefined;

      const artId = editingArticle ? editingArticle.id : 'art-' + Date.now();
      const articlePayload: GuideArticle = {
        id: artId,
        title: articleFormTitle,
        excerpt: articleFormExcerpt,
        tag: articleFormTag || undefined,
        content: articleFormContent || undefined,
        imageUrl: articleFormImageUrl || undefined,
        businessName: articleFormBusinessName || undefined,
        author: authorObj || undefined
      };

      if (editingArticle) {
        await guideService.updateArticle(articlePayload, guideFormCategory);
        setMsg({ type: 'success', text: 'Article updated successfully!' });
      } else {
        await guideService.createArticle(articlePayload, guideFormCategory);
        setMsg({ type: 'success', text: 'Article created successfully!' });
      }

      setShowArticleForm(false);
      setEditingArticle(null);
      await fetchGuides();
    } catch (err: any) {
      console.error('Failed to save article:', err);
      setMsg({ type: 'error', text: 'Failed to save article: ' + err.message });
    } finally {
      setSavingArticle(false);
    }
  };

  const handleDeleteArticle = async (artId: string) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    
    setDeletingArticleId(artId);
    try {
      await guideService.deleteArticle(artId);
      setMsg({ type: 'success', text: 'Article deleted successfully!' });
      await fetchGuides();
    } catch (err: any) {
      console.error('Failed to delete article:', err);
      setMsg({ type: 'error', text: 'Failed to delete article: ' + err.message });
    } finally {
      setDeletingArticleId(null);
    }
  };

  const [proSearch, setProSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [testimonySearch, setTestimonySearch] = useState('');
  const [articleSearch, setArticleSearch] = useState('');

  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const [refusalReason, setRefusalReason] = useState<{ [key: string]: string }>({});
  const [showConfirmAction, setShowConfirmAction] = useState<{ [key: string]: 'approve' | 'delete' | null }>({});

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const data = await chatService.getAllReports();
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleResolveReport = async (reportId: string | number) => {
    // Optimistic UI update for instant feedback
    setReports(prev => prev.map(r => String(r.id) === String(reportId) ? { ...r, resolved: true } : r));

    try {
      const result = await chatService.resolveReport(reportId);
      if (result && result.localOnly) {
        setMsg({ 
          type: 'success', 
          text: 'Report resolved locally! To save permanently on Supabase, execute this SQL: ALTER TABLE user_reports ADD COLUMN resolved BOOLEAN DEFAULT false;' 
        });
      } else {
        setMsg({ type: 'success', text: 'Report resolved successfully!' });
      }
    } catch (error) {
      console.error('Error resolving report:', error);
      setMsg({ 
        type: 'error', 
        text: "Report resolved locally, but failed to sync online. Please check if the 'resolved' (BOOLEAN, default FALSE) column exists in your Supabase 'user_reports' table." 
      });
    }
  };

  const [highlightingId, setHighlightingId] = useState<string | null>(null);

  const handleToggleHighlight = async (type: 'pro' | 'event' | 'article' | 'testimony', id: string | number) => {
    setHighlightingId(String(id));
    const targetId = String(id);
    try {
      if (type === 'pro') {
        const isNowHighlighted = !highlightedProIds.includes(targetId);
        const newIds = isNowHighlighted ? [targetId] : [];
        
        setHighlightedProIds(newIds);
        setHighlightedProId(isNowHighlighted ? targetId : null);
        localStorage.setItem('highlighted_pro_ids', newIds.join(','));
        localStorage.setItem('highlighted_pro_id', isNowHighlighted ? targetId : '');

        if (isSupabaseConfigured) {
          // Reset all others if highlighting a new one
          if (isNowHighlighted) {
            await supabase.from('professionals').update({ is_highlighted: false }).neq('id', targetId);
          }
          
          const { error: setError } = await supabase
            .from('professionals')
            .update({ is_highlighted: isNowHighlighted })
            .eq('id', targetId);

          if (setError) {
            console.warn('Could not set pro highlighted state in database:', setError);
          } else {
            setMsg({ type: 'success', text: isNowHighlighted ? 'Professional updated as the unique highlight!' : 'Highlight removed!' });
          }
        } else {
          setMsg({ type: 'success', text: isNowHighlighted ? 'Professional updated as unique highlight locally!' : 'Highlight removed locally!' });
        }
        if (onRefetchPros) await onRefetchPros();
        await fetchCompletedPros();

      } else if (type === 'event') {
        const isNowHighlighted = !highlightedEventIds.includes(targetId);
        const newIds = isNowHighlighted ? [targetId] : [];
        
        setHighlightedEventIds(newIds);
        setHighlightedEventId(isNowHighlighted ? targetId : null);
        localStorage.setItem('highlighted_event_ids', newIds.join(','));
        localStorage.setItem('highlighted_event_id', isNowHighlighted ? targetId : '');

        if (isSupabaseConfigured) {
          // Reset all others if highlighting a new one
          if (isNowHighlighted) {
            await supabase.from('events').update({ is_highlighted: false }).neq('id', targetId);
          }

          const { error: setError } = await supabase
            .from('events')
            .update({ is_highlighted: isNowHighlighted })
            .eq('id', targetId);

          if (setError) {
            console.warn('Could not set event highlighted state in database:', setError);
          } else {
            setMsg({ type: 'success', text: isNowHighlighted ? 'Event updated as the unique highlight!' : 'Highlight removed!' });
          }
        } else {
          setMsg({ type: 'success', text: isNowHighlighted ? 'Event updated as unique highlight locally!' : 'Highlight removed locally!' });
        }
        if (onRefetchEvents) await onRefetchEvents();

      } else if (type === 'article') {
        const isNowHighlighted = !highlightedArticleIds.includes(targetId);
        let newIds = isNowHighlighted ? [targetId] : [];
        if (newIds.length === 0) {
          newIds = ['gs-1']; // maintain at least default article
        }
        
        const finalId = newIds[0];
        setHighlightedArticleIds(newIds);
        setHighlightedArticleId(finalId);
        localStorage.setItem('highlighted_article_ids', newIds.join(','));
        localStorage.setItem('highlighted_article_id', finalId);
        setMsg({ type: 'success', text: isNowHighlighted ? 'Article updated as the unique highlight!' : 'Highlight reset to default!' });

      } else if (type === 'testimony') {
        const isNowHighlighted = !highlightedTestimoniesIds.includes(targetId);
        const newIds = isNowHighlighted ? [targetId] : [];
        
        setHighlightedTestimoniesIds(newIds);
        setHighlightedTestimonyId(isNowHighlighted ? targetId : null);
        localStorage.setItem('highlighted_testimony_ids', newIds.join(','));
        localStorage.setItem('highlighted_testimony_id', isNowHighlighted ? targetId : '');

        if (isSupabaseConfigured) {
          // Reset all others if highlighting a new one
          if (isNowHighlighted) {
            await supabase.from('testimonies').update({ is_highlighted: false }).neq('id', targetId);
          }

          const { error: setError } = await supabase
            .from('testimonies')
            .update({ is_highlighted: isNowHighlighted })
            .eq('id', targetId);

          if (setError) {
            console.warn('Could not set testimony highlighted state in database:', setError);
          } else {
            setMsg({ type: 'success', text: isNowHighlighted ? 'Testimony updated as the unique highlight!' : 'Highlight removed!' });
          }
        } else {
          setMsg({ type: 'success', text: isNowHighlighted ? 'Testimony updated as unique highlight locally!' : 'Highlight removed locally!' });
        }
        await fetchAllTestimonies();
      }
    } catch (err) {
      console.error('Error highlighting item:', err);
      setMsg({ type: 'error', text: 'Failed to update highlight: ' + (err instanceof Error ? err.message : String(err)) });
    } finally {
      setHighlightingId(null);
    }
  };

  const fetchCompletedPros = async () => {
    try {
      const data = await proService.getProfessionals();
      setCompletedPros(data);
      if (data && data.length > 0) {
        const dbHighlight = data.find((p: any) => p.is_highlighted);
        if (dbHighlight) {
          setHighlightedProId(dbHighlight.id);
          localStorage.setItem('highlighted_pro_id', dbHighlight.id);
        }
      }
    } catch (error) {
      console.error('Error fetching completed pros:', error);
    }
  };

  const fetchAllTestimonies = async () => {
    try {
      const data = await proService.getAllTestimonies();
      setAllTestimonies(data);
      if (data && data.length > 0) {
        const dbHighlight = data.find((t: any) => t.is_highlighted);
        if (dbHighlight) {
          setHighlightedTestimonyId(String(dbHighlight.id));
          localStorage.setItem('highlighted_testimony_id', String(dbHighlight.id));
        }
      }
    } catch (error) {
      console.error('Error fetching all testimonies:', error);
    }
  };

  const handleDeleteTestimony = async (id: string | number) => {
    try {
      await proService.deleteTestimony(id);
      await fetchAllTestimonies(); // Refresh
      setMsg({ type: 'success', text: 'Testimony deleted successfully.' });
    } catch (error) {
      console.error('Error deleting testimony:', error);
      setMsg({ type: 'error', text: 'Failed to delete testimony: ' + (error as any).message });
    }
  };

  useEffect(() => {
    if (activeTab === 'completed') {
      fetchCompletedPros();
    }
  }, [activeTab]);

  useEffect(() => {
    if (dashboardCategory === 'testimonies') {
      fetchAllTestimonies();
    } else if (dashboardCategory === 'reported_users') {
      fetchReports();
    } else if (dashboardCategory === 'highlights') {
      fetchCompletedPros();
      fetchAllTestimonies();
    } else if (dashboardCategory === 'guides') {
      fetchGuides();
    }
  }, [dashboardCategory]);

  // Synchronize dynamic DB values into multi-state arrays on Admin Page
  // Now strictly enforcing single selection
  useEffect(() => {
    if (completedPros && completedPros.length > 0) {
      const dbHighlightedIds = completedPros.filter((p: any) => p.is_highlighted === true || p.is_highlighted === 'true' || p.is_highlighted === 1).map(p => String(p.id));
      if (dbHighlightedIds.length > 0) {
        const singleId = dbHighlightedIds[dbHighlightedIds.length - 1];
        setHighlightedProIds([singleId]);
        setHighlightedProId(singleId);
        localStorage.setItem('highlighted_pro_ids', singleId);
        localStorage.setItem('highlighted_pro_id', singleId);
      }
    }
  }, [completedPros]);

  useEffect(() => {
    if (events && events.length > 0) {
      const dbHighlightedIds = events.filter((e: any) => e.is_highlighted === true || e.is_highlighted === 'true' || e.is_highlighted === 1).map(e => String(e.id));
      if (dbHighlightedIds.length > 0) {
        const singleId = dbHighlightedIds[dbHighlightedIds.length - 1];
        setHighlightedEventIds([singleId]);
        setHighlightedEventId(singleId);
        localStorage.setItem('highlighted_event_ids', singleId);
        localStorage.setItem('highlighted_event_id', singleId);
      }
    }
  }, [events]);

  useEffect(() => {
    if (allTestimonies && allTestimonies.length > 0) {
      const dbHighlightedIds = allTestimonies.filter((t: any) => t.is_highlighted === true || t.is_highlighted === 'true' || t.is_highlighted === 1).map(t => String(t.id));
      if (dbHighlightedIds.length > 0) {
        const singleId = dbHighlightedIds[dbHighlightedIds.length - 1];
        setHighlightedTestimoniesIds([singleId]);
        setHighlightedTestimonyId(singleId);
        localStorage.setItem('highlighted_testimony_ids', singleId);
        localStorage.setItem('highlighted_testimony_id', singleId);
      }
    }
  }, [allTestimonies]);

  // Form state for adding pro
  const [newPro, setNewPro] = useState({
    name: '',
    company_name: '',
    category: '',
    rating: 0,
    review_count: 0,
    languages: [] as string[],
    image: '',
    bio: '',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    location: '',
    lat: 0,
    lng: 0
  });

  const [newEvent, setNewEvent] = useState({
    title: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    category: '',
    description: '',
    image: '',
    lat: 0,
    lng: 0
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToTop?.();
    fetchRecommendations();
    fetchCompletedPros();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const data = await proService.getRecommendations();
      setRecommendations(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAdding = (rec: any) => {
    setActiveRecId(rec.id);
    setEditingProId(null);
    setSelectedFile(null);
    setNewPro({
      ...newPro,
      name: rec.pro_name || '',
      company_name: rec.company_name || '',
      category: rec.pro_category || '',
      phone: rec.pro_phone || '',
      email: rec.pro_email || '',
      image: rec.pro_image_url || '',
      languages: rec.pro_languages || []
    });
    if (rec.pro_image_url) {
      setPreviewUrl(rec.pro_image_url);
    }
    setActiveTab('add_pro');
    scrollToTop?.();
  };

  const handleStartEditing = (pro: Professional) => {
    console.log('[handleStartEditing] Editing pro:', pro);
    setEditingProId(pro.id);
    setActiveRecId(null);
    setSelectedFile(null);
    
    // Mapping from Professional interface (which is already normalized by proService)
    const bioValue = pro.bio || '';
    const imageValue = pro.image || '';
    const categoryValue = pro.category || '';
    const latValue = pro.coordinates?.lat ?? 0;
    const lngValue = pro.coordinates?.lng ?? 0;

    setNewPro({
      name: pro.name || '',
      company_name: pro.company_name || '',
      category: categoryValue,
      rating: pro.rating ?? 0,
      review_count: pro.review_count || 0,
      languages: Array.isArray(pro.languages) ? pro.languages : [],
      image: imageValue,
      bio: bioValue,
      phone: pro.phone || '',
      email: pro.email || '',
      website: pro.website || '',
      instagram: pro.instagram || '',
      facebook: pro.facebook || '',
      location: pro.location || '',
      lat: Number(latValue),
      lng: Number(lngValue)
    });
    setPreviewUrl(imageValue || null);
    setActiveTab('edit_pro');
    scrollToTop?.();
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMsg(null);

    try {
      let imageUrl = newEvent.image;
      if (selectedFile) {
        let fileToUpload = await compressImage(selectedFile);
        const path = `events/${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        imageUrl = await storageService.uploadFile('images', path, fileToUpload);
      }

      // Geocoding for event
      let finalLat = newEvent.lat;
      let finalLng = newEvent.lng;
      if ((finalLat === 0 || finalLng === 0) && newEvent.location) {
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ address: newEvent.location }, (results, status) => {
              if (status === 'OK' && results && results.length > 0) resolve(results);
              else reject(status);
            });
          });
          finalLat = result[0].geometry.location.lat();
          finalLng = result[0].geometry.location.lng();
        } catch (e) {
          console.error('Event geocoding failed', e);
        }
      }

      await eventService.createEvent({
        ...newEvent,
        user_id: currentUser?.id,
        start_date: newEvent.start_date,
        end_date: newEvent.end_date,
        start_time: newEvent.start_time,
        end_time: newEvent.end_time,
        date: newEvent.start_date, // for legacy use
        time: newEvent.start_time, // for legacy use
        image_url: imageUrl,
        coordinates: { lat: finalLat, lng: finalLng }
      });

      setMsg({ type: 'success', text: 'Event created successfully!' });
      setNewEvent({
        title: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        location: '',
        category: '',
        description: '',
        image: '',
        lat: 0,
        lng: 0
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to create event.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPro = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use a simpler confirmation or just proceed if the user is an admin
    // For now, let's just proceed to verify the update works
    setIsSubmitting(true);
    setMsg(null);

    try {
      let imageUrl = newPro.image;
      let oldImageUrlToDelete = null;

      if (selectedFile) {
        console.log('[handleAddPro] Compressing and uploading selected file:', selectedFile.name);
        
        // 1. Compress image
        let fileToUpload = selectedFile;
        fileToUpload = await compressImage(selectedFile);

        // 2. Prepare path and sanity check
        const sanitizedName = selectedFile.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_');
          
        const path = `images_pro/${Date.now()}_${sanitizedName}`;
        
        // 3. Keep track of old image for deletion later
        if (editingProId && newPro.image && newPro.image.includes('supabase.co')) {
          oldImageUrlToDelete = newPro.image;
        }

        // 4. Upload
        imageUrl = await storageService.uploadFile('images', path, fileToUpload);
        
        // CRITICAL: Successfully uploaded, so update state to prevent re-uploading if DB update fails
        setNewPro(prev => ({ ...prev, image: imageUrl }));
        setSelectedFile(null);
        console.log('[handleAddPro] File uploaded successfully:', imageUrl);
      }

      // Geocoding fallback
      let finalLat = newPro.lat;
      let finalLng = newPro.lng;

      console.log('[handleAddPro] Initial coordinates:', finalLat, finalLng, 'Location:', newPro.location);

      if ((finalLat === 0 || finalLng === 0) && newPro.location) {
        console.log('[handleAddPro] Attempting geocoding fallback for:', newPro.location);
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ address: newPro.location }, (results, status) => {
              if (status === 'OK' && results && results.length > 0) resolve(results);
              else reject(status);
            });
          });
          finalLat = result[0].geometry.location.lat();
          finalLng = result[0].geometry.location.lng();
          console.log('[handleAddPro] Geocoding success. New coordinates:', finalLat, finalLng);
        } catch (e) {
          console.error('[handleAddPro] Geocoding fallback failed for address:', newPro.location, 'Error:', e);
        }
      }

      const formattedPro = {
        name: newPro.name,
        company_name: newPro.company_name,
        profession: newPro.category,
        rating: newPro.rating || 0,
        review_count: newPro.review_count || 0,
        languages: newPro.languages,
        image_url: imageUrl,
        image: imageUrl, // Add both for safety
        description: newPro.bio,
        bio: newPro.bio, // Add both for safety
        phone: newPro.phone,
        email: newPro.email,
        website: newPro.website,
        instagram: newPro.instagram,
        facebook: newPro.facebook,
        location: newPro.location,
        lat: finalLat,
        lng: finalLng
      };

      console.log('[handleAddPro] Final payload to service:', {
        ...formattedPro,
        description: typeof formattedPro.description === 'string' ? formattedPro.description.substring(0, 30) + '...' : ''
      });

      if (editingProId) {
        console.log('[handleAddPro] Calling updateProfessional for ID:', editingProId, 'Image:', imageUrl);
        const result = await proService.updateProfessional(editingProId, formattedPro);
        console.log('[handleAddPro] Update result:', result);
        
        if (result && result.success === false) {
           setMsg({ type: 'error', text: result.message || 'Failed to update professional. Record not found.' });
           setIsSubmitting(false); // Stop here so they can fix and retry
           return;
        }
        
        setMsg({ type: 'success', text: 'Professional updated successfully!' });
      } else {
        console.log('[handleAddPro] Creating new professional');
        await proService.createProfessional(formattedPro);
        
        // Update recommendation status if this came from a recommendation
        if (activeRecId) {
          await proService.updateRecommendationStatus(activeRecId, 'validated');
          await fetchRecommendations(); // Refresh the list
        }
        setMsg({ type: 'success', text: 'Professional added successfully!' });
      }

      // Cleanup old image if everything succeeded and we had a new upload
      if (oldImageUrlToDelete) {
        try {
          // Robust path extraction from public URL
          // Supabase public URLs are typically: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
          let pathToDelete = null;
          
          if (oldImageUrlToDelete.includes('/public/images/')) {
            pathToDelete = oldImageUrlToDelete.split('/public/images/')[1];
          } else if (oldImageUrlToDelete.includes('/images/')) {
            // Fallback for different URL patterns
            const parts = oldImageUrlToDelete.split('/images/');
            pathToDelete = parts[parts.length - 1];
          }

          if (pathToDelete) {
            // Remove any query parameters if present
            pathToDelete = pathToDelete.split('?')[0];
            
            console.log('[handleAddPro] Clean up: Deleting old image from storage:', pathToDelete);
            await storageService.deleteFile('images', pathToDelete);
          } else {
            console.warn('[handleAddPro] Could not parse path for deletion from URL:', oldImageUrlToDelete);
          }
        } catch (cleanupError) {
          console.warn('[handleAddPro] Failed to delete old image:', cleanupError);
        }
      }

      if (onRefetchPros) {
        await onRefetchPros(); // Refresh the main search results
      }
      await fetchCompletedPros(); // Refresh the admin list
      setActiveRecId(null);
      setEditingProId(null);
      setActiveTab('completed');
      setNewPro({
        name: '',
        company_name: '',
        category: '',
        rating: 0,
        review_count: 0,
        languages: [],
        image: '',
        bio: '',
        phone: '',
        email: '',
        website: '',
        instagram: '',
        facebook: '',
        location: '',
        lat: 0,
        lng: 0
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
      const action = editingProId ? 'update' : 'add';
      const errorMessage = err instanceof Error ? err.message : String(err);
      setMsg({ type: 'error', text: `Failed to ${action} professional: ${errorMessage}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePro = async () => {
    if (!editingProId) return;
    
    setIsSubmitting(true);
    setMsg(null);
    setShowConfirmModal(false);
    
    try {
      await proService.deleteProfessional(editingProId);
      
      // Cleanup image if it was on Supabase
      if (newPro.image && newPro.image.includes('supabase.co')) {
        try {
          let pathToDelete = null;
          if (newPro.image.includes('/public/images/')) {
            pathToDelete = newPro.image.split('/public/images/')[1];
          } else if (newPro.image.includes('/images/')) {
            const parts = newPro.image.split('/images/');
            pathToDelete = parts[parts.length - 1];
          }
          if (pathToDelete) {
             pathToDelete = pathToDelete.split('?')[0];
             await storageService.deleteFile('images', pathToDelete);
          }
        } catch (e) {
          console.warn('Failed to delete storage image during pro deletion:', e);
        }
      }

      setMsg({ type: 'success', text: 'Professional successfully deleted and archived!' });
      
      if (onRefetchPros) {
        await onRefetchPros();
      }
      await fetchCompletedPros();
      
      setTimeout(() => {
        setActiveTab('completed');
        setEditingProId(null);
        setNewPro({
          name: '',
          company_name: '',
          category: '',
          rating: 0,
          review_count: 0,
          languages: [],
          image: '',
          bio: '',
          phone: '',
          email: '',
          website: '',
          instagram: '',
          facebook: '',
          location: '',
          lat: 0,
          lng: 0
        });
        setPreviewUrl(null);
        setMsg(null);
      }, 1500);
    } catch (error: any) {
      console.error("Error deleting professional:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during deletion.';
      setMsg({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirmModal(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 text-left w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div className="space-y-1">
           <h2 className="text-xl md:text-2xl font-medium font-display text-brand-navy flex items-center gap-2">
             <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-brand-blue" />
             Admin Dashboard
           </h2>
           <h3 className="text-sm md:text-base text-slate-500 font-medium tracking-tight">
             {dashboardCategory === 'pros' ? 'Review recommendations and manage professionals.' : 
              dashboardCategory === 'events' ? 'Manage community events and meetups.' :
              dashboardCategory === 'reported_users' ? 'Moderate reported users, content, and harassment reports.' :
              dashboardCategory === 'highlights' ? 'Select which pro, event, article, and testimonial are highlighted on the Landing Page.' :
              dashboardCategory === 'guides' ? 'Manage articles, educational tips, and local expat guides.' :
              'Moderate client reviews and testimonies.'}
           </h3>
        </div>

        <div className="flex flex-wrap bg-slate-100 p-1 rounded-2xl w-full border border-slate-200/50 gap-1">
          <button 
            onClick={() => {
              setDashboardCategory('pros');
              setActiveTab('recommendations');
            }}
            className={cn(
              "px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              dashboardCategory === 'pros' ? "bg-white text-brand-blue shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Users className="w-4 h-4" />
            Pros
          </button>
          <button 
            onClick={() => {
              setDashboardCategory('events');
              setActiveTab('add_event');
            }}
            className={cn(
              "px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              dashboardCategory === 'events' ? "bg-white text-emerald-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Calendar className="w-4 h-4" />
            Events
          </button>
          <button 
            onClick={() => {
              setDashboardCategory('testimonies');
              setActiveTab('recommendations');
            }}
            className={cn(
              "px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              dashboardCategory === 'testimonies' ? "bg-white text-indigo-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Testimonies
          </button>
          <button 
            onClick={() => {
              setDashboardCategory('reported_users');
            }}
            className={cn(
              "px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              dashboardCategory === 'reported_users' ? "bg-white text-rose-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Flag className="w-4 h-4" />
            Reports
          </button>
          <button 
            onClick={() => {
              setDashboardCategory('highlights');
            }}
            className={cn(
              "px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              dashboardCategory === 'highlights' ? "bg-white text-amber-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Star className="w-4 h-4" />
            Highlights
          </button>
          <button 
            onClick={() => {
              setDashboardCategory('guides');
              setShowArticleForm(false);
              setEditingArticle(null);
            }}
            className={cn(
              "px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              dashboardCategory === 'guides' ? "bg-white text-orange-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <BookOpen className="w-4 h-4" />
            Guides
          </button>
        </div>
      </div>

      <div className="mb-8">
        {dashboardCategory === 'pros' ? (
          <div className="flex items-center gap-1 overflow-x-auto pb-2 no-scrollbar -mx-4 md:-mx-6 px-4 md:px-6">
            <div className="flex shrink-0 w-full min-w-max lg:w-auto gap-1 bg-slate-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => {
                  setActiveTab('completed');
                  setActiveRecId(null);
                  setEditingProId(null);
                  setSelectedFile(null);
                }}
                className={cn(
                  "flex-1 lg:flex-none px-3 lg:px-5 py-2 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === 'completed' ? "bg-white text-brand-blue shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Active
              </button>
              <button 
                onClick={() => setActiveTab('recommendations')}
                className={cn(
                  "flex-1 lg:flex-none px-3 lg:px-5 py-2 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === 'recommendations' ? "bg-white text-brand-blue shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Recs
              </button>
              <button 
                onClick={() => {
                  setActiveTab('add_pro');
                  setActiveRecId(null);
                  setEditingProId(null);
                  setSelectedFile(null);
                  setNewPro({
                    name: '',
                    company_name: '',
                    category: '',
                    rating: 0,
                    review_count: 0,
                    languages: [],
                    image: '',
                    bio: '',
                    phone: '',
                    email: '',
                    website: '',
                    instagram: '',
                    facebook: '',
                    location: '',
                    lat: 0,
                    lng: 0
                  });
                  setPreviewUrl(null);
                }}
                className={cn(
                  "flex-1 lg:flex-none px-3 lg:px-5 py-2 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === 'add_pro' ? "bg-white text-brand-blue shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Add Pro
              </button>
              {activeTab === 'edit_pro' && (
                <button 
                  className={cn(
                    "flex-1 lg:flex-none px-3 lg:px-5 py-2 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap bg-white text-amber-500 shadow-sm border border-amber-100"
                  )}
                >
                  Edit Profile
                </button>
              )}
              <button 
                onClick={() => {
                  setActiveTab('refused');
                  setActiveRecId(null);
                  setEditingProId(null);
                  setSelectedFile(null);
                }}
                className={cn(
                  "flex-1 lg:flex-none px-3 lg:px-5 py-2 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === 'refused' ? "bg-white text-brand-blue shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Refused
              </button>
            </div>
          </div>
        ) : dashboardCategory === 'events' ? (
          <div className="flex items-center gap-1 overflow-x-auto pb-2 no-scrollbar -mx-4 md:-mx-6 px-4 md:px-6">
            <div className="flex shrink-0 w-full min-w-max lg:w-auto gap-1 bg-slate-100 p-1.5 rounded-2xl">
              <button 
                className={cn(
                  "w-full lg:w-auto px-6 py-2.5 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap bg-white text-emerald-500 shadow-sm"
                )}
              >
                Add New Event
              </button>
            </div>
          </div>
        ) : dashboardCategory === 'testimonies' ? (
          <div className="flex items-center gap-1 overflow-x-auto pb-2 no-scrollbar -mx-4 md:-mx-6 px-4 md:px-6">
            <div className="flex shrink-0 w-full min-w-max lg:w-auto gap-1 bg-slate-100 p-1.5 rounded-2xl">
              <button 
                className={cn(
                  "w-full lg:w-auto px-6 py-2.5 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap bg-white text-indigo-500 shadow-sm"
                )}
              >
                All Testimonies
              </button>
            </div>
          </div>
        ) : dashboardCategory === 'reported_users' ? (
          <div className="flex items-center gap-1 overflow-x-auto pb-2 no-scrollbar -mx-4 md:-mx-6 px-4 md:px-6">
            <div className="flex shrink-0 w-full min-w-max lg:w-auto gap-1 bg-slate-100 p-1.5 rounded-2xl">
              <button 
                className={cn(
                  "w-full lg:w-auto px-6 py-2.5 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap bg-white text-rose-500 shadow-sm"
                )}
              >
                User Reports
              </button>
            </div>
          </div>
        ) : dashboardCategory === 'guides' ? (
          <div className="flex items-center gap-1 overflow-x-auto pb-2 no-scrollbar -mx-4 md:-mx-6 px-4 md:px-6">
            <div className="flex shrink-0 w-full min-w-max lg:w-auto gap-1 bg-slate-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => {
                  setShowArticleForm(false);
                  setEditingArticle(null);
                }}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  !showArticleForm ? "bg-white text-orange-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                All Articles
              </button>
              <button 
                onClick={() => {
                  setEditingArticle(null);
                  setGuideFormCategory('getting-started');
                  setArticleFormTitle('');
                  setArticleFormExcerpt('');
                  setArticleFormTag('Housing');
                  setArticleFormContent('');
                  setArticleFormImageUrl('');
                  setArticleFormBusinessName('');
                  setArticleFormAuthorName('');
                  setArticleFormAuthorRole('');
                  setArticleFormAuthorBusiness('');
                  setArticleFormAuthorWebsite('');
                  setArticleFormAuthorEmail('');
                  setArticleFormAuthorPhone('');
                  
                  setShowArticleForm(true);
                }}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  showArticleForm && !editingArticle ? "bg-white text-orange-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Add New Article
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {msg && (
        <div className={cn(
          "mb-6 p-4 rounded-2xl flex items-center gap-3",
          msg.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
        )}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-bold tracking-tight">{msg.text}</p>
        </div>
      )}

      {dashboardCategory === 'pros' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 font-display">
              {activeTab === 'completed' ? 'Active Professionals' :
               activeTab === 'add_pro' ? 'Add New Professional' :
               activeTab === 'edit_pro' ? 'Edit Professional' :
               activeTab === 'refused' ? 'Refused Recommendations' :
               'Review Recommendations'}
            </h3>
          </div>

          <div className="space-y-4">
          {activeTab === 'recommendations' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-8">
                  {recommendations.filter(r => r.status === 'pending' || !r.status).length === 0 ? (
                    <div className="bg-slate-50 rounded-[32px] p-12 text-center border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-medium">No pending recommendations.</p>
                    </div>
                  ) : (
                    recommendations
                      .filter(r => r.status === 'pending' || !r.status)
                      .map((rec) => (
                        <RecommendationItem 
                          key={rec.id} 
                          rec={rec} 
                          onUpdate={fetchRecommendations} 
                          onStartAdding={handleStartAdding}
                        />
                      ))
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'refused' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
                </div>
              ) : recommendations.filter(r => r.status === 'refused').length === 0 ? (
                <div className="bg-slate-50 rounded-[32px] p-12 text-center border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">No refused recommendations.</p>
                </div>
              ) : (
                recommendations
                  .filter(r => r.status === 'refused')
                  .map((rec) => (
                    <RecommendationItem 
                      key={rec.id} 
                      rec={rec} 
                      onUpdate={fetchRecommendations} 
                      onStartAdding={handleStartAdding}
                    />
                  ))
              )}
            </div>
          )}

          {activeTab === 'edit_pro' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => {
                    setActiveTab('completed');
                    setEditingProId(null);
                  }}
                  className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to List
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Editing Mode</span>
                </div>
              </div>

              <form onSubmit={handleAddPro} className="bg-white p-5 md:p-8 rounded-[32px] md:rounded-[40px] border-2 border-amber-100 shadow-2xl space-y-6 md:space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-400" />
                
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 gap-4">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300">
                          <Camera className="w-10 h-10 mb-1" />
                          <span className="text-[10px] font-semibold uppercase tracking-widest">No Image</span>
                        </div>
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-3 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-all active:scale-95"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold font-display text-slate-900 text-sm">Update Professional Image</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Leave blank to keep current photo</p>
                  </div>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Full Name</label>
                    <input 
                      required
                      value={newPro.name}
                      onChange={e => setNewPro({...newPro, name: e.target.value})}
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Company Name</label>
                    <input 
                      value={newPro.company_name}
                      onChange={e => setNewPro({...newPro, company_name: e.target.value})}
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Profession</label>
                    <input 
                      required
                      value={newPro.category}
                      onChange={e => setNewPro({...newPro, category: e.target.value})}
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Languages (comma separated)</label>
                    <input 
                      value={newPro.languages.join(', ')}
                      onChange={e => setNewPro({...newPro, languages: e.target.value.split(',').map(s => s.trim())})}
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Email</label>
                    <input 
                      type="email"
                      value={newPro.email}
                      onChange={e => setNewPro({...newPro, email: e.target.value})}
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Phone</label>
                    <input 
                      type="tel"
                      value={newPro.phone}
                      onChange={e => setNewPro({...newPro, phone: e.target.value})}
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Location Address</label>
                    <AddressAutocomplete 
                      value={newPro.location}
                      onChange={val => setNewPro({...newPro, location: val, lat: 0, lng: 0})}
                      onSelect={(location, lat, lng) => {
                        setNewPro({...newPro, location, lat, lng});
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Website</label>
                    <input 
                      value={newPro.website}
                      onChange={e => setNewPro({...newPro, website: e.target.value})}
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Instagram (@handle)</label>
                    <input 
                      value={newPro.instagram}
                      onChange={e => setNewPro({...newPro, instagram: e.target.value})}
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Facebook (URL or username)</label>
                    <input 
                      value={newPro.facebook || ''}
                      onChange={e => setNewPro({...newPro, facebook: e.target.value})}
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-display text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 px-1">About (Bio)</label>
                  <textarea 
                    required
                    value={newPro.bio}
                    onChange={e => setNewPro({...newPro, bio: e.target.value})}
                    className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-none font-display text-sm leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="h-14 bg-amber-500 text-white rounded-2xl font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] text-xs"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setActiveTab('completed');
                        setEditingProId(null);
                      }}
                      className="h-14 bg-slate-100 text-slate-600 rounded-2xl font-bold uppercase tracking-wider hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={initiateDelete}
                    className="w-full h-14 bg-rose-50 text-rose-600 rounded-2xl font-bold uppercase tracking-wider hover:bg-rose-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] text-xs mt-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Professional Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'add_pro' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <form onSubmit={handleAddPro} className="bg-white p-5 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-xl space-y-6 md:space-y-8">
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[32px] border border-dashed border-slate-200 gap-4">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300">
                          <Camera className="w-10 h-10 mb-1" />
                          <span className="text-[10px] font-semibold uppercase tracking-widest">No Image</span>
                        </div>
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-3 bg-brand-blue text-white rounded-full shadow-lg hover:bg-brand-navy transition-all active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-center">
                    <h4 className="font-semibold font-display text-brand-navy text-sm uppercase tracking-widest">Profile Photo</h4>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Click the button to upload a file</p>
                  </div>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Full Name</label>
                    <input 
                      required
                      value={newPro.name}
                      onChange={e => setNewPro({...newPro, name: e.target.value})}
                      placeholder=""
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Company Name</label>
                    <input 
                      value={newPro.company_name}
                      onChange={e => setNewPro({...newPro, company_name: e.target.value})}
                      placeholder=""
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Profession</label>
                    <input 
                      required
                      value={newPro.category}
                      onChange={e => setNewPro({...newPro, category: e.target.value})}
                      placeholder=""
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Languages (comma separated)</label>
                    <input 
                      value={newPro.languages.join(', ')}
                      onChange={e => setNewPro({...newPro, languages: e.target.value.split(',').map(s => s.trim())})}
                      placeholder="e.g. English, French, Spanish"
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Email</label>
                    <input 
                      type="email"
                      value={newPro.email}
                      onChange={e => setNewPro({...newPro, email: e.target.value})}
                      placeholder=""
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Phone</label>
                    <input 
                      type="tel"
                      value={newPro.phone}
                      onChange={e => setNewPro({...newPro, phone: e.target.value})}
                      placeholder=""
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Location Address</label>
                    <AddressAutocomplete 
                      value={newPro.location}
                      onChange={val => setNewPro({...newPro, location: val, lat: 0, lng: 0})}
                      onSelect={(location, lat, lng) => {
                        setNewPro({...newPro, location, lat, lng});
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Website</label>
                    <input 
                      value={newPro.website}
                      onChange={e => setNewPro({...newPro, website: e.target.value})}
                      placeholder=""
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Instagram (@handle)</label>
                    <input 
                      value={newPro.instagram}
                      onChange={e => setNewPro({...newPro, instagram: e.target.value})}
                      placeholder=""
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Facebook (URL or username)</label>
                    <input 
                      value={newPro.facebook || ''}
                      onChange={e => setNewPro({...newPro, facebook: e.target.value})}
                      placeholder=""
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-display text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 px-1">About (Bio)</label>
                  <textarea 
                    required
                    value={newPro.bio}
                    onChange={e => setNewPro({...newPro, bio: e.target.value})}
                    placeholder="Short professional biography..."
                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all resize-none font-display text-sm leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-brand-navy text-white rounded-2xl font-semibold uppercase tracking-wider shadow-lg shadow-brand-navy/10 hover:bg-brand-blue transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] text-xs"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Professional to App
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-end -mt-3">
                <span className="text-[10px] bg-brand-blue/10 text-brand-blue px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                  {completedPros.length} Active
                </span>
              </div>
              <div className="grid gap-4">
                {completedPros.length > 0 ? (
                  completedPros.map((pro) => (
                    <div key={pro.id} className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img src={pro.image} alt="" className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-100" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate">{pro.name}</h4>
                          <p className="text-xs text-slate-500 truncate">{pro.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-2xl sm:rounded-none">
                         <button 
                           onClick={() => handleStartEditing(pro)}
                           className="p-2.5 bg-white sm:bg-slate-50 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-xl transition-all shadow-sm sm:shadow-none"
                           title="Edit Profile"
                         >
                           <Edit2 className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm font-medium">No professionals added yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      ) : dashboardCategory === 'events' ? (
        <div className="space-y-4">
          {activeTab === 'add_event' && (
            <form onSubmit={handleAddEvent} className="bg-white p-5 md:p-8 rounded-[32px] md:rounded-[40px] border border-emerald-100 shadow-xl space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center justify-center p-6 bg-emerald-50/30 rounded-[32px] border border-dashed border-emerald-100 gap-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <Camera className="w-10 h-10 mb-1" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest">No Image</span>
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-3 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold font-display text-emerald-600 text-sm uppercase tracking-widest">Event Poster</h4>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Image for the event card</p>
                </div>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Event Title</label>
                  <input 
                    required
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="Ex: Beach Cleanup Valencia"
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-display text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Start Date</label>
                    <input 
                      required
                      type="date"
                      value={newEvent.start_date}
                      onChange={e => setNewEvent({...newEvent, start_date: e.target.value})}
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">End Date (Optional)</label>
                      {newEvent.end_date && (
                        <button 
                          type="button" 
                          onClick={() => setNewEvent({...newEvent, end_date: ''})}
                          className="text-[10px] text-brand-blue font-bold uppercase hover:text-brand-blue/80 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input 
                      type="date"
                      value={newEvent.end_date}
                      onChange={e => setNewEvent({...newEvent, end_date: e.target.value})}
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-display text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Start Time (Optional)</label>
                      {newEvent.start_time && (
                        <button 
                          type="button" 
                          onClick={() => setNewEvent({...newEvent, start_time: ''})}
                          className="text-[10px] text-brand-blue font-bold uppercase hover:text-brand-blue/80 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input 
                      type="time"
                      value={newEvent.start_time}
                      onChange={e => setNewEvent({...newEvent, start_time: e.target.value})}
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-display text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">End Time (Optional)</label>
                      {newEvent.end_time && (
                        <button 
                          type="button" 
                          onClick={() => setNewEvent({...newEvent, end_time: ''})}
                          className="text-[10px] text-brand-blue font-bold uppercase hover:text-brand-blue/80 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input 
                      type="time"
                      value={newEvent.end_time}
                      onChange={e => setNewEvent({...newEvent, end_time: e.target.value})}
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-display text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Category</label>
                  <input 
                    required
                    value={newEvent.category}
                    onChange={e => setNewEvent({...newEvent, category: e.target.value})}
                    placeholder="Community"
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-display text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Location Address</label>
                  <AddressAutocomplete 
                    value={newEvent.location}
                    onChange={val => setNewEvent({...newEvent, location: val})}
                    onSelect={(location, lat, lng) => setNewEvent({...newEvent, location, lat, lng})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1">Description</label>
                <textarea 
                  required
                  rows={4}
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-display text-sm resize-none"
                />
              </div>

              <button 
                disabled={isSubmitting}
                type="submit"
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold uppercase shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
                {isSubmitting ? 'Creating Event...' : 'Create Event'}
              </button>
            </form>
          )}
        </div>
      ) : dashboardCategory === 'testimonies' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 font-display">Moderation Testimonies</h3>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
              {allTestimonies.length} Total
            </span>
          </div>

          <div className="grid gap-4">
            {allTestimonies.length > 0 ? (
              allTestimonies.map((testimony) => {
                const isProcessing = deletingId === testimony.id;
                
                return (
                  <div key={testimony.id} className={cn(
                    "bg-white p-5 md:p-6 rounded-[32px] border transition-all",
                    testimony.status === 'pending' ? "border-amber-200 shadow-md shadow-amber-500/5 ring-1 ring-amber-100" : "border-slate-100 shadow-sm"
                  )}>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0",
                            testimony.status === 'approved' ? "bg-emerald-50 text-emerald-500" : 
                            testimony.status === 'refused' ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"
                          )}>
                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              <span className="font-bold text-slate-900">{testimony.author}</span>
                              <span className="text-slate-300 mx-1">•</span>
                              <div className="flex items-center gap-0.5 text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={cn("w-3 h-3 fill-current", i >= testimony.rating && "text-slate-200 fill-none")} />
                                ))}
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                                testimony.status === 'approved' ? "bg-emerald-50 text-emerald-600" : 
                                testimony.status === 'refused' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600 animate-pulse"
                              )}>
                                {testimony.status || 'pending'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed mb-3">
                              "{testimony.comment}"
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Regarding:</span>
                              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">
                                {testimony.professionals?.name || 'Unknown Pro'}
                              </span>
                            </div>
                            {testimony.status === 'refused' && testimony.refusal_reason && (
                              <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Refusal Reason:</p>
                                <p className="text-xs text-rose-500 italic">{testimony.refusal_reason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowConfirmAction(prev => ({ ...prev, [testimony.id]: 'delete' }))}
                          disabled={isProcessing}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
                          title="Delete Testimony"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {showConfirmAction[testimony.id] === 'delete' && (
                        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 flex flex-col gap-3 animate-in fade-in zoom-in-95 mb-4">
                          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest text-center">Delete this testimony permanently?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                setDeletingId(testimony.id);
                                await handleDeleteTestimony(testimony.id);
                                setDeletingId(null);
                                setShowConfirmAction(prev => ({ ...prev, [testimony.id]: null }));
                              }}
                              disabled={isProcessing}
                              className="flex-1 h-9 bg-rose-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-600 transition-all disabled:opacity-50"
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setShowConfirmAction(prev => ({ ...prev, [testimony.id]: null }))}
                              className="flex-1 h-9 bg-white text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-100 hover:bg-slate-50 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {testimony.status === 'pending' && (
                        <div className="flex flex-col gap-3 pt-3 border-t border-slate-50">
                          {showConfirmAction[testimony.id] === 'approve' ? (
                            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col gap-3 animate-in fade-in zoom-in-95">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest text-center">Approve this testimony?</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    setDeletingId(testimony.id);
                                    try {
                                      await proService.approveTestimony(testimony.id);
                                      await fetchAllTestimonies();
                                      if (onRefetchPros) await onRefetchPros();
                                      setMsg({ type: 'success', text: 'Testimony approved!' });
                                    } catch (err) {
                                      console.error('Approve error:', err);
                                      setMsg({ type: 'error', text: 'Failed to approve: ' + (err instanceof Error ? err.message : String(err)) });
                                    } finally {
                                      setDeletingId(null);
                                      setShowConfirmAction(prev => ({ ...prev, [testimony.id]: null }));
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="flex-1 h-9 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50"
                                >
                                  Yes, Approve
                                </button>
                                <button
                                  onClick={() => setShowConfirmAction(prev => ({ ...prev, [testimony.id]: null }))}
                                  className="flex-1 h-9 bg-white text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-100 hover:bg-slate-50 transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : refusalReason[testimony.id] !== undefined ? (
                            <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 flex flex-col gap-3 animate-in fade-in zoom-in-95">
                              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Reason for refusal:</p>
                              <textarea
                                value={refusalReason[testimony.id]}
                                onChange={(e) => setRefusalReason(prev => ({ ...prev, [testimony.id]: e.target.value }))}
                                placeholder="Write the reason here..."
                                className="w-full bg-white border border-rose-100 rounded-xl p-3 text-xs text-slate-700 min-h-[80px] focus:ring-2 focus:ring-rose-200 outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    if (!refusalReason[testimony.id]?.trim()) {
                                      setMsg({ type: 'error', text: 'Please provide a reason for refusal.' });
                                      return;
                                    }
                                    setDeletingId(testimony.id);
                                    try {
                                      await proService.refuseTestimony(testimony.id, refusalReason[testimony.id]);
                                      await fetchAllTestimonies();
                                      setMsg({ type: 'success', text: 'Testimony refused.' });
                                    } catch (err) {
                                      console.error('Refuse error:', err);
                                      setMsg({ type: 'error', text: 'Failed to refuse: ' + (err instanceof Error ? err.message : String(err)) });
                                    } finally {
                                      setDeletingId(null);
                                      setRefusalReason(prev => {
                                        const next = { ...prev };
                                        delete next[testimony.id];
                                        return next;
                                      });
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="flex-1 h-9 bg-rose-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-600 transition-all disabled:opacity-50"
                                >
                                  Confirm Refusal
                                </button>
                                <button
                                  onClick={() => setRefusalReason(prev => {
                                    const next = { ...prev };
                                    delete next[testimony.id];
                                    return next;
                                  })}
                                  className="flex-1 h-9 bg-white text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-100 hover:bg-slate-50 transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setShowConfirmAction(prev => ({ ...prev, [testimony.id]: 'approve' }))}
                                disabled={isProcessing}
                                className="flex-1 h-10 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => setRefusalReason(prev => ({ ...prev, [testimony.id]: '' }))}
                                disabled={isProcessing}
                                className="flex-1 h-10 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                Refuse
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-white rounded-[40px] border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <p className="text-slate-400 text-sm font-medium">No testimonies found in the system.</p>
              </div>
            )}
          </div>
        </div>
      ) : dashboardCategory === 'reported_users' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 font-display">Reported Users Moderation</h3>
            <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-rose-100">
              {reports.length} Reports Total
            </span>
          </div>

          {loadingReports ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
              {/* Active Reports Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                  <h4 className="font-bold text-rose-600 text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Active ({reports.filter(r => r.resolved !== true && r.resolved !== 'true').length})
                  </h4>
                </div>

                <div className="space-y-4">
                  {reports.filter(r => r.resolved !== true && r.resolved !== 'true').length > 0 ? (
                    reports.filter(r => r.resolved !== true && r.resolved !== 'true').map((report) => {
                      const reportDate = report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A';
                      return (
                        <div key={report.id} className="bg-white p-5 md:p-6 rounded-[32px] border border-rose-100 shadow-sm transition-all hover:shadow-md">
                          <div className="flex flex-col gap-4">
                            {/* Header with reporter and reported profiles side-by-side */}
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-rose-50/50 pb-4">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <img 
                                    src={report.reported?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(report.reported?.full_name || 'U')}&background=f1f5f9&color=475569`} 
                                    alt={report.reported?.full_name} 
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-50"
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-0.5 rounded-full" title="Reported User">
                                    <Ban className="w-3 h-3" />
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reported User</p>
                                  <h4 className="font-bold text-slate-900 text-sm">{report.reported?.full_name || 'Unknown Profile'}</h4>
                                  <p className="text-xs text-slate-500 font-mono">{report.reported?.email || 'No email'}</p>
                                </div>
                              </div>

                              <div className="hidden sm:block text-slate-300 font-medium">➔</div>

                              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl">
                                <img 
                                  src={report.reporter?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(report.reporter?.full_name || 'U')}&background=eaeaea&color=333333`} 
                                  className="w-8 h-8 rounded-full object-cover"
                                  alt={report.reporter?.full_name}
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Flagged By</p>
                                  <h5 className="font-bold text-slate-800 text-xs">{report.reporter?.full_name || 'Unknown Profile'}</h5>
                                </div>
                              </div>
                            </div>

                            {/* Details & content */}
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg border border-rose-100">
                                  Reason: {report.reason}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  Date: {reportDate}
                                </span>
                              </div>
                              
                              {report.details && (
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-slate-700 text-sm leading-relaxed italic">
                                  "{report.details}"
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50">
                              <button
                                onClick={() => handleResolveReport(report.id)}
                                className="px-4 py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-100 transition-all flex items-center gap-1.5 active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Dismiss / Resolve Flag
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-16 bg-white rounded-[40px] border border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Flag className="w-8 h-8" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium font-display">No active user reports. The community is clean.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolved Reports Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-emerald-600 text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Archive / Resolved ({reports.filter(r => r.resolved === true || r.resolved === 'true').length})
                  </h4>
                </div>

                <div className="space-y-4">
                  {reports.filter(r => r.resolved === true || r.resolved === 'true').length > 0 ? (
                    reports.filter(r => r.resolved === true || r.resolved === 'true').map((report) => {
                      const reportDate = report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A';
                      return (
                        <div key={report.id} className="bg-slate-50/30 p-5 md:p-6 rounded-[32px] border border-slate-200/60 transition-all opacity-90 hover:opacity-100">
                          <div className="flex flex-col gap-4">
                            {/* Header with reporter and reported profiles side-by-side */}
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <img 
                                    src={report.reported?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(report.reported?.full_name || 'U')}&background=f1f5f9&color=475569`} 
                                    alt={report.reported?.full_name} 
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 filter grayscale-[20%]"
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full">
                                    <Check className="w-3 h-3" />
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reported User</p>
                                  <h4 className="font-bold text-slate-700 text-sm line-through decoration-slate-300">{report.reported?.full_name || 'Unknown Profile'}</h4>
                                  <p className="text-xs text-slate-500 font-mono">{report.reported?.email || 'No email'}</p>
                                </div>
                              </div>

                              <div className="hidden sm:block text-slate-300 font-medium">➔</div>

                              <div className="flex items-center gap-3 bg-slate-100/50 p-2.5 rounded-2xl">
                                <img 
                                  src={report.reporter?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(report.reporter?.full_name || 'U')}&background=eaeaea&color=333333`} 
                                  className="w-8 h-8 rounded-full object-cover filter grayscale-[10%]"
                                  alt={report.reporter?.full_name}
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Flagged By</p>
                                  <h5 className="font-bold text-slate-600 text-xs">{report.reporter?.full_name || 'Unknown Profile'}</h5>
                                </div>
                              </div>
                            </div>

                            {/* Details & content */}
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200">
                                  Reason: {report.reason}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  Date: {reportDate}
                                </span>
                              </div>
                              
                              {report.details && (
                                <div className="bg-slate-100/30 p-4 rounded-2xl border border-slate-100 text-slate-500 text-sm leading-relaxed italic">
                                  "{report.details}"
                                </div>
                              )}
                            </div>

                            {/* Resolved Badge */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-wider">
                                <Check className="w-3.5 h-3.5" />
                                Resolved
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-16 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 border border-slate-100">
                        <Check className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium font-display">No resolved reports history.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : dashboardCategory === 'highlights' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
          <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-900 font-display">Landing Page Highlights (Discover Room)</h3>
            <p className="text-xs text-slate-400 font-medium">Select what cards are displayed in the Discover section on the main landing page.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pro Highlight Selector */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-amber-50 text-amber-500 rounded-xl">
                    <Star className="w-4 h-4 fill-current" />
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Top Provider Card</h4>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search provider by name or category..."
                  value={proSearch}
                  onChange={(e) => setProSearch(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-150 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {proSearch.trim() === '' ? (
                  (() => {
                    const currentHighlights = completedPros.filter(p => highlightedProIds.includes(String(p.id)));
                    if (currentHighlights.length > 0) {
                      return (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currently Highlighted ({currentHighlights.length}):</p>
                          <div className="space-y-2">
                            {currentHighlights.map(currentHighlight => (
                              <div 
                                key={currentHighlight.id}
                                onClick={() => handleToggleHighlight('pro', currentHighlight.id)}
                                className="flex items-center justify-between p-3 rounded-2xl border bg-amber-50/40 border-amber-200 cursor-pointer hover:bg-amber-100/40 transition-all"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <img src={currentHighlight.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentHighlight.name)}&background=f1f5f9&color=475569`} alt="" className="w-8 h-8 rounded-full object-cover" />
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-slate-900 text-xs truncate">{currentHighlight.name}</h5>
                                    <p className="text-[10px] text-slate-400 truncate">{currentHighlight.category}</p>
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shrink-0">Active</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <p className="text-slate-400 text-xs text-center py-6 font-medium">No provider highlighted. Search to highlight a provider.</p>
                      );
                    }
                  })()
                ) : (
                  (() => {
                    const filtered = completedPros.filter(pro => 
                      pro.name.toLowerCase().includes(proSearch.toLowerCase()) ||
                      (pro.category && pro.category.toLowerCase().includes(proSearch.toLowerCase()))
                    );
                    if (filtered.length > 0) {
                      return (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Results:</p>
                          {filtered.map((pro) => {
                            const isHighlighted = highlightedProIds.includes(String(pro.id));
                            return (
                              <div 
                                key={pro.id} 
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer",
                                  isHighlighted ? "bg-amber-50/40 border-amber-200" : "bg-slate-50/30 border-slate-100 hover:bg-slate-50"
                                )}
                                onClick={() => handleToggleHighlight('pro', pro.id)}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <img src={pro.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.name)}&background=f1f5f9&color=475569`} alt="" className="w-8 h-8 rounded-full object-cover" />
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-slate-900 text-xs truncate">{pro.name}</h5>
                                    <p className="text-[10px] text-slate-400 truncate">{pro.category}</p>
                                  </div>
                                </div>
                                <button 
                                  disabled={highlightingId === String(pro.id)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                                    isHighlighted ? "bg-amber-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-150 hover:bg-slate-100"
                                  )}
                                >
                                  {highlightingId === String(pro.id) ? "..." : isHighlighted ? "Highlighted" : "Select"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else {
                      return <p className="text-slate-400 text-xs text-center py-6 font-medium">No providers match your search.</p>;
                    }
                  })()
                )}
              </div>
            </div>

            {/* Event Highlight Selector */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-50 text-emerald-500 rounded-xl">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Event of the Week</h4>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search events by title or location..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {eventSearch.trim() === '' ? (
                  (() => {
                    const currentHighlights = events.filter(e => highlightedEventIds.includes(String(e.id)));
                    if (currentHighlights.length > 0) {
                      return (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currently Highlighted ({currentHighlights.length}):</p>
                          <div className="space-y-2">
                            {currentHighlights.map(currentHighlight => (
                              <div 
                                key={currentHighlight.id}
                                onClick={() => handleToggleHighlight('event', currentHighlight.id)}
                                className="flex items-center justify-between p-3 rounded-2xl border bg-emerald-50/40 border-emerald-200 cursor-pointer hover:bg-emerald-100/40 transition-all"
                              >
                                <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                                  <img src={currentHighlight.image || `https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80`} alt="" className="w-8 h-8 rounded-full object-cover" />
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-slate-900 text-xs truncate">{currentHighlight.title}</h5>
                                    <p className="text-[10px] text-slate-400 truncate">{currentHighlight.start_date || currentHighlight.date} • {currentHighlight.location}</p>
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shrink-0">Active</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <p className="text-slate-400 text-xs text-center py-6 font-medium">No event highlighted. Search to highlight an event.</p>
                      );
                    }
                  })()
                ) : (
                  (() => {
                    const filtered = events.filter(evt =>
                      evt.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
                      (evt.location && evt.location.toLowerCase().includes(eventSearch.toLowerCase()))
                    );
                    if (filtered.length > 0) {
                      return (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Results:</p>
                          {filtered.map((evt) => {
                            const isHighlighted = highlightedEventIds.includes(String(evt.id));
                            return (
                              <div 
                                key={evt.id} 
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer",
                                  isHighlighted ? "bg-emerald-50/40 border-emerald-200" : "bg-slate-50/30 border-slate-100 hover:bg-slate-50"
                                )}
                                onClick={() => handleToggleHighlight('event', evt.id)}
                              >
                                <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                                  <img src={evt.image || `https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80`} alt="" className="w-8 h-8 rounded-full object-cover" />
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-slate-900 text-xs truncate">{evt.title}</h5>
                                    <p className="text-[10px] text-slate-400 truncate">{evt.start_date || evt.date} • {evt.location}</p>
                                  </div>
                                </div>
                                <button 
                                  disabled={highlightingId === String(evt.id)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                                    isHighlighted ? "bg-emerald-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-150 hover:bg-slate-100"
                                  )}
                                >
                                  {highlightingId === String(evt.id) ? "..." : isHighlighted ? "Highlighted" : "Select"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else {
                      return <p className="text-slate-400 text-xs text-center py-6 font-medium">No events match your search.</p>;
                    }
                  })()
                )}
              </div>
            </div>

            {/* Testimony Highlight Selector */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-500 rounded-xl">
                    <MessageSquare className="w-4 h-4" />
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Quote / Testimonial</h4>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search testimonials by author, provider, or commentary..."
                  value={testimonySearch}
                  onChange={(e) => setTestimonySearch(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {testimonySearch.trim() === '' ? (
                  (() => {
                    const approvedTestimonies = allTestimonies.filter(t => t.status === 'approved');
                    const currentHighlights = approvedTestimonies.filter(t => highlightedTestimoniesIds.includes(String(t.id)));
                    if (currentHighlights.length > 0) {
                      return (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currently Highlighted ({currentHighlights.length}):</p>
                          <div className="space-y-2">
                            {currentHighlights.map(currentHighlight => (
                              <div 
                                key={currentHighlight.id}
                                onClick={() => handleToggleHighlight('testimony', currentHighlight.id)}
                                className="flex items-center justify-between p-3 rounded-2xl border bg-indigo-50/40 border-indigo-200 cursor-pointer hover:bg-indigo-100/40 transition-all"
                              >
                                <div className="min-w-0 pr-4 text-left">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 text-xs truncate">{currentHighlight.author}</span>
                                    <span className="text-[9px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md font-bold uppercase truncate max-w-[120px]">
                                      {currentHighlight.professionals?.name || 'Pro'}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 truncate italic mt-1">"{currentHighlight.comment}"</p>
                                </div>
                                <span className="px-2.5 py-1 bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shrink-0">Active</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <p className="text-slate-400 text-xs text-center py-6 font-medium">No testimonial highlighted. Search to highlight a testimonial.</p>
                      );
                    }
                  })()
                ) : (
                  (() => {
                    const approvedTestimonies = allTestimonies.filter(t => t.status === 'approved');
                    const filtered = approvedTestimonies.filter(t => 
                      t.author.toLowerCase().includes(testimonySearch.toLowerCase()) ||
                      (t.comment && t.comment.toLowerCase().includes(testimonySearch.toLowerCase())) ||
                      (t.professionals?.name && t.professionals.name.toLowerCase().includes(testimonySearch.toLowerCase()))
                    );
                    if (filtered.length > 0) {
                      return (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Results:</p>
                          {filtered.map((testimony) => {
                            const isHighlighted = highlightedTestimoniesIds.includes(String(testimony.id));
                            return (
                              <div 
                                key={testimony.id} 
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer",
                                  isHighlighted ? "bg-indigo-50/40 border-indigo-200" : "bg-slate-50/30 border-slate-100 hover:bg-slate-50"
                                )}
                                onClick={() => handleToggleHighlight('testimony', testimony.id)}
                              >
                                <div className="flex flex-col gap-1 min-w-0 pr-4 text-left">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 text-xs truncate">{testimony.author}</span>
                                    <span className="text-[9px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md font-bold uppercase truncate max-w-[120px]">
                                      {testimony.professionals?.name || 'Pro'}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 truncate italic">"{testimony.comment}"</p>
                                </div>
                                <button 
                                  disabled={highlightingId === String(testimony.id)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shrink-0",
                                    isHighlighted ? "bg-indigo-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-150 hover:bg-slate-100"
                                  )}
                                >
                                  {highlightingId === String(testimony.id) ? "..." : isHighlighted ? "Highlighted" : "Select"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else {
                      return <p className="text-slate-400 text-xs text-center py-6 font-medium">No approved testimonials match your search.</p>;
                    }
                  })()
                )}
              </div>
            </div>

            {/* Article/Guide Highlight Selector */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[#00C2A8]/10 text-[#00C2A8] rounded-xl">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Tips / Article of the Week</h4>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles by title, tag, or excerpt..."
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-150 focus:outline-none focus:ring-2 focus:ring-[#00C2A8]/20 focus:border-[#00C2A8] text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {articleSearch.trim() === '' ? (
                  (() => {
                    const currentHighlights = allArticles.filter(art => highlightedArticleIds.includes(String(art.id)));
                    if (currentHighlights.length > 0) {
                      return (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currently Highlighted ({currentHighlights.length}):</p>
                          <div className="space-y-2">
                            {currentHighlights.map(currentHighlight => (
                              <div 
                                key={currentHighlight.id}
                                onClick={() => handleToggleHighlight('article', currentHighlight.id)}
                                className="flex items-center justify-between p-3 rounded-2xl border bg-[#00C2A8]/5 border-[#00C2A8]/30 cursor-pointer hover:bg-[#00C2A8]/15 transition-all"
                              >
                                <div className="flex flex-col gap-1 min-w-0 text-left">
                                  <span className="font-bold text-slate-900 text-xs truncate">{currentHighlight.title}</span>
                                  <span className="text-[10px] text-slate-400 truncate">{currentHighlight.excerpt}</span>
                                </div>
                                <span className="px-2.5 py-1 bg-[#00C2A8] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shrink-0">Active</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <p className="text-slate-400 text-xs text-center py-6 font-medium">No article highlighted. Search to highlight one or more.</p>
                      );
                    }
                  })()
                ) : (
                  (() => {
                    const filtered = allArticles.filter(art => 
                      art.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
                      (art.excerpt && art.excerpt.toLowerCase().includes(articleSearch.toLowerCase())) ||
                      (art.tag && art.tag.toLowerCase().includes(articleSearch.toLowerCase()))
                    );
                    if (filtered.length > 0) {
                      return (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Results:</p>
                          {filtered.map((art) => {
                            const isHighlighted = highlightedArticleIds.includes(String(art.id));
                            return (
                              <div 
                                key={art.id} 
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer",
                                  isHighlighted ? "bg-[#00C2A8]/5 border-[#00C2A8]/30" : "bg-slate-50/30 border-slate-100 hover:bg-slate-50"
                                )}
                                onClick={() => handleToggleHighlight('article', art.id)}
                              >
                                <div className="flex flex-col gap-1 min-w-0 text-left">
                                  <span className="font-bold text-slate-900 text-xs truncate">{art.title}</span>
                                  <span className="text-[10px] text-slate-400 truncate">{art.excerpt}</span>
                                </div>
                                <button 
                                  disabled={highlightingId === String(art.id)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ml-2",
                                    isHighlighted ? "bg-[#00C2A8] text-white shadow-sm" : "bg-white text-slate-600 border border-slate-150 hover:bg-slate-100"
                                  )}
                                >
                                  {highlightingId === String(art.id) ? "..." : isHighlighted ? "Highlighted" : "Select"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else {
                      return <p className="text-slate-400 text-xs text-center py-6 font-medium">No articles match your search.</p>;
                    }
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      ) : dashboardCategory === 'guides' ? (
        <div className="space-y-6">
          {loadingGuides ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm font-medium">Loading articles...</p>
            </div>
          ) : showArticleForm ? (
            <form onSubmit={handleSaveArticle} className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-lg font-bold font-display text-slate-800">
                    {editingArticle ? 'Edit Article' : 'Create New Article'}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">Enter details and author contact information below.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowArticleForm(false);
                    setEditingArticle(null);
                  }}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Category</label>
                  <select
                    value={guideFormCategory}
                    onChange={(e) => setGuideFormCategory(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl bg-slate-50 border border-slate-150 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-medium"
                  >
                    <option value="getting-started">Getting Started</option>
                    <option value="paperwork">Paperwork</option>
                    <option value="family">Family</option>
                    <option value="health">Health</option>
                    <option value="work">Work</option>
                    <option value="daily-tips">Daily Tips</option>
                    <option value="city-fun">City Fun</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Tag / Label (e.g. "Housing")</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Housing, Arrival"
                    value={articleFormTag}
                    onChange={(e) => setArticleFormTag(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl bg-slate-50 border border-slate-150 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter article title"
                    value={articleFormTitle}
                    onChange={(e) => setArticleFormTitle(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl bg-slate-50 border border-slate-150 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Excerpt (Short Description)</label>
                  <input
                    type="text"
                    required
                    placeholder="A quick summary showing on lists..."
                    value={articleFormExcerpt}
                    onChange={(e) => setArticleFormExcerpt(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl bg-slate-50 border border-slate-150 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Key Business Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Engel & Völkers Valencia"
                    value={articleFormBusinessName}
                    onChange={(e) => setArticleFormBusinessName(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl bg-slate-50 border border-slate-150 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Article Image</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="md:col-span-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Or enter public image URL (e.g., https://...)"
                          value={articleFormImageUrl}
                          onChange={(e) => setArticleFormImageUrl(e.target.value)}
                          className="w-full text-xs px-4 py-3 rounded-xl bg-slate-50 border border-slate-150 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-medium"
                        />
                        <label className="cursor-pointer px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/10">
                          <Upload className="w-3.5 h-3.5" />
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleArticleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {uploadingArticleImg && (
                        <p className="text-[10px] text-orange-500 font-semibold mt-1 animate-pulse">Uploading image to secure storage...</p>
                      )}
                    </div>
                    <div className="flex justify-center md:justify-end">
                      {articleFormImageUrl ? (
                        <div className="relative group w-28 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                          <img
                            src={articleFormImageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setArticleFormImageUrl('')}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-95 hover:opacity-100 transition-all hover:scale-105"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-28 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50 font-sans">
                          <span className="text-[9px] font-bold uppercase tracking-wider font-semibold">No Image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Article Content (Markdown supported)</label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Enter full article text. You can use markdown headers, bullets, and paragraphs..."
                    value={articleFormContent}
                    onChange={(e) => setArticleFormContent(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl bg-slate-50 border border-slate-150 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-medium font-sans resize-y"
                  />
                </div>
              </div>

              {/* Author Section */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <div>
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Author details or Contact Information (Optional)</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">To display contact credentials and redirection links at the end of the article.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Marina Sanchis"
                      value={articleFormAuthorName}
                      onChange={(e) => setArticleFormAuthorName(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Role / Title Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Real Estate Advisor"
                      value={articleFormAuthorRole}
                      onChange={(e) => setArticleFormAuthorRole(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Engel & Völkers"
                      value={articleFormAuthorBusiness}
                      onChange={(e) => setArticleFormAuthorBusiness(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Website URL (Include http://)</label>
                    <input
                      type="url"
                      placeholder="e.g. https://www.ev.com"
                      value={articleFormAuthorWebsite}
                      onChange={(e) => setArticleFormAuthorWebsite(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Contact Email</label>
                    <input
                      type="email"
                      placeholder="e.g. contact@email.com"
                      value={articleFormAuthorEmail}
                      onChange={(e) => setArticleFormAuthorEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Contact Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +34 612 345 678"
                      value={articleFormAuthorPhone}
                      onChange={(e) => setArticleFormAuthorPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-wrap gap-3 justify-between border-t border-slate-100 pt-6">
                <div>
                  <button
                    type="button"
                    onClick={handlePreviewArticle}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 border border-slate-200"
                  >
                    <Eye className="w-4 h-4 text-slate-500" />
                    View Article
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowArticleForm(false);
                      setEditingArticle(null);
                    }}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingArticle}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-md shadow-orange-500/10"
                  >
                    {savingArticle ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : editingArticle ? (
                      'Save Changes'
                    ) : (
                      'Create Article'
                    )}
                  </button>
                </div>
              </div>

              {/* Live Preview Modal */}
              <ExpertGuideModal 
                isOpen={showPreviewModal} 
                onClose={() => setShowPreviewModal(false)} 
                article={previewArticle}
              />
            </form>
          ) : (
            <div className="space-y-8 text-left">
              {guideCategories.length === 0 ? (
                <div className="bg-white p-12 rounded-[32px] border border-slate-100 shadow-sm text-center">
                  <p className="text-slate-400 text-xs py-6 font-medium">No guide articles found in cache. Click Add New Article to start.</p>
                </div>
              ) : (
                guideCategories.map((cat) => (
                  <div key={cat.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <div className="flex items-center gap-2 font-sans">
                        <span className="p-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                          {cat.title}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                          {cat.articles?.length || 0} {cat.articles?.length === 1 ? 'article' : 'articles'}
                        </span>
                      </div>
                    </div>

                    {cat.articles && cat.articles.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {cat.articles.map((art) => (
                          <div key={art.id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/10 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center">
                            {art.imageUrl && (
                              <img src={art.imageUrl} alt={art.title} className="w-20 h-16 object-cover rounded-xl bg-slate-100 shrink-0 border border-slate-100" referrerPolicy="no-referrer" />
                            )}
                            <div className="min-w-0 flex-1 text-left space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                  {art.tag || 'Housing'}
                                </span>
                                <span></span>
                              </div>
                              <h5 className="font-bold text-slate-900 text-sm truncate">{art.title}</h5>
                              <p className="text-xs text-slate-500 font-medium line-clamp-1">{art.excerpt}</p>
                            </div>

                            <div className="flex items-center gap-2 self-stretch md:self-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleEditArticleClick(art, cat.id)}
                                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 shrink-0"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={deletingArticleId === art.id}
                                onClick={() => handleDeleteArticle(art.id)}
                                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-rose-100/50 transition-all flex items-center gap-1.5 shrink-0"
                              >
                                {deletingArticleId === art.id ? (
                                  '...'
                                ) : (
                                  <>
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic text-left py-2">No articles in this category.</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 top-[60px] bottom-[80px] md:inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ y: 100, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100, scale: 0.9 }}
              className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-rose-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Delete Confirmation</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Are you sure you want to delete this professional? This action is irreversible and the profile will be archived.
                  </p>
                </div>
                <div className="flex flex-col w-full gap-3 pt-4">
                  <button
                    onClick={() => handleDeletePro()}
                    disabled={isSubmitting}
                    className="w-full h-14 bg-rose-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, delete permanently"}
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="w-full h-14 bg-slate-100 text-slate-600 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileSetupView({ currentUser, onComplete }: { currentUser: any, onComplete: (profile: Profile) => void }) {
  const [fullName, setFullName] = useState(currentUser?.user_metadata?.full_name || '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser?.user_metadata?.avatar_url || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB');
        return;
      }
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let avatarUrl = '';
      if (avatar) {
        avatarUrl = await authService.uploadAvatar(currentUser.id, avatar);
      }

      const profile = await authService.upsertProfile({
        id: currentUser.id,
        email: currentUser.email,
        full_name: fullName.trim(),
        avatar_url: avatarUrl || avatarPreview || undefined,
      });

      onComplete(profile);
    } catch (err: any) {
      console.error('Error setting up profile:', err);
      setError(err.message || 'Failed to complete profile setup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[110] flex flex-col overflow-y-auto no-scrollbar">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-brand-blue/5 rounded-full blur-3xl" />
        <div className="absolute top-[20%] -left-[5%] w-[30%] h-[30%] bg-brand-yellow/5 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center p-6 min-h-screen">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <Logo />
            <h2 className="text-2xl font-semibold text-brand-navy tracking-tight mt-6">Complete Your Profile</h2>
            <p className="text-slate-400 text-sm font-medium">Almost there! Tell us a bit more about yourself.</p>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative z-10">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold flex items-center gap-3 mb-6">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group cursor-pointer"
                >
                  <div className="w-24 h-24 rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center group-hover:border-brand-blue group-hover:bg-brand-blue/5 transition-all">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-300 group-hover:text-brand-blue transition-colors" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-blue text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/20 group-hover:scale-110 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Profile Photo</span>
              </div>

              {/* Full Name Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 px-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 group-focus-within:bg-brand-blue/5 transition-colors">
                    <User className={cn(
                      "w-5 h-5 transition-colors",
                      fullName ? "text-brand-blue" : "text-slate-300"
                    )} />
                  </div>
                  <input 
                    required
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-slate-300 text-sm"
                  />
                </div>
              </div>

              <button 
                disabled={isLoading}
                type="submit"
                className="w-full h-14 bg-brand-blue text-white rounded-2xl font-semibold text-sm uppercase tracking-widest shadow-xl shadow-brand-blue/20 hover:shadow-2xl hover:shadow-brand-blue/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginView({ onBack, onLoginSuccess, onSetUser, currentUser }: { onBack: () => void, onLoginSuccess: () => void, onSetUser: (user: any) => void, currentUser?: any }) {
  useEffect(() => {
    if (currentUser) {
      onLoginSuccess();
    }
  }, [currentUser, onLoginSuccess]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [isNewUser, setIsNewUser] = useState(false);
  const [showSignupToggle, setShowSignupToggle] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStep('password');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (isNewUser) {
        const { user } = await authService.signUp(email, password);
        if (user) {
          onSetUser(user);
          // Redirection will be handled by loadProfile which is triggered by currentUser change in App.tsx
          onLoginSuccess();
        } else {
          setMessage({ type: 'success', text: 'Account created! Please check your email to confirm.' });
        }
      } else {
        try {
          const { user } = await authService.signIn(email, password);
          if (user) {
            onSetUser(user);
            onLoginSuccess();
          }
        } catch (error: any) {
          if (error.message?.toLowerCase().includes('invalid login credentials')) {
            setShowSignupToggle(true);
            throw new Error('Invalid email or password. If you don\'t have an account yet, please click "Sign up" below.');
          }
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setMessage({ type: 'error', text: error.message || 'Authentication failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      await authService.signInWithGoogle();
    } catch (error: any) {
      console.error('Google auth error:', error);
      setMessage({ type: 'error', text: error.message || 'Google Authentication failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-full bg-white relative">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-brand-blue/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-[20%] -left-[5%] w-[30%] h-[30%] bg-brand-yellow/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-5s' }} />
        <div className="absolute bottom-[10%] right-[5%] w-[25%] h-[25%] bg-brand-blue/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-10s' }} />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center pt-24 px-6 pb-8 md:pt-6 min-h-screen">
        {/* Back Button to Landing Page */}
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 md:top-8 md:left-8 text-slate-400 hover:text-slate-700 transition-all active:scale-95 group flex items-center gap-2 z-25 cursor-pointer"
          title="Back to home"
          type="button"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-xs font-bold uppercase tracking-wider">Back</span>
        </button>

        <div className="w-full max-w-sm space-y-10">
          {/* Logo Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <Logo className="scale-110" />
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full bg-white p-8 md:p-10 rounded-[40px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative z-10"
          >
            <div className="text-center space-y-2 mb-10">
              <h2 className="text-3xl font-bold text-brand-navy tracking-tight">
                {isNewUser ? "Join Unlocked" : "Sign In"}
              </h2>
            </div>

            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 mb-8",
                  message.type === 'success' 
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                    : "bg-rose-50 text-rose-600 border border-rose-100"
                )}
              >
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                {message.text}
              </motion.div>
            )}

            <form onSubmit={step === 'email' ? handleContinue : handleAuth} className="space-y-6">
              {step === 'email' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 px-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 group-focus-within:bg-brand-blue/5 transition-colors">
                      <Mail className={cn(
                        "w-5 h-5 transition-colors",
                        email ? "text-brand-blue" : "text-slate-300"
                      )} />
                    </div>
                    <input 
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-slate-300 placeholder:font-medium text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Password</label>
                    <button 
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue hover:underline"
                    >
                      Change email
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 group-focus-within:bg-brand-blue/5 transition-colors">
                      <Lock className={cn(
                        "w-5 h-5 transition-colors",
                        password ? "text-brand-blue" : "text-slate-300"
                      )} />
                    </div>
                    <input 
                      required
                      autoFocus
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-14 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-slate-300 placeholder:font-medium text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer appearance-none w-5 h-5 border border-slate-200 rounded-[6px] bg-slate-50 checked:bg-brand-blue checked:border-brand-blue transition-all cursor-pointer"
                    />
                    <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[3]" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-600 transition-colors select-none">Stay logged in</span>
                </label>
              </div>

              <button 
                disabled={isLoading}
                type="submit"
                className="w-full h-14 bg-brand-blue text-white rounded-2xl font-semibold text-sm uppercase tracking-widest shadow-xl shadow-brand-blue/20 hover:shadow-2xl hover:shadow-brand-blue/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>{step === 'email' ? 'Continue' : isNewUser ? 'Sign up' : 'Sign In'} <ArrowRight className="w-4 h-4" /></>
                  )}
                </span>
              </button>

              <div className="text-center space-y-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsNewUser(!isNewUser);
                    if (message) setMessage(null);
                    // If we switch to signup, stay on email step to avoid confusion if we were at password
                    if (!isNewUser) setStep('email');
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-brand-blue transition-colors"
                >
                  {isNewUser ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <span className="relative bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-300">or continue with</span>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="w-full h-14 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700/80 hover:text-slate-900 rounded-2xl font-bold text-xs tracking-widest uppercase hover:shadow transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 overflow-hidden active:scale-[0.98]"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.68 1.48 7.58l3.9 3.03C6.31 7.55 8.94 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.46h6.44c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.51z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.38 14.45a7.16 7.16 0 0 1 0-4.9l-3.9-3.03a11.96 11.96 0 0 0 0 10.96l3.9-3.03z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.06 0-5.69-2.51-6.62-5.57l-3.9 3.03C3.37 20.32 7.35 23 12 23z"
                />
              </svg>
              <span>Google</span>
            </button>

          </motion.div>


        </div>
      </div>
    </div>
  );
}

function HomeView({ 
  onNavigate, 
  allPros, 
  events, 
  onAddPro, 
  ads, 
  onSelectAd, 
  onSelectPost, 
  scrollToTop, 
  onProUpdate, 
  userProfile, 
  currentUser, 
  unreadConversations = [], 
  blockedUsers = [], 
  usersWhoBlockedMe = [],
  highlightedProIds = [],
  highlightedEventIds = [],
  highlightedArticleIds = [],
  highlightedTestimoniesIds = [],
  allArticles = []
}: { 
  onNavigate: (view: View, params?: { eventId?: string, proId?: string, guideId?: string, searchQuery?: string, chat?: any }) => void, 
  allPros: Professional[], 
  events: Event[],
  onAddPro: () => void, 
  ads: Ad[], 
  onSelectAd: (ad: Ad) => void, 
  onSelectPost: (post: any) => void, 
  scrollToTop?: () => void,
  onProUpdate?: () => void,
  userProfile: Profile | null,
  currentUser?: any,
  unreadConversations?: string[],
  blockedUsers?: string[],
  usersWhoBlockedMe?: string[],
  highlightedProIds?: string[],
  highlightedEventIds?: string[],
  highlightedArticleIds?: string[],
  highlightedTestimoniesIds?: string[],
  allArticles?: any[]
}) {
  const feedRef = useRef<HTMLDivElement>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [homeSearchError, setHomeSearchError] = useState('');

  const [sec1Idx, setSec1Idx] = useState(0);
  const [sec2Idx, setSec2Idx] = useState(0);
  const [sec3Idx, setSec3Idx] = useState(0);
  const [sec4Idx, setSec4Idx] = useState(0);

  const [discoverTestimonies, setDiscoverTestimonies] = useState<any[]>([]);
  useEffect(() => {
    const loadTestimonies = async () => {
      try {
        const data = await proService.getAllTestimonies();
        setDiscoverTestimonies(data || []);
      } catch (err) {
        console.warn('Could not fetch testimonies in HomeView:', err);
      }
    };
    loadTestimonies();
  }, [allPros]);
  
  return (
    <div className="px-6 pt-12 pb-6 space-y-12 max-w-7xl mx-auto w-full overflow-hidden">
      {/* Welcome Section */}
      <div 
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-center md:text-left mb-12"
      >
        <div className="space-y-1 flex flex-col items-center md:items-start w-full">
          <h2 className="text-[28px] md:text-[36px] font-semibold font-display text-brand-navy flex items-center gap-3">
            <span>{currentUser ? `Hello, ${userProfile?.full_name ? userProfile.full_name.split(' ')[0] : 'Explorer'}!` : 'Hello,'}</span>
            {unreadConversations.length > 0 && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onNavigate('messages' as any)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 group active:scale-95 transition-all shadow-sm"
              >
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                  </span>
                </div>
                <span className="text-xs font-bold text-rose-600">
                  {unreadConversations.length} new
                </span>
              </motion.button>
            )}
          </h2>
          <p className="text-slate-500 text-base md:text-lg">
            <span className="text-brand-blue font-medium italic">Discover better.</span> <span className="font-bold text-slate-900 leading-none">Belong faster.</span>
          </p>
        </div>
      </div>

      {/* Community Image Section */}
      <div 
        className="w-full flex justify-center -mb-2 relative z-0 h-[80px] md:h-[135px]"
      >
        <img 
          src="/people.jpg" 
          alt="Our Community" 
          className="w-[70%] md:w-[35%] h-full object-contain block"
        />
      </div>

      {/* Hero Find Pro Section */}
      <div 
        className="relative overflow-hidden rounded-[2rem] bg-white p-8 md:p-16 text-slate-900 border border-slate-100 shadow-sm transition-all duration-300 md:hover:-translate-y-1 md:hover:shadow-lg"
      >
        {/* Subtle Background Elements */}
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center">
          <div className="space-y-6 md:space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-semibold font-display leading-[1.1] tracking-tight max-w-lg mx-auto lg:mx-0">
              Find recommended <span className="text-brand-blue italic">Pros</span> nearby.
            </h1>
            <p className="text-slate-500 text-base md:text-xl max-w-sm leading-relaxed mx-auto lg:mx-0">
              Powered by local experiences.
            </p>
            
            <div className="w-full max-w-2xl space-y-3">
              <div 
                onClick={() => onNavigate('explore')}
                className="relative flex items-center gap-2 group w-full cursor-pointer"
              >
                <div className="relative flex-1 w-full min-w-0 pointer-events-none">
                  <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
                  <input 
                    type="text"
                    readOnly
                    placeholder="Start searching"
                    className="w-full h-14 sm:h-16 pl-12 sm:pl-14 pr-4 bg-slate-50/50 rounded-2xl border border-slate-100 focus:border-brand-blue/30 focus:ring-4 focus:ring-brand-blue/5 shadow-[0_10px_30px_rgba(8,112,184,0.05)] hover:bg-white focus:bg-white outline-none transition-all text-slate-800 font-medium text-[13px] sm:text-base lg:text-lg placeholder:text-slate-400 cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex justify-center lg:justify-end relative">
            <div className="relative w-72 h-72">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue to-brand-yellow rounded-full animate-pulse opacity-10 blur-2xl" />
              <div className="relative z-10 w-full h-full rounded-full border-2 border-slate-100 p-4 backdrop-blur-sm">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-2xl">
                   <img src="/valencia.jpg" alt="Valencia City" className="w-full h-full object-cover" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-2xl font-display text-brand-navy flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-blue" />
            Discover on Unlocked
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Top Rated Pro / Testimonial */}
          {(() => {
            const highlightedPros = allPros.filter(p => highlightedProIds.includes(String(p.id)));
            const approvedTestimonies = discoverTestimonies ? discoverTestimonies.filter(t => t.status === 'approved') : [];
            const highlightedTestimonies = approvedTestimonies.filter(t => highlightedTestimoniesIds.includes(String(t.id)));

            const section1Items: { type: 'pro' | 'testimony'; data: any }[] = [];
            highlightedPros.forEach(p => {
              section1Items.push({ type: 'pro', data: p });
            });
            highlightedTestimonies.forEach(t => {
              section1Items.push({ type: 'testimony', data: t });
            });

            if (section1Items.length === 0) return null;

            const activeIndex = sec1Idx % section1Items.length;
            const currentItem = section1Items[activeIndex];

            // Determine details for rendering
            let proToShow = null;
            let ratingToShow = 5;
            let commentToShow = "Excellent communication in English, incredibly punctual, and provided perfect local help. Absolutely recommended!";
            let authorToShow = "Community Member";

            if (currentItem.type === 'testimony') {
              proToShow = allPros && allPros.find(p => String(p.id) === String(currentItem.data.pro_id));
              ratingToShow = currentItem.data.rating || 5;
              commentToShow = currentItem.data.comment || "";
              authorToShow = currentItem.data.author || "Anonymous";
            } else {
              proToShow = currentItem.data;
              const proTestimonies = approvedTestimonies.filter(t => String(t.pro_id) === String(proToShow.id));
              if (proTestimonies && proTestimonies.length > 0) {
                const latest = proTestimonies[0];
                ratingToShow = latest.rating || 5;
                commentToShow = latest.comment || "";
                authorToShow = latest.author || "Anonymous";
              } else {
                ratingToShow = proToShow.rating || 5;
                commentToShow = "Highly recommended professional with excellent track record on Unlocked!";
                authorToShow = "Community Member";
              }
            }

            if (!proToShow) return null;

            return (
              <div 
                className="flex flex-col justify-between p-6 rounded-3xl bg-white border border-slate-100 hover:border-amber-500/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden h-full"
                id="discover-card-pro"
                onClick={() => onNavigate('explore', { proId: proToShow.id })}
              >
                <div className="relative flex-1">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="h-full flex flex-col items-center justify-center text-center"
                    >
                      <div className="flex items-center justify-between gap-2 mb-4">
                        {currentItem.type !== 'testimony' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-widest shrink-0">
                            <Star className="w-3 h-3 fill-current" /> Top Provider
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col h-full">
                        {currentItem.type === 'testimony' ? (
                          <div className="space-y-4 flex flex-col h-full items-center justify-center">
                            <div className="flex items-center gap-2.5">
                              <img 
                                src={proToShow.image || "/people.jpg"} 
                                alt={proToShow.name} 
                                className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-50"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors max-w-[150px] truncate leading-tight uppercase tracking-tight text-[11px]">{proToShow.name}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{proToShow.category}</p>
                              </div>
                            </div>

                            <div className="relative bg-amber-50/50 p-5 rounded-3xl border border-brand-yellow/20">
                              <p className="text-[12px] text-slate-700 leading-relaxed font-medium italic">
                                "{commentToShow}"
                              </p>
                              <div className="mt-3 flex items-center justify-end gap-2">
                                <div className="h-[1px] w-4 bg-amber-200" />
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-tight">
                                  {formatName(authorToShow)}
                                </span>
                              </div>
                              {/* Decorative bubble tail */}
                              <div className="absolute -bottom-2 left-6 w-4 h-4 bg-amber-50/50 border-r border-b border-brand-yellow/20 rotate-45" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-4 flex-1 items-center justify-center h-full">
                            <div className="flex items-center gap-4">
                              <img 
                                src={proToShow.image || "/people.jpg"} 
                                alt={proToShow.name} 
                                className="w-16 h-16 rounded-2xl object-cover shadow-sm ring-4 ring-slate-50 group-hover:scale-105 transition-all duration-300"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="space-y-1 text-center">
                              <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors text-base leading-tight">{proToShow.name}</h4>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{proToShow.category}</p>
                              <div className="flex items-center gap-1 pt-1 justify-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-3.5 h-3.5 ${i < Math.floor(ratingToShow) ? 'text-brand-yellow fill-current' : 'text-slate-200'}`} 
                                  />
                                ))}
                                <span className="text-[10px] text-slate-400 font-extrabold ml-1">({ratingToShow})</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>




                {section1Items.length >= 2 && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSec1Idx((activeIndex - 1 + section1Items.length) % section1Items.length);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/60 backdrop-blur shadow text-slate-400 hover:text-amber-600 hover:border-amber-100 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSec1Idx((activeIndex + 1) % section1Items.length);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/60 backdrop-blur shadow text-slate-400 hover:text-amber-600 hover:border-amber-100 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            );
          })()}

          {/* Card 2: Event Highlight */}
          {(() => {
            const section2Items = events.filter(e => highlightedEventIds.includes(String(e.id)));
            if (section2Items.length === 0) return null;

            const activeIndex = sec2Idx % section2Items.length;
            const featuredEvent = section2Items[activeIndex];
            
            return (
              <div 
                className="flex flex-col justify-between p-6 rounded-3xl bg-white border border-slate-100 hover:border-brand-blue/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden h-full"
                id="discover-card-event"
                onClick={() => onNavigate('events', { eventId: featuredEvent.id })}
              >
                <div className="relative flex-1">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-brand-blue/5 text-brand-blue border border-brand-blue/10 uppercase tracking-widest shrink-0">
                          <Calendar className="w-3 h-3" /> Event Highlights
                        </span>
                      </div>

                      <div className="space-y-3 text-left">
                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 relative">
                          <img 
                            src={featuredEvent.image || "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80"} 
                            alt={featuredEvent.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-brand-blue transition-colors text-[13px] leading-snug">{featuredEvent.title}</h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 font-bold">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{featuredEvent.date || featuredEvent.start_date}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>




                {section2Items.length >= 2 && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSec2Idx((activeIndex - 1 + section2Items.length) % section2Items.length);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/60 backdrop-blur shadow text-slate-400 hover:text-brand-blue hover:border-brand-blue/10 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSec2Idx((activeIndex + 1) % section2Items.length);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/60 backdrop-blur shadow text-slate-400 hover:text-brand-blue hover:border-brand-blue/10 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            );
          })()}

          {/* Card 3: Guide Highlight */}
          {(() => {
            const section3Items = allArticles.filter(art => highlightedArticleIds.includes(String(art.id)));
            if (section3Items.length === 0) return null;

            const activeIndex = sec3Idx % section3Items.length;
            const featuredArticle = section3Items[activeIndex];

            return (
              <div 
                className="flex flex-col justify-between p-6 rounded-3xl bg-white border border-slate-100 hover:border-[#00C2A8]/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden h-full"
                id="discover-card-guide"
                onClick={() => onNavigate('guides', { guideId: featuredArticle.id })}
              >
                <div className="relative flex-1">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-[#00C2A8]/10 text-[#00C2A8] border border-[#00C2A8]/20 uppercase tracking-widest shrink-0">
                          <BookOpen className="w-3 h-3" /> Tips of the week
                        </span>
                      </div>
                      
                      <div className="space-y-3 text-left">
                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 relative">
                          <img 
                            src={featuredArticle.imageUrl || "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=400&q=80"} 
                            alt={featuredArticle.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-[#00C2A8] transition-colors text-[13px] leading-snug line-clamp-1">{featuredArticle.title}</h4>
                          <p className="text-[10px] text-slate-500 leading-snug font-bold line-clamp-2 mt-1">{featuredArticle.excerpt}</p>
                          {featuredArticle.author?.name && (
                            <div className="flex items-center gap-1.5 text-[10px] text-[#00C2A8] mt-2 font-bold uppercase tracking-wider">
                              <User className="w-3.5 h-3.5 text-[#00C2A8]/80 shrink-0" />
                              <span className="truncate">By {featuredArticle.author.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>




                {section3Items.length >= 2 && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSec3Idx((activeIndex - 1 + section3Items.length) % section3Items.length);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/60 backdrop-blur shadow text-slate-400 hover:text-[#00C2A8] hover:border-[#00C2A8]/20 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSec3Idx((activeIndex + 1) % section3Items.length);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/60 backdrop-blur shadow text-slate-400 hover:text-[#00C2A8] hover:border-[#00C2A8]/20 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            );
          })()}

          {/* Card 4: How to Add a Pro */}
          <div 
            onClick={onAddPro}
            className="flex flex-col justify-between p-6 rounded-3xl bg-white border border-slate-100 hover:border-brand-yellow/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            id="discover-card-addpro"
          >
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-brand-yellow text-slate-900 uppercase tracking-widest shadow-sm shadow-brand-yellow/10 select-none">
                <Plus className="w-3.5 h-3.5 text-slate-900" style={{ strokeWidth: 3 }} /> How to add a pro
              </span>
              
              <div className="space-y-3.5 text-xs text-slate-500">
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-brand-yellow/20 text-amber-700 flex items-center justify-center font-black text-[10px] mt-0.5 select-none shrink-0 border border-brand-yellow/30">1</div>
                  <div className="leading-tight flex-1" style={{ textAlign: 'left' }}>
                    <p><strong className="text-slate-700">Recommend</strong>: Click the button at the top of your screen. A pro can only be added <strong className="text-slate-800">on recommendation of a member</strong>.</p>
                    <div className="mt-2 flex items-center gap-3 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100 group-hover:bg-amber-50 group-hover:border-brand-yellow/20 transition-all">
                      <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                        {/* Simplified visual of the header button */}
                        <div className="absolute inset-1.5 bg-brand-yellow rounded-full shadow-sm flex items-center justify-center z-10">
                          <Plus className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="absolute inset-0 w-full h-full rotate-12">
                          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                            <defs>
                              <path
                                id="miniCirclePath"
                                d="M 50, 50 m -43, 0 a 43,43 0 1,1 86,0 a 43,43 0 1,1 -86,0"
                              />
                            </defs>
                            <text className="text-[20px] font-black fill-brand-yellow uppercase">
                              <textPath xlinkHref="#miniCirclePath">Recommend a Pro</textPath>
                            </text>
                          </svg>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold text-slate-400 group-hover:text-amber-600 transition-colors uppercase tracking-widest leading-none">Find this at the header</p>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight">Click to start recommendation</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-brand-yellow/20 text-amber-700 flex items-center justify-center font-black text-[10px] mt-0.5 select-none shrink-0 border border-brand-yellow/30">2</div>
                  <p className="leading-tight" style={{ textAlign: 'left' }}>
                    <strong className="text-slate-700">Validation</strong>: Our team validates directly with the pro to approve their profile on Unlocked.
                  </p>
                </div>
                
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-brand-yellow/20 text-amber-700 flex items-center justify-center font-black text-[10px] mt-0.5 select-none shrink-0 border border-brand-yellow/30">3</div>
                  <p className="leading-tight" style={{ textAlign: 'left' }}><strong className="text-slate-700">Go Live</strong>: Profile instantly joins the live platform!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpertGuideModal({ isOpen, onClose, article }: { isOpen: boolean, onClose: () => void, article: any }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset scroll state when article changes or when closed/opened
  useEffect(() => {
    if (isOpen) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, article]);

  if (!isOpen || !article) return null;

  const imageSrc = article.imageUrl || "/valencia.jpg";
  const categoryName = article.tag || article.categoryTitle || "Valencia Guide";
  const authorName = article.author?.name;
  const businessName = article.author?.businessName || article.businessName;

  return (
    <AnimatePresence>
      <div className="fixed inset-x-0 top-[60px] bottom-[80px] md:inset-0 z-[100] flex items-center justify-center p-3.5 sm:p-6 lg:p-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-navy/60 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-4xl h-full md:h-auto md:max-h-[85vh] rounded-[24px] md:rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Image Section - Compact, Stable, and High Contrast */}
          <div className="relative h-[200px] flex-shrink-0 overflow-hidden bg-brand-navy group">
            <img 
              src={imageSrc} 
              alt={article.title} 
              className="w-full h-full object-cover absolute inset-0" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all shadow-lg active:scale-95 z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute bottom-6 left-6 right-6 pointer-events-none md:bottom-8 md:left-8 md:right-8">
              <div className="flex items-center gap-2 mb-2">
                {categoryName && (
                  <span className="px-2.5 py-0.5 bg-brand-yellow text-slate-955 text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-brand-yellow/20">
                    {categoryName}
                  </span>
                )}
              </div>
              <h2 className="text-xl md:text-3xl font-black text-white font-display leading-tight drop-shadow-2xl">
                {article.title}
              </h2>
            </div>
          </div>

          {/* Scrollable Content */}
          <div 
            ref={scrollContainerRef}
            className="flex-grow overflow-y-auto p-8 md:p-12 scroll-smooth"
          >
            <div className="max-w-2xl mx-auto space-y-8">
              {/* Partner Intro / Author details */}
              {(authorName || businessName) && (
                <div className="flex items-center gap-4 py-6 border-b border-slate-100 mb-6">
                  <div className="w-12 h-12 rounded-full border-2 border-brand-yellow/20 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                    {article.author?.avatarUrl ? (
                      <img src={article.author.avatarUrl} alt={authorName || businessName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div>
                    {authorName && (
                      <p className="text-sm font-extrabold text-slate-900">
                        {authorName}
                      </p>
                    )}
                    {businessName && (
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">{businessName}</p>
                    )}
                    {article.author?.role && (
                      <p className="text-xs text-slate-500 font-bold mt-0.5">{article.author.role}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Guide Content - Simple and highly readable text */}
              <div className="space-y-6 text-slate-650 leading-relaxed text-base md:text-[17px]">
                {article.content ? (
                  article.content.split('\n\n').map((paragraph: string, idx: number) => (
                    <p key={idx} className="whitespace-pre-line text-slate-600">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No content available for this guide.</p>
                )}
              </div>

              {/* Call to Action Section - Optionnel (rendered only if author has contact info or website) */}
              {(article.author?.email || article.author?.phone || article.author?.website) && (
                <div className="mt-12 p-8 bg-slate-900 rounded-[32px] text-white relative overflow-hidden group shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/10 rounded-full blur-3xl group-hover:bg-brand-yellow/20 transition-all duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-5 h-5 text-brand-yellow" />
                      <span className="text-xs font-black uppercase tracking-widest text-brand-yellow">Verified Expert Advisor</span>
                    </div>
                    <h4 className="text-xl font-bold mb-4 font-display">Need expert assistance?</h4>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                      Connect directly with {authorName || businessName || "our expert advisor"} for personalized assistance.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {article.author?.phone && (
                        <a href={`tel:${article.author.phone}`} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group/call">
                          <div className="w-10 h-10 rounded-xl bg-brand-yellow/20 flex items-center justify-center text-brand-yellow group-hover/call:scale-110 transition-transform">
                            <Phone className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Call Advisor</p>
                            <p className="text-sm font-bold">{article.author.phone}</p>
                          </div>
                        </a>
                      )}
                      {article.author?.email && (
                        <a href={`mailto:${article.author.email}`} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group/mail">
                          <div className="w-10 h-10 rounded-xl bg-brand-blue/20 flex items-center justify-center text-brand-blue group-hover/mail:scale-110 transition-transform">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Email Advisor</p>
                            <p className="text-xs font-bold truncate max-w-[140px]">{article.author.email}</p>
                          </div>
                        </a>
                      )}
                    </div>

                    {article.author?.website && (
                      <a 
                        href={article.author.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 block w-full text-center py-4 bg-brand-yellow text-slate-900 font-bold text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-yellow/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Visit Website</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ExpertGuidesPartners({ onReadFullGuide }: { onReadFullGuide: () => void }) {
  const featuredGuide = {
    title: "How to choose the best neighborhood in Valencia",
    partner: "Engel & Völkers Valencia",
    author: "Marina Sanchis",
    avatar: null,
    excerpt: "From the bohemian streets of Ruzafa to the family-friendly avenues of Algiros, every district tells a different story. Discover which one matches your lifestyle and investment goals.",
    brandImage: null,
    contact: {
      phone: "+34 963 51 02 00",
      email: "valencia@engelvoelkers.com"
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-4">
      <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all group flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row flex-1">
          {/* Visual Side */}
          <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden bg-brand-blue/5 flex items-center justify-center">
            {featuredGuide.brandImage ? (
              <img src={featuredGuide.brandImage} alt="Valencia neighborhoods" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <MapPin className="w-12 h-12 text-brand-blue/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r" />
            <div className="absolute top-4 left-4 bg-brand-yellow text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-lg">
              Featured Expert
            </div>
          </div>

          {/* Content Side */}
          <div className="md:w-2/3 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand-yellow/20 flex items-center justify-center bg-slate-50">
                  {featuredGuide.avatar ? (
                    <img src={featuredGuide.avatar} alt={featuredGuide.author} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm leading-none">{featuredGuide.partner}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">By {featuredGuide.author}</p>
                </div>
              </div>
              
              <h2 className="text-xl md:text-2xl font-black font-display text-brand-navy mb-3 group-hover:text-brand-blue transition-colors leading-tight">
                {featuredGuide.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 md:line-clamp-none">
                {featuredGuide.excerpt}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Contact Expert</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-brand-yellow" />
                    {featuredGuide.contact.phone}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-brand-yellow" />
                    {featuredGuide.contact.email}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={onReadFullGuide}
                  className="bg-brand-navy text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue transition-all shadow-lg active:scale-95"
                >
                  Read Full Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HighlightCarousel({ onNavigate, allPros, events }: { onNavigate: (view: View, params?: { eventId?: string, proId?: string, guideId?: string, chat?: any }) => void, allPros: Professional[], events: Event[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featuredPro = allPros.length > 0 ? allPros[0] : null;
  const featuredEvent = events.length > 0 ? events[0] : null;

  const slidesRaw = [
    featuredEvent ? {
      type: 'event',
      title: featuredEvent.title,
      location: featuredEvent.location,
      image: featuredEvent.image,
      tag: 'Event of the week',
      date: {
        day: featuredEvent.start_date ? featuredEvent.start_date.split('-')[1] : featuredEvent.date.split(' ')[0], // Simple heuristic
        num: featuredEvent.start_date ? featuredEvent.start_date.split('-')[2] : featuredEvent.date.split(' ')[1]
      },
      action: () => onNavigate('events', { eventId: featuredEvent.id })
    } : null,
    featuredPro ? {
      type: 'pro',
      pro: featuredPro,
      action: () => onNavigate('explore', { proId: featuredPro.id })
    } : null
  ];

  const slides = slidesRaw.filter(Boolean) as any[];
  const totalSlides = slides.length;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);

  if (totalSlides === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-[32px] no-swipe flex-1 flex flex-col">
      <motion.div 
        className="flex h-full"
        animate={{ x: `-${currentIndex * 100}%` }}
        transition={{ type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.3 }}
      >
        {slides.map((slide, idx) => (
          <div key={idx} className="min-w-full px-1 h-full">
            {slide.type === 'event' && (
              <div 
                className="card bg-white overflow-hidden cursor-pointer h-full border border-slate-100/50 shadow-sm flex flex-col"
                onClick={slide.action}
              >
                <div className="h-32 overflow-hidden relative">
                  <img src={slide.image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-lg text-center shadow-sm">
                    <p className="text-[8px] font-bold text-brand-blue uppercase">{slide.date?.day}</p>
                    <p className="text-sm font-bold leading-none">{slide.date?.num}</p>
                  </div>
                  <div className="absolute top-3 right-3 bg-brand-blue text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {slide.tag}
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="font-bold text-sm text-slate-900">{slide.title}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {slide.location}
                  </p>
                </div>
              </div>
            )}

            {slide.type === 'pro' && slide.pro && (
              <div 
                className="card bg-gradient-to-br from-brand-blue/5 to-transparent overflow-hidden cursor-pointer h-full border border-brand-blue/10 shadow-sm relative flex flex-col justify-center items-center text-center p-5"
                onClick={slide.action}
              >
                <div className="absolute top-3 right-3 bg-brand-blue text-white p-1.5 rounded-full shadow-lg">
                  <Trophy className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-2">Pro of the week</p>
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-xl mb-3 flex items-center justify-center bg-white/50">
                  {slide.pro.image ? (
                    <img src={slide.pro.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-brand-blue/30" />
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-slate-900">{slide.pro.name}</h4>
                  <p className="text-xs text-brand-blue font-medium">{slide.pro.category}</p>
                </div>
              </div>
            )}

            {slide.type === 'tip' && (
              <div 
                className="card bg-white overflow-hidden cursor-pointer h-full border border-slate-100/50 shadow-sm flex flex-col"
                onClick={slide.action}
              >
                <div className="h-24 bg-brand-blue/10 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-blue/20 rounded-full blur-2xl" />
                  <Lightbulb className="w-10 h-10 text-brand-blue relative z-10" />
                  <div className="absolute top-3 right-3 bg-brand-blue text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {slide.tag}
                  </div>
                </div>
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">{slide.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{slide.excerpt}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Guides</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg text-slate-600 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg text-slate-600 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "h-1 transition-all duration-300 rounded-full",
              currentIndex === i ? "w-4 bg-brand-blue" : "w-1 bg-slate-300"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function ProMap({ pros, onSelectPro, center }: { pros: Professional[], onSelectPro: (pro: Professional) => void, center: { lat: number, lng: number } }) {
  const hasValidKey = Boolean(GOOGLE_MAPS_KEY) && GOOGLE_MAPS_KEY.length > 10;

  if (!hasValidKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 p-8 text-center rounded-[32px] border border-slate-100">
        <div className="max-w-md space-y-6">
          <div className="w-12 h-12 bg-brand-blue/10 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-brand-blue" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-brand-navy">Interactive Map Locked</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enable the professional directory map by adding your <strong>Google Maps Platform API Key</strong> as a secret.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-left space-y-2 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Setup</p>
            <ol className="text-[10px] text-slate-600 space-y-1.5 list-decimal pl-4">
              <li>Open <strong>Settings</strong> → <strong>Secrets</strong></li>
              <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <APIProvider apiKey={GOOGLE_MAPS_KEY}>
        <Map
          defaultCenter={{ lat: 39.4699, lng: -0.3763 }}
          defaultZoom={13}
          mapId="e8677c77d4677732"
          className="w-full h-full"
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          scrollwheel={true}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          {pros.map((pro, index) => pro.coordinates && (
            <AdvancedMarker
              key={pro.id}
              position={pro.coordinates}
              onClick={() => {
                console.log('Marker clicked:', pro.name);
                onSelectPro(pro);
              }}
              title={pro.name}
            >
              <div 
                className="relative group/pin cursor-pointer"
                onClick={(e) => {
                  // Fallback for mobile if AdvancedMarker onClick is flaky
                  e.stopPropagation();
                  onSelectPro(pro);
                }}
              >
                <Pin 
                  background={'#0038FF'} 
                  borderColor={'#fff'} 
                  glyphColor={'#fff'}
                  glyph={(index + 1).toString()}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white rounded-lg shadow-xl border border-slate-100 whitespace-nowrap opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none z-50">
                  <p className="text-[10px] font-bold text-brand-navy">{pro.name}</p>
                  <p className="text-[8px] text-slate-400 font-medium whitespace-nowrap">Touch to see details</p>
                </div>
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}

function ExploreView({ allPros, onNavigate, initialProId, initialSearch, onModalClose, scrollToTop, onProUpdate, currentUser, userProfile, blockedUsers = [], usersWhoBlockedMe = [], isActive = false }: { 
  allPros: Professional[], 
  onNavigate: (view: View, params?: { eventId?: string, proId?: string, guideId?: string, searchQuery?: string, chat?: any }) => void, 
  initialProId?: string | null, 
  initialSearch?: string | null,
  onModalClose?: () => void, 
  scrollToTop?: () => void,
  onProUpdate?: () => void,
  currentUser?: any,
  userProfile?: any,
  blockedUsers?: string[],
  usersWhoBlockedMe?: string[],
  isActive?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState(initialSearch || '');
  const [deferredSearch, setDeferredSearch] = useState(initialSearch || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    if (isActive) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isActive]);

  // AI-powered Search states
  const [aiResults, setAiResults] = useState<{ [key: string]: { score: number; reason: string } } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'standard' | 'ai'>('standard');

  useEffect(() => {
    // If the input gets cleared, instantly reset all AI search filters
    if (search.trim() === '') {
      setDeferredSearch('');
      setAiResults(null);
      setAiError(null);
      setAiQuery('');
    }
  }, [search]);

  useEffect(() => {
   if (searchMode === 'standard') {
     setAiResults(null);
     setAiError(null);
   }
  }, [searchMode]);

  // Hook up handleSearchSubmit to perform an intelligent AI matching process
  const handleSearchSubmit = async () => {
    const trimmed = search.trim();
    if (!trimmed) {
      setAiResults(null);
      setDeferredSearch('');
      setAiQuery('');
      setAiError(null);
      return;
    }

    setIsInputFocused(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setIsSearching(true);
    setAiLoading(true);
    setAiError(null);
    setAiQuery(trimmed);
    setDeferredSearch(trimmed);

    try {
      let data = null;
      let serverFailed = false;

      try {
        const response = await fetch("/api/ai-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, professionals: allPros }),
        });
        
        if (response.status === 404 || response.status === 405) {
          serverFailed = true;
        } else if (!response.ok) {
          throw new Error("Sorry, an error occurred during AI search.");
        } else {
          data = await response.json();
        }
      } catch (fetchErr) {
        console.warn("[Search] Server search failed or is unavailable, attempting client fallback:", fetchErr);
        serverFailed = true;
      }

      if (serverFailed) {
        // Fallback to client-side search using the client-side API key
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';
        if (!apiKey) {
          throw new Error("The server AI search service is busy or unavailable (Error 404). To use client-side AI search (e.g., on Vercel), please configure the VITE_GEMINI_API_KEY environment variable in your Vercel project settings.");
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const proListBrief = allPros.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          company_name: p.company_name || "",
          category: p.category || p.profession || "",
          bio: p.bio || p.description || "",
          languages: p.languages || [],
          rating: p.rating || 0,
          location: p.location || ""
        }));

        const sysInstruction = `You are an expert matching AI assistant for "Unlocked" - a premier community-curated directory of recommended local professionals.
Your purpose is to thoroughly examine the user's natural language request (written in French, English, or Spanish) and return the most relevant matching professionals.

Review the list of professionals provided and rank them based on:
1. Skills, profession, and category align, or partial matches.
2. Direct/indirect/synonymous matches (e.g., if they ask for "relooking" or "decorateur d'interieur", match it against interior designers, painters, etc.).
3. Language spoken (if they request "qui parle anglais" or "bilingual", match it against pros that speak English).
4. Description context (matching specific skills mentioned in their bio, e.g. "compta" matching a tax advisor).

Assign a match score from 0 to 100 for each. Include any professional that has a match score above 0. If a professional doesn't match at all, you may omit them or output score as 0.
Under "reasonUrlExcerpt", write a single, user-friendly matching explanation in English (1 concise sentence maximum) suitable to be displayed inside a badge on their profile.
Example reasonUrlExcerpt: "Recommended for your painting project thanks to 12 years of experience" or "Bilingual tax advisor ideal for your autonomo setup".`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `User Query: "${trimmed}"

Professionals:
${JSON.stringify(proListBrief, null, 2)}`,
          config: {
            systemInstruction: sysInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "The professional's ID as a string" },
                  score: { type: Type.INTEGER, description: "The relevancy match score from 0 to 100" },
                  reasonUrlExcerpt: { type: Type.STRING, description: "Highly engaging, concise explanation in English explaining why this pro is matched." }
                },
                required: ["id", "score", "reasonUrlExcerpt"]
              }
            }
          }
        });

        const parsedContent = JSON.parse(response.text || "[]");
        data = { results: parsedContent };
      }

      if (!data) {
        throw new Error("Could not retrieve search results.");
      }
      
      const resultsDict: { [key: string]: { score: number; reason: string } } = {};
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((item: any) => {
          resultsDict[String(item.id)] = {
            score: item.score,
            reason: item.reasonUrlExcerpt
          };
        });
      }
      setAiResults(resultsDict);
    } catch (err: any) {
      console.error("[Search] AI matching error:", err);
      setAiError(err.message || "Connection error with the AI service.");
      // Fallback: clear AI results
      setAiResults(null);
    } finally {
      setAiLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // Auto focus on mount - faster
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Secure auto-scrolling to results once Jane has finished sorting and rendering the list
  useEffect(() => {
    if (aiResults && !aiLoading) {
      const timer = setTimeout(() => {
        const resultsEl = document.getElementById("pro-cards-list");
        if (resultsEl) {
          resultsEl.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [aiResults, aiLoading]);

  useEffect(() => {
    if (initialSearch !== null && initialSearch !== undefined) {
      setSearch(initialSearch);
      setDeferredSearch(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    scrollToTop?.();
  }, [selectedCategory]);

  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);

  // Sync selectedPro with freshly fetched allPros to show updated ratings/counts in modal
  useEffect(() => {
    if (selectedPro) {
      const updated = allPros.find(p => p.id === selectedPro.id);
      if (updated) {
        setSelectedPro(updated);
      }
    }
  }, [allPros]);

  const allProfessions = useMemo(() => {
    return Array.from(new Set(allPros.map(p => p.category))).sort();
  }, [allPros]);

  const scrollToPro = (pro: Professional) => {
    const element = document.getElementById(`pro-card-${pro.id}`);
    if (element) {
      // Use a more robust scrolling method for mobile compatibility
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Also try scrollIntoView as a secondary measure if supported
      try {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) {
        console.warn('scrollIntoView failed, relying on window.scrollTo');
      }

      // Add a temporary highlight effect
      element.classList.add('ring-4', 'ring-brand-blue/40', 'scale-[1.02]', 'z-20');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-brand-blue/40', 'scale-[1.02]', 'z-20');
      }, 2000);
    }
  };

  useEffect(() => {
    if (initialProId) {
      const pro = allPros.find(p => p.id === initialProId);
      if (pro) {
        setSelectedPro(pro);
      }
    }
  }, [initialProId, allPros]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [maxDistance, setMaxDistance] = useState<number | 'All'>('All');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedPro]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Default to Valencia center if denied
          setUserLocation({ lat: 39.4699, lng: -0.3763 });
        }
      );
    } else {
      setUserLocation({ lat: 39.4699, lng: -0.3763 });
    }
  }, []);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const checkMatches = (text: string) => {
    if (!text.trim()) return true;
    return allPros.some(pro => {
      const matchesCategory = selectedCategory === 'All' || pro.category === selectedCategory;
      const matchesLanguage = selectedLanguage === 'All' || pro.languages.includes(selectedLanguage);
      const matchesRating = pro.rating >= minRating;
      
      const searchLower = text.toLowerCase().trim();
      let matchesSearch = pro.name.toLowerCase().includes(searchLower) || 
                          pro.category.toLowerCase().includes(searchLower) ||
                          (pro.company_name && pro.company_name.toLowerCase().includes(searchLower)) ||
                          pro.bio.toLowerCase().includes(searchLower);
                          
      let matchesDistance = true;
      if (maxDistance !== 'All' && userLocation && pro.coordinates) {
        const dist = getDistance(userLocation.lat, userLocation.lng, pro.coordinates.lat, pro.coordinates.lng);
        matchesDistance = dist <= (maxDistance as number);
      }
      return matchesCategory && matchesLanguage && matchesSearch && matchesDistance && matchesRating;
    });
  };

  const languages = ['All', 'Spanish', 'English', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Arabic', 'Chinese', 'Japanese'];
  const distances = ['All', 1, 2, 5, 10, 25, 50, 100];

  const hasActiveFilter = deferredSearch.trim() !== '' || selectedCategory !== 'All' || selectedLanguage !== 'All' || maxDistance !== 'All' || minRating > 0 || aiResults !== null;

  const filteredPros = hasActiveFilter 
    ? allPros.filter(pro => {
        const matchesCategory = selectedCategory === 'All' || pro.category === selectedCategory;
        const matchesLanguage = selectedLanguage === 'All' || pro.languages.includes(selectedLanguage);
        const matchesRating = pro.rating >= minRating;
        
        let matchesSearch = true;
        if (deferredSearch.trim() !== '') {
          if (aiResults !== null) {
            const proIdStr = String(pro.id);
            const matchInfo = aiResults[proIdStr];
            matchesSearch = !!matchInfo && matchInfo.score > 0;
          } else {
            matchesSearch = pro.name.toLowerCase().includes(deferredSearch.toLowerCase()) || 
                            pro.category.toLowerCase().includes(deferredSearch.toLowerCase()) ||
                            pro.bio.toLowerCase().includes(deferredSearch.toLowerCase());
          }
        }
        
        let matchesDistance = true;
        if (maxDistance !== 'All' && userLocation && pro.coordinates) {
          const dist = getDistance(userLocation.lat, userLocation.lng, pro.coordinates.lat, pro.coordinates.lng);
          matchesDistance = dist <= (maxDistance as number);
        }

        return matchesCategory && matchesLanguage && matchesSearch && matchesDistance && matchesRating;
      })
      .sort((a, b) => {
        if (aiResults) {
          const scoreA = aiResults[String(a.id)]?.score || 0;
          const scoreB = aiResults[String(b.id)]?.score || 0;
          return scoreB - scoreA;
        }
        return 0;
      })
    : [];

  return (
    <div className="p-4 md:p-12 pt-20 md:pt-24 space-y-16 pb-32 max-w-7xl mx-auto">
      {/* Search & Filters */}
      <div className="space-y-16">
        <div className="max-w-5xl space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-end gap-2 mb-2">
              <div className="bg-slate-100 rounded-full p-1 flex items-center">
                <button 
                  onClick={() => setSearchMode('standard')} 
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${searchMode === 'standard' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-brand-blue'}`}
                >
                  Standard
                </button>
                <button 
                  onClick={() => setSearchMode('ai')} 
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${searchMode === 'ai' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-500 hover:text-violet-600'}`}
                >
                  AI Search
                </button>
              </div>
            </div>
            <h2 className="text-2xl md:text-4xl font-normal font-display text-brand-navy tracking-tight leading-tight">
              Find exactly who you are <span className={`italic font-medium transition-colors ${searchMode === 'ai' ? 'text-violet-600' : 'text-brand-blue'}`}>looking for.</span>
            </h2>
          </div>

          <div className="relative group flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1 w-full min-w-0">
              {searchMode === 'ai' ? (
                <Sparkles className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-violet-400 group-focus-within:text-violet-600 transition-colors" />
              ) : (
                <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
              )}
              <input 
                ref={inputRef}
                type="text" 
                placeholder={searchMode === 'ai' ? "Describe what you need..." : "Search pros or skills..."}
                className={`w-full pl-10 sm:pl-14 pr-12 py-3.5 sm:py-4 bg-white rounded-2xl border border-slate-100 focus:ring-4 ${searchMode === 'ai' ? 'focus:ring-violet-600/5 focus:border-violet-600/30' : 'focus:ring-blue-600/5 focus:border-blue-600/30'} outline-none shadow-sm hover:shadow-md transition-all text-slate-700 font-medium text-[13px] sm:text-base placeholder:text-slate-300 text-ellipsis overflow-hidden whitespace-nowrap`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (searchMode === 'ai') {
                      handleSearchSubmit();
                    } else {
                      // Scroll logic for standard mode only if results appear
                      if (checkMatches(search)) {
                        document.getElementById('pro-cards-list')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }
                }}
              />

                <AnimatePresence>
                  {search && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={() => {
                  if (searchMode === 'ai') {
                    handleSearchSubmit();
                  } else {
                    setDeferredSearch(search);
                    if (checkMatches(search)) {
                      document.getElementById('pro-cards-list')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
                className={`flex items-center justify-center gap-2 px-8 py-4 md:py-5 ${searchMode === 'ai' ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'} text-white rounded-[24px] font-bold shadow-lg ${searchMode === 'ai' ? 'shadow-indigo-600/20' : 'shadow-blue-600/20'} hover:brightness-110 ${searchMode === 'ai' ? 'hover:shadow-indigo-600/30' : 'hover:shadow-blue-600/30'} transition-all active:scale-95 disabled:opacity-50 w-full md:w-auto`}
                disabled={aiLoading}
              >
                {searchMode === 'ai' ? (
                  aiLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5 fill-white/20 animate-pulse" />
                  )
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {searchMode === 'ai' ? (aiLoading ? "Jane is searching..." : "Search with Jane") : "Search"}
              </button>
            </div>

            {searchMode === 'ai' && (
              <p className="text-xs text-slate-400 font-medium">
                💡 <span className="font-semibold text-slate-500">Suggestions:</span> "I am looking for a bilingual Spanish plumber", "A real estate lawyer with great reviews", "Trustworthy English-speaking nanny"
              </p>
            )}

            {/* No Results banner */}
            <AnimatePresence>
              {hasActiveFilter && !aiLoading && filteredPros.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100/50 text-amber-900 text-xs md:text-sm font-medium flex items-center gap-3 shadow-sm"
                >
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span>No matches found. Try using other keywords or clearing some filters! 🌟</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Error banner */}
            {aiError && (
              <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-center gap-3 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{aiError}</span>
              </div>
            )}



            {/* Skeleton / Loading pulse for AI mapping */}
            {aiLoading && (
              <div className="p-8 bg-violet-50/40 rounded-3xl border border-indigo-100/40 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 bg-violet-600/10 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-violet-600 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-violet-900">Jane is analyzing your request...</p>
                  <p className="text-xs text-slate-400 max-w-sm">Jane is searching our database of recommended professionals to find the perfect matches.</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Filters Grid */}
          <div className="grid grid-cols-2 gap-4 md:gap-x-8 md:gap-y-6 pt-4">
            {/* Profession Dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-brand-blue" /> Profession
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-4 pr-10 py-3.5 bg-white rounded-2xl border border-slate-100 focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/20 outline-none shadow-sm hover:shadow-md transition-all text-slate-700 font-bold text-xs md:text-sm appearance-none cursor-pointer"
                >
                  <option value="All">All Professions</option>
                  {allProfessions.map(prof => (
                    <option key={prof} value={prof}>{prof}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Language Dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-brand-blue" /> Language
              </label>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full pl-4 pr-10 py-3.5 bg-white rounded-2xl border border-slate-100 focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/20 outline-none shadow-sm hover:shadow-md transition-all text-slate-700 font-bold text-xs md:text-sm appearance-none cursor-pointer"
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang === 'All' ? 'All Languages' : lang}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Distance Filter Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> Distance ({maxDistance === 'All' ? '∞' : `${maxDistance}km`})
                </label>
              </div>
              <div className="px-3 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 min-h-[60px] md:min-h-[66px] justify-center">
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={maxDistance === 'All' ? 50 : maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
            </div>

            {/* Rating Filter stars */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-brand-yellow" /> Rating
              </label>
              <div className="flex items-center gap-2 px-3 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[60px] md:min-h-[66px]">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setMinRating(minRating === s ? 0 : s)}
                      className="p-0.5"
                    >
                      <Star className={cn("w-4 h-4 md:w-5 md:h-5 transition-colors", s <= minRating ? "text-brand-yellow fill-brand-yellow" : "text-slate-200")} />
                    </button>
                  ))}
                </div>
                <span className="hidden sm:inline ml-auto text-[10px] font-bold text-slate-400">
                  {minRating > 0 ? `${minRating}.0+` : 'Any'}
                </span>
              </div>
            </div>
          </div>

          {/* Active AI search indicator placed below the filters */}
          {aiQuery && aiResults && !aiLoading && (
            <div className="p-4 bg-violet-50 text-violet-800 rounded-2xl border border-violet-100 flex flex-wrap items-center justify-between gap-3 text-sm transition-all duration-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600 fill-violet-300 animate-pulse" />
                <span>Jane's Recommended Results for "<strong>{aiQuery}</strong>" • <strong>{filteredPros.length}</strong> matches sorted by relevance</span>
              </div>
              <button 
                onClick={() => {
                  setSearch('');
                  setAiResults(null);
                  setAiQuery('');
                  setDeferredSearch('');
                }}
                className="text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors bg-white px-3 py-1.5 rounded-xl border border-violet-200 shadow-sm"
              >
                Clear
              </button>
            </div>
          )}
      </div>

      <div className="pt-8" id="results-section">
        <div className="space-y-12">
          {/* Map View always on top - only for members */}
          {currentUser && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full h-[300px] md:h-[400px] rounded-[40px] overflow-hidden border border-slate-100 shadow-2xl relative bg-slate-50"
            >
               <ProMap 
                 pros={filteredPros} 
                 onSelectPro={(pro) => scrollToPro(pro)} 
                 center={userLocation || { lat: 39.4699, lng: -0.3763 }} 
               />
            </motion.div>
          )}

          {/* List View below the map */}
          <div id="pro-cards-list" className="grid grid-cols-1 md:grid-cols-2 gap-6 scroll-mt-28">
            {filteredPros.length > 0 ? (
              filteredPros.map((pro, index) => (
                <motion.div 
                  key={pro.id} 
                  id={`pro-card-${pro.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedPro(pro)}
                  className="group relative bg-white rounded-[32px] p-6 flex flex-col lg:flex-row gap-6 border border-slate-100 transition-all shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-brand-blue/10 cursor-pointer overflow-hidden"
                >
                  {/* Number Badge to match map pins */}
                  <div className="absolute top-6 right-6 w-8 h-8 bg-brand-blue text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg shadow-brand-blue/20 z-10 transition-transform group-hover:scale-110">
                    {index + 1}
                  </div>

                  {/* AI Match Score Badge */}
                  {aiResults && aiResults[String(pro.id)] && (
                    <div className="absolute top-6 right-16 px-2.5 py-1 bg-violet-50 text-violet-700 rounded-full flex items-center gap-1 text-[10px] font-bold border border-violet-100/50 z-10">
                      <Sparkles className="w-3 h-3 text-violet-500 fill-violet-200" />
                      <span>{aiResults[String(pro.id)].score}% Jane match</span>
                    </div>
                  )}

                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-16 -mt-16 group-hover:bg-brand-blue/5 transition-colors duration-500" />
                  
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm group-hover:scale-105 transition-transform duration-700 flex items-center justify-center">
                    {pro.image ? (
                      <img src={pro.image} alt={pro.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-1/2 h-1/2 text-slate-200" />
                    )}
                  </div>
  
                  <div className="relative flex-1 flex flex-col justify-between min-w-0 py-1">
                    <div className="space-y-2">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-900 text-xl truncate group-hover:text-brand-blue transition-colors tracking-tight pr-8">{pro.name}</h4>
                        <div className="flex items-center gap-2">
                           <span className="text-[11px] font-medium text-brand-blue uppercase tracking-widest">{pro.category}</span>
                           <span className="text-slate-200">•</span>
                           <div className={cn(
                             "flex items-center gap-1 transition-all",
                             !currentUser && "filter blur-[4px] select-none pointer-events-none"
                           )}>
                             <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                             <span className="text-xs font-normal text-slate-700">
                               {pro.review_count && pro.review_count > 0 ? (
                                 <span className="flex items-center gap-1">
                                   {pro.rating} <span className="text-slate-400 font-medium font-sans">({pro.review_count})</span>
                                 </span>
                               ) : 'Recommended by the community. Reviews coming soon'}
                             </span>
                           </div>
                        </div>
                      </div>
                      <p className={cn(
                        "text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium transition-all",
                        !currentUser && "filter blur-[4.5px] select-none pointer-events-none"
                      )}>
                        {pro.bio}
                      </p>

                      {/* AI Tailored Matching Reason */}
                      {aiResults && aiResults[String(pro.id)]?.reason && (
                        <div className="mt-3 p-3 bg-violet-50/40 rounded-2xl border border-violet-100/45 flex items-start gap-2 max-w-full">
                          <Sparkles className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0 animate-pulse" />
                          <p className="text-xs text-violet-800 font-medium italic leading-relaxed">
                            "{aiResults[String(pro.id)].reason}"
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50 gap-4">
                      <div className="flex flex-wrap gap-2 flex-shrink-0">
                        {pro.languages.slice(0, 2).map(lang => (
                          <span key={lang} className="px-2 py-1 bg-slate-50/80 text-slate-400 rounded-lg text-[10px] font-medium border border-slate-100">
                            {lang}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-col items-end gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-300 uppercase tracking-widest w-full overflow-hidden justify-end">
                           <MapPin className="w-3 h-3 flex-shrink-0" />
                           <span className={currentUser ? "truncate" : "filter blur-[4.5px] select-none text-slate-300 inline-block pointer-events-none truncate"}>
                             {pro.location || "Carrer Sorní, 12, 46004 Valencia"}
                           </span>
                        </div>
                        {!currentUser && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('login');
                            }}
                            className="text-[9px] font-medium text-brand-blue uppercase tracking-widest hover:underline flex items-center gap-1 mt-1 transition-all active:scale-95"
                          >
                            <Lock className="w-2.5 h-2.5 text-brand-blue" /> Sign up to Unlocked
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center space-y-6">
                <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto ring-1 ring-slate-100">
                  <Search className="w-12 h-12 text-slate-200" />
                </div>
                {!hasActiveFilter ? (
                  <div className="space-y-2">
                    <p className="text-slate-900 font-bold text-2xl">Start your search</p>
                    <p className="text-slate-400 max-w-md mx-auto font-medium">Use the search bar or filters above to find the best local professionals recommended by the community.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-slate-900 font-bold text-2xl">No pros found</p>
                    <p className="text-slate-400 max-w-md mx-auto font-medium">We didn't find any professional matching your search. Try different filters or keywords!</p>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal Integration */}
      <AnimatePresence>
        {selectedPro && (
          <ProfessionalDetailView 
            pro={selectedPro} 
            onClose={() => {
              setSelectedPro(null);
              onModalClose?.();
            }} 
            onNavigate={onNavigate}
            onProUpdate={onProUpdate}
            currentUser={currentUser}
            userProfile={userProfile}
            blockedUsers={blockedUsers}
            usersWhoBlockedMe={usersWhoBlockedMe}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MessagesView({ 
  scrollToTop, 
  initialChat, 
  onClearInitial, 
  onNavigate, 
  currentUser, 
  userProfile,
  unreadConversations = [],
  blockedUsers = [],
  usersWhoBlockedMe = [],
  onBlockedUsersUpdate,
  onMarkChatAsRead
}: { 
  scrollToTop?: () => void, 
  initialChat?: any, 
  onClearInitial?: () => void,
  onNavigate?: (view: View, params?: { eventId?: string, proId?: string, guideId?: string, searchQuery?: string, chat?: any }) => void,
  currentUser?: any,
  userProfile?: Profile | null,
  unreadConversations?: string[],
  blockedUsers: string[],
  usersWhoBlockedMe: string[],
  onBlockedUsersUpdate?: () => void,
  onMarkChatAsRead?: (chatId: string) => void
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Custom alerts or status notifications
  const [viewAlert, setViewAlert] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Search filter for chats list
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Menu Dropdowns
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Report fields
  const [reportReason, setReportReason] = useState('harassment');
  const [reportDetails, setReportDetails] = useState('');
  
  // Cleanup empty conversations when navigating away or switching chats
  useEffect(() => {
    const lastActiveChatId = selectedChat?.id;
    
    return () => {
      if (lastActiveChatId) {
        console.log(`[MessagesView] Triggering empty conversation check for ${lastActiveChatId}`);
        chatService.deleteConversationIfEmpty(lastActiveChatId).then(deleted => {
          if (deleted) {
            setConversations(prev => prev.filter(c => c.id !== lastActiveChatId));
          }
        });
      }
    };
  }, [selectedChat?.id]); // Trigger when selectedChat changes. Unmount handles view changes.

  // Helper to close chat with explicit cleanup
  const handleCloseChat = async () => {
    const chatId = selectedChat?.id;
    setSelectedChat(null);
    if (chatId) {
      const deleted = await chatService.deleteConversationIfEmpty(chatId);
      if (deleted) {
        setConversations(prev => prev.filter(c => c.id !== chatId));
      }
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMarkedReadRef = useRef<number>(0);
  const lastMessagesLengthRef = useRef<number>(0);

  // Scroll automatic to chat bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      const scrollHeight = messagesContainerRef.current.scrollHeight;
      if (behavior === 'smooth') {
        messagesContainerRef.current.scrollTo({
          top: scrollHeight,
          behavior: 'smooth'
        });
      } else {
        messagesContainerRef.current.scrollTop = scrollHeight;
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastMarkedReadRef.current > 1500) {
      lastMarkedReadRef.current = now;
      if (selectedChat && currentUser) {
        // Only trigger update if there are actually unread messages from the other user
        const hasUnreadIncoming = messages.some(m => m.sender_id !== currentUser.id && !m.is_read);
        if (!hasUnreadIncoming) return;

        chatService.markMessagesAsRead(selectedChat.id, currentUser.id);
        // Also ensure local storage and parent state are kept up to date
        localStorage.setItem(`chat_last_read_${selectedChat.id}`, new Date().toISOString());
        onMarkChatAsRead?.(selectedChat.id);

        // Instantly mark received messages in local state as read
        setMessages(prev => prev.map(m => {
          if (m.sender_id !== currentUser.id && !m.is_read) {
            return { ...m, is_read: true };
          }
          return m;
        }));
      }
    }
  };

  useEffect(() => {
    // Only scroll to bottom if the messages length increased (new message)
    // or if it's the first load for this chat
    if (messages.length > lastMessagesLengthRef.current || lastMessagesLengthRef.current === 0) {
      const isScrolledUp = messagesContainerRef.current && 
        (messagesContainerRef.current.scrollHeight - messagesContainerRef.current.scrollTop - messagesContainerRef.current.clientHeight > 150);

      if (lastMessagesLengthRef.current === 0 || !isScrolledUp) {
        scrollToBottom(lastMessagesLengthRef.current === 0 ? 'auto' : 'smooth');
      }
    }
    lastMessagesLengthRef.current = messages.length;
  }, [messages.length]); // Only depend on length to avoid scrolling on status updates

  // Load conversations and initial chat coordination
  useEffect(() => {
    let active = true;

    const initMessages = async () => {
      if (!currentUser) return;
      try {
        setLoadingConversations(true);

        // Fetch conversations safely
        let userConvs: Conversation[] = [];

        try {
          if (isSupabaseConfigured) {
            userConvs = await chatService.getUserConversations(currentUser.id);
          }
        } catch (e) {
          console.warn('Error fetching user conversations:', e);
        }

        if (!active) return;

        // Handle initialChat trigger if present
        if (initialChat) {
          // If it's already a full conversation object, just select it
          if (initialChat.id && initialChat.participant_1 && initialChat.participant_2) {
            setConversations(userConvs);
            setSelectedChat(initialChat);
            setLoadingConversations(false);
            onClearInitial?.();
            return;
          }

          const targetName = initialChat.name || (initialChat.otherUser?.full_name);
          const targetId = initialChat.userId || initialChat.otherUser?.id;

          if (!targetName && !targetId) {
            setConversations(userConvs);
            setLoadingConversations(false);
            onClearInitial?.();
            return;
          }

          // Case: Self-chat prevention
          const currentUserNormalizedName = (currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || '').trim().toLowerCase();
          const targetNormalizedName = (targetName || '').trim().toLowerCase();

          if (targetId === currentUser.id || (targetName && targetNormalizedName === currentUserNormalizedName)) {
            setViewAlert({ type: 'info', text: "You cannot start a conversation with yourself." });
            setConversations(userConvs);
            setLoadingConversations(false);
            onClearInitial?.();
            return;
          }

          // Seek profile
          let otherProfile = null;
          try {
            if (targetId) {
              otherProfile = await authService.getProfile(targetId);
            } else if (targetName) {
              otherProfile = await chatService.getProfileByName(targetName);
            }
          } catch (e) {
            console.warn('Error fetching profile for initial chat:', e);
          }

          if (!active) return;

          if (otherProfile) {
            if (otherProfile.id === currentUser.id) {
              setViewAlert({ type: 'info', text: "You cannot start a conversation with yourself." });
              setConversations(userConvs);
              setLoadingConversations(false);
              onClearInitial?.();
              return;
            }

            if (otherProfile.chat_enabled === false) {
              setViewAlert({ type: 'error', text: "This member has disabled chat participation." });
              setConversations(userConvs);
              setLoadingConversations(false);
              onClearInitial?.();
              return;
            }

            if (blockedUsers.includes(otherProfile.id)) {
              setViewAlert({ type: 'info', text: `You have blocked ${otherProfile.full_name || 'this member'}.` });
            }

            // Create or retrieve real conversation
            try {
              const conv = await chatService.getOrCreateConversation(currentUser.id, otherProfile.id);
              if (conv && active) {
                const fullConv: Conversation = {
                  ...conv,
                  otherUser: otherProfile
                };

                // Refresh list and select conv
                let updatedConvs: Conversation[] = [];
                try {
                  updatedConvs = await chatService.getUserConversations(currentUser.id);
                } catch (e) {
                  console.warn('Error refreshing conversations list:', e);
                }

                setConversations(updatedConvs.length > 0 ? updatedConvs : [fullConv]);
                const matchedConv = updatedConvs.find(c => c.id === conv.id) || fullConv;
                setSelectedChat(matchedConv);
              } else if (active) {
                setViewAlert({ type: 'error', text: "Messaging service is temporarily unavailable. Check your Supabase configuration." });
              }
            } catch (dbErr: any) {
              console.error('Real conversation creation failed:', dbErr);
              const errorMsg = dbErr?.message || "Unknown database error";
              
              if (errorMsg.includes('relation "public.conversations" does not exist')) {
                setViewAlert({ type: 'error', text: "The 'conversations' table is missing in your Supabase database. Please create it to enable messaging." });
              } else if (errorMsg.includes('permissions') || errorMsg.includes('RLS')) {
                setViewAlert({ type: 'error', text: "Permission denied. Please check your Supabase RLS policies for the 'conversations' table." });
              } else {
                setViewAlert({ type: 'error', text: `Database error: ${errorMsg}. Check the browser console for details.` });
              }
            }
          } else {
            console.warn('[MessagesView] Member not found for profile lookup:', targetName || targetId);
            setViewAlert({ 
              type: 'error', 
              text: `Member "${targetName || 'Requested'}" could not be found. They might have changed their profile name or deleted their account.` 
            });
            setConversations(userConvs);
          }
          onClearInitial?.();
        } else {
          // If no initialChat, just set conversations normally
          setConversations(userConvs);
        }
      } catch (err) {
        console.error('Error during message flow initialization:', err);
      } finally {
        if (active) {
          setLoadingConversations(false);
        }
      }
    };

    initMessages();

    return () => {
      active = false;
    };
  }, [currentUser, initialChat]);

  // Handle selection of a chat and real-time subscription
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoadingMessages(true);

    const loadMsgs = async () => {
      try {
        const msgs = await chatService.getMessages(selectedChat.id);
        if (isMounted) {
          // Filter out messages from blocked users
          const filteredMsgs = msgs.filter(m => !blockedUsers.includes(m.sender_id));
          
          // Reset length ref for new chat to force scroll to bottom on first load
          lastMessagesLengthRef.current = 0;

          // Instantly mark all received messages as read in local rendering list
          const readMappedMsgs = filteredMsgs.map(m => {
            if (m.sender_id !== currentUser?.id) {
              return { ...m, is_read: true };
            }
            return m;
          });
          
          setMessages(readMappedMsgs);
          // Mark as read in localStorage
          localStorage.setItem(`chat_last_read_${selectedChat.id}`, new Date().toISOString());
          // Mark as read in parent state
          onMarkChatAsRead?.(selectedChat.id);

          // Mark as read in Supabase
          if (currentUser) {
            chatService.markMessagesAsRead(selectedChat.id, currentUser.id);
          }
        }
      } catch (err) {
        console.error('Error fetching messages list:', err);
      } finally {
        if (isMounted) {
          setLoadingMessages(false);
        }
      }
    };

    loadMsgs();

    // Subscribe to messages changes in real-time
    const unsubscribe = chatService.subscribeToMessages(selectedChat.id, (newMsg) => {
      if (isMounted) {
        // If current user blocked the sender of this message, ignore it
        if (blockedUsers.includes(newMsg.sender_id)) {
          console.log('[Chat] Ignoring message from blocked user');
          return;
        }

        setMessages(prev => {
          // Idempotent: prevent duplicates
          if (prev.find(m => m.id === newMsg.id)) return prev;
          
          // Since we are looking at this chat, mark upcoming message as read immediately
          localStorage.setItem(`chat_last_read_${selectedChat.id}`, new Date().toISOString());
          onMarkChatAsRead?.(selectedChat.id);

          // Mark incoming message as read in database
          if (currentUser && newMsg.sender_id !== currentUser.id) {
            chatService.markMessagesAsRead(selectedChat.id, currentUser.id);
          }
          
          const finalMsg = {
            ...newMsg,
            is_read: newMsg.sender_id === currentUser?.id ? newMsg.is_read : true
          };
          
          return [...prev, finalMsg];
        });
      }
    }, (updatedMsg) => {
      if (isMounted) {
        // Handle real-time updates (e.g. message is_read status marked true by other user)
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [selectedChat, blockedUsers, onMarkChatAsRead, currentUser]);

  // Send a message
  const handleSendMessage = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!selectedChat || !currentUser || !newMessage.trim() || isSending) return;

    const otherUserId = selectedChat.otherUser?.id;
    if (otherUserId) {
      if (selectedChat.otherUser?.chat_enabled === false) {
        setViewAlert({ type: 'error', text: 'This member has disabled chat participation.' });
        return;
      }
      if (blockedUsers.includes(otherUserId)) {
        setViewAlert({ type: 'error', text: 'You need to unblock this member to send them a message.' });
        return;
      }
      if (usersWhoBlockedMe.includes(otherUserId)) {
        setViewAlert({ type: 'error', text: 'You cannot send messages to this member.' });
        return;
      }
    }

    try {
      setIsSending(true);
      const text = newMessage.trim();
      setNewMessage(''); // optimistic client-side clearing

      const sent = await chatService.sendMessage(selectedChat.id, currentUser.id, text);
      if (sent) {
        setMessages(prev => {
          if (prev.find(m => m.id === sent.id)) return prev;
          return [...prev, sent];
        });
        
        // Mark as read immediately on sending
        localStorage.setItem(`chat_last_read_${selectedChat.id}`, new Date().toISOString());
        
        // Refresh conversations to update order
        const userConvs = await chatService.getUserConversations(currentUser.id);
        setConversations(userConvs);
      }
    } catch (err: any) {
      console.error('Error executing sendMessage:', err);
      if (err.message === 'This discussion is blocked.' || err.message === 'This conversation is blocked.') {
        setViewAlert({ type: 'error', text: 'You cannot send messages because the conversation or member is blocked.' });
        // Refresh block lists globally
        onBlockedUsersUpdate?.();
      } else if (err.message === 'Chat participation is disabled for one of the users.') {
        setViewAlert({ type: 'error', text: 'Chat participation is disabled for you or the other member.' });
      } else {
        setViewAlert({ type: 'error', text: 'Unable to send message. Please try again.' });
      }
    } finally {
      setIsSending(false);
    }
  };

  // Block or Unblock user execution
  const executeBlockToggle = async () => {
    const otherUserId = selectedChat?.otherUser?.id;
    if (!otherUserId || !currentUser || !selectedChat) return;

    try {
      setIsActionLoading(true);
      const isCurrentlyBlocked = blockedUsers.includes(otherUserId);

      if (isCurrentlyBlocked) {
        await chatService.unblockUser(currentUser.id, otherUserId);
        const unblockedGlobally = await chatService.unblockConversation(selectedChat.id, currentUser.id); 
        
        onBlockedUsersUpdate?.();
        
        // Only update local UI state if it was unblocked globally (no other blocks)
        if (unblockedGlobally) {
          setSelectedChat(prev => prev ? { ...prev, is_blocked: false } : null);
          setConversations(prev => prev.map(c => c.id === selectedChat.id ? { ...c, is_blocked: false } : c));
        }
        
        setViewAlert({ type: 'success', text: 'Member successfully unblocked.' });
      } else {
        await chatService.blockUser(currentUser.id, otherUserId);
        await chatService.blockConversation(selectedChat.id); // Also block conversation
        
        onBlockedUsersUpdate?.();
        setSelectedChat(prev => prev ? { ...prev, is_blocked: true } : null);
        setConversations(prev => prev.map(c => c.id === selectedChat.id ? { ...c, is_blocked: true } : c));
        setViewAlert({ type: 'success', text: 'Member successfully blocked.' });
      }
      setShowBlockModal(false);
    } catch (err) {
      console.error('Error toggling block state:', err);
      setViewAlert({ type: 'error', text: 'Failed to update block state.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Submit report
  const handleSendReport = async () => {
    const otherUserId = selectedChat?.otherUser?.id;
    if (!otherUserId || !currentUser) return;

    try {
      setIsActionLoading(true);
      console.log('[Report] Submitting report with payload:', {
        reporter_id: currentUser.id,
        reported_id: otherUserId,
        reason: reportReason,
        details: reportDetails.trim(),
        conversation_id: selectedChat.id
      });
      
      await chatService.reportUser({
        reporter_id: currentUser.id,
        reported_id: otherUserId,
        reason: reportReason,
        details: reportDetails.trim(),
        conversation_id: selectedChat.id
      });
      
      // Automatically block the user as requested
      if (!blockedUsers.includes(otherUserId)) {
        try {
          await chatService.blockUser(currentUser.id, otherUserId);
          onBlockedUsersUpdate?.();
        } catch (blockErr) {
          console.warn('[Report] Automatic block failed:', blockErr);
        }
      }
      
      setViewAlert({ type: 'success', text: 'Report submitted. The member has also been blocked automatically.' });
      setReportDetails('');
      setShowReportModal(false);
    } catch (err: any) {
      console.error('Error submitting report:', err);
      // Detailed error for diagnostic
      const errorMsg = err?.message || 'Failed to submit report.';
      const errorCode = err?.code || 'Unknown';
      setViewAlert({ 
        type: 'error', 
        text: `Report failed: ${errorMsg} (Code: ${errorCode}). Please ensure the 'user_reports' table exists and allows your account to submit reports.` 
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filter conversations matching search string
  const filteredConversations = conversations.filter(conv => {
    const otherName = conv.otherUser?.full_name || '';
    return otherName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto w-full h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] bg-white md:rounded-[32px] overflow-hidden shadow-sm border-x md:border border-slate-100 flex md:mt-4 relative">
      {/* Visual Alerts Overlay container */}
      <AnimatePresence>
        {viewAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90%] bg-slate-900 text-white rounded-2xl px-5 py-3.5 shadow-xl flex items-center justify-between gap-3 text-sm font-medium"
          >
            <span>{viewAlert.text}</span>
            <button 
              onClick={() => setViewAlert(null)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-350"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR - List of conversations */}
      <div className={cn(
        "w-full md:w-80 border-r border-slate-100 flex flex-col transition-all duration-200 bg-white",
        selectedChat ? "hidden md:flex" : "flex"
      )}>
        <div className="p-5 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 font-display">Private Messages</h2>
            <button 
              onClick={() => onNavigate?.('back' as any)}
              className="p-1 px-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all flex items-center gap-1.5"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">Close</span>
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 p-2.5 rounded-xl leading-relaxed">
            To start a private conversation with a community member, click on the chat icon next to their name in the testimonials section of a professional's profile.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loadingConversations ? (
            <div className="p-8 text-center space-y-3">
              <Loader2 className="w-6 h-6 text-brand-blue animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-bold text-slate-400">No messages</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const otherUserObj = conv.otherUser;
              const otherName = otherUserObj?.full_name || 'Anonymous Member';
              const displayedName = formatName(otherName);
              const otherAvatar = otherUserObj?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayedName)}&background=random`;
              const isBlockedByMe = blockedUsers.includes(otherUserObj?.id || '');
              const isBlockedMe = usersWhoBlockedMe.includes(otherUserObj?.id || '');
              const isBlockedLocally = isBlockedByMe || isBlockedMe;
              const isUnread = unreadConversations.includes(conv.id);

              return (
                <div 
                  key={conv.id}
                  onClick={async () => {
                    const prevId = selectedChat?.id;
                    setSelectedChat(conv);
                    setShowOptionsDropdown(false);
                    // Force mark as read locally
                    localStorage.setItem(`chat_last_read_${conv.id}`, new Date().toISOString());
                    
                    // Manually trigger cleanup if switching from an empty chat
                    if (prevId && prevId !== conv.id) {
                      const deleted = await chatService.deleteConversationIfEmpty(prevId);
                      if (deleted) {
                        setConversations(prev => prev.filter(c => c.id !== prevId));
                      }
                    }
                  }}
                  className={cn(
                    "p-4 flex gap-3 cursor-pointer transition-all border-l-4 relative",
                    selectedChat?.id === conv.id ? "bg-brand-blue/5 border-brand-blue" : "hover:bg-slate-50 border-transparent"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <img src={otherAvatar} alt="" className="w-11 h-11 rounded-full object-cover border border-slate-100" />
                    {isBlockedLocally && (
                      <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-0.5 rounded-full border border-white">
                        <Ban className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className={cn("text-sm truncate", isUnread ? "font-black text-slate-900" : "font-bold text-slate-700")}>
                        {displayedName}
                      </h4>
                      <span className="text-[9px] text-slate-400">
                        {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString([], {month: 'short', day: 'numeric'}) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      {conv.is_blocked ? (
                        <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Chat Blocked
                        </span>
                      ) : isBlockedByMe ? (
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Blocked</span>
                      ) : isBlockedMe ? (
                        <span className="text-[10px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Unavailable</span>
                      ) : (
                        <p className={cn("text-xs truncate", isUnread ? "font-bold text-brand-blue" : "text-slate-500")}>
                          {isUnread ? "New messages" : "Click to open chat"}
                        </p>
                      )}
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Actual chat window */}
      <div className={cn(
        "flex-1 flex flex-col bg-slate-50/20 transition-all duration-200",
        selectedChat ? "flex" : "hidden md:flex bg-white items-center justify-center text-center p-8"
      )}>
        {selectedChat ? (
          <>
            {/* Conversations Header */}
            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm relative z-30">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleCloseChat}
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-brand-blue transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <img 
                     src={selectedChat.otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formatName(selectedChat.otherUser?.full_name))}&background=random`} 
                     alt="" 
                     className="w-10 h-10 rounded-full object-cover border border-slate-100" 
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{formatName(selectedChat.otherUser?.full_name)}</h4>
                  {(blockedUsers.includes(selectedChat.otherUser?.id || '') || usersWhoBlockedMe.includes(selectedChat.otherUser?.id || '')) && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {blockedUsers.includes(selectedChat.otherUser?.id || '') ? (
                        <span className="text-[9px] bg-rose-50 text-rose-500 font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md">Blocked by you</span>
                      ) : (
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md">Unavailable</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action options - Dropdown with block & report */}
              <div className="relative">
                <button 
                  onClick={() => setShowOptionsDropdown(prev => !prev)}
                  className="p-2.5 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                  title="Options Menu"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {/* Dropdown Box */}
                {showOptionsDropdown && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-150 shadow-xl py-2 z-40">
                    <button 
                      onClick={() => {
                        setShowOptionsDropdown(false);
                        setShowReportModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors font-medium"
                    >
                      <Flag className="w-4 h-4 text-amber-500" />
                      Report this member
                    </button>
                    <button 
                      onClick={() => {
                        setShowOptionsDropdown(false);
                        setShowBlockModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50/50 flex items-center gap-2.5 transition-colors font-medium border-t border-slate-50"
                    >
                      <Ban className="w-4 h-4 text-rose-500" />
                      {blockedUsers.includes(selectedChat.otherUser?.id || '') ? 'Unblock member' : 'Block member'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Messages Log */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto bg-slate-50/40" 
              onScroll={handleScroll}
            >
              {loadingMessages ? (
                <div className="h-full flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
                  <p className="text-xs text-slate-400">Loading conversation...</p>
                </div>
              ) : (() => {
                const visibleMsgs = messages.filter(msg => {
                  if (!msg?.content) return true;
                  return !(msg.content.startsWith('Hello ') && msg.content.includes('! I saw your review for '));
                });
                
                if (visibleMsgs.length === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-bold text-slate-500">No messages yet</p>
                      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">Engage in a respectful and constructive conversation regarding their review!</p>
                    </div>
                  );
                }
                
                return visibleMsgs.map((msg) => {
                  const isSentByMe = msg.sender_id === currentUser?.id;
                  
                  return (
                    <div 
                      key={msg.id} 
                      className={cn("flex", isSentByMe ? "justify-end" : "justify-start")}
                    >
                      <div className={cn(
                        "p-4 rounded-2xl max-w-[85%] md:max-w-sm text-sm shadow-sm leading-relaxed",
                        isSentByMe 
                          ? "bg-brand-blue text-white rounded-tr-none" 
                          : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                      )}>
                        <p className="break-words white-space-pre-wrap">{msg.content}</p>
                        <span className={cn(
                          "block text-[9px] mt-1.5 text-right font-medium",
                          isSentByMe ? "text-blue-150" : "text-slate-400"
                        )}>
                          {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box section (Conditional blockers) */}
            <div className="p-4 bg-white border-t border-slate-100 pb-6 md:pb-4">
              {userProfile?.chat_enabled === false ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-slate-500 text-xs font-bold leading-relaxed shadow-sm">
                  You have disabled chat participation. Enable it in Profile &gt; Settings to send and receive messages.
                </div>
              ) : selectedChat.otherUser?.chat_enabled === false ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-slate-500 text-xs font-bold leading-relaxed shadow-sm flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  This member has disabled chat participation.
                </div>
              ) : selectedChat.is_blocked ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center text-white text-xs font-bold flex flex-col items-center justify-center gap-1.5 shadow-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>
                      {blockedUsers.includes(selectedChat.otherUser?.id || '') 
                        ? 'You have blocked this conversation.' 
                        : 'This conversation has been blocked by the other participant.'}
                    </span>
                  </div>
                  {blockedUsers.includes(selectedChat.otherUser?.id || '') && (
                    <button 
                      onClick={() => setShowBlockModal(true)}
                      className="mt-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl border border-white/20 text-[10px] shadow-sm uppercase tracking-wider transition-all"
                    >
                      Unblock to resume
                    </button>
                  )}
                </div>
              ) : blockedUsers.includes(selectedChat.otherUser?.id || '') ? (
                <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 text-center text-rose-600 text-xs font-bold flex flex-col items-center justify-center gap-1.5 shadow-sm">
                  <span>You have blocked this member. Unblock them from the options menu to resume the discussion.</span>
                  <button 
                    onClick={() => setShowBlockModal(true)}
                    className="mt-1 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-600 px-3.5 py-1.5 rounded-xl border border-rose-200 text-[10px] shadow-sm uppercase tracking-wider transition-all"
                  >
                    Unblock Now
                  </button>
                </div>
              ) : usersWhoBlockedMe.includes(selectedChat.otherUser?.id || '') ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-slate-500 text-xs font-bold leading-relaxed shadow-sm">
                  This member does not accept private messages anymore or is currently unavailable.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your private message..."
                    disabled={isSending}
                    className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none font-medium text-slate-700 transition-all disabled:opacity-60"
                  />
                  <button 
                    type="submit"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="bg-brand-blue text-white p-2.5 rounded-xl shadow-lg shadow-brand-blue/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-5 h-5" />
                    )}
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 md:p-12 space-y-4 bg-white">
            <div className="w-20 h-20 bg-brand-blue/10 rounded-full flex items-center justify-center animate-bounce-slow">
              <MessageCircle className="w-10 h-10 text-brand-blue" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Your Private Conversations</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Connect with authentic community members by clicking on the chat message icon next to their reviews on wellness professional profiles.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* REPORT MEMBER DIALOG MODAL */}
      <AnimatePresence>
        {showReportModal && selectedChat && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4"
          >
            <motion.div 
               initial={{ scale: 0.95, y: 15 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.95, y: 15 }}
               className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowReportModal(false)}
                className="absolute top-5 right-5 p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                  <Flag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Report Inappropriate Behavior</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Help us keep our community safe and friendly by reporting any inappropriate behavior or harassment.
                  </p>
                </div>

                <div className="space-y-3 pt-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Primary Reason</label>
                    <select 
                      value={reportReason} 
                      onChange={(e) => setReportReason(e.target.value)} 
                      className="w-full px-4 py-2 bg-white border border-slate-200 focus:ring-2 focus:ring-brand-blue/20 rounded-xl text-xs font-medium text-slate-700 outline-none"
                    >
                      <option value="harassment">Harassment or disrespectful behavior</option>
                      <option value="spam">Spam / Unsolicited advertising</option>
                      <option value="inappropriate">Inappropriate content</option>
                      <option value="scam">Scam or suspicious behavior</option>
                      <option value="other">Other reason</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Details (Optional)</label>
                    <textarea 
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      rows={4}
                      placeholder="Describe the situation in a few sentences..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 focus:ring-2 focus:ring-brand-blue/20 rounded-xl text-xs font-medium text-slate-700 outline-none transition-all resize-none font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button 
                    onClick={() => setShowReportModal(false)}
                    className="py-3 bg-white hover:bg-slate-50 text-slate-550 rounded-xl text-xs font-bold border border-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendReport}
                    disabled={isActionLoading}
                    className="py-3 bg-brand-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-brand-blue/20 transition-all disabled:opacity-50"
                  >
                    {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BLOCK MEMBER DIALOG MODAL */}
      <AnimatePresence>
        {showBlockModal && selectedChat && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative"
            >
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Ban className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    {blockedUsers.includes(selectedChat.otherUser?.id || '') ? 'Unblock this member?' : 'Block this member?'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {blockedUsers.includes(selectedChat.otherUser?.id || '') 
                      ? `By unblocking ${formatName(selectedChat.otherUser?.full_name)}, you will be able to message them and receive their messages again.`
                      : `By blocking ${formatName(selectedChat.otherUser?.full_name)}, you will stop all direct communication and will no longer receive or send any messages.`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button 
                    onClick={() => setShowBlockModal(false)}
                    className="py-2.5 bg-white hover:bg-slate-50 text-slate-550 rounded-xl text-xs font-bold border border-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeBlockToggle}
                    disabled={isActionLoading}
                    className={cn(
                      "py-2.5 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50",
                      blockedUsers.includes(selectedChat.otherUser?.id || '') 
                        ? "bg-brand-blue hover:bg-blue-600 shadow-brand-blue/15" 
                        : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/15"
                    )}
                  >
                    {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : blockedUsers.includes(selectedChat.otherUser?.id || '') ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfessionalDetailView({ 
  pro, 
  onClose, 
  onNavigate, 
  onProUpdate, 
  currentUser, 
  userProfile,
  blockedUsers = [],
  usersWhoBlockedMe = []
}: { 
  pro: Professional, 
  onClose: () => void, 
  onNavigate: (view: View, params?: { eventId?: string, proId?: string, guideId?: string, searchQuery?: string, chat?: any }) => void, 
  onProUpdate?: () => void, 
  currentUser?: any, 
  userProfile?: any,
  blockedUsers?: string[],
  usersWhoBlockedMe?: string[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  const [hasAlreadyReviewed, setHasAlreadyReviewed] = useState(false);
  const [checkingReview, setCheckingReview] = useState(false);
  
  const [displayReviewCount, setDisplayReviewCount] = useState(pro.review_count || 0);
  const [displayRating, setDisplayRating] = useState(pro.rating || 0);

  // Sync local display states when props change (from parent refetch)
  useEffect(() => {
    setDisplayReviewCount(pro.review_count || 0);
    setDisplayRating(pro.rating || 0);
  }, [pro.review_count, pro.rating]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    
    // Reset writing state when switching pros
    setIsWritingReview(false);
    setReviewSuccess(false);
    setRating(0);
    setComment('');
    // Fetch real reviews from Supabase
    const fetchReviews = async () => {
      try {
        const reviews = await proService.getTestimonies(pro.id);
        if (reviews && reviews.length > 0) {
          setLocalReviews(reviews.map((r: any) => ({
            id: r.id,
            author: r.author,
            userId: r.user_id || r.author_id || r.profile_id || r.creator_id,
            rating: r.rating,
            comment: r.comment,
            date: new Date(r.created_at).toLocaleDateString()
          })));
        } else {
          setLocalReviews([]);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      }
    };

    const checkExistingReview = async () => {
      if (!currentUser) return;
      setCheckingReview(true);
      try {
        const authorName = userProfile?.full_name || currentUser?.email?.split('@')[0] || '';
        if (authorName) {
          const reviewed = await proService.hasUserReviewedPro(authorName, pro.id);
          setHasAlreadyReviewed(reviewed);
        }
      } catch (err) {
        console.error('Error checking review status:', err);
      } finally {
        setCheckingReview(false);
      }
    };

    fetchReviews();
    checkExistingReview();
  }, [pro.id, currentUser, userProfile]);

  return (
    <div 
      ref={scrollRef}
      className="fixed inset-x-0 top-[60px] bottom-[80px] md:inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] overflow-y-auto overscroll-contain flex justify-center" 
      onClick={onClose}
    >
      <div className="min-h-full w-full max-w-5xl flex items-start p-4 md:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white w-full rounded-[40px] overflow-hidden shadow-2xl relative my-auto"
          onClick={e => e.stopPropagation()}
        >
        {/* Header Image/Cover Area */}
        <div className="h-40 md:h-56 bg-gradient-to-br from-brand-blue/30 via-slate-100 to-amber-500/10 relative">
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2.5 bg-white/40 hover:bg-white/90 backdrop-blur-md rounded-full shadow-lg text-slate-600 transition-all z-10 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 md:px-12 pb-12 -mt-16 relative">
          <div className="flex flex-col md:flex-row gap-6 md:items-end mb-10">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-[32px] bg-white p-1.5 overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-100 group flex items-center justify-center">
              {pro.image ? (
                <img src={pro.image} alt={pro.name} className="w-full h-full object-cover rounded-[24px] group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <User className="w-20 h-20 text-slate-200" />
              )}
            </div>
            <div className="flex-1 space-y-3 pb-2">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-4xl md:text-5xl font-black text-slate-900 font-display tracking-tight leading-none">{pro.name}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue/5 text-brand-blue rounded-xl font-medium border border-brand-blue/10">
                  <Briefcase className="w-3.5 h-3.5" />
                  {pro.category}
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl font-medium border border-slate-100 transition-all",
                  !currentUser && "filter blur-[4px] select-none pointer-events-none"
                )}>
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{displayReviewCount > 0 ? `${displayRating} (${displayReviewCount})` : 'Recommended by the community. Reviews coming soon'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
            <div className="lg:col-span-2 space-y-12">
              {/* Direct Contact & Info Bar */}
              <div className="bg-slate-50/30 rounded-2xl p-6 w-full border border-slate-100/50 relative overflow-hidden min-h-[160px] flex flex-col justify-center">
                <div className={cn(
                  "grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-300",
                  !currentUser && "filter blur-[6.5px] select-none pointer-events-none"
                )}>
                  <div className="space-y-3">
                    {pro.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-3.5 h-3.5 text-cyan-500/70" />
                        <a href={`tel:${pro.phone}`} className="text-sm text-slate-500 hover:text-brand-blue transition-colors font-medium">{pro.phone}</a>
                      </div>
                    )}
                    {pro.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-3.5 h-3.5 text-brand-blue/70" />
                        <a href={`mailto:${pro.email}`} className="text-sm text-slate-500 hover:text-brand-blue transition-colors break-all font-medium">{pro.email}</a>
                      </div>
                    )}
                    {pro.website && (
                      <div className="flex items-center gap-3">
                        <Link className="w-3.5 h-3.5 text-slate-400/70" />
                        <a 
                          href={pro.website.startsWith('http') ? pro.website : `https://${pro.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-slate-500 hover:text-brand-blue transition-colors font-medium"
                        >
                          {pro.website.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      </div>
                    )}
                    {pro.instagram && (
                      <div className="flex items-center gap-3">
                        <Instagram className="w-3.5 h-3.5 text-pink-500/70" />
                        <a 
                          href={pro.instagram.startsWith('http') ? pro.instagram : `https://instagram.com/${pro.instagram.replace(/^@/, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-slate-500 hover:text-brand-blue transition-colors font-medium"
                        >
                          {pro.instagram.startsWith('@') ? pro.instagram : `@${pro.instagram}`}
                        </a>
                      </div>
                    )}
                    {pro.facebook && (
                      <div className="flex items-center gap-3">
                        <Facebook className="w-3.5 h-3.5 text-blue-600/70" />
                        <a 
                          href={pro.facebook.startsWith('http') ? pro.facebook : `https://facebook.com/${pro.facebook}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-slate-500 hover:text-brand-blue transition-colors font-medium"
                        >
                          {pro.facebook.startsWith('http') ? pro.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\//, '') : pro.facebook}
                        </a>
                      </div>
                    )}
                    {pro.languages && pro.languages.length > 0 && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-3.5 h-3.5 text-slate-400/70" />
                        <div className="flex flex-wrap gap-2">
                          {pro.languages.map(lang => (
                            <span key={lang} className="text-sm text-slate-500 font-medium">{lang}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {pro.location && (
                      <>
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pro.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 group/loc cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-rose-500/70 group-hover/loc:text-rose-500 transition-colors mt-0.5" />
                          <span className="text-sm text-slate-500 group-hover/loc:text-brand-blue transition-colors underline decoration-slate-200 underline-offset-4 font-medium leading-relaxed">{pro.location}</span>
                        </a>
                        
                        {/* Mini Map */}
                        {pro.coordinates && (
                          <div className="w-full h-32 rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative group/map">
                            <Map
                              defaultCenter={pro.coordinates}
                              defaultZoom={15}
                              gestureHandling={'none'}
                              disableDefaultUI={true}
                              mapId="MINI_MAP"
                              className="w-full h-full"
                            >
                              <AdvancedMarker position={pro.coordinates}>
                                <Pin background="#E11D48" glyphColor="#fff" borderColor="#BE123D" />
                              </AdvancedMarker>
                            </Map>
                            <div className="absolute inset-0 bg-transparent cursor-pointer" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pro.location!)}`, '_blank')} />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {!currentUser && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/45 backdrop-blur-[4px] rounded-2xl text-center z-10 transition-all">
                    <div className="w-11 h-11 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue mb-2 shadow-sm animate-pulse">
                      <Lock className="w-5 h-5 stroke-[2.5px]" />
                    </div>
                    <p className="text-sm font-semibold text-slate-950 tracking-tight mb-4 max-w-xs mx-auto">Join our community for free to reveal full information and testimonials</p>
                    <button 
                      onClick={() => { onClose(); onNavigate('login'); }}
                      className="px-5 py-2.5 bg-brand-blue hover:bg-blue-600 text-white rounded-xl text-[10px] font-semibold uppercase tracking-wider shadow-lg shadow-brand-blue/25 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" /> Sign up for free to Unlocked
                    </button>
                  </div>
                )}
              </div>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-blue" />
                  <h4 className="text-lg font-semibold text-slate-900 font-display uppercase tracking-wider">About</h4>
                </div>
                <div className="relative">
                  <p className="text-slate-600 leading-relaxed text-base font-medium transition-all duration-300">
                    {pro.bio}
                  </p>
                </div>
              </section>

              {/* Reviews Section */}
              <section className="space-y-6 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-yellow" />
                    <h4 className="text-lg font-semibold text-slate-900 font-display uppercase tracking-wider">Testimonials</h4>
                  </div>
                  <span className="text-sm font-bold text-slate-400">{localReviews.length} reviews</span>
                </div>

                <div className="relative">
                  <div className={cn(
                    "space-y-4 transition-all duration-300",
                    !currentUser && "filter blur-[7px] select-none pointer-events-none"
                  )}>
                    {localReviews.length > 0 ? (
                      localReviews.map((review) => (
                        <div key={review.id} className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div 
                                className="font-bold text-slate-900 flex items-center gap-2 cursor-pointer hover:text-brand-blue transition-colors group/author"
                                onClick={() => {
                                  onNavigate('messages', { 
                                    chat: {
                                      id: `chat-${review.id}`,
                                      userId: review.userId, // Direct user ID mapping if available
                                      name: review.author, // RAW NAME for lookup as backup
                                      displayName: formatName(review.author), // Formatted name for display
                                      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formatName(review.author))}&background=random`,
                                      online: true,
                                      time: 'just now',
                                      lastMsg: `Hello ${formatName(review.author)}! I saw your review for ${pro.name}.`,
                                      returnToProId: pro.id
                                    }
                                  });
                                  onClose();
                                }}
                              >
                                {formatName(review.author)}
                                <div className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                                  (review.userId && (blockedUsers.includes(review.userId) || usersWhoBlockedMe.includes(review.userId)))
                                    ? "bg-slate-50 cursor-not-allowed"
                                    : "bg-slate-100 group-hover/author:bg-brand-blue/10"
                                )}>
                                  <MessageSquare className={cn(
                                    "w-3.5 h-3.5 transition-all",
                                    (review.userId && (blockedUsers.includes(review.userId) || usersWhoBlockedMe.includes(review.userId)))
                                      ? "text-slate-250"
                                      : "text-slate-400 group-hover/author:text-brand-blue"
                                  )} />
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={cn("w-3 h-3", s <= review.rating ? "text-brand-yellow fill-brand-yellow" : "text-slate-200")} />
                                ))}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{review.date}</span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed italic">"{review.comment}"</p>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center space-y-3 bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                          <MessageCircle className="w-6 h-6 text-slate-200" />
                        </div>
                        <p className="text-sm text-slate-400 font-medium italic">No testimonials yet. Be the first to share your experience!</p>
                      </div>
                    )}
                  </div>
                  {!currentUser && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/45 backdrop-blur-[4px] rounded-3xl p-6 text-center z-10 transition-all">
                      <div className="w-11 h-11 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue mb-2 shadow-sm animate-pulse">
                        <Lock className="w-5 h-5 stroke-[2.5px]" />
                      </div>
                      <p className="text-sm font-semibold text-slate-950 tracking-tight text-center px-4 mb-4">Join our community for free to reveal full information and testimonials</p>
                      <button 
                        onClick={() => { onClose(); onNavigate('login'); }}
                        className="px-5 py-2.5 bg-brand-blue hover:bg-blue-600 text-white rounded-xl text-[10px] font-semibold uppercase tracking-wider shadow-lg shadow-brand-blue/25 transition-all active:scale-95 flex items-center gap-1.5 justify-center mx-auto"
                      >
                        <Lock className="w-3.5 h-3.5" /> Sign up for free to Unlocked
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {currentUser && (
              <div className="space-y-6">
                <motion.div 
                  layout
                  className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6 overflow-hidden"
                >
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-slate-900 leading-tight">Experience with this professional?</h4>
                    <p className="text-sm text-slate-500 font-medium">Help the community by sharing your feedback about {pro.name}.</p>
                  </div>

                  <AnimatePresence mode="wait">
                    {reviewSuccess ? (
                      <motion.div
                        key="success-message"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-8 text-center space-y-4"
                      >
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 rotate-3">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-emerald-900 font-bold text-lg">Sent for moderation</h4>
                          <p className="text-emerald-700/80 text-sm leading-relaxed px-4">
                            Thank you! Your testimonial has been submitted for moderation and will be published once approved by an administrator.
                          </p>
                        </div>
                        <button 
                          onClick={() => setReviewSuccess(false)}
                          className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:bg-emerald-600 transition-all active:scale-95"
                        >
                          Understood
                        </button>
                      </motion.div>
                    ) : hasAlreadyReviewed ? (
                      <motion.div
                        key="already-reviewed"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-brand-blue/5 border border-brand-blue/10 rounded-2xl p-6 text-center space-y-3"
                      >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto shadow-sm">
                          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-slate-900 font-bold text-sm">Review Submitted</h4>
                          <p className="text-slate-500 text-xs leading-relaxed px-4">
                            You have already shared your experience with {pro.name}. Thank you for your contribution to our community!
                          </p>
                        </div>
                      </motion.div>
                    ) : !isWritingReview ? (
                      <motion.button 
                        key="write-btn"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onClick={() => setIsWritingReview(true)}
                        disabled={checkingReview}
                        className="w-full py-4 bg-white text-slate-900 border-2 border-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm disabled:opacity-50"
                      >
                        <Star className="w-4 h-4" />
                        {checkingReview ? 'Checking...' : 'Write a Review'}
                      </motion.button>
                    ) : (
                      <motion.div 
                        key="review-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6"
                      >
                        <div className="flex justify-center gap-2 py-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              onClick={() => setRating(star)}
                              className="transition-transform active:scale-90"
                            >
                              <Star 
                                className={cn(
                                  "w-8 h-8 transition-colors",
                                  (hoveredRating || rating) >= star ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                )} 
                              />
                            </button>
                          ))}
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Feedback</label>
                          <textarea 
                            placeholder="Tell us about your experience..." 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full p-4 bg-white rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-blue outline-none h-32 text-sm font-medium resize-none shadow-inner" 
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button 
                            onClick={() => setIsWritingReview(false)}
                            className="flex-1 py-3 bg-white text-slate-500 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-50 transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            disabled={!rating || !comment.trim() || isSubmitting}
                            onClick={async () => {
                              setIsSubmitting(true);
                              const finalAuthorName = userProfile?.full_name || currentUser?.email?.split('@')[0] || 'Anonymous Member';
                                try {
                                 await proService.addTestimony({
                                   pro_id: pro.id,
                                   author: finalAuthorName,
                                   rating: rating,
                                   comment: comment
                                 });

                                 setReviewSuccess(true);
                                 setHasAlreadyReviewed(true);
                                 setIsWritingReview(false);
                                 setRating(0);
                                 setComment('');
                               } catch (err: any) {
                                 console.error('Failed to submit review:', err);
                                 alert(err.message || 'An error occurred while posting your testimonial. Please try again.');
                               } finally {
                                setIsSubmitting(false);
                              }
                            }}
                            className="flex-1 py-3 bg-brand-blue text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-blue/20 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {isSubmitting ? 'Posting...' : 'Post Review'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  </div>
);
}

function EventsView({ initialEventId, onModalClose, scrollToTop, events: propEvents }: { initialEventId?: string | null, onModalClose?: () => void, scrollToTop?: () => void, events?: Event[] }) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>(propEvents && propEvents.length > 0 ? propEvents : (isSupabaseConfigured ? [] : MOCK_EVENTS));
  const [loading, setLoading] = useState(!propEvents || propEvents.length === 0);

  useEffect(() => {
    // Only fetch if not provided via props or if they're empty and we're configured
    if (propEvents && propEvents.length > 0) {
      setEvents(propEvents);
      setLoading(false);
      return;
    }

    const loadEvents = async () => {
      try {
        const data = await eventService.getEvents();
        if (data) {
          setEvents(data);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [propEvents]);

  useEffect(() => {
    if (initialEventId && events.length > 0) {
      const event = events.find(e => e.id === initialEventId);
      if (event) {
        setSelectedEvent(event);
      }
    }
  }, [initialEventId, events]);

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold font-display text-brand-navy">What's Up in Your City</h2>
        <p className="text-slate-500">Discover meetups and cultural events.</p>
      </div>

      {loading && events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
          <p className="text-slate-400 font-medium">Discovering best events...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
          {events.map(event => (
          <div 
            key={event.id} 
            className="card bg-white group hover-lift cursor-pointer"
            onClick={() => setSelectedEvent(event)}
          >
            <div className="h-40 overflow-hidden relative">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-center min-w-[50px]">
                <p className="text-[10px] font-bold text-brand-blue uppercase">
                  {event.start_date || event.date}
                </p>
                {event.end_date && (
                  <p className="text-[9px] font-medium text-slate-400 mt-0.5 border-t border-slate-100 pt-0.5">
                    to {event.end_date}
                  </p>
                )}
              </div>
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white p-2 rounded-full">
                <Share2 className="w-4 h-4" />
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-lg">{event.title}</h4>
                <span className="text-[10px] font-bold bg-brand-blue/5 text-brand-blue px-2 py-1 rounded-full">{event.category}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {event.start_time || event.time}
                  {event.end_time && ` - ${event.end_time}`}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <span className="text-brand-blue font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Details
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal 
            event={selectedEvent} 
            onClose={() => {
              setSelectedEvent(null);
              onModalClose?.();
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EventDetailModal({ event, onClose }: { event: Event, onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [event.id]);

  return (
    <div 
      ref={scrollRef}
      className="fixed inset-x-0 top-[60px] bottom-[80px] md:inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-4 py-8 md:py-16" 
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-48 relative">
          <img src={event.image} alt="" className="w-full h-full object-cover" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-slate-900">{event.title}</h2>
              <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-[10px] font-bold uppercase tracking-wider">
                {event.category}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-brand-blue" />
                {event.start_date || event.date}
                {event.end_date && ` to ${event.end_date}`}
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-brand-blue" />
                {event.start_time || event.time}
                {event.end_time && ` - ${event.end_time}`}
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-brand-blue" />
                {event.location}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">About this event</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              {event.description || `Join us for ${event.title} at ${event.location}! This is a great opportunity to meet new people and enjoy the local atmosphere.`}
            </p>
          </div>

          {event.coordinates && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Location</h3>
              <div className="h-48 w-full rounded-2xl overflow-hidden border border-slate-100 shadow-inner group">
                <Map
                  defaultCenter={event.coordinates}
                  defaultZoom={15}
                  gestureHandling="greedy"
                  disableDefaultUI
                  mapId="event_map"
                >
                  <AdvancedMarker position={event.coordinates}>
                    <Pin background={'#0870B8'} glyphColor={'#FFFFFF'} borderColor={'#0870B8'} />
                  </AdvancedMarker>
                </Map>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {event.location}
              </p>
            </div>
          )}

          <div className="pt-4">
            <button 
              onClick={() => {
                const title = encodeURIComponent(event.title);
                const details = encodeURIComponent(event.description || '');
                const location = encodeURIComponent(event.location);
                const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
                window.open(googleUrl, '_blank');
              }}
              className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand-blue/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Add to Calendar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const ICON_MAP: Record<string, () => React.JSX.Element> = {
  RocketIcon,
  PaperworkIcon,
  FamilyIcon,
  HealthIcon,
  WorkIcon,
  TipsIcon,
  CityFunIcon,
};

function GuidesView({ initialGuideId, onModalClose, scrollToTop }: { initialGuideId?: string | null, onModalClose?: () => void, scrollToTop?: () => void }) {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);

  useEffect(() => {
    let active = true;
    const loadArticles = async () => {
      try {
        const raw = await guideService.getGuideCategories();
        const flattened = raw.flatMap(cat => 
          cat.articles.map((article: any) => ({
            ...article,
            categoryTitle: cat.title,
            categoryColor: cat.color,
          }))
        );
        if (active) {
          setArticles(flattened);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load articles:', err);
        if (active) {
          setLoading(false);
        }
      }
    };
    loadArticles();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (initialGuideId && articles.length > 0) {
      const foundArticle = articles.find(art => art.id === initialGuideId);
        
      if (foundArticle) {
        setSelectedArticleId(initialGuideId);
        setShowArticleModal(true);
      }
    }
  }, [initialGuideId, articles]);

  useEffect(() => {
    scrollToTop?.();
  }, []);

  const handleCloseModal = () => {
    setShowArticleModal(false);
    if (initialGuideId) {
      onModalClose?.();
    }
  };

  const selectedArticle = useMemo(() => {
    return articles.find(art => art.id === selectedArticleId) || null;
  }, [selectedArticleId, articles]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const query = searchQuery.toLowerCase();
    return articles.filter((article: any) => {
      return (
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        (article.tag && article.tag.toLowerCase().includes(query)) ||
        (article.content && article.content.toLowerCase().includes(query))
      );
    });
  }, [articles, searchQuery]);

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        <p className="text-slate-500 font-medium text-sm">Loading guides...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 pb-32">
      {/* Page Header */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-black font-display text-brand-navy tracking-tight">Guides</h2>
        <p className="text-slate-500 text-base">All the essential articles and expert advice to settle smoothly into Valencia.</p>
      </div>

      {/* Modern Search */}
      <div className="max-w-4xl mx-auto w-full">
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search guides, legal checklists, neighborhoods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue text-slate-900 transition-all text-sm font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filtered Articles Grid */}
      <div className="space-y-12 max-w-7xl mx-auto w-full">
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article: any) => (
              <div 
                key={article.id} 
                onClick={() => {
                  setSelectedArticleId(article.id);
                  setShowArticleModal(true);
                }}
                className="card p-5 space-y-4 flex flex-col justify-between hover-lift group cursor-pointer transition-all border bg-white border-slate-100 hover:border-brand-blue/35 hover:shadow-lg rounded-2xl"
              >
                <div className="space-y-3">
                  {/* Optional Thumbnail Image */}
                  {article.imageUrl && (
                    <div className="w-full h-36 rounded-xl overflow-hidden relative bg-slate-100">
                      <img 
                        src={article.imageUrl} 
                        alt={article.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {article.tag && (
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100">
                          {article.tag}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-slate-950 group-hover:text-brand-blue transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h4>
                    {(article.author?.name || article.author?.businessName || article.businessName) && (
                      <div className="flex items-center gap-1 mt-2 text-[10.5px] text-slate-400 font-medium">
                        <span>By</span>
                        <span className="font-bold text-slate-600">{article.author?.name || "Expert"}</span>
                        {(article.author?.businessName || article.businessName) && (
                          <>
                            <span>•</span>
                            <span className="text-brand-navy font-semibold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{article.author?.businessName || article.businessName}</span>
                          </>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mt-2 font-sans">
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto text-xs font-bold text-brand-blue group-hover:text-brand-blue/80 transition-all">
                  <span>Read Article</span>
                  <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 text-center space-y-4 max-w-lg mx-auto py-16">
            <div className="p-4 bg-white rounded-full shadow-sm text-slate-400">
              <Search className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-lg">No guides found</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                We couldn't find any articles matching your search query. Try using another keyword.
              </p>
            </div>
            <button 
              onClick={() => {
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-brand-blue/90 transition-all shadow-sm"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>



      {/* Article Modal */}
      <ExpertGuideModal 
        isOpen={showArticleModal} 
        onClose={handleCloseModal} 
        article={selectedArticle}
      />
    </div>
  );
}

function MarketplaceView({ onAddAd, ads, onSelectAd, scrollToTop }: { onAddAd: () => void, ads: Ad[], onSelectAd: (ad: Ad) => void, scrollToTop?: () => void }) {
  useEffect(() => {
    scrollToTop?.();
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center space-y-12">
        {/* Animated Icon Group */}
        <div className="relative inline-block">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="w-32 h-32 bg-brand-blue/5 rounded-[40px] flex items-center justify-center relative z-10"
          >
            <ShoppingBag className="w-12 h-12 text-brand-blue" />
          </motion.div>
          
          {/* Decorative elements */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-4 -right-4 w-12 h-12 bg-rose-100 rounded-full blur-2xl"
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute -bottom-8 -left-8 w-20 h-20 bg-brand-blue/20 rounded-full blur-3xl"
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] font-black text-brand-blue uppercase tracking-[0.5em]"
            >
              Exclusive Community Area
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-black font-display text-brand-navy tracking-tight"
            >
              Marketplace <br/>
              <span className="text-brand-blue italic font-medium">Coming Soon.</span>
            </motion.h2>
          </div>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-500 text-sm md:text-base leading-relaxed max-w-md mx-auto"
          >
            We're building a secure, private space for our community to trade, share, and connect. Stay tuned for the grand opening.
          </motion.p>
        </div>

        {/* Status indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-3"
        >
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue/20" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            System Refinement in Progress
          </span>
        </motion.div>
      </div>
    </div>
  );
}

function FeedbackSubPage({ currentUser, onBack }: { currentUser: any, onBack: () => void }) {
  const [category, setCategory] = useState<string>('suggestion');
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedSql, setSuggestedSql] = useState<string | null>(null);

  const categories = [
    { id: 'bug', label: 'Bug Report', icon: AlertCircle, color: 'text-rose-500 bg-rose-50 border-rose-100' },
    { id: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-amber-500 bg-amber-50 border-amber-100' },
    { id: 'compliment', label: 'Compliment', icon: Sparkles, color: 'text-teal-500 bg-teal-50 border-teal-100' },
    { id: 'other', label: 'Other', icon: HelpCircle, color: 'text-slate-500 bg-slate-50 border-slate-100' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please write a brief comment');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuggestedSql(null);

    try {
      await feedbackService.submitFeedback({
        user_id: currentUser?.id,
        user_email: currentUser?.email || 'anonymous',
        category,
        comment: comment.trim(),
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      if (err.code === 'RLS_ERROR') {
        setError('Permission denied by Supabase database (RLS Policy).');
        setSuggestedSql(err.sql);
      } else {
        setError(err.message || 'Could not submit feedback. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-12 px-4 max-w-md mx-auto">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 font-display">Thank you for your feedback!</h3>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
            Your insights have been saved successfully and help us improve the Unlocked experience for everyone.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 bg-brand-blue text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-brand-blue/10 hover:bg-blue-600"
        >
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="bg-white rounded-3xl p-6 border border-slate-100/85 shadow-sm space-y-6 text-left">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
          <MessageSquare className="w-5 h-5 text-[#00C2A8]" />
          <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase">Share Your Experience</h3>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 shrink-0 text-rose-500 ${!suggestedSql ? 'animate-bounce' : ''}`} />
            <div className="space-y-3 w-full">
              <p className="text-xs font-bold tracking-tight text-rose-700">{error}</p>
              {suggestedSql && (
                <div className="space-y-2 bg-white/50 p-3 rounded-xl border border-rose-100 mt-2">
                  <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Solution: Run this in Supabase SQL Editor</p>
                  <pre className="p-3 bg-slate-900 text-slate-100 text-[10px] font-mono rounded-lg overflow-x-auto whitespace-pre select-all">
                    {suggestedSql}
                  </pre>
                  <p className="text-[9px] text-slate-500 italic">This will grant permission to the public role to submit feedback forms.</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(suggestedSql);
                      alert('SQL command copied to clipboard!');
                    }}
                    className="w-full py-2 bg-brand-blue text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-brand-blue-dark transition-colors shadow-sm"
                  >
                    Copy Fix-it SQL
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Type of Feedback</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${
                    isSelected 
                      ? `${cat.color} ring-2 ring-offset-2 ring-rose-500/10 scale-[1.02] shadow-sm` 
                      : 'border-slate-100 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-bold tracking-tight">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
            <span>Comments / Feedback</span>
            <span className="text-slate-300 font-mono">{comment.length}/500</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            placeholder="Tell us what you like"
            rows={5}
            className="w-full px-4 py-3 bg-white border border-slate-200 focus:ring-2 focus:ring-rose-500/15 focus:border-[#00C2A8] rounded-2xl text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 resize-none leading-relaxed"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-2 border-t border-slate-50">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            className="px-6 py-3 bg-[#00C2A8] hover:bg-[#00ad95] disabled:bg-slate-205 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-md shadow-teal-500/10 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

function ProfileView({ scrollToTop, onNavigate, currentUser, userProfile, onProfileUpdate, onAddPro, allPros, unreadConversations = [] }: { scrollToTop?: () => void, onNavigate?: (view: View, params?: { eventId?: string, proId?: string, guideId?: string, searchQuery?: string, chat?: any }) => void, currentUser?: any, userProfile?: Profile | null, onProfileUpdate?: () => void, onAddPro?: () => void, allPros?: any[], unreadConversations?: string[] }) {
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const userEmail = currentUser?.email || "";
  const isAdmin = proService.isAdmin(userEmail) || userProfile?.is_admin;

  const [editName, setEditName] = useState(userProfile?.full_name || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const [selectedDocKey, setSelectedDocKey] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('');
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);

  useEffect(() => {
    if (selectedDocKey) {
      setIsLoadingDoc(true);
      documentService.getDocument(selectedDocKey)
        .then(doc => {
          setDocTitle(doc.title);
          setDocContent(doc.content);
        })
        .catch(err => {
          console.error('Error loading doc:', err);
          setDocContent('Failed to load document.');
        })
        .finally(() => {
          setIsLoadingDoc(false);
        });
    } else {
      setDocContent('');
      setDocTitle('');
    }
  }, [selectedDocKey]);

  const [myTestimonies, setMyTestimonies] = useState<any[]>([]);
  const [loadingTestimonies, setLoadingTestimonies] = useState(false);
  const [editingTestimonyId, setEditingTestimonyId] = useState<string | number | null>(null);
  const [editTestimonyRating, setEditTestimonyRating] = useState(0);
  const [editTestimonyComment, setEditTestimonyComment] = useState("");
  const [isUpdatingTestimony, setIsUpdatingTestimony] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.full_name || "");
    }
  }, [userProfile]);

  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [showConfirmAction, setShowConfirmAction] = useState<{ [key: string]: 'approve' | 'delete' | null }>({});
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const fetchMyConversations = async () => {
    if (!currentUser) return;
    setLoadingConversations(true);
    try {
      const list = await chatService.getUserConversations(currentUser.id);
      setConversations(list || []);
    } catch (e) {
      console.error('Error fetching my conversations:', e);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMyTestimonies = async () => {
    const name = userProfile?.full_name || currentUser?.email?.split('@')[0] || '';
    if (!name) return;
    setLoadingTestimonies(true);
    try {
      const list = await proService.getMyTestimonies(name);
      setMyTestimonies(list);
    } catch (e) {
      console.error('Error fetching my testimonies:', e);
    } finally {
      setLoadingTestimonies(false);
    }
  };

  useEffect(() => {
    if (activeSubPage === 'My Account') {
      fetchMyTestimonies();
      fetchMyConversations();
    }
  }, [activeSubPage, userProfile]);

  useEffect(() => {
    scrollToTop?.();
  }, [activeSubPage]);

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUpdatingAvatar(true);
    try {
      const fileName = `${currentUser.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      // Use 'avatars' bucket as requested
      const publicUrl = await storageService.uploadFile('avatars', `avatars/${fileName}`, file);
      
      await authService.updateProfile({
        id: currentUser.id,
        avatar_url: publicUrl
      });
      
      onProfileUpdate?.();
    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Failed to update avatar. Please ensure bucket "avatars" is configured.');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-8 bg-slate-50 pb-32">
        <div className="w-20 h-20 bg-brand-blue/10 rounded-[30px] flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-brand-blue opacity-50" />
        </div>
        <div className="text-center space-y-3 mb-10 max-w-xs">
          <h2 className="text-2xl font-bold font-display text-brand-navy">Your Profile</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Join the Unlocked community to save your favorite pros, participate in events, and chat with members.
          </p>
        </div>
        <button 
          onClick={() => onNavigate?.('login')}
          className="w-full max-w-[280px] py-4 bg-brand-blue text-white rounded-2xl font-bold shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Lock className="w-5 h-5" />
          Log In or Sign Up
        </button>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await authService.signOut();
      onNavigate?.('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { label: 'My Account', icon: User, color: 'text-brand-blue font-bold text-brand-blue' },
    ...(isAdmin ? [{ label: 'Admin Dashboard', icon: ShieldCheck, color: 'text-brand-blue', action: () => onNavigate?.('admin') }] : []),
    { label: 'Suggest a Pro', icon: Star, color: 'text-brand-yellow', action: () => onAddPro?.() },
    { label: 'Feedback', icon: MessageSquare, color: 'text-[#00C2A8]' },
    { label: 'Account Security', icon: Shield },
    { label: 'Settings', icon: SlidersHorizontal },
    { label: 'Support', icon: HelpCircle },
    { label: 'About', icon: Info },
  ];

  return (
    <div className="pb-12">
      {/* Profile Header */}
      <div className="flex flex-col items-center pt-8 pb-10 bg-white border-b border-slate-100">
        <div 
          onClick={handleAvatarClick}
          className="relative w-24 h-24 rounded-full bg-brand-blue/10 border-4 border-white shadow-sm overflow-hidden mb-4 flex items-center justify-center cursor-pointer group"
        >
          {userProfile?.avatar_url ? (
            <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
          ) : (
            <User className="w-12 h-12 text-brand-blue group-hover:opacity-50 transition-opacity" />
          )}
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            {isUpdatingAvatar ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
          <input 
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold font-display text-brand-navy flex items-center justify-center gap-2">
            {userProfile?.full_name || userEmail.split('@')[0]}
            {unreadConversations.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => onNavigate?.('messages' as any)}
                className="relative group active:scale-90 transition-all ml-1"
                title={`${unreadConversations.length} new message${unreadConversations.length > 1 ? 's' : ''}`}
              >
                <div className="w-5 h-5 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 group-hover:bg-brand-blue/5 group-hover:border-brand-blue/20 transition-all">
                  <MessageCircle className="w-3 h-3 text-slate-400 group-hover:text-brand-blue" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 border border-white"></span>
                </span>
              </motion.button>
            )}
          </h2>
          {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-blue/10 text-brand-blue text-[10px] font-semibold uppercase tracking-widest rounded-full mt-1">
              <ShieldCheck className="w-3 h-3" /> Admin
            </span>
          )}
        </div>
      </div>

      {/* Menu List */}
      <div className="bg-white border-y border-slate-100">
        {menuItems.map((item, index) => (
          <button 
            key={index}
            onClick={() => item.action ? item.action() : setActiveSubPage(item.label)}
            className={cn(
              "w-full px-6 py-4 flex justify-between items-center active:bg-slate-50 hover:bg-slate-50/50 transition-all group",
              index !== menuItems.length - 1 && "border-b border-slate-50"
            )}
          >
            <div className="flex items-center gap-3 group-hover:translate-x-1 transition-transform">
              <item.icon className={cn("w-5 h-5 text-slate-400 group-hover:text-brand-blue transition-colors", item.color)} />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-wider">{item.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-blue transition-colors" />
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <div className="px-6 mt-8">
        <button 
          onClick={handleLogout}
          className="w-full py-4 text-slate-500 font-medium hover:text-red-500 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {/* Sub-pages */}
      <AnimatePresence>
        {activeSubPage === 'My Account' && (
          <ProfileSubPage key="subpage-my-account" title="My Account" onBack={() => setActiveSubPage(null)}>
            <div className="space-y-8 max-w-2xl mx-auto pb-10">
              {msg && (
                <div className={cn(
                  "p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                  msg.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                )}>
                  {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <p className="text-sm font-bold tracking-tight">{msg.text}</p>
                </div>
              )}
              
              {/* Profile Details Edit Form */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100/85 shadow-sm space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <User className="w-5 h-5 text-brand-blue" />
                  <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase">Edit Profile Information</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="text" 
                      value={userEmail} 
                      disabled 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed" 
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      placeholder="Your full name"
                      className="w-full px-4 py-3 bg-white border border-slate-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue rounded-xl text-sm font-medium text-slate-700 outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={async () => {
                      if (!currentUser) return;
                      setIsSavingProfile(true);
                      setMsg(null);
                      try {
                        await authService.updateProfile({
                          id: currentUser.id,
                          full_name: editName.trim()
                        });
                        onProfileUpdate?.();
                        setMsg({ type: 'success', text: 'Profile updated successfully!' });
                        // Clear success message after 3 seconds
                        setTimeout(() => setMsg(null), 3000);
                      } catch (err) {
                        console.error('Error saving profile:', err);
                        setMsg({ type: 'error', text: 'Could not update profile information.' });
                      } finally {
                        setIsSavingProfile(false);
                      }
                    }}
                    disabled={isSavingProfile || !editName.trim()}
                    className="px-6 py-3 bg-brand-blue text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-brand-blue/15 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>

              {/* Testimonials Left */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100/85 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-brand-yellow fill-brand-yellow" />
                    <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase">My Testimonials</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">{myTestimonies.length} Left</span>
                </div>

                {loadingTestimonies ? (
                  <div className="py-8 flex justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : myTestimonies.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 italic text-sm">
                    You have not left any testimonials yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myTestimonies.map((review) => {
                      const associatedPro = allPros?.find((p) => String(p.id) === String(review.pro_id));
                      const isEditing = editingTestimonyId === review.id;
                      const isProcessing = deletingId === review.id;
                      
                      return (
                        <div key={review.id} className={cn(
                          "p-5 rounded-2xl border transition-all duration-300",
                          review.status === 'pending' ? "bg-amber-50/30 border-amber-100" : 
                          review.status === 'refused' ? "bg-rose-50/30 border-rose-100" : "bg-slate-50/55 border-slate-100"
                        )}>
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-bold text-slate-800 text-sm truncate">
                                  {associatedPro ? associatedPro.name : 'Professional'}
                                </p>
                                <span className={cn(
                                  "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                                  review.status === 'approved' ? "bg-emerald-50 text-emerald-600" : 
                                  review.status === 'refused' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600 animate-pulse"
                                )}>
                                  {review.status || 'pending'}
                                </span>
                              </div>
                              {associatedPro?.profession && (
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{associatedPro.profession}</p>
                              )}
                            </div>
                            
                            {!isEditing && (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingTestimonyId(review.id);
                                    setEditTestimonyRating(review.rating);
                                    setEditTestimonyComment(review.comment);
                                  }}
                                  disabled={isProcessing}
                                  className="h-8 px-3 bg-white text-slate-500 border border-slate-200 rounded-xl hover:text-brand-blue hover:border-brand-blue/30 text-[10px] font-bold uppercase tracking-wide transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => setShowConfirmAction(prev => ({ ...prev, [review.id]: 'delete' }))}
                                  disabled={isProcessing}
                                  className={cn(
                                    "h-8 w-8 border rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0",
                                    isProcessing ? "bg-slate-50 border-slate-100 text-slate-300" : "bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100"
                                  )}
                                  title="Delete Review"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>

                          {showConfirmAction[review.id] === 'delete' && (
                            <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 flex flex-col gap-3 animate-in fade-in zoom-in-95 my-3">
                              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest text-center">Delete this testimonial permanently?</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    setDeletingId(review.id);
                                    try {
                                      const success = await proService.deleteTestimony(review.id);
                                      if (success) {
                                        await fetchMyTestimonies();
                                        setMsg({ type: 'success', text: 'Testimonial deleted successfully.' });
                                      }
                                    } catch (err) {
                                      console.error('Delete error:', err);
                                      setMsg({ type: 'error', text: 'Failed to delete testimonial.' });
                                    } finally {
                                      setDeletingId(null);
                                      setShowConfirmAction(prev => ({ ...prev, [review.id]: null }));
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="flex-1 h-9 bg-rose-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-600 transition-all disabled:opacity-50"
                                >
                                  {isProcessing ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                                <button
                                  onClick={() => setShowConfirmAction(prev => ({ ...prev, [review.id]: null }))}
                                  disabled={isProcessing}
                                  className="flex-1 h-9 bg-white text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-100 hover:bg-slate-50 transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {isEditing ? (
                            <div className="space-y-3 pt-2 bg-white rounded-xl p-3 border border-slate-200">
                              <div className="flex items-center gap-1">
                                <label className="text-xs font-bold text-slate-500 animate-pulse">Rating:</label>
                                <div className="flex items-center gap-0.5">
                                  {[1,2,3,4,5].map((s) => (
                                    <button 
                                      key={s} 
                                      onClick={() => setEditTestimonyRating(s)}
                                      className="p-0.5"
                                    >
                                      <Star className={cn("w-4 h-4", s <= editTestimonyRating ? "text-brand-yellow fill-brand-yellow" : "text-slate-200")} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <textarea 
                                value={editTestimonyComment}
                                onChange={(e) => setEditTestimonyComment(e.target.value)}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-blue/20"
                                rows={2}
                              />
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setEditingTestimonyId(null)}
                                  className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={async () => {
                                    setIsUpdatingTestimony(true);
                                    try {
                                      await proService.updateTestimony(review.id, editTestimonyRating, editTestimonyComment);
                                      setEditingTestimonyId(null);
                                      await fetchMyTestimonies();
                                      setMsg({ type: 'success', text: 'Review updated and sent for moderation.' });
                                    } catch (err) {
                                      console.error('Error saving testimony changes:', err);
                                    } finally {
                                      setIsUpdatingTestimony(false);
                                    }
                                  }}
                                  disabled={isUpdatingTestimony}
                                  className="px-3 py-1 bg-brand-blue text-white text-[10px] font-bold uppercase tracking-wider rounded-md"
                                >
                                  {isUpdatingTestimony ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={cn(
                                      "w-3 h-3", 
                                      i < review.rating ? "text-brand-yellow fill-brand-yellow" : "text-slate-200"
                                    )} 
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed italic">
                                "{review.comment}"
                              </p>
                              
                              {review.status === 'refused' && review.refusal_reason && (
                                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 mt-2">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <XCircle className="w-3 h-3 text-rose-500" />
                                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Reason for Refusal:</span>
                                  </div>
                                  <p className="text-[11px] text-rose-500/80 leading-normal">{review.refusal_reason}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Private Chats Access */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100/85 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase">Private Chats</h3>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed">
                  Connect with other community members regarding testimonials and reviews you have posted or discussed in the past.
                </p>

                <div className="space-y-3">
                  {loadingConversations ? (
                    <div className="py-6 flex justify-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100/80 text-center space-y-2">
                      <p className="text-xs font-bold text-slate-500">No active discussions yet</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">Discover pros and read user reviews to start a private chat with their authors!</p>
                      <button
                        onClick={() => {
                          setActiveSubPage(null);
                          onNavigate?.('explore');
                        }}
                        className="px-4 py-1.5 bg-brand-blue text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-blue-600 active:scale-95 mt-1"
                      >
                        Explore Pros
                      </button>
                    </div>
                  ) : (
                    conversations.slice(0, 3).map((conv) => {
                      const otherName = conv.otherUser?.full_name || 'Community Member';
                      const displayedName = formatName(otherName);
                      const otherAvatar = conv.otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayedName)}&background=random`;
                      
                      return (
                        <div 
                          key={conv.id} 
                          onClick={() => {
                            if (onNavigate) {
                              setActiveSubPage(null);
                              onNavigate('messages', { chat: conv });
                            }
                          }}
                          className="p-4 flex gap-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer transition-all active:scale-[0.98]"
                        >
                          <div className="relative flex-shrink-0">
                            <img src={otherAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-slate-800 truncate">{displayedName}</h4>
                              <span className="text-[9px] text-slate-400">
                                {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString([], {month: 'short', day: 'numeric'}) : ''}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">Click to view private conversation</p>
                          </div>
                          <div className="flex items-center">
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      );
                    })
                  )}
                  {conversations.length > 3 && (
                    <button
                      onClick={() => {
                        setActiveSubPage(null);
                        onNavigate?.('messages');
                      }}
                      className="w-full text-center py-2 text-xs font-bold text-brand-blue hover:text-blue-600 hover:underline transition-all"
                    >
                      See all conversations ({conversations.length})
                    </button>
                  )}
                </div>
              </div>

            </div>
          </ProfileSubPage>
        )}

        {activeSubPage === 'Account Security' && (
          <ProfileSubPage key="subpage-account-security" title="Account Security" onBack={() => setActiveSubPage(null)}>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-500">Add an extra layer of security to your account.</p>
                  </div>
                  <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                <p className="font-bold text-slate-900">Change Password</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Current Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-blue outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-blue outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-blue outline-none" />
                  </div>
                  <button className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold shadow-lg shadow-brand-blue/20 mt-4">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                <p className="font-bold text-slate-900">Login History</p>
                <div className="space-y-4">
                  {[
                    { device: 'iPhone 15 Pro', location: 'Valencia, ES', time: 'Active now' },
                    { device: 'MacBook Air', location: 'Valencia, ES', time: '2 hours ago' }
                  ].map((login, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-slate-700">{login.device}</p>
                        <p className="text-xs text-slate-400">{login.location}</p>
                      </div>
                      <span className="text-xs text-slate-400">{login.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ProfileSubPage>
        )}

        {activeSubPage === 'Settings' && (
          <ProfileSubPage key="subpage-settings" title="Settings" onBack={() => setActiveSubPage(null)}>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {[
                { 
                  title: 'Chat Participation', 
                  desc: 'Allow receiving and sending chat messages',
                  enabled: userProfile?.chat_enabled ?? true,
                  action: async () => {
                    if (userProfile) {
                      try {
                        const nextValue = userProfile.chat_enabled === undefined ? false : !userProfile.chat_enabled;
                        await authService.updateProfile({ 
                          id: userProfile.id, 
                          chat_enabled: nextValue 
                        });
                        onProfileUpdate?.();
                      } catch (err) {
                        console.error('Error updating chat participation:', err);
                      }
                    }
                  }
                }
              ].map((item, i) => (
                <div key={i} className={cn(
                  "p-6 flex items-center justify-between",
                  i !== 0 && "border-b border-slate-50"
                )}>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <div 
                    onClick={item.action}
                    className={cn(
                    "w-12 h-6 rounded-full relative transition-colors",
                    item.action ? "cursor-pointer" : "opacity-50 cursor-not-allowed",
                    item.enabled ? "bg-brand-blue" : "bg-slate-200"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                      item.enabled ? "right-1" : "left-1"
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </ProfileSubPage>
        )}

        {activeSubPage === 'Support' && (
          <ProfileSubPage key="subpage-support" title="Support" onBack={() => setActiveSubPage(null)}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <a 
                  href="mailto:hello.unlockd@gmail.com"
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-brand-blue/30 transition-all w-full"
                >
                  <div className="w-12 h-12 bg-brand-blue/5 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-brand-blue" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900 text-lg">Email Us</p>
                    <p className="text-sm text-slate-500">hello.unlockd@gmail.com</p>
                  </div>
                </a>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <p className="p-6 font-bold text-slate-900 border-b border-slate-50">Frequently Asked Questions</p>
                {[
                  'How do I book a professional?',
                  'What is the cancellation policy?',
                  'How can I list an item in marketplace?',
                  'Is my payment secure?'
                ].map((q, i) => (
                  <button key={i} className="w-full p-6 flex justify-between items-center hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <span className="text-sm font-medium text-slate-700">{q}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          </ProfileSubPage>
        )}

        {activeSubPage === 'About' && (
          <ProfileSubPage key="subpage-about" title="About Unlocked" onBack={() => setActiveSubPage(null)} className="bg-white">
            <div className="flex flex-col items-center text-center space-y-8 py-8">
              <Logo className="scale-125 mb-4" />
              <div>
                <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">Version 1.0</p>
              </div>
              <div className="w-full space-y-2 px-2">
                {[
                  { title: 'Privacy Policy', key: 'privacy_policy' },
                  { title: 'Community Guidelines', key: 'community_guidelines' },
                  { title: 'User Terms & Conditions', key: 'user_terms' },
                  { title: 'Provider Terms & Conditions', key: 'terms_of_service' },
                  { title: 'Cookie Policy', key: 'cookie_policy' }
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedDocKey(item.key)}
                    className="w-full p-4 bg-white rounded-xl border border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-medium text-slate-700">{item.title}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          </ProfileSubPage>
        )}

        {activeSubPage === 'Feedback' && (
          <ProfileSubPage key="subpage-feedback" title="Feedback" onBack={() => setActiveSubPage(null)}>
            <FeedbackSubPage currentUser={currentUser} onBack={() => setActiveSubPage(null)} />
          </ProfileSubPage>
        )}

        {selectedDocKey && (
          <ProfileSubPage key={`subpage-doc-${selectedDocKey}`} title={docTitle || "Document"} onBack={() => setSelectedDocKey(null)}>
            <div className="max-w-2xl mx-auto py-4">
              <button 
                onClick={() => setSelectedDocKey(null)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium mb-4 px-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to About
              </button>
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm">
                {isLoadingDoc ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                    <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Loading dynamic copy...</p>
                  </div>
                ) : (
                  <div className="text-slate-700 leading-relaxed font-sans space-y-6 text-sm sm:text-base">
                    <div className="markdown-body">
                      <Markdown>{docContent}</Markdown>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex justify-start">
                      <button 
                        onClick={() => setSelectedDocKey(null)}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to About
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ProfileSubPage>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileSubPage({ title, onBack, children, className }: { title: string, onBack: () => void, children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("fixed inset-0 z-[60] flex flex-col", className || "bg-slate-50")}
    >
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h2 className="text-xl font-semibold font-display text-brand-navy">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {children}
      </div>
    </motion.div>
  );
}
