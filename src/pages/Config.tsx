import { useState } from 'react'
import { Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ConfigPage() {
  const { user, signOut } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('analisis_ia_profile_name', name)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and preferences.</p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-md overflow-hidden">
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-950/50 border border-gray-800 rounded-lg text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={signOut}
              className="px-5 py-2.5 text-gray-300 hover:text-white font-medium rounded-lg transition-colors"
            >
              Sign out
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}