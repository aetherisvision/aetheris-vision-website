'use client'

import { useState } from 'react'
import { CodeBracketIcon, PlayIcon } from '@heroicons/react/24/outline'

const apiEndpoints = [
  {
    id: 'security-status',
    name: 'Security Status',
    method: 'GET',
    path: '/api/security-status',
    description: 'Get real-time security metrics and compliance status',
    example: {
      ssl: { grade: 'A+', valid: true },
      security: { headers: 12, violations: 0 },
      uptime: { percentage: 99.97 }
    }
  }
]

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(apiEndpoints[0])
  const [responses, setResponses] = useState<Record<string, { status: number; data: unknown }>>({})
  const [loading, setLoading] = useState<string | null>(null)

  const testEndpoint = async (endpoint: typeof apiEndpoints[number]) => {
    if (loading) return
    
    setLoading(endpoint.id)
    
    try {
      const response = await fetch(endpoint.path)
      const data = await response.json()
      
      setResponses(prev => ({
        ...prev,
        [endpoint.id]: { status: response.status, data }
      }))
    } catch (error) {
      setResponses(prev => ({
        ...prev,
        [endpoint.id]: { status: 500, data: { error: (error as Error).message } }
      }))
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <section className="py-20 bg-gradient-to-br from-violet-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Live API Documentation
          </h1>
          <p className="text-xl text-violet-100 mb-8 max-w-3xl mx-auto">
            Interactive API explorer with real-time testing. See security APIs in action.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Available Endpoints
              </h2>
              
              {apiEndpoints.map((endpoint) => (
                <div key={endpoint.id} className="bg-white dark:bg-slate-800 rounded-lg p-6 border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {endpoint.name}
                      </h3>
                      <code className="text-sm text-slate-600 dark:text-slate-400">
                        {endpoint.method} {endpoint.path}
                      </code>
                    </div>
                    
                    <button
                      onClick={() => testEndpoint(endpoint)}
                      disabled={loading === endpoint.id}
                      className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-md transition-colors"
                    >
                      {loading === endpoint.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <PlayIcon className="h-4 w-4" />
                      )}
                      Test
                    </button>
                  </div>
                  
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {endpoint.description}
                  </p>

                  {responses[endpoint.id] && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Live Response:</h4>
                      <pre className="text-sm bg-slate-100 dark:bg-slate-900 p-4 rounded overflow-x-auto">
                        {JSON.stringify(responses[endpoint.id].data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-8">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                🚀 Technical Implementation
              </h3>
              <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                <li>• Live API testing with real endpoints</li>
                <li>• TypeScript for complete type safety</li>
                <li>• Built-in rate limiting and security</li>
                <li>• Real-time response display</li>
                <li>• Production-grade error handling</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}