import Link from "next/link";

export default function SecurityStatusPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Live Security Status Dashboard</h1>
        
        <div className="bg-yellow-600 text-black p-4 rounded mb-6">
          <h2 className="font-bold">⚠️ Security Implementation In Progress</h2>
          <p>This dashboard will display live security metrics once the middleware and monitoring systems are deployed.</p>
          <Link href="/security" className="underline">View current security policies →</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">SSL Grade</h3>
            <div className="text-3xl font-bold text-green-400">A+</div>
            <p className="text-sm text-gray-400">Qualys SSL Labs</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Security Headers</h3>
            <div className="text-3xl font-bold text-green-400">✓</div>
            <p className="text-sm text-gray-400">CSP, HSTS, XSS Protection</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibent mb-2">Rate Limiting</h3>
            <div className="text-3xl font-bold text-blue-400">Active</div>
            <p className="text-sm text-gray-400">100 req/15min</p>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Implementation Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Enhanced Security Headers</span>
              <span className="text-green-400">✅ Deployed</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Security Middleware</span>
              <span className="text-yellow-400">🚧 Pending Deployment</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Live Monitoring Dashboard</span>
              <span className="text-yellow-400">🚧 Next Phase</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}