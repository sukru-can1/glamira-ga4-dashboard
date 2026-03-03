"use client";

import { useState, useRef, useEffect } from "react";
import { useDashboard } from "@/contexts/DashboardContext";

export function DomainPicker() {
  const { allPropertyIds, selectedPropertyIds, setSelectedPropertyIds } = useDashboard();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allSelected = selectedPropertyIds.length === allPropertyIds.length;
  const filtered = allPropertyIds.filter((id) => id.includes(search));

  function toggleAll() {
    setSelectedPropertyIds(allSelected ? [] : [...allPropertyIds]);
  }

  function toggle(id: string) {
    setSelectedPropertyIds(
      selectedPropertyIds.includes(id)
        ? selectedPropertyIds.filter((p) => p !== id)
        : [...selectedPropertyIds, id]
    );
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-gray-300">
        <span>{allSelected ? "All Properties" : `${selectedPropertyIds.length} of ${allPropertyIds.length}`}</span>
        <span className="text-gray-400">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b p-2">
            <input type="text" placeholder="Search properties..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-xs" />
          </div>
          <div className="border-b p-2">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
              <span className="font-medium">All Properties</span>
            </label>
          </div>
          <div className="max-h-48 overflow-y-auto p-2">
            {filtered.map((id) => (
              <label key={id} className="flex items-center gap-2 py-0.5 text-xs">
                <input type="checkbox" checked={selectedPropertyIds.includes(id)} onChange={() => toggle(id)} className="rounded" />
                {id}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
