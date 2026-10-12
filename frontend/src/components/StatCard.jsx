import React from 'react';

const StatCard = ({ title, amount, subtitle, icon: Icon, color = 'emerald', badge, badgeType = 'neutral' }) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-100',
    },
  };

  const badgeMap = {
    positive: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    negative: 'bg-rose-100 text-rose-800',
    neutral: 'bg-slate-100 text-slate-700',
  };

  const c = colorMap[color] || colorMap.emerald;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-sm transition">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-lg ${c.bg} ${c.text} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">{amount}</h3>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeMap[badgeType] || badgeMap.neutral}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
