import React from 'react';

export default function StatsCard({ title, value, change, changeType, icon: Icon, color }) {
  const gradientBg = {
    positive: 'bg-gradient-to-br from-black via-green-800 to-green-900',
    negative: 'bg-gradient-to-br from-black via-red-800 to-red-900',
    neutral: 'bg-gradient-to-br from-black via-gray-700 to-gray-900'
  };

  return (
    <div className={`${gradientBg[changeType] || 'bg-black'} rounded-2xl border border-gray-700 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-200">{title}</p>
          <p className="text-3xl font-bold text-gray-200 mt-2">{value}</p>
          {change && (
            <p
              className={`text-sm mt-2 px-2 py-1 rounded-full inline-block`}
            >
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-ful shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}