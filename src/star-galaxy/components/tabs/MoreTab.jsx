import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronRight,
  Lock,
} from 'lucide-react';
import GospelDiary from '../diary/GospelDiary';
import FilesManager from '../files/FilesManager';
import MediaManager from '../media/MediaManager';

export default function MoreTab() {
  const {
    currentUser,
    data,
    setActiveTab,
    t,
  } = useApp();

  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  const diaryCount = (currentUser?.id && data.gospelDiary?.[currentUser.id]?.length) || 0;

  // Calculate visible files count for the badge
  const visibleFilesCount = useMemo(() => {
    const allFiles = data.sharedFiles || [];
    if (currentUser?.role === 'admin') return allFiles.length;
    return allFiles.filter(f => {
      if (!f.assignedTo || f.assignedTo === 'all') return true;
      if (Array.isArray(f.assignedTo)) {
        return f.assignedTo.includes('all') || f.assignedTo.includes(currentUser?.id);
      }
      return false;
    }).length;
  }, [data.sharedFiles, currentUser]);

  // Calculate visible Fellowship Media count (combining galleryMedia and any legacy childrenMedia)
  const visibleMediaCount = useMemo(() => {
    const all = data.galleryMedia || [];
    if (currentUser?.role === 'admin') return all.length;
    return all.filter(m => !m.isArchived).length;
  }, [data.galleryMedia, currentUser]);

  // If user opened Gospel Diary, show full Diary view
  if (isDiaryOpen) {
    return (
      <div className="pb-24 pt-2 animate-in fade-in duration-300">
        <GospelDiary onBack={() => setIsDiaryOpen(false)} />
      </div>
    );
  }

  // If user opened Files, show full Files view
  if (isFilesOpen) {
    return (
      <div className="pb-24 pt-2 animate-in fade-in duration-300">
        <FilesManager onBack={() => setIsFilesOpen(false)} />
      </div>
    );
  }

  // If user opened Fellowship Media, show full Media view
  if (isMediaOpen) {
    return (
      <div className="pb-24 pt-2 animate-in fade-in duration-300">
        <MediaManager onBack={() => setIsMediaOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 pt-1 animate-in fade-in duration-300">
      {/* Quick Action Cards Grid (Bright & Colourful) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* 📖 Gospel Diary Card */}
        <div
          onClick={() => setIsDiaryOpen(true)}
          className="bg-gradient-to-r from-amber-100 via-amber-50 to-orange-100 rounded-3xl p-4 sm:p-5 border-2 border-amber-400 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between group active:scale-95 hover:scale-[1.02]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-200 text-xl">
              📖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm sm:text-base text-amber-950">
                  Gospel Diary
                </h4>
                <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs">
                  <Lock className="w-2.5 h-2.5" />
                  Private
                </span>
              </div>
              <p className="text-[11px] font-bold text-amber-800 mt-0.5">
                Personal Spiritual Notes & Reflections
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-xs">
              {diaryCount} Notes
            </span>
            <ChevronRight className="w-5 h-5 text-amber-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 📁 Files Card (Google Docs, Drive Videos, Audios, PDFs) */}
        <div
          onClick={() => setIsFilesOpen(true)}
          className="bg-gradient-to-r from-emerald-100 via-teal-50 to-cyan-100 rounded-3xl p-4 sm:p-5 border-2 border-emerald-400 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between group active:scale-95 hover:scale-[1.02]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-200 text-xl">
              📁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm sm:text-base text-emerald-950">
                  Files
                </h4>
                <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                  Docs & Media
                </span>
              </div>
              <p className="text-[11px] font-bold text-emerald-800 mt-0.5">
                Documents, Videos, Audios & PDFs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-xs">
              {visibleFilesCount} Files
            </span>
            <ChevronRight className="w-5 h-5 text-emerald-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 📷 Media Card (Directly Below Files, with Special, Children & Custom Categories Inside!) */}
        <div
          onClick={() => setIsMediaOpen(true)}
          className="bg-gradient-to-r from-purple-100 via-fuchsia-50 to-pink-100 rounded-3xl p-4 sm:p-5 border-2 border-purple-400 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between group active:scale-95 hover:scale-[1.02] md:col-span-2"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-200 text-xl">
              📷
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm sm:text-base text-purple-950">
                  Media
                </h4>
                <span className="bg-purple-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                  Special, Children & Categories
                </span>
              </div>
              <p className="text-[11px] font-bold text-purple-800 mt-0.5">
                Fellowship Photos, Children Activities, Videos & Spiritual Realizations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-xs">
              {visibleMediaCount} Items
            </span>
            <ChevronRight className="w-5 h-5 text-purple-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 👑 Admin Management Center Card (Admin Only) */}
        {currentUser?.role === 'admin' && (
          <div
            onClick={() => setActiveTab('admin')}
            className="bg-gradient-to-r from-purple-100 via-indigo-50 to-pink-100 rounded-3xl p-4 sm:p-5 border-2 border-purple-400 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between group active:scale-95 hover:scale-[1.02] md:col-span-2"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-200 text-xl">
                👑
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base text-purple-950">
                  {t('adminPanelTitle') || 'Admin Management Center'}
                </h4>
                <p className="text-[11px] font-bold text-purple-800 mt-0.5">
                  Member Approvals, Roles, Permissions & Database
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1.5 rounded-2xl text-xs font-black shadow-xs">
                Open Tab
              </span>
              <ChevronRight className="w-5 h-5 text-purple-700 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
