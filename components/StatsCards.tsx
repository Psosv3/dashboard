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
      icon: '📄',
      color: 'bg-blue-500',
    },
    {
      title: 'Documents traités',
      value: stats.processedDocuments,
      icon: '✅',
      color: 'bg-green-500',
    },
    {
      title: 'Sessions de chat',
      value: stats.totalChats,
      icon: '💬',
      color: 'bg-purple-500',
    },
    {
      title: 'Stockage utilisé',
      value: formatFileSize(stats.storageUsed),
      icon: '💾',
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div key={index} className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`${card.color} rounded-md p-3`}>
                <span className="text-2xl text-white">{card.icon}</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {card.title}
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {card.value}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 