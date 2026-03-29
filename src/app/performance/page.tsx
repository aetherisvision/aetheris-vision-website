'use client'

import { useState, useEffect } from 'react'
import { ChartBarIcon, BoltIcon, ClockIcon, EyeIcon } from '@heroicons/react/24/outline'

interface PerformanceMetrics {
  lcp: number | null
  fid: number | null
  cls: number | null
  fcp: number | null
  ttfb: number | null
  loadTime: number
  domNodes: number
  memoryUsage: number | null
  timestamp: number
}

interface PerformanceGrade {
  score: number
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  color: string
}

function MetricCard({
  title,
  value,
  unit,
  thresholds,
  icon: Icon,
  description,
  calculateGrade,
}: {
  title: string
  value: number | null
  unit: string
  thresholds: number[]
  icon: React.ComponentType<{ className?: string }>
  description: string
  calculateGrade: (metric: number | null, thresholds: number[]) => PerformanceGrade
}) {
  const grade = calculateGrade(value, thresholds)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        </div>
        <div className={`text-2xl font-bold ${grade.color}`}>
          {grade.score < 0 ? '—' : grade.grade}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {value !== null ? value.toLocaleString() : '—'}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">{unit}</span>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400">
          {description}
        </p>

        {/* Performance bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              grade.score >= 90 ? 'bg-emerald-500' :
              grade.score >= 80 ? 'bg-green-500' :
              grade.score >= 70 ? 'bg-yellow-500' :
              grade.score >= 60 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(grade.score, 5)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Collect real Core Web Vitals
    const collectMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      const baseMetrics: PerformanceMetrics = {
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        ttfb: navigation ? Math.round(navigation.responseStart - navigation.requestStart) : 0,
        loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : 0,
        domNodes: document.querySelectorAll('*').length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        memoryUsage: (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : null,
        timestamp: Date.now()
      }

      // Get paint timing
      const paintEntries = performance.getEntriesByType('paint')
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      if (fcpEntry) {
        baseMetrics.fcp = Math.round(fcpEntry.startTime)
      }

      // Try to get LCP via PerformanceObserver
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver(list => {
            const entries = list.getEntries()
            if (entries.length > 0) {
              const lastEntry = entries[entries.length - 1]
              baseMetrics.lcp = Math.round(lastEntry.startTime)
            }
          })
          observer.observe({ entryTypes: ['largest-contentful-paint'] })
          
          // Set a timeout to capture metrics
          setTimeout(() => {
            observer.disconnect()
            setMetrics({ ...baseMetrics })
            setIsLoading(false)
          }, 3000)
        } catch {
          setMetrics(baseMetrics)
          setIsLoading(false)
        }
      } else {
        setMetrics(baseMetrics)
        setIsLoading(false)
      }
    }

    // Wait for page to be fully loaded
    if (document.readyState === 'complete') {
      setTimeout(collectMetrics, 1000)
    } else {
      window.addEventListener('load', () => {
        setTimeout(collectMetrics, 1000)
      })
    }

    return () => {
      // Cleanup
    }
  }, [])

  const calculateGrade = (metric: number | null, thresholds: number[]): PerformanceGrade => {
    if (metric === null) return { score: -1, grade: 'F', color: 'text-gray-400' }
    
    if (metric <= thresholds[0]) return { score: 95, grade: 'A+', color: 'text-emerald-500' }
    if (metric <= thresholds[1]) return { score: 85, grade: 'A', color: 'text-green-500' }
    if (metric <= thresholds[2]) return { score: 75, grade: 'B', color: 'text-yellow-500' }
    if (metric <= thresholds[3]) return { score: 65, grade: 'C', color: 'text-orange-500' }
    return { score: 40, grade: 'F', color: 'text-red-500' }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Analyzing performance metrics...</p>
          </div>
        </div>
      </div>
    )
  }

  const overallScore = metrics ? (() => {
    const scores = [
      calculateGrade(metrics.lcp, [2500, 4000, 6000, 8000]).score,
      calculateGrade(metrics.fcp, [1800, 3000, 4500, 6000]).score,
      calculateGrade(metrics.ttfb, [200, 500, 800, 1200]).score,
      calculateGrade(metrics.loadTime, [3000, 5000, 8000, 12000]).score
    ].filter(s => s >= 0)
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  })() : 0

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Live Performance Monitor
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Real-time Core Web Vitals and technical metrics. This is what peak performance looks like.
          </p>
          
          {/* Overall Score */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
            <div className="text-6xl font-bold mb-2">{overallScore}</div>
            <div className="text-blue-100">Overall Performance Score</div>
            <div className={`text-2xl font-semibold mt-2 ${
              overallScore >= 90 ? 'text-emerald-300' :
              overallScore >= 80 ? 'text-green-300' :
              overallScore >= 70 ? 'text-yellow-300' : 'text-red-300'
            }`}>
              {overallScore >= 90 ? 'Exceptional' :
               overallScore >= 80 ? 'Excellent' :
               overallScore >= 70 ? 'Good' : 'Needs Improvement'}
            </div>
          </div>
        </div>
      </section>

      {/* Core Web Vitals */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8 text-center">
            Core Web Vitals
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <MetricCard
              title="Largest Contentful Paint"
              value={metrics?.lcp || null}
              unit="ms"
              thresholds={[2500, 4000, 6000, 8000]}
              icon={EyeIcon}
              description="Measures loading performance. Good LCP is 2.5s or faster."
              calculateGrade={calculateGrade}
            />

            <MetricCard
              title="First Contentful Paint"
              value={metrics?.fcp || null}
              unit="ms"
              thresholds={[1800, 3000, 4500, 6000]}
              icon={BoltIcon}
              description="Time when first content appears. Good FCP is 1.8s or faster."
              calculateGrade={calculateGrade}
            />

            <MetricCard
              title="Time to First Byte"
              value={metrics?.ttfb || null}
              unit="ms"
              thresholds={[200, 500, 800, 1200]}
              icon={ClockIcon}
              description="Server response time. Good TTFB is 200ms or faster."
              calculateGrade={calculateGrade}
            />
          </div>

          {/* Additional Metrics */}
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Technical Metrics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Page Load Time"
              value={metrics?.loadTime || null}
              unit="ms"
              thresholds={[3000, 5000, 8000, 12000]}
              icon={ChartBarIcon}
              description="Complete page load time. Good load is 3s or faster."
              calculateGrade={calculateGrade}
            />

            <MetricCard
              title="DOM Complexity"
              value={metrics?.domNodes || null}
              unit="nodes"
              thresholds={[800, 1500, 3000, 5000]}
              icon={ChartBarIcon}
              description="Total DOM elements. Lower count improves performance."
              calculateGrade={calculateGrade}
            />

            <MetricCard
              title="Memory Usage"
              value={metrics?.memoryUsage || null}
              unit="MB"
              thresholds={[20, 50, 100, 200]}
              icon={ChartBarIcon}
              description="JavaScript heap size. Lower usage improves performance."
              calculateGrade={calculateGrade}
            />
          </div>

          {/* Technical Notes */}
          <div className="mt-16 bg-slate-100 dark:bg-slate-800 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              🔬 Performance Engineering Notes
            </h3>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li>• Metrics collected using native Performance API and PerformanceObserver</li>
              <li>• Real-time measurement with no synthetic testing</li>
              <li>• Grades based on Core Web Vitals thresholds from Google</li>
              <li>• Memory metrics available in Chromium-based browsers</li>
              <li>• Data collected at {metrics ? new Date(metrics.timestamp).toLocaleString() : 'N/A'}</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}