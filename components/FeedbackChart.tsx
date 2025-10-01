'use client'

import React from 'react'

interface FeedbackTrend {
  date: string
  likes: number
  dislikes: number
}

interface FeedbackChartProps {
  data: FeedbackTrend[]
  title: string
}

export default function FeedbackChart({ data, title }: FeedbackChartProps) {
  const maxValue = Math.max(...data.map(d => Math.max(d.likes, d.dislikes)))
  const chartHeight = 200

  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">{title}</h3>
      
      <div className="relative">
        {/* Axe Y */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-500 pr-2">
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
                className="absolute w-full border-t border-slate-200"
                style={{ top: `${fraction * 100}%` }}
              />
            ))}
          </div>

          {/* Barres groupées */}
          <div className="flex items-end justify-between h-full relative z-10">
            {data.slice(-14).map((item, index) => {
              const likesHeight = maxValue > 0 ? (item.likes / maxValue) * chartHeight : 0
              const dislikesHeight = maxValue > 0 ? (item.dislikes / maxValue) * chartHeight : 0
              
              return (
                <div key={item.date} className="flex flex-col items-center group">
                  <div className="flex items-end space-x-1">
                    {/* Barre des likes */}
                    <div
                      className={`w-4 bg-gradient-to-t from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 transition-all duration-200 relative rounded-t ${
                        likesHeight === 0 ? 'min-h-[1px]' : ''
                      }`}
                      style={{ height: Math.max(likesHeight, 1) }}
                    >
                      {/* Tooltip pour likes */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                        {new Date(item.date).toLocaleDateString('fr-FR', {
                          month: 'short',
                          day: 'numeric'
                        })}
                        <br />
                        <span className="text-green-300">👍 {item.likes} likes</span>
                        <br />
                        <span className="text-red-300">👎 {item.dislikes} dislikes</span>
                      </div>
                    </div>
                    
                    {/* Barre des dislikes */}
                    <div
                      className={`w-4 bg-gradient-to-t from-red-500 to-red-400 hover:from-red-600 hover:to-red-500 transition-all duration-200 relative rounded-t ${
                        dislikesHeight === 0 ? 'min-h-[1px]' : ''
                      }`}
                      style={{ height: Math.max(dislikesHeight, 1) }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Axe X - Dates */}
        <div className="ml-8 mt-2 flex justify-between text-xs text-slate-500">
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
      <div className="mt-6 flex items-center justify-center space-x-6">
        <div className="flex items-center text-sm text-slate-600">
          <div className="w-4 h-4 bg-gradient-to-t from-green-500 to-green-400 rounded mr-2"></div>
          <span>Likes</span>
        </div>
        <div className="flex items-center text-sm text-slate-600">
          <div className="w-4 h-4 bg-gradient-to-t from-red-500 to-red-400 rounded mr-2"></div>
          <span>Dislikes</span>
        </div>
        <div className="text-xs text-slate-500">
          (14 derniers jours)
        </div>
      </div>
    </div>
  )
}
