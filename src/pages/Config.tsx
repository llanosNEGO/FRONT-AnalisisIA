import { Save } from 'lucide-react'

export default function ConfigPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and preferences.</p>
      </div>

      <div className="rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-md overflow-hidden">
        <div className="p-6 border-b border-gray-800/60">
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <p className="text-sm text-gray-400 mt-1">Update your personal information.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Name</label>
              <input 
                type="text" 
                defaultValue="John Doe"
                className="w-full px-4 py-2 bg-gray-950/50 border border-gray-800 rounded-lg text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <input 
                type="email" 
                defaultValue="john@example.com"
                disabled
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
