import React from 'react';

export default function StatsCard({ title, value, change, changeType, icon: Icon, color }) {
  const changeColors = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50'
  };

  return (
   <div className="bg-black rounded-2xl border border-gray-700 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-200">{title}</p>
      <p className="text-3xl font-bold text-gray-200 mt-2">{value}</p>
      {change && (
        <p
          className={`text-sm mt-2 px-2 py-1 rounded-full inline-block ${
            changeType === 'positive'
              ? 'bg-green-600 text-white'
              : changeType === 'negative'
              ? 'bg-red-600 text-white'
              : 'bg-purple-600 text-white'
          }`}
        >
          {change}
        </p>
      )}
    </div>
    <div className={`p-3 rounded-full ${color} shadow-md`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
</div>

  );
}