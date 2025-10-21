'use client';

import { useState } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  '#4F46E5', // Indigo
  '#7C3AED', // Violet
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#84CC16', // Lime
];

export default function ColorPicker({ value, onChange, label = 'Couleur' }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);

  const handleColorChange = (color: string) => {
    setCustomColor(color);
    onChange(color);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}
        </label>
        
        {/* Couleurs prédéfinies */}
        <div className="grid grid-cols-6 gap-3 mb-4">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorChange(color)}
              className={`
                w-12 h-12 rounded-lg transition-all duration-200
                hover:scale-110 hover:shadow-lg
                ${value === color ? 'ring-4 ring-offset-2 ring-gray-400' : ''}
              `}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* Sélecteur de couleur personnalisée */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-2">
              Couleur personnalisée
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#4F46E5"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Aperçu */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Aperçu
        </label>
        <div 
          className="p-6 rounded-lg text-white font-medium text-center"
          style={{ backgroundColor: value }}
        >
          Ceci est un aperçu de votre couleur
        </div>
      </div>
    </div>
  );
}

