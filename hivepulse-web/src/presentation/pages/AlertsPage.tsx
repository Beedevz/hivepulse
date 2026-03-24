import { useEffect, useState } from 'react'
import { useIncidents } from '../../application/useIncidents'
import type { IncidentFilter } from '../../application/useIncidents'
import type { Incident } from '../../domain/incident'
import { Sidebar } from '../components/Sidebar'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function LiveDuration({ startedAt }: { startedAt: string }) {
  const [secs, setSecs] = useState(
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  )
  useEffect(() => {
    const t = setInterval(() => {
      setSecs(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [startedAt])
  return <span className="font-bold text-red-400">{formatDuration(secs)}</span>
}

function ActiveIncidentCard({ inc }: { inc: Incident }) {
  return (
    <div className="bg-red-950/40 border border-red-500/30 rounded-lg p-3 mb-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" style={{ boxShadow: '0 0 6px rgba(248,113,113,0.8)' }} />
          <span className="font-bold text-white text-sm">{inc.monitor_name}</span>
          <span className="text-xs bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded font-bold">DOWN</span>
        </div>
        <LiveDuration startedAt={inc.started_at} />
      </div>
      <div className="text-xs text-gray-400 space-x-4">
        <span>Started: {new Date(inc.started_at).toLocaleTimeString()}</span>
        {inc.error_msg && <span className="text-red-300">{inc.error_msg}</span>}
      </div>
    </div>
  )
}

function ResolvedIncidentCard({ inc }: { inc: Incident }) {
  return (
    <div className="bg-green-950/20 border border-green-500/20 rounded-lg p-3 mb-3">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="font-medium text-gray-300 text-sm">{inc.monitor_name}</span>
          <span className="text-xs bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded font-bold">RESOLVED</span>
        </div>
        <span className="text-green-400 text-xs font-semibold">
          Downtime: {formatDuration(inc.duration_s)}
        </span>
      </div>
      <div className="text-xs text-gray-500">
        {new Date(inc.started_at).toLocaleTimeString()} → {inc.resolved_at ? new Date(inc.resolved_at).toLocaleTimeString() : ''}
      </div>
    </div>
  )
}

export function AlertsPage() {
  const [filter, setFilter] = useState<IncidentFilter>('all')
  const { data: activeData } = useIncidents('active')
  const { data: resolvedData } = useIncidents('resolved')

  const activeIncidents = activeData?.data ?? []
  const resolvedIncidents = resolvedData?.data ?? []

  const showActive = filter === 'all' || filter === 'active'
  const showResolved = filter === 'all' || filter === 'resolved'

  const filterBtn = (f: IncidentFilter, label: string) => (
    <button
      onClick={() => setFilter(f)}
      className={`px-3 py-1 rounded text-xs font-semibold ${
        filter === f
          ? 'bg-gray-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">Alerts</h1>
            {activeIncidents.length > 0 && (
              <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full font-bold">
                {activeIncidents.length} active
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {filterBtn('all', 'All')}
            {filterBtn('active', 'Active')}
            {filterBtn('resolved', 'Resolved')}
          </div>
        </div>

        {showActive && (
          <div className="mb-6">
            <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">
              🔴 Active ({activeIncidents.length})
            </div>
            {activeIncidents.length === 0 ? (
              <div className="text-gray-500 text-sm">No active incidents.</div>
            ) : (
              activeIncidents.map(inc => <ActiveIncidentCard key={inc.id} inc={inc} />)
            )}
          </div>
        )}

        {showResolved && (
          <div>
            <div className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3">
              ✓ Resolved ({resolvedIncidents.length})
            </div>
            {resolvedIncidents.length === 0 ? (
              <div className="text-gray-500 text-sm">No resolved incidents.</div>
            ) : (
              resolvedIncidents.map(inc => <ResolvedIncidentCard key={inc.id} inc={inc} />)
            )}
          </div>
        )}
      </main>
    </div>
  )
}
