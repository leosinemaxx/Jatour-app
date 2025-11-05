// app/components/dest_card.tsx
"use client";
import React from "react";
import type { Destination } from "@/app/datatypes";

export interface DestCardProps<T extends Destination> {
  item: T;
  className?: string;
}

export default function DestCard<T extends Destination>({ item, className }: DestCardProps<T>) {
  // fallback simple jika image kosong
  const bg = item.image ?? "/main-bg.webp";

  return (
    <article
      className={`bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-md w-44 ${className ?? ""}`}
      aria-labelledby={`dest-${item.id}`}
      role="article"
    >
      <div
        className="h-28 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
        aria-hidden
      />
      <div className="p-3 text-white">
        <h3 id={`dest-${item.id}`} className="font-semibold text-sm truncate">
          {item.name}
        </h3>
        <p className="text-xs opacity-80 truncate">{item.city}</p>
        <div className="mt-2 text-xs">⭐ {item.rating?.toFixed?.(1) ?? item.rating}</div>
      </div>
    </article>
  );
}
