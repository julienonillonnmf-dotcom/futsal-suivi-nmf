// components/ScaleQuestion.jsx
import React from 'react';

const ScaleQuestion = ({ 
  question, 
  value, 
  onChange, 
  leftLabel, 
  rightLabel, 
  showValue = false 
}) => (
  <div className="mb-6">
    <label className="block text-sm font-semibold text-gray-700 mb-3">
      {question}
    </label>
    <div className="px-2">
      <input
        type="range"
        min="1"
        max="20"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #fecaca 0%, #fef3c7 50%, #bbf7d0 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-gray-600 mt-2 font-medium">
        <span>{leftLabel}</span>
        {showValue && <span className="text-center font-bold">{value}/20</span>}
        <span>{rightLabel}</span>
      </div>
    </div>
  </div>
);

export default ScaleQuestion;
