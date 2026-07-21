import { Home, CreditCard, Landmark, Users, Package, Code, Menu, X, HelpCircle, User, Bell } from 'lucide-react';

interface LeftSidebarProps {
  currentTab: 'home' | 'payments' | 'balances' | 'customers' | 'products' | 'developers';
  setCurrentTab: (tab: 'home' | 'payments' | 'balances' | 'customers' | 'products' | 'developers') => void;
  isTestMode: boolean;
  setIsTestMode: (val: boolean) => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  userEmail: string;
}

export default function LeftSidebar({
  currentTab,
  setCurrentTab,
  isTestMode,
  setIsTestMode,
  isOpen,
  setIsOpen,
  userEmail
}: LeftSidebarProps) {
  const navItems = [
    { id: 'home' as const, label: 'Home', icon: <Home className="h-4 w-4" /> },
    { id: 'payments' as const, label: 'Payments', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'balances' as const, label: 'Balances', icon: <Landmark className="h-4 w-4" /> },
    { id: 'customers' as const, label: 'Customers', icon: <Users className="h-4 w-4" /> },
    { id: 'products' as const, label: 'Products', icon: <Package className="h-4 w-4" /> },
    { id: 'developers' as const, label: 'Developers', icon: <Code className="h-4 w-4" /> },
  ];

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <div className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:hidden shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-indigo-600 font-mono text-xs font-bold text-white shadow-xs">
            S
          </div>
          <span className="text-sm font-bold text-neutral-900 tracking-tight font-mono">stripe</span>
          {isTestMode && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-800">
              TEST DATA
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg border border-neutral-200 p-1.5 text-neutral-600 hover:bg-neutral-50"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Drawer Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#1F2231] bg-[#0A0D14] text-neutral-300 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Company account Switcher & Logo */}
        <div className="border-b border-[#1F2231] px-5 py-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-mono text-sm font-bold text-white shadow-md">
                S
              </div>
              <span className="text-base font-extrabold text-white tracking-tight font-sans">stripe</span>
            </div>
            
            {/* Close button inside sidebar on Mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-neutral-800 p-1 text-neutral-400 hover:bg-neutral-900 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Business selector dropdown design */}
          <div className="flex items-center justify-between rounded-lg bg-neutral-900 hover:bg-neutral-850 px-3 py-1.5 cursor-pointer border border-neutral-800 transition duration-150">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-white leading-tight">Adastra Network</span>
              <span className="text-[9px] text-neutral-400 font-mono">ID: acct_8741392A</span>
            </div>
            <div className="flex h-4 w-4 flex-col items-center justify-center">
              <span className="border-t-4 border-r-4 border-transparent border-t-neutral-400 w-1.5 h-1.5 transform rotate-45 -mt-0.5" />
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false); // Close on mobile navigation click
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition duration-150 ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-xs border border-neutral-800/60'
                    : 'text-neutral-400 hover:bg-neutral-900/40 hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-indigo-400' : 'text-neutral-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.id === 'developers' && (
                  <span className="ml-auto rounded-full bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 text-[9px] font-bold text-neutral-400 font-mono">
                    SANDBOX
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer actions & Environment toggles */}
        <div className="border-t border-[#1F2231] p-4 space-y-4 shrink-0 bg-[#07090F]">
          
          {/* Working Test Mode Switch */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-white tracking-wide">Test Mode</span>
              <span className="text-[9px] text-neutral-400">Using simulated events</span>
            </div>
            <button
              onClick={() => {
                setIsTestMode(!isTestMode);
                // Prompt user visually
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isTestMode ? 'bg-amber-500' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  isTestMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* User profile block */}
          <div className="flex items-center gap-2.5 rounded-lg border border-neutral-900 bg-neutral-950 p-2 text-xs">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 font-bold text-indigo-400 text-[10px] uppercase font-mono">
              AD
            </div>
            <div className="flex flex-col truncate">
              <span className="font-semibold text-white truncate text-[10px]">{userEmail}</span>
              <span className="text-[8px] text-neutral-500 font-mono leading-none">ROLE: ADMIN</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-neutral-950/40 backdrop-blur-xs lg:hidden"
        />
      )}
    </>
  );
}
