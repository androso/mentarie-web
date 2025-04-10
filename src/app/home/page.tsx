"use client"

import React, { useState } from 'react';
import { Home, Book, BarChart2, User, LogOut, Circle, AlertCircle, FileText, MessageSquare } from 'lucide-react';

const LanguageLearningDashboard = () => {
  const [activeSection, setActiveSection] = useState('learn');
  
  // Content for Learn section (default)
  const renderLearnContent = () => (
    <div className="max-w-4xl mx-auto p-8">
      {/* User Header */}
      <div className="flex items-center mb-10">
        <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center mr-4">
          <img src="/api/placeholder/56/56" alt="Profile" className="object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Hi, rosmeo!</h1>
          <div className="flex items-center space-x-4 mt-1">
            <div className="h-6 w-10 flex items-center justify-center">
              <span>🇺🇸</span>
            </div>
            <div className="flex items-center text-[#4e342e]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Pro Member
            </div>
            <div className="flex items-center text-[#4e342e]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              </svg>
              A2
            </div>
          </div>
        </div>
      </div>

      {/* Today's Lesson */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Today's Lesson</h2>
        <p className="text-gray-600">Continue your progress</p>
      </div>

      {/* Conversations Card */}
      <div className="mb-12 border border-gray-200 rounded-lg p-6 shadow-sm bg-white">
        <div className="flex items-center mb-4">
          <MessageSquare className="h-5 w-5 text-[#4e342e] mr-2" />
          <span className="font-medium text-gray-900">Conversations</span>
        </div>
        <p className="mb-4 text-gray-600">Food & Friends</p>
        <div className="flex justify-end">
          <button className="bg-[#4e342e] text-white py-2 px-4 rounded-full text-sm hover:bg-[#6d4c41] transition-colors">
            View all units
          </button>
        </div>
      </div>

      {/* Unit Progress */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-8 text-gray-900">Unit Progress</h2>
        
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-1/2 w-px border-l border-dashed border-gray-300 -translate-x-1/2"></div>
            
            {/* Progress point 1 - Active */}
            <div className="relative flex justify-center mb-20">
              <div className="w-16 h-16 rounded-full bg-[#4e342e] flex items-center justify-center z-10 shadow-md">
                <Circle className="h-8 w-8 text-white" />
              </div>
            </div>
            
            {/* Progress point 2 */}
            <div className="relative flex justify-center mb-20">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center z-10 border border-gray-200">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            
            {/* Progress point 3 */}
            <div className="relative flex justify-center mb-20">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center z-10 border border-gray-200">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            
            {/* Progress point 4 */}
            <div className="relative flex justify-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center z-10 border border-gray-200">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Simple placeholder content for other sections
  const renderCoursesContent = () => (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">My Courses</h1>
      <p className="text-gray-600 mb-8">Browse and manage your enrolled courses.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((course) => (
          <div key={course} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold mb-2">Course {course}</h3>
            <p className="text-gray-600 mb-4">Course description goes here. This would show information about the course.</p>
            <div className="flex justify-between items-center">
              <span className="text-sm bg-green-100 text-green-800 py-1 px-3 rounded-full">In Progress</span>
              <button className="text-[#4e342e] hover:underline">Continue</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderStatsContent = () => (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">My Statistics</h1>
      <p className="text-gray-600 mb-8">Track your learning progress and achievements.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-medium text-gray-500 mb-1">Days Streak</h3>
          <p className="text-3xl font-bold text-[#4e342e]">14</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-medium text-gray-500 mb-1">Words Learned</h3>
          <p className="text-3xl font-bold text-[#4e342e]">238</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-medium text-gray-500 mb-1">Fluency Score</h3>
          <p className="text-3xl font-bold text-[#4e342e]">67%</p>
        </div>
      </div>
      
      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
        <h3 className="text-xl font-bold mb-4">Weekly Activity</h3>
        <div className="h-64 flex items-end justify-between">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <div key={day} className="flex flex-col items-center">
              <div className="w-10 bg-[#4e342e] rounded-t-sm mb-2" style={{height: `${20 + i * 20}px`}}></div>
              <span className="text-sm text-gray-500">{day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  const renderAccountContent = () => (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>
      <p className="text-gray-600 mb-8">Manage your profile and application settings.</p>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-4">Profile Information</h2>
        <div className="flex items-start">
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center mr-6">
            <img src="/api/placeholder/96/96" alt="Profile" className="object-cover" />
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value="Rosmeo" className="w-full p-2 border border-gray-300 rounded-md" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value="rosmeo@example.com" className="w-full p-2 border border-gray-300 rounded-md" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <input type="text" value="English" className="w-full p-2 border border-gray-300 rounded-md" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency Level</label>
                <input type="text" value="A2" className="w-full p-2 border border-gray-300 rounded-md" readOnly />
              </div>
            </div>
            <button className="mt-4 bg-[#4e342e] text-white py-2 px-4 rounded-md hover:bg-[#6d4c41]">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Subscription</h2>
        <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Pro Member - Active</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Your subscription renews on May 1, 2025</p>
        </div>
        <button className="text-[#4e342e] border border-[#4e342e] py-2 px-4 rounded-md hover:bg-gray-50">
          Manage Subscription
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white text-[#4e342e] flex flex-col h-screen fixed left-0 border-r border-gray-200">
        {/* Logo */}
        <div className="pt-5 pb-4">
          <h1 className="text-2xl font-bold text-[#4e342e] text-center">Mentarie</h1>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 flex flex-col">
          <a 
            href="#" 
            className={`flex items-center px-5 py-4 font-medium gap-2.5 ${activeSection === 'learn' ? 'bg-[#4e342e] text-white' : 'text-[#4e342e] hover:bg-gray-100'}`}
            onClick={() => setActiveSection('learn')}
          >
            <Home className="h-5 w-5" />
            Learn
          </a>
          <a 
            href="#" 
            className={`flex items-center px-5 py-4 font-medium gap-2.5 ${activeSection === 'courses' ? 'bg-[#4e342e] text-white' : 'text-[#4e342e] hover:bg-gray-100'}`}
            onClick={() => setActiveSection('courses')}
          >
            <Book className="h-5 w-5" />
            Courses
          </a>
          <a 
            href="#" 
            className={`flex items-center px-5 py-4 font-medium gap-2.5 ${activeSection === 'stats' ? 'bg-[#4e342e] text-white' : 'text-[#4e342e] hover:bg-gray-100'}`}
            onClick={() => setActiveSection('stats')}
          >
            <BarChart2 className="h-5 w-5" />
            Stats
          </a>
          <a 
            href="#" 
            className={`flex items-center px-5 py-4 font-medium gap-2.5 ${activeSection === 'account' ? 'bg-[#4e342e] text-white' : 'text-[#4e342e] hover:bg-gray-100'}`}
            onClick={() => setActiveSection('account')}
          >
            <User className="h-5 w-5" />
            Account
          </a>
          
          <div className="mt-auto">
            <a 
              href="#" 
              className="flex items-center px-5 py-4 text-[#4e342e] hover:bg-gray-100 gap-2.5 border-t border-gray-200"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </a>
          </div>
        </nav>
      </div>
      
      {/* Main Content Area - shifts based on sidebar width */}
      <div className="ml-64 min-h-screen">
        {activeSection === 'learn' && renderLearnContent()}
        {activeSection === 'courses' && renderCoursesContent()}
        {activeSection === 'stats' && renderStatsContent()}
        {activeSection === 'account' && renderAccountContent()}
      </div>
    </div>
  );
};

export default LanguageLearningDashboard;