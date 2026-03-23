import { useState } from 'react'
import type { CreateMonitorPayload, CheckType } from '../../domain/monitor'

interface MonitorModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateMonitorPayload) => void
  initialValues?: Partial<CreateMonitorPayload>
}

export const MonitorModal = ({ open, onClose, onSubmit, initialValues }: MonitorModalProps) => {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [checkType, setCheckType] = useState<CheckType>(initialValues?.check_type ?? 'http')
  const [interval, setInterval] = useState(initialValues?.interval ?? 60)
  const [timeout, setTimeout] = useState(initialValues?.timeout ?? 30)
  const [retries, setRetries] = useState(initialValues?.retries ?? 0)
  const [retryInterval, setRetryInterval] = useState(initialValues?.retry_interval ?? 20)
  const [enabled, setEnabled] = useState(initialValues?.enabled ?? true)
  // HTTP fields
  const [url, setUrl] = useState(initialValues?.url ?? '')
  const [method, setMethod] = useState(initialValues?.method ?? 'GET')
  const [expectedStatus, setExpectedStatus] = useState(initialValues?.expected_status ?? 200)
  const [followRedirects, setFollowRedirects] = useState(initialValues?.follow_redirects ?? true)
  // TCP fields
  const [host, setHost] = useState(initialValues?.host ?? '')
  const [port, setPort] = useState(initialValues?.port ?? 80)
  // Ping fields
  const [pingHost, setPingHost] = useState(initialValues?.ping_host ?? '')
  // DNS fields
  const [dnsHost, setDnsHost] = useState(initialValues?.dns_host ?? '')
  const [recordType, setRecordType] = useState(initialValues?.record_type ?? 'A')

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const base = {
      name,
      check_type: checkType,
      interval,
      timeout,
      retries,
      retry_interval: retryInterval,
      enabled,
    }
    let payload: CreateMonitorPayload
    if (checkType === 'http') {
      payload = { ...base, url, method, expected_status: expectedStatus, follow_redirects: followRedirects }
    } else if (checkType === 'tcp') {
      payload = { ...base, host, port }
    } else if (checkType === 'ping') {
      payload = { ...base, ping_host: pingHost }
    } else {
      payload = { ...base, dns_host: dnsHost, record_type: recordType }
    }
    onSubmit(payload)
  }

  return (
    <div role="dialog" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">{initialValues?.name ? 'Edit Monitor' : 'Add Monitor'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="My Monitor"
            />
          </div>

          {/* Check Type */}
          <div className="mb-4">
            <label htmlFor="check_type" className="block text-sm font-medium mb-1">Check Type</label>
            <select
              id="check_type"
              value={checkType}
              onChange={(e) => setCheckType(e.target.value as CheckType)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="http">HTTP</option>
              <option value="tcp">TCP</option>
              <option value="ping">PING</option>
              <option value="dns">DNS</option>
            </select>
          </div>

          {/* HTTP fields */}
          {checkType === 'http' && (
            <>
              <div className="mb-4">
                <label htmlFor="url" className="block text-sm font-medium mb-1">URL</label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="https://example.com"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="method" className="block text-sm font-medium mb-1">Method</label>
                <select
                  id="method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="HEAD">HEAD</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="expected_status" className="block text-sm font-medium mb-1">Expected Status</label>
                <input
                  id="expected_status"
                  type="number"
                  value={expectedStatus}
                  onChange={(e) => setExpectedStatus(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input
                  id="follow_redirects"
                  type="checkbox"
                  checked={followRedirects}
                  onChange={(e) => setFollowRedirects(e.target.checked)}
                />
                <label htmlFor="follow_redirects" className="text-sm font-medium">Follow Redirects</label>
              </div>
            </>
          )}

          {/* TCP fields */}
          {checkType === 'tcp' && (
            <>
              <div className="mb-4">
                <label htmlFor="host" className="block text-sm font-medium mb-1">Host</label>
                <input
                  id="host"
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="example.com"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="port" className="block text-sm font-medium mb-1">Port</label>
                <input
                  id="port"
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="80"
                />
              </div>
            </>
          )}

          {/* Ping fields */}
          {checkType === 'ping' && (
            <div className="mb-4">
              <label htmlFor="ping_host" className="block text-sm font-medium mb-1">Ping Host</label>
              <input
                id="ping_host"
                type="text"
                value={pingHost}
                onChange={(e) => setPingHost(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="8.8.8.8"
              />
            </div>
          )}

          {/* DNS fields */}
          {checkType === 'dns' && (
            <>
              <div className="mb-4">
                <label htmlFor="dns_host" className="block text-sm font-medium mb-1">DNS Host</label>
                <input
                  id="dns_host"
                  type="text"
                  value={dnsHost}
                  onChange={(e) => setDnsHost(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="example.com"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="record_type" className="block text-sm font-medium mb-1">Record Type</label>
                <select
                  id="record_type"
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="A">A</option>
                  <option value="AAAA">AAAA</option>
                  <option value="CNAME">CNAME</option>
                  <option value="MX">MX</option>
                </select>
              </div>
            </>
          )}

          {/* Common numeric fields */}
          <div className="mb-4">
            <label htmlFor="interval" className="block text-sm font-medium mb-1">Interval (seconds)</label>
            <input
              id="interval"
              type="number"
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="timeout" className="block text-sm font-medium mb-1">Timeout (seconds)</label>
            <input
              id="timeout"
              type="number"
              value={timeout}
              onChange={(e) => setTimeout(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="retries" className="block text-sm font-medium mb-1">Retries</label>
            <input
              id="retries"
              type="number"
              value={retries}
              onChange={(e) => setRetries(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="retry_interval" className="block text-sm font-medium mb-1">Retry Interval (seconds)</label>
            <input
              id="retry_interval"
              type="number"
              value={retryInterval}
              onChange={(e) => setRetryInterval(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="mb-4 flex items-center gap-2">
            <input
              id="enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <label htmlFor="enabled" className="text-sm font-medium">Enabled</label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
