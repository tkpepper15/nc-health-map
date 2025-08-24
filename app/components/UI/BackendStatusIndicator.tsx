'use client'

import { useState, useEffect, useCallback } from 'react'

interface BackendStatus {
  source: 'database' | 'file' | 'mock'
  server: 'supabase' | 'local' | 'vercel'
  connection: 'connected' | 'fallback' | 'error'
  endpoint: string
  timestamp: string
  responseTime?: number
  serverInfo?: {
    is_vercel?: boolean;
    region?: string;
    deployment_id?: string;
    [key: string]: unknown;
  }
}

export default function BackendStatusIndicator() {
  const [status, setStatus] = useState<BackendStatus | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkBackendStatus = useCallback(async () => {
    const startTime = Date.now()
    try {
      const response = await fetch('/api/healthcare-data?aggregated=true&limit=1')
      const data = await response.json()
      const responseTime = Date.now() - startTime
      
      const serverInfo = determineServerInfo(data.metadata)
      
      setStatus({
        source: data.metadata.source,
        server: serverInfo.server,
        connection: serverInfo.connection,
        endpoint: serverInfo.endpoint,
        timestamp: data.metadata.timestamp,
        responseTime,
        serverInfo: data.metadata.server_info
      })
    } catch {
      setStatus({
        source: 'mock',
        server: 'local',
        connection: 'error',
        endpoint: 'localhost:3000',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkBackendStatus()
  }, [checkBackendStatus])

  const determineServerInfo = (metadata: { source?: string; fallback_reason?: string; server_info?: Record<string, unknown>; [key: string]: unknown }) => {
    const serverInfo = metadata.server_info || {}
    
    // Determine server type
    let server: 'vercel' | 'supabase' | 'local'
    let endpoint: string
    
    if (serverInfo.is_vercel) {
      server = 'vercel'
      endpoint = typeof window !== 'undefined' ? window.location.hostname : 'vercel.app'
    } else if (metadata.source === 'database' && !metadata.fallback_reason) {
      server = 'supabase'
      endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || 'supabase.co'
    } else {
      server = 'local'
      endpoint = typeof window !== 'undefined' 
        ? `${window.location.hostname}:${window.location.port}`
        : 'localhost:3000'
    }
    
    // Determine connection status
    let connection: 'connected' | 'fallback' | 'error'
    
    if (metadata.fallback_reason) {
      connection = 'fallback'
    } else if (metadata.source === 'database') {
      connection = 'connected'
    } else if (metadata.source === 'mock') {
      connection = 'error'
    } else {
      connection = 'fallback'
    }
    
    return { server, connection, endpoint }
  }

  const getStatusColor = () => {
    if (loading) return 'bg-gray-100 text-gray-600'
    
    switch (status?.connection) {
      case 'connected':
        return status.server === 'supabase' 
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-blue-100 text-blue-800 border-blue-200'
      case 'fallback':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusIcon = () => {
    if (loading) return '⏳'
    
    switch (status?.connection) {
      case 'connected':
        return status.server === 'supabase' ? '☁️' : '🔗'
      case 'fallback':
        return '📁'
      case 'error':
        return '❌'
      default:
        return '❓'
    }
  }

  const getStatusText = () => {
    if (loading) return 'Checking...'
    if (!status) return 'Unknown'
    
    const serverName = {
      supabase: 'Supabase',
      vercel: 'Vercel',
      local: 'Local'
    }[status.server]
    
    const sourceText = {
      database: 'Database',
      file: 'Files',
      mock: 'Mock'
    }[status.source]
    
    return `${serverName} (${sourceText})`
  }

  const getServerDetail = (key: string) => {
    return status?.serverInfo?.[key]
  }

  if (!status && !loading) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`
          inline-flex items-center px-3 py-2 rounded-lg border text-xs font-medium
          cursor-pointer transition-all duration-200 shadow-sm
          ${getStatusColor()}
          ${isExpanded ? 'mb-2' : ''}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="mr-2">{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
        {status?.responseTime && (
          <span className="ml-2 opacity-75">
            {status.responseTime}ms
          </span>
        )}
        <span className={`ml-1 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </div>
      
      {isExpanded && status && (
        <div className="bg-white rounded-lg shadow-lg border p-4 text-xs space-y-2 min-w-64">
          <div className="font-semibold text-gray-800 border-b pb-2">
            Backend Connection Status
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600">Server:</div>
              <div className="font-medium">{status.server.toUpperCase()}</div>
              
              <div className="text-gray-600">Data Source:</div>
              <div className="font-medium">{status.source.toUpperCase()}</div>
              
              <div className="text-gray-600">Endpoint:</div>
              <div className="font-mono text-xs break-all">{status.endpoint}</div>
              
              <div className="text-gray-600">Response Time:</div>
              <div className="font-medium">{status.responseTime}ms</div>
              
              <div className="text-gray-600">Status:</div>
              <div className={`font-medium capitalize ${
                status.connection === 'connected' ? 'text-green-600' :
                status.connection === 'fallback' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {status.connection}
              </div>
            </div>
            
            {/* Server Details */}
            <div className="border-t pt-2">
              <div className="text-xs font-semibold text-gray-700 mb-1">Server Details:</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Environment: <span className="font-mono">{getServerDetail('environment') || 'unknown'}</span></div>
                <div>Region: <span className="font-mono">{getServerDetail('server_region')}</span></div>
                <div>Supabase: <span className="font-mono">{getServerDetail('supabase_configured') ? '✓' : '✗'}</span></div>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <div className="text-gray-500">Last Updated:</div>
            <div className="font-mono text-xs">
              {new Date(status.timestamp).toLocaleString()}
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              setLoading(true)
              checkBackendStatus()
            }}
            className="w-full mt-2 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 transition-colors"
          >
            Refresh Status
          </button>
        </div>
      )}
    </div>
  )
}