'use client'

import React from 'react'

interface DailyActivity {
  date: string
  sessions: number
  messages: number
}

interface StatsChartProps {
  data: DailyActivity[]
  title: string
  type: 'sessions' | 'messages'
}

export default function StatsChart({ data, title, type }: StatsChartProps) {
  const maxValue = Math.max(...data.map(d => type === 'sessions' ? d.sessions : d.messages))
  const chartHeight = 200

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      
      <div className="relative">
        {/* Axe Y */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Zone du graphique */}
        <div className="ml-8 relative" style={{ height: chartHeight }}>
          {/* Grille horizontale */}
          <div className="absolute inset-0">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
              <div
                key={fraction}
                className="absolute w-full border-t border-gray-200"
                style={{ top: `${fraction * 100}%` }}
              />
            ))}
          </div>

          {/* Barres */}
          <div className="flex items-end justify-between h-full relative z-10">
            {data.slice(-14).map((item, index) => {
              const value = type === 'sessions' ? item.sessions : item.messages
              const height = maxValue > 0 ? (value / maxValue) * chartHeight : 0
              
              return (
                <div key={item.date} className="flex flex-col items-center group">
                  <div
                    className={`w-6 bg-blue-500 hover:bg-blue-600 transition-colors duration-200 relative ${
                      height === 0 ? 'min-h-[1px]' : ''
                    }`}
                    style={{ height: Math.max(height, 1) }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                      {new Date(item.date).toLocaleDateString('fr-FR', {
                        month: 'short',
                        day: 'numeric'
                      })}
                      <br />
                      {value} {type === 'sessions' ? 'sessions' : 'messages'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Axe X - Dates */}
        <div className="ml-8 mt-2 flex justify-between text-xs text-gray-500">
          {data.slice(-14).filter((_, index) => index % 3 === 0).map((item) => (
            <span key={item.date}>
              {new Date(item.date).toLocaleDateString('fr-FR', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex items-center text-sm text-gray-600">
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span>{type === 'sessions' ? 'Sessions par jour' : 'Messages par jour'} (14 derniers jours)</span>
        </div>
      </div>
    </div>
  )
}
