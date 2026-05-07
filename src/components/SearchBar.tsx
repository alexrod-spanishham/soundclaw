"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef } from "react";

function SearchBarInner({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        router.push(`/search?q=${encodeURIComponent(value.trim())}`);
      }
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search tracks, artists, genres..."
        className="w-full bg-elevated border border-border rounded-full pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
      />
    </form>
  );
}

export function SearchBar() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  // Use the URL query as a key to reset internal state when navigation changes the query.
  // This avoids calling setState inside useEffect.
  return <SearchBarInner key={initialQuery} initialQuery={initialQuery} />;
}
