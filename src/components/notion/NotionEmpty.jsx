import { PlusCircle } from 'lucide-react';

export function NotionEmpty({ pageTitle = 'Notes', onCreate }) {
  return (
    <div className="flex h-full min-h-[380px] flex-col items-center justify-center space-y-4 py-16 px-4 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="w-28 h-28 rounded-3xl bg-amber-50/80 border-2 border-amber-200/60 flex items-center justify-center text-5xl shadow-sm animate-in zoom-in-95 duration-200">
        📝
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-slate-800">
          Welcome to {pageTitle}
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No notes or articles in this section yet. Click below to start writing your sacred message or note.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer hover:scale-105 active:scale-95 duration-150"
      >
        <PlusCircle className="h-4 w-4 text-[#F4B942]" />
        <span>Create a note</span>
      </button>
    </div>
  );
}

export default NotionEmpty;
