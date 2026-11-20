import React, { useState } from 'react';
import { SmilePlus, X, Keyboard, Sparkles, Users, User, Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const COMMON_EMOJIS = ['❤️', '🙏', '👏', '⭐', '🔥', '🎉'];

const EMOJI_PALETTES = {
  Faces: ['😊', '😇', '😍', '🥳', '😎', '🥺', '🤗', '🤔', '🥰', '🤩', '😄', '😌'],
  Faith: ['🙏', '🙌', '👏', '🕊️', '💐', '📖', '💒', '🕯️', '🌸', '✨', '🌿', '🌾'],
  Glory: ['⭐', '🌟', '👑', '🏆', '🥇', '🛡️', '💎', '🌈', '☀️', '💖', '🔥', '⚡'],
  Party: ['🎉', '🎊', '🎈', '🚀', '🎁', '🎂', '🥳', '💌', '🔔', '💪', '👍', '💯'],
};

export default function EmojiReactionPicker({ reactions = {}, onReact, currentUser }) {
  const { data } = useApp() || {};
  const allUsers = data?.users || [];

  const [showPicker, setShowPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Faces');
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [viewingReaction, setViewingReaction] = useState(null); // Boolean or { emoji, users }
  const [activeReactionTab, setActiveReactionTab] = useState('all'); // 'all' | specific emoji

  const userId = currentUser?.id;
  const reactionEntries = Object.entries(reactions || {}).filter(
    ([_, users]) => Array.isArray(users) && users.length > 0
  );

  const totalReactionsCount = reactionEntries.reduce((acc, [_, users]) => acc + users.length, 0);

  // Flatten all reactions for the "All" tab: [{ uId, emoji }]
  const allReactedItems = [];
  reactionEntries.forEach(([emoji, users]) => {
    users.forEach(uId => {
      allReactedItems.push({ uId, emoji });
    });
  });

  const getUserInfo = (uId) => {
    const u = allUsers.find(x => x.id === uId || x.username === uId);
    if (u) {
      return {
        id: u.id,
        name: u.name || u.username,
        nickname: u.nickname || '',
        role: u.role || 'member',
      };
    }
    if (uId === 'surya11008') {
      return { id: 'surya11008', name: 'Surya', nickname: 'Admin', role: 'admin' };
    }
    return { id: uId, name: uId, nickname: '', role: 'member' };
  };

  const handleEmojiClick = (emoji) => {
    if (!emoji || !onReact) return;
    onReact(emoji.trim());
    setShowPicker(false);
    setCustomEmojiInput('');
  };

  const handleCustomSubmit = (e) => {
    if (e) e.preventDefault();
    if (!customEmojiInput.trim()) return;

    // Extract first emoji or full string
    const emojiMatch = customEmojiInput.trim();
    if (emojiMatch) {
      handleEmojiClick(emojiMatch);
    }
  };

  return (
    <div className="pt-2 border-t border-slate-100 space-y-2">
      {/* 1. Quick Reaction Toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-0.5">
          <span>React:</span>
        </span>

        {/* Quick Common Emojis */}
        {COMMON_EMOJIS.map((emoji) => {
          const userList = reactions[emoji] || [];
          const hasReacted = userId && userList.includes(userId);

          return (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-sm sm:text-base transition-all duration-150 active:scale-125 cursor-pointer hover:bg-amber-100/60 ${
                hasReacted
                  ? 'bg-amber-100 border-2 border-amber-400 shadow-2xs scale-105'
                  : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
              }`}
              title={`React with ${emoji}`}
            >
              <span className="leading-none">{emoji}</span>
            </button>
          );
        })}

        {/* ⌨️ Full Keyboard & More Emojis Access Button */}
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className={`px-2 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
            showPicker
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
              : 'bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border-indigo-200'
          }`}
          title="Open keyboard to react with ANY emoji"
        >
          <SmilePlus className="w-3.5 h-3.5" />
          <span className="text-[11px]">Any Emoji ⌨️</span>
        </button>
      </div>

      {/* 2. Full Keyboard Emoji Picker Dropdown Modal/Card */}
      {showPicker && (
        <div className="bg-white rounded-2xl p-3 border-2 border-indigo-300 shadow-xl space-y-3 animate-in fade-in zoom-in-95 mt-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-900">
              <Keyboard className="w-4 h-4 text-indigo-600" />
              <span>React with Any Keyboard Emoji</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Direct Keyboard Input Box */}
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={customEmojiInput}
                onChange={(e) => setCustomEmojiInput(e.target.value)}
                placeholder="Type or paste any emoji from your keyboard..."
                className="w-full px-3 py-1.5 text-xs sm:text-sm border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-indigo-50/40 text-slate-800 placeholder-slate-400 font-medium"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!customEmojiInput.trim()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              React
            </button>
          </form>

          {/* Quick Category Tabs */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {Object.keys(EMOJI_PALETTES).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                    activeCategory === cat
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Emoji Grid for the Selected Category */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {(EMOJI_PALETTES[activeCategory] || []).map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:scale-120 border border-slate-100 flex items-center justify-center text-base transition-all active:scale-95 cursor-pointer"
                  title={`React with ${emoji}`}
                >
                  <span>{emoji}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Active Reactions Counter Pills + Unified 'All Reactions' Button */}
      {reactionEntries.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {/* 🌟 Unified 'All Reactions' Button for Admin & Brethren */}
          <button
            type="button"
            onClick={() => {
              setActiveReactionTab('all');
              setViewingReaction(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-amber-100 via-amber-50 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-950 border border-amber-300 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Click once to view ALL reactions and reacting members in one place!"
          >
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>All Reactions</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black">
              {totalReactionsCount}
            </span>
          </button>

          {/* Individual Emoji Pills */}
          {reactionEntries.map(([emoji, users]) => {
            const hasReacted = userId && users.includes(userId);
            const isAdmin = currentUser?.role === 'admin';

            return (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  if (isAdmin) {
                    setActiveReactionTab(emoji);
                    setViewingReaction(true);
                  } else {
                    handleEmojiClick(emoji);
                  }
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  hasReacted
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs scale-102 ring-1 ring-indigo-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title={isAdmin ? `Admin: View all reactions or click to filter ${emoji}` : (hasReacted ? 'You reacted (click to remove)' : 'Click to react')}
              >
                <span className="text-sm leading-none">{emoji}</span>
                <span className="text-[11px] font-extrabold">{users.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Unified Who Reacted Modal (All in One with Filter Tabs) */}
      {viewingReaction && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setViewingReaction(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-3.5 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center font-black shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    All Reactions Received ({totalReactionsCount})
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Brethren fellowship reactions overview
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingReaction(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Filter Tabs: 'All' + Each Specific Emoji */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveReactionTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  activeReactionTab === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>🌟 All</span>
                <span className="text-[10px] opacity-80">({totalReactionsCount})</span>
              </button>

              {reactionEntries.map(([emoji, users]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setActiveReactionTab(emoji)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    activeReactionTab === emoji
                      ? 'bg-amber-500 text-white shadow-xs scale-105'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-sm leading-none">{emoji}</span>
                  <span className="text-[10px] opacity-90">({users.length})</span>
                </button>
              ))}
            </div>

            {/* Members List Container */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
              {activeReactionTab === 'all' ? (
                allReactedItems.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-8 font-semibold">No reactions yet.</p>
                ) : (
                  allReactedItems.map((item, idx) => {
                    const uInfo = getUserInfo(item.uId);
                    const isMe = item.uId === userId;

                    return (
                      <div
                        key={`${item.uId}-${item.emoji}-${idx}`}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-amber-50/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                            {(uInfo.name || item.uId).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate flex items-center gap-1.5">
                              <span>{uInfo.name}</span>
                              {isMe && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-md font-bold">
                                  You
                                </span>
                              )}
                            </p>
                            {uInfo.nickname && (
                              <p className="text-[10px] text-slate-500 font-semibold truncate">
                                {uInfo.nickname}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            uInfo.role === 'admin'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : uInfo.role === 'manager'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {uInfo.role}
                          </span>
                          <span className="text-xl leading-none bg-white p-1 rounded-xl shadow-2xs border border-slate-100">
                            {item.emoji}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                // Filtered to activeReactionTab
                (reactions[activeReactionTab] || []).length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-8 font-semibold">No reactions for {activeReactionTab}.</p>
                ) : (
                  (reactions[activeReactionTab] || []).map((uId) => {
                    const uInfo = getUserInfo(uId);
                    const isMe = uId === userId;

                    return (
                      <div
                        key={uId}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-amber-50/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                            {(uInfo.name || uId).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate flex items-center gap-1.5">
                              <span>{uInfo.name}</span>
                              {isMe && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-md font-bold">
                                  You
                                </span>
                              )}
                            </p>
                            {uInfo.nickname && (
                              <p className="text-[10px] text-slate-500 font-semibold truncate">
                                {uInfo.nickname}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            uInfo.role === 'admin'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : uInfo.role === 'manager'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {uInfo.role}
                          </span>
                          <span className="text-xl leading-none bg-white p-1 rounded-xl shadow-2xs border border-slate-100">
                            {activeReactionTab}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>

            {/* Footer Close */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setViewingReaction(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
