"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface LeverageSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function LeverageSelector({
  value,
  onChange,
  min = 1,
  max = 100,
  className = "",
}: LeverageSelectorProps) {
  const [localValue, setLocalValue] = useState<number>(value);
  
  // Common leverage presets
  const presets = [1, 2, 5, 10, 25, 50, 75, 100];
  
  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      setLocalValue(newValue);
      onChange(newValue);
    }
  };
  
  // Handle preset click
  const handlePresetClick = (preset: number) => {
    setLocalValue(preset);
    onChange(preset);
  };
  
  // Get color based on leverage risk
  const getLeverageColor = (lev: number) => {
    if (lev <= 2) return "text-green-400";
    if (lev <= 10) return "text-amber-400";
    if (lev <= 50) return "text-orange-400";
    return "text-red-400";
  };
  
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-white/70 text-sm">Leverage</label>
        <div className={`font-bold text-lg ${getLeverageColor(localValue)}`}>
          {localValue}x
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={localValue}
          onChange={handleSliderChange}
          className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
        />
        <input
          type="number"
          min={min}
          max={max}
          value={localValue}
          onChange={handleInputChange}
          className="w-16 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-center"
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            className={`px-2 py-1 text-xs rounded-md ${
              localValue === preset
                ? "bg-white/20 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            {preset}x
          </button>
        ))}
      </div>
      
      <div className="text-xs text-white/50 mt-1">
        {localValue <= 2 ? (
          <span className="text-green-400">Low risk</span>
        ) : localValue <= 10 ? (
          <span className="text-amber-400">Medium risk</span>
        ) : localValue <= 50 ? (
          <span className="text-orange-400">High risk</span>
        ) : (
          <span className="text-red-400">Extreme risk</span>
        )}
        {" - "}
        Liquidation at {localValue <= 2 ? "50%" : localValue <= 10 ? "20%" : localValue <= 50 ? "10%" : "5%"} price move against you
      </div>
    </div>
  );
}

export default LeverageSelector;
