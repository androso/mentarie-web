"use client"

import React, { useEffect, useState } from 'react';
import { Home, Book, BarChart2, User, LogOut, Check, Lock, Trophy, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCourses, useLevelRoadmap } from '@/hooks/useCourses';
import type { CourseWithUnits, UnitWithStatus } from '@/lib/types';

const LanguageLearningDashboard = () => {
  const [activeSection, setActiveSection] = useState('learn');
  const router = useRouter();
  const { user, nativeLanguage, learningLanguages, isLoading, logoutMutation } = useAuth();

  const displayName = user?.name || 'Learner';
  const firstName = displayName.trim().split(/\s+/)[0] || 'Learner';
  const profileImage = user?.image || '/api/placeholder/56/56';
  const primaryLearningLanguage = learningLanguages[0];

  const primaryLanguageId = primaryLearningLanguage?.languageId;
  const primaryLevelCode = primaryLearningLanguage?.level;
  const validLevelCode =
    primaryLevelCode && ['a2', 'b1', 'b2'].includes(primaryLevelCode)
      ? primaryLevelCode
      : undefined;

  const { coursesWithUnits, isLoading: roadmapLoading } = useLevelRoadmap(
    validLevelCode,
    primaryLanguageId,
  );
  const { data: allCourses } = useCourses(primaryLanguageId);

  const primaryLanguageName = primaryLearningLanguage?.name || 'Not set';
  const primaryLanguageLevel = primaryLearningLanguage?.level.toUpperCase() || 'Not set';
  const learningLanguageSummary =
    learningLanguages.length > 0
      ? learningLanguages
          .map((lang) => `${lang.name} (${lang.level.toUpperCase()})`)
          .join(', ')
      : 'No learning languages selected yet';
  const nativeLanguageName = nativeLanguage?.name || 'Not set';

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!isLoading && user && (!nativeLanguage || learningLanguages.length === 0)) {
      router.push('/onboarding');
    }
  }, [isLoading, user, nativeLanguage, learningLanguages.length, router]);

  const handleSignOut = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => router.push('/'),
    });
  };

  if (isLoading) {
    return <div className="bg-gray-100 min-h-screen" />;
  }

  if (!user) {
    return null;
  }
  
  // Derive the "next up" unit for the Today's Lesson card
  const nextUnit = (() => {
    for (const course of coursesWithUnits) {
      const active = course.units.find((u) => u.status === 'in_progress');
      if (active) return { unit: active, course };
    }
    for (const course of coursesWithUnits) {
      const next = course.units.find((u) => u.status === 'unlocked');
      if (next) return { unit: next, course };
    }
    return null;
  })();

  const renderUnitNode = (unit: UnitWithStatus, isLast: boolean) => {
    const nodeSize = unit.isCapstone ? 'w-20 h-20' : 'w-14 h-14';
    const iconSize = unit.isCapstone ? 'h-9 w-9' : 'h-7 w-7';

    const nodeStyle =
      unit.status === 'completed'
        ? 'bg-green-500 text-white shadow-md'
        : unit.status === 'in_progress'
          ? 'bg-[#4e342e] text-white shadow-md'
          : unit.status === 'unlocked'
            ? 'bg-white border-2 border-[#4e342e] text-[#4e342e]'
            : 'bg-gray-100 border border-gray-200 text-gray-300';

    const labelStyle =
      unit.status === 'locked' ? 'text-gray-400' : 'text-gray-900';

    return (
      <div key={unit.id} className="relative flex items-start mb-6 w-full">
        {/* Connector line */}
        {!isLast && (
          <div className="absolute left-[26px] top-14 bottom-0 w-px border-l border-dashed border-gray-300" />
        )}

        {/* Node circle */}
        <div
          className={`${nodeSize} rounded-full flex-shrink-0 flex items-center justify-center z-10 ${nodeStyle}`}
        >
          {unit.status === 'completed' ? (
            <Check className={iconSize} />
          ) : unit.status === 'locked' ? (
            <Lock className={iconSize} />
          ) : unit.isCapstone ? (
            <Trophy className={iconSize} />
          ) : (
            <ChevronRight className={iconSize} />
          )}
        </div>

        {/* Label */}
        <div className="ml-4 pt-1">
          <p className={`font-semibold leading-tight ${labelStyle}`}>
            {unit.title}
            {unit.isCapstone && (
              <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Capstone
              </span>
            )}
          </p>
          <p className="text-sm text-gray-500 mt-0.5 leading-snug">
            {unit.communicativeGoal}
          </p>
        </div>
      </div>
    );
  };

  const renderCourseBlock = (course: CourseWithUnits) => (
    <div key={course.id} className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Block {course.blockOrder}
        </span>
        <span className="text-gray-300">·</span>
        <h3 className="text-base font-bold text-[#4e342e]">{course.title}</h3>
      </div>
      <div className="pl-0">
        {course.units.length === 0
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center mb-6">
                <div className="w-14 h-14 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="ml-4 space-y-2">
                  <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))
          : course.units.map((unit, idx) =>
              renderUnitNode(unit, idx === course.units.length - 1),
            )}
      </div>
    </div>
  );

  // Content for Learn section (default)
  const renderLearnContent = () => (
    <div className="max-w-4xl mx-auto p-8">
      {/* User Header */}
      <div className="flex items-center mb-10">
        <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center mr-4">
          <img src={profileImage} alt="Profile" className="object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Hi, {firstName}!</h1>
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
              {primaryLanguageLevel}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Lesson */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 text-[#4e342e]">Today's Lesson</h2>
        <p className="text-gray-600">Continue your progress</p>
      </div>

      {/* Next unit card */}
      <div className="mb-12 border border-gray-200 rounded-lg p-6 shadow-sm bg-white">
        {roadmapLoading ? (
          <div className="space-y-3">
            <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : nextUnit ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
              {nextUnit.unit.status === 'in_progress' ? 'Continue' : 'Up next'} · {nextUnit.course.title}
            </p>
            <p className="font-semibold text-gray-900 mb-1">{nextUnit.unit.title}</p>
            <p className="text-sm text-gray-500 mb-4">{nextUnit.unit.communicativeGoal}</p>
            <div className="flex justify-end">
              <button className="bg-[#4e342e] text-white py-2 px-4 rounded-full text-sm hover:bg-[#6d4c41] transition-colors">
                {nextUnit.unit.status === 'in_progress' ? 'Resume' : 'Start'}
              </button>
            </div>
          </>
        ) : coursesWithUnits.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {validLevelCode ? 'No courses available yet.' : 'Courses for your level are coming soon.'}
          </p>
        ) : (
          <p className="text-gray-500 text-sm">All units completed — great work!</p>
        )}
      </div>

      {/* Level Roadmap */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-8 text-[#4e342e]">
          {validLevelCode ? `Level ${validLevelCode.toUpperCase()} Roadmap` : 'Your Roadmap'}
        </h2>

        {coursesWithUnits.length === 0 && !roadmapLoading ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">Coming soon</p>
            <p className="text-sm">Courses for your level are being prepared.</p>
          </div>
        ) : (
          coursesWithUnits.map(renderCourseBlock)
        )}
      </div>
    </div>
  );
  
  const renderCoursesContent = () => {
    const grouped = (allCourses ?? []).reduce<Record<string, typeof allCourses>>((acc, c) => {
      if (!c) return acc;
      const key = c.levelCode.toUpperCase();
      if (!acc[key]) acc[key] = [];
      acc[key]!.push(c);
      return acc;
    }, {});

    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-2 text-[#4e342e]">My Courses</h1>
        <p className="text-gray-600 mb-8">Browse and manage your enrolled courses.</p>

        {!allCourses ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm animate-pulse">
                <div className="h-6 w-36 bg-gray-100 rounded mb-3" />
                <div className="h-4 w-20 bg-gray-100 rounded mb-4" />
                <div className="h-2 w-full bg-gray-100 rounded mb-4" />
                <div className="h-4 w-16 bg-gray-100 rounded ml-auto" />
              </div>
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">Coming soon</p>
            <p className="text-sm">Courses for your level are being prepared.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([level, levelCourses]) => (
            <div key={level} className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Level {level}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(levelCourses ?? []).map((course) => {
                  if (!course) return null;
                  const pct = course.totalUnits > 0
                    ? Math.round((course.completedUnits / course.totalUnits) * 100)
                    : 0;
                  const isComplete = course.completedUnits === course.totalUnits && course.totalUnits > 0;
                  const hasStarted = course.completedUnits > 0;

                  return (
                    <div
                      key={course.id}
                      className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-lg font-bold text-[#4e342e] leading-tight pr-2">
                          {course.title}
                        </h3>
                        <span
                          className={`flex-shrink-0 text-xs py-1 px-2.5 rounded-full font-medium ${
                            isComplete
                              ? 'bg-green-100 text-green-700'
                              : hasStarted
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {isComplete ? 'Completed' : hasStarted ? 'In progress' : 'Not started'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-4">Block {course.blockOrder}</p>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Units completed</span>
                          <span>{course.completedUnits} / {course.totalUnits}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-[#4e342e] h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          className="text-sm text-[#4e342e] font-medium hover:underline flex items-center gap-1"
                          onClick={() => setActiveSection('learn')}
                        >
                          {isComplete ? 'Review' : hasStarted ? 'Continue' : 'Start'}
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };
  
  const renderStatsContent = () => (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-[#4e342e]">My Statistics</h1>
      <p className="text-gray-600 mb-8">Track your learning progress and achievements.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-medium text-[#4e342e] mb-1">Days Streak</h3>
          <p className="text-3xl font-bold text-[#4e342e]">14</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-medium text-[#4e342e] mb-1">Words Learned</h3>
          <p className="text-3xl font-bold text-[#4e342e]">238</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-medium text-[#4e342e] mb-1">Fluency Score</h3>
          <p className="text-3xl font-bold text-[#4e342e]">67%</p>
        </div>
      </div>
      
      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
        <h3 className="text-xl font-bold mb-4 text-[#4e342e]">Weekly Activity</h3>
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
      <h1 className="text-3xl font-bold mb-6 text-[#4e342e]">My Account</h1>
      <p className="text-gray-600 mb-8">Manage your profile and application settings.</p>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-4 text-[#4e342e]">Profile Information</h2>
        <div className="flex items-start">
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center mr-6">
            <img src={profileImage} alt="Profile" className="object-cover" />
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={displayName} className="w-full p-2 border border-gray-300 rounded-md" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={user.email} className="w-full p-2 border border-gray-300 rounded-md" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <input type="text" value={primaryLanguageName} className="w-full p-2 border border-gray-300 rounded-md" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency Level</label>
                <input type="text" value={primaryLanguageLevel} className="w-full p-2 border border-gray-300 rounded-md" readOnly />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Native Language</label>
              <input type="text" value={nativeLanguageName} className="w-full p-2 border border-gray-300 rounded-md" readOnly />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Learning Languages</label>
              <p className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {learningLanguageSummary}
              </p>
            </div>
            <button className="mt-4 bg-[#4e342e] text-white py-2 px-4 rounded-md hover:bg-[#6d4c41]">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-[#4e342e]">Subscription</h2>
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
              onClick={(event) => {
                event.preventDefault();
                handleSignOut();
              }}
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