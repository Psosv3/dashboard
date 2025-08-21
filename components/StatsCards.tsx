interface StatsCardsProps {
  stats: {
    totalDocuments: number
    processedDocuments: number
    totalChats: number
    storageUsed: number
  }
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const cards = [
    {
      title: 'Documents totaux',
      value: stats.totalDocuments,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Documents traités',
      value: stats.processedDocuments,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Sessions de chat',
      value: stats.totalChats,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a8.841 8.841 0 01-4.255-.949L3 20l1.395-3.123C2.493 12.767 2 11.434 2 10c0-4.418 4.03-8 9-8s9 3.134 9 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" />
        </svg>
      ),
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      title: 'Stockage utilisé',
      value: formatFileSize(stats.storageUsed),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">
                    {card.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-600 truncate">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {card.value}
                  </p>
                </div>
              </div>
              
              {/* Barre de progression subtile */}
              <div className="mt-4">
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full bg-gradient-to-r ${card.color} transition-all duration-500`}
                    style={{ 
                      width: `${Math.min((stats.totalDocuments > 0 ? (card.title === 'Documents traités' ? stats.processedDocuments / stats.totalDocuments : 1) : 0) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Indicateur de tendance */}
          <div className="mt-4 flex items-center justify-between">
            <div className={`flex items-center space-x-1 text-xs ${card.textColor}`}>
              {card.title === 'Documents traités' && stats.totalDocuments > 0 && (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>
                    {Math.round((stats.processedDocuments / stats.totalDocuments) * 100)}%
                  </span>
                </>
              )}
            </div>
            
            {/* Badge de statut */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${card.bgColor} ${card.textColor}`}>
              {card.title === 'Documents totaux' && 'Total'}
              {card.title === 'Documents traités' && 'Traité'}
              {card.title === 'Sessions de chat' && 'Actif'}
              {card.title === 'Stockage utilisé' && 'Utilisé'}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 