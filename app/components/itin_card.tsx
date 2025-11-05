"use client";
import React from "react";
import { Itinerary } from "../datatypes";

export default function ItineraryCard({ it }: { it: Itinerary }) {
  return (
    <div className="bg-white/8 backdrop-blur rounded-2xl overflow-hidden shadow-lg w-full md:w-80">
      <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${it.thumbnail})` }} />
      <div className="p-4 text-white">
        <h4 className="font-semibold">{it.title}</h4>
        <p className="text-xs opacity-80">{it.city} • {it.startDate} - {it.endDate}</p>
        <p className="mt-2 text-xs opacity-75">{it.places?.slice(0,3).join(", ")}</p>
      </div>
    </div>
  );
}
