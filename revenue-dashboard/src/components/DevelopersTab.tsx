import { useState, useEffect, useRef } from 'react';
import { Terminal, Code, Settings, ShieldAlert, Key, Eye, EyeOff, Check, RotateCcw, Save, Activity, Trash2 } from 'lucide-react';
import { formatCurrency } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface ApiLog {
  id: string;
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  endpoint: string;
  statusCode: number;
  time: string;
  requestBody?: string;
  responseBody?: string;
}

interface DevelopersTabProps {
  inputRevenue: string;
  setInputRevenue: (val: string) => void;
  inputDays: string;
  setInputDays: (val: string) => void;
  inputCount: string;
  setInputCount: (val: string) => void;
  onSaveConfig: (revenue: number, days: number, count: number) => void;
  onResetConfig: () => void;
  customConfig: any;
  currencyCode: string;
  showToast: (msg: string) => void;
}

export default function DevelopersTab({
  inputRevenue,
  setInputRevenue,
  inputDays,
  setInputDays,
  inputCount,
  setInputCount,
  onSaveConfig,
  onResetConfig,
  customConfig,
  currencyCode,
  showToast
}: DevelopersTabProps) {
  const [revealPublishable, setRevealPublishable] = useState(false);
  const [revealSecret, setRevealSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);

  // Keep a ref to prevent log explosion
  const logsRef = useRef<ApiLog[]>([]);

  // Automatically spawn mock API requests over time to simulate a busy developer console!
  useEffect(() => {
    // Seed initial logs
    const initialLogs: ApiLog[] = [
      {
        id: 'req_1N9aX2E8',
        method: 'POST',
        endpoint: '/v1/payment_intents',
        statusCode: 200,
        time: new Date(Date.now() - 120000).toLocaleTimeString(),
        requestBody: JSON.stringify({ amount: 14900, currency: 'usd', payment_method_types: ['card'] }, null, 2),
        responseBody: JSON.stringify({ id: 'pi_SIM_192837', status: 'succeeded', amount_received: 14900, client_secret: 'pi_192837_secret_89234' }, null, 2)
      },
      {
        id: 'req_1N9aX1B3',
        method: 'GET',
        endpoint: '/v1/customers/cus_J89A2K9',
        statusCode: 200,
        time: new Date(Date.now() - 240000).toLocaleTimeString(),
        responseBody: JSON.stringify({ id: 'cus_J89A2K9', object: 'customer', email: 'alice@freeman.io', name: 'Alice Freeman' }, null, 2)
      },
      {
        id: 'req_1N9aW9X0',
        method: 'POST',
        endpoint: '/v1/refunds',
        statusCode: 201,
        time: new Date(Date.now() - 360000).toLocaleTimeString(),
        requestBody: JSON.stringify({ charge: 'ch_SIM_987213', amount: 7900 }, null, 2),
        responseBody: JSON.stringify({ id: 're_123891', status: 'succeeded', amount: 7900, currency: 'usd' }, null, 2)
      }
    ];
    setApiLogs(initialLogs);
    logsRef.current = initialLogs;

    const interval = setInterval(() => {
      const endpoints = [
        { method: 'POST' as const, path: '/v1/payment_intents', code: 200, req: { amount: Math.floor(Math.random()*200+10)*100, currency: 'usd' }, res: { status: 'succeeded' } },
        { method: 'GET' as const, path: '/v1/customers', code: 200, req: undefined, res: { object: 'list', count: 16 } },
        { method: 'POST' as const, path: '/v1/customers', code: 201, req: { email: 'client@new-saas.com', name: 'Sandbox User' }, res: { id: 'cus_NEW_' + Math.random().toString(36).substring(2,6).toUpperCase() } },
        { method: 'GET' as const, path: '/v1/balance', code: 200, req: undefined, res: { object: 'balance', available: [{ amount: 48920, currency: 'usd' }] } }
      ];

      const chosen = endpoints[Math.floor(Math.random() * endpoints.length)];
      const newLog: ApiLog = {
        id: `req_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        method: chosen.method,
        endpoint: chosen.path,
        statusCode: chosen.code,
        time: new Date().toLocaleTimeString(),
        requestBody: chosen.req ? JSON.stringify(chosen.req, null, 2) : undefined,
        responseBody: JSON.stringify({ ...chosen.res, id: `pi_${Math.random().toString(36).substring(2,8)}` }, null, 2)
      };

      const nextLogs = [newLog, ...logsRef.current].slice(0, 20); // cap at 20 logs
      logsRef.current = nextLogs;
      setApiLogs(nextLogs);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    showToast(`📋 Copied ${keyName} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Developers Console</h2>
        <p className="text-xs text-neutral-500">Access API keys, monitor real-time server traffic, and manage simulation targets</p>
      </div>

      {/* Grid: API keys + Simulation settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* API Keys Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5 border-b border-neutral-100 pb-3">
              <Key className="h-4 w-4 text-neutral-500" /> API Authentication Keys
            </h3>

            <div className="space-y-4">
              {/* Publishable key */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500">Publishable Key</span>
                  <button
                    onClick={() => handleCopy('pk_test_51Ng83bJH239Yskdjf89234skldjhfh2', 'Publishable Key')}
                    className="text-[10px] font-mono text-indigo-600 hover:underline"
                  >
                    {copiedKey === 'Publishable Key' ? 'Copied!' : 'Copy Key'}
                  </button>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 font-mono text-xs text-neutral-700">
                  <span className="flex-1 overflow-x-auto whitespace-nowrap">
                    {revealPublishable ? 'pk_test_51Ng83bJH239Yskdjf89234skldjhfh2' : 'pk_test_••••••••••••••••••••••••••••••••'}
                  </span>
                  <button
                    onClick={() => setRevealPublishable(!revealPublishable)}
                    className="text-neutral-400 hover:text-neutral-700"
                  >
                    {revealPublishable ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Secret key */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500">Secret Key</span>
                  <button
                    onClick={() => handleCopy('sk_test_51Ng83bJH239Ysecret9238472394skdhf2', 'Secret Key')}
                    className="text-[10px] font-mono text-indigo-600 hover:underline"
                  >
                    {copiedKey === 'Secret Key' ? 'Copied!' : 'Copy Key'}
                  </button>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 font-mono text-xs text-neutral-700">
                  <span className="flex-1 overflow-x-auto whitespace-nowrap text-rose-700 font-semibold">
                    {revealSecret ? 'sk_test_51Ng83bJH239Ysecret9238472394skdhf2' : 'sk_test_••••••••••••••••••••••••••••••••'}
                  </span>
                  <button
                    onClick={() => setRevealSecret(!revealSecret)}
                    className="text-neutral-400 hover:text-neutral-700"
                  >
                    {revealSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Web Traffic Terminal */}
          <div className="rounded-xl border border-neutral-200 bg-[#0F111A] text-neutral-300 overflow-hidden flex flex-col h-[340px] shadow-lg">
            <div className="border-b border-neutral-800 bg-[#141622] px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold font-mono text-neutral-200 tracking-tight uppercase">Live HTTP API request stream</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-500">Connected to webhook logger</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-0 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
              
              {/* Log List */}
              <div className="overflow-y-auto p-2 space-y-1 font-mono text-[11px] h-full">
                {apiLogs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-2 rounded-lg cursor-pointer transition flex items-center justify-between ${
                      selectedLog?.id === log.id 
                        ? 'bg-neutral-800 text-white' 
                        : 'hover:bg-neutral-850 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-bold rounded px-1 text-[9px] ${
                        log.method === 'POST' ? 'text-indigo-400 bg-indigo-950/40' : 'text-emerald-400 bg-emerald-950/40'
                      }`}>
                        {log.method}
                      </span>
                      <span className="text-neutral-200 truncate max-w-[130px]">{log.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-500">{log.time}</span>
                      <span className={`font-semibold ${log.statusCode >= 400 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {log.statusCode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Log Details Code Viewer */}
              <div className="overflow-y-auto p-4 font-mono text-xs bg-[#090B11] h-full flex flex-col">
                {selectedLog ? (
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between text-[11px] border-b border-neutral-800 pb-2 text-neutral-400">
                      <span>ID: {selectedLog.id}</span>
                      <span className="text-indigo-400">{selectedLog.time}</span>
                    </div>

                    {selectedLog.requestBody && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-neutral-500 block">Request Payload:</span>
                        <pre className="text-[11px] bg-neutral-900/40 p-2.5 rounded-lg text-neutral-300 overflow-x-auto whitespace-pre leading-relaxed">
                          {selectedLog.requestBody}
                        </pre>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-neutral-500 block">Response JSON Payload:</span>
                      <pre className="text-[11px] bg-indigo-950/10 p-2.5 rounded-lg text-indigo-200 overflow-x-auto whitespace-pre leading-relaxed">
                        {selectedLog.responseBody}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-neutral-600">
                    <Code className="h-8 w-8 text-neutral-700 mb-2" />
                    <p className="text-xs">Click any live API request log in the list to inspect header payloads and Response JSON objects</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Sandbox Configurator Card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5 border-b border-neutral-100 pb-3">
            <Settings className="h-4 w-4 text-neutral-500" /> Simulation Parameters
          </h3>

          <p className="text-xs text-neutral-500 leading-normal">
            Adjust the mock engine target parameters below. The transaction engine will dynamically scatter schedules, prices, currencies, and customer orders to perfectly match these totals.
          </p>

          <div className="space-y-4 pt-2">
            {/* Target revenue */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 block">Target Gross Revenue (USD)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-semibold text-neutral-400">$</span>
                <input
                  type="number"
                  value={inputRevenue}
                  onChange={(e) => setInputRevenue(e.target.value)}
                  placeholder="E.g., 50000"
                  className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 pr-3 pl-7 text-sm font-semibold text-neutral-900 outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
                />
              </div>
            </div>

            {/* Target days */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 block">Scatter Duration</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={inputDays}
                    onChange={(e) => setInputDays(e.target.value)}
                    placeholder="E.g., 30"
                    className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 px-3 text-sm font-semibold text-neutral-900 outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
                  />
                  <span className="absolute right-3 text-[10px] font-mono text-neutral-400">DAYS</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 block">Order Count</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={inputCount}
                    onChange={(e) => setInputCount(e.target.value)}
                    placeholder="E.g., 1000"
                    className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 px-3 text-sm font-semibold text-neutral-900 outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
                  />
                  <span className="absolute right-3 text-[10px] font-mono text-neutral-400">TXS</span>
                </div>
              </div>
            </div>

            {/* Warning indicator */}
            {customConfig && (
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-[11px] text-indigo-800 flex items-start gap-2 leading-relaxed">
                <ShieldAlert className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Custom configuration active:</span>
                  <p className="mt-0.5 text-indigo-600">The simulated database has been repopulated with {customConfig.customCount} charges totaling {formatCurrency(customConfig.customRevenue, currencyCode)} over {customConfig.customDays} days.</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t border-neutral-100">
              <button
                onClick={onResetConfig}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white py-2 text-center text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all flex-1"
                title="Reset simulation parameters to default baseline"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Baseline
              </button>
              
              <button
                onClick={() => onSaveConfig(parseFloat(inputRevenue), parseInt(inputDays), parseInt(inputCount))}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 py-2 text-center text-xs font-semibold text-white hover:bg-neutral-850 transition-all flex-1"
              >
                <Save className="h-3.5 w-3.5" />
                Save & Re-seed
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
