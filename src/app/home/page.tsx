"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Clock, 
  BookOpen, 
  Zap, 
  Bell, 
  Calendar, 
  Search,
  Star,
  Headphones,
  MessageCircle,
  Award,
  Globe,
  PenTool,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X,
  Activity
} from 'lucide-react';

// TypeScript interfaces
interface UserProfile {
  name: string;
  membershipStatus: 'Premium' | 'Básico';
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  profileScore: number;
  avatarUrl?: string;
}

interface LearningMetrics {
  vocabularyMastered: number;
  vocabularyTotal: number;
  grammarScore: number;
  speakingScore: number;
  listeningScore: number;
  readingScore: number;
  writingScore: number;
  dailyStreak: number;
  weeklyProgress: number[];
  monthlyGoalCompletion: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

// Mock API functions
const fetchUserProfile = (): Promise<UserProfile> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: 'Carlos',
        membershipStatus: 'Premium',
        level: 'Intermedio',
        profileScore: 78,
      });
    }, 600);
  });
};

const fetchLearningMetrics = (): Promise<LearningMetrics> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        vocabularyMastered: 1250,
        vocabularyTotal: 2000,
        grammarScore: 82,
        speakingScore: 65,
        listeningScore: 76,
        readingScore: 85,
        writingScore: 70,
        dailyStreak: 42,
        weeklyProgress: [65, 70, 85, 75, 90, 80, 75],
        monthlyGoalCompletion: 68,
      });
    }, 800);
  });
};

const fetchNotifications = (): Promise<Notification[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          title: 'Lección Diaria',
          message: 'Tu lección diaria de "Verbos Irregulares" está lista.',
          read: false,
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: '2',
          title: 'Nuevo Logro',
          message: '¡Felicidades! Desbloqueaste el logro "Maestro de Vocabulario".',
          read: false,
          timestamp: new Date(Date.now() - 7200000),
        },
        {
          id: '3',
          title: 'Práctica Pendiente',
          message: 'No has completado tu práctica de conversación esta semana.',
          read: true,
          timestamp: new Date(Date.now() - 86400000),
        },
      ]);
    }, 700);
  });
};

// Main component
export default function EnglishLearningDashboard() {
  // States
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [activeMetricIndex, setActiveMetricIndex] = useState<number>(0);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Format date to Spanish format
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  // Capitalize first letter of date
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [profileData, metricsData, notificationsData] = await Promise.all([
          fetchUserProfile(),
          fetchLearningMetrics(),
          fetchNotifications(),
        ]);
        
        setUserProfile(profileData);
        setLearningMetrics(metricsData);
        setNotifications(notificationsData);
        setError(null);
      } catch (err) {
        setError('Error al cargar los datos. Por favor, inténtalo de nuevo más tarde.');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Set current date with interval to update every minute
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(dateInterval);
  }, []);

  // Handle search functionality
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    // Mock search functionality
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    // Simulate search results based on query
    const mockSearchItems = [
      'Vocabulario de negocios',
      'Verbos irregulares',
      'Práctica de escucha',
      'Ejercicios de gramática',
      'Pronunciación avanzada',
      'Phrasal verbs comunes',
    ];
    
    const results = mockSearchItems.filter(item => 
      item.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(results);
  }, []);

  // Toggle notification panel
  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };

  // Handle click outside notification panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current && 
        !notificationRef.current.contains(event.target as Node) &&
        showNotifications
      ) {
        setShowNotifications(false);
      }
      
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target as Node) &&
        isSearchFocused
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, isSearchFocused]);

  // Handle marking notifications as read
  const markAsRead = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Navigate between metrics
  const navigateMetrics = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setActiveMetricIndex(prev => (prev + 1) % 3);
    } else {
      setActiveMetricIndex(prev => (prev - 1 + 3) % 3);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <div className="flex items-center text-red-500 mb-4">
            
            {/* Vocabulary Flashcards */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <BookOpen className="text-green-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-800">Tarjetas de Vocabulario</h3>
                <p className="text-gray-600">50 nuevas palabras por aprender</p>
              </div>
              <button className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors text-sm">
                Repasar
              </button>
            </div>
            
            {/* Listening Exercise */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <Headphones className="text-purple-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-800">Ejercicio de Escucha</h3>
                <p className="text-gray-600">Comprensión de diálogos cotidianos</p>
              </div>
              <button className="px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors text-sm">
                Escuchar
              </button>
            </div><X size={24} className="mr-2" />
            <h2 className="text-xl font-bold">Error</h2>
          </div>
          <p className="text-gray-700">{error}</p>
          <button 
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get level color
  const getLevelColor = () => {
    switch (userProfile?.level) {
      case 'Principiante':
        return 'text-green-600';
      case 'Intermedio':
        return 'text-blue-600';
      case 'Avanzado':
        return 'text-purple-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 p-4">
      <div className="w-full bg-white rounded-2xl p-4 sm:p-6 font-sans shadow-md">
        {/* Header Section with Date and Notifications */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <span className="text-gray-600 mr-2">
              <Calendar size={20} />
            </span>
            <span className="text-gray-600">{capitalizedDate}</span>
          </div>
          <div className="relative" ref={notificationRef}>
            <button 
              className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={toggleNotifications}
              aria-label={`Notificaciones (${unreadCount} sin leer)`}
            >
              <Bell className="text-gray-600" size={20} />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {unreadCount}
                </div>
              )}
            </button>

            {/* Notifications Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden">
                <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Notificaciones</h3>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setShowNotifications(false)}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No hay notificaciones</div>
                  ) : (
                    notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 border-b border-gray-100 ${notification.read ? 'bg-white' : 'bg-blue-50'} hover:bg-gray-50 transition-colors cursor-pointer`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex justify-between mb-1">
                          <h4 className="font-medium text-gray-800">{notification.title}</h4>
                          <span className="text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-gray-100">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 p-2">
                    Marcar todas como leídas
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="flex items-center mb-8">
          <div className="w-14 h-14 rounded-full overflow-hidden mr-4 border border-gray-100 bg-blue-500 flex-shrink-0 flex items-center justify-center text-white">
            {userProfile?.avatarUrl ? (
              <img 
                src={userProfile.avatarUrl} 
                alt={userProfile.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold">
                {userProfile?.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">¡Hola, {userProfile?.name}!</h1>
            <div className="flex items-center flex-wrap gap-3 mt-1">
              <span className="flex items-center text-blue-600 text-sm">
                <Star className="mr-1" size={16} />
                {userProfile?.membershipStatus}
              </span>
              <span className={`flex items-center ${getLevelColor()} text-sm`}>
                <Award className="mr-1" size={16} />
                {userProfile?.level}
              </span>
              <span className="flex items-center text-orange-500 text-sm">
                <Activity className="mr-1" size={16} />
                {learningMetrics?.dailyStreak} días consecutivos
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8" ref={searchRef}>
          <input
            type="text"
            placeholder="Buscar lecciones, ejercicios, vocabulario..."
            className="w-full py-3 px-5 bg-gray-50 rounded-full text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            aria-label="Buscar en el dashboard"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Search className="text-gray-400" size={20} />
          </div>
          
          {/* Search Results */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div 
                    key={index} 
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => {
                      setSearchQuery(result);
                      setIsSearchFocused(false);
                    }}
                  >
                    <div className="flex items-center">
                      <Search size={16} className="text-gray-400 mr-2" />
                      <p className="text-gray-700">{result}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Learning Metrics Section - Now with 2 per row */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-800">Métricas de Aprendizaje</h2>
            <div>
              <MoreVertical size={20} className="text-gray-400" />
            </div>
          </div>
          <div className="relative">
            {/* Navigation Buttons */}
            <button 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center z-10 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => navigateMetrics('prev')}
              aria-label="Métrica anterior"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out" 
                style={{ transform: `translateX(-${activeMetricIndex * 100}%)` }}
              >
                {/* Page 1: Vocabulary and Grammar */}
                <div className="min-w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Vocabulary Card */}
                    <div className="bg-blue-100 rounded-xl p-6 flex flex-col items-center justify-center">
                      <div className="text-blue-600 mb-3">
                        <BookOpen size={24} />
                      </div>
                      <h3 className="text-blue-600 font-medium mb-4">Vocabulario</h3>
                      <div className="relative w-24 h-24 mb-2">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke="#e6f1fe" 
                            strokeWidth="10" 
                          />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke="#3b82f6" 
                            strokeWidth="10" 
                            strokeLinecap="round"
                            strokeDasharray="282.7"
                            strokeDashoffset={282.7 - (282.7 * (learningMetrics?.vocabularyMastered || 0) / (learningMetrics?.vocabularyTotal || 1))}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-blue-600">{Math.round((learningMetrics?.vocabularyMastered || 0) / (learningMetrics?.vocabularyTotal || 1) * 100)}%</span>
                        </div>
                      </div>
                      <p className="text-blue-600 text-center">
                        {learningMetrics?.vocabularyMastered} / {learningMetrics?.vocabularyTotal} palabras
                      </p>
                    </div>
                    
                    {/* Grammar Card */}
                    <div className="bg-green-100 rounded-xl p-6 flex flex-col items-center justify-center">
                      <div className="text-green-600 mb-3">
                        <PenTool size={24} />
                      </div>
                      <h3 className="text-green-600 font-medium mb-2">Gramática</h3>
                      <div className="text-3xl font-bold text-green-600 mb-4">{learningMetrics?.grammarScore}/100</div>
                      <div className="w-full flex items-end justify-center space-x-1 h-14">
                        {/* Grammar score visualization */}
                        <div className="w-full bg-green-200 rounded-full h-4">
                          <div 
                            className="bg-green-500 rounded-full h-4 transition-all duration-1000"
                            style={{ width: `${learningMetrics?.grammarScore || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Page 2: Speaking and Listening */}
                <div className="min-w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Speaking Card */}
                    <div className="bg-orange-100 rounded-xl p-6 flex flex-col items-center justify-center">
                      <div className="text-orange-500 mb-3">
                        <MessageCircle size={24} />
                      </div>
                      <h3 className="text-orange-500 font-medium mb-4">Conversación</h3>
                      <div className="relative w-24 h-24 mb-2">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke="#ffedd5" 
                            strokeWidth="10" 
                          />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke="#f97316" 
                            strokeWidth="10" 
                            strokeLinecap="round"
                            strokeDasharray="282.7"
                            strokeDashoffset={282.7 - (282.7 * (learningMetrics?.speakingScore || 0) / 100)}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-orange-500">{learningMetrics?.speakingScore}</span>
                        </div>
                      </div>
                      <p className="text-orange-500">Habilidad de Conversación</p>
                    </div>
                    
                    {/* Listening Card */}
                    <div className="bg-purple-100 rounded-xl p-6 flex flex-col items-center justify-center">
                      <div className="text-purple-600 mb-3">
                        <Headphones size={24} />
                      </div>
                      <h3 className="text-purple-600 font-medium mb-2">Comprensión Auditiva</h3>
                      <div className="text-3xl font-bold text-purple-600 mb-4">{learningMetrics?.listeningScore}/100</div>
                      <div className="w-full flex items-end justify-center space-x-1 h-14">
                        <div className="w-full bg-purple-200 rounded-full h-4">
                          <div 
                            className="bg-purple-500 rounded-full h-4 transition-all duration-1000"
                            style={{ width: `${learningMetrics?.listeningScore || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Page 3: Reading and Writing */}
                <div className="min-w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Reading Card */}
                    <div className="bg-yellow-100 rounded-xl p-6 flex flex-col items-center justify-center">
                      <div className="text-yellow-600 mb-3">
                        <BookOpen size={24} />
                      </div>
                      <h3 className="text-yellow-600 font-medium mb-4">Lectura</h3>
                      <div className="relative w-24 h-24 mb-2">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke="#fef3c7" 
                            strokeWidth="10" 
                          />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke="#d97706" 
                            strokeWidth="10" 
                            strokeLinecap="round"
                            strokeDasharray="282.7"
                            strokeDashoffset={282.7 - (282.7 * (learningMetrics?.readingScore || 0) / 100)}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-yellow-600">{learningMetrics?.readingScore}</span>
                        </div>
                      </div>
                      <p className="text-yellow-600">Comprensión de Lectura</p>
                    </div>
                    
                    {/* Writing Card */}
                    <div className="bg-red-100 rounded-xl p-6 flex flex-col items-center justify-center">
                      <div className="text-red-600 mb-3">
                        <PenTool size={24} />
                      </div>
                      <h3 className="text-red-600 font-medium mb-2">Escritura</h3>
                      <div className="text-3xl font-bold text-red-600 mb-4">{learningMetrics?.writingScore}/100</div>
                      <div className="w-full flex items-end justify-center space-x-1 h-14">
                        <div className="w-full bg-red-200 rounded-full h-4">
                          <div 
                            className="bg-red-500 rounded-full h-4 transition-all duration-1000"
                            style={{ width: `${learningMetrics?.writingScore || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center z-10 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => navigateMetrics('next')}
              aria-label="Siguiente métrica"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
          
          {/* Pagination Dots */}
          <div className="flex justify-center space-x-2 mt-5">
            {[0, 1, 2].map((index) => (
              <button 
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  activeMetricIndex === index ? 'bg-gray-800' : 'bg-gray-300'
                }`}
                onClick={() => setActiveMetricIndex(index)}
                aria-label={`Ir a métrica ${index + 1}`}
              ></button>
            ))}
          </div>
        </div>

        {/* Learning Activities Section */}
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-800">Actividades de Aprendizaje</h2>
            <div>
              <MoreVertical size={20} className="text-gray-400" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Lesson */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <MessageCircle className="text-orange-500" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-800">Práctica de Conversación</h3>
                <p className="text-gray-600">15 minutos de práctica pendiente</p>
              </div>
              <button className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors text-sm">
                Practicar
              </button>
            </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <Clock className="text-blue-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-800">Lección Diaria</h3>
                <p className="text-gray-600">Verbos Irregulares: Parte 2</p>
              </div>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors text-sm">
                Comenzar
              </button>
            </div>
            
            {/* Speaking Practice */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <Headphones className="text-yellow-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-800">Ejercicio
                  de Escucha</h3>
                  </div>  
                </div>
              </div>
            </div>
          </div>
  )}