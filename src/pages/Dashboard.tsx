import { MessageSquare, BarChart3, Bot, Search } from 'lucide-react'

export default function Dashboard() {
  const stats = [
    { label: 'Total Prompts', value: '1,284', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Avg. Response Length', value: '450 words', icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Top Platform', value: 'ChatGPT', icon: Bot, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ]

  const mockPrompts = [
    { id: 1, text: "Explain quantum computing in simple terms", platform: "ChatGPT", date: "2 hours ago" },
    { id: 2, text: "Write a React hook for debouncing", platform: "Claude", date: "5 hours ago" },
    { id: 3, text: "Summarize the latest AI news", platform: "Gemini", date: "1 day ago" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your AI interactions.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-md flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Prompts Section */}
      <div className="rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-md overflow-hidden">
        <div className="p-6 border-b border-gray-800/60 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Prompts</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-9 pr-4 py-2 bg-gray-950/50 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all w-64"
            />
          </div>
        </div>
        
        <div className="divide-y divide-gray-800/60">
          {mockPrompts.map((prompt) => (
            <div key={prompt.id} className="p-6 hover:bg-gray-800/20 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-gray-200 font-medium group-hover:text-purple-400 transition-colors">{prompt.text}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400">{prompt.platform}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                    <span className="text-gray-500">{prompt.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
