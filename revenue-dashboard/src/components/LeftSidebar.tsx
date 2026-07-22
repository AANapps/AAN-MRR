import { Home, CreditCard, Landmark, Users, Package, Code, Menu, X, ChevronDown } from 'lucide-react';

interface LeftSidebarProps {
  currentTab: 'home' | 'payments' | 'balances' | 'customers' | 'products' | 'developers';
  setCurrentTab: (tab: 'home' | 'payments' | 'balances' | 'customers' | 'products' | 'developers') => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  userEmail: string;
}

export default function LeftSidebar({
  currentTab,
  setCurrentTab,
  isOpen,
  setIsOpen,
  userEmail
}: LeftSidebarProps) {
  const navItems = [
    { id: 'home' as const, label: 'Home', icon: <Home className="h-4 w-4" /> },
    { id: 'balances' as const, label: 'Balances', icon: <Landmark className="h-4 w-4" /> },
    { id: 'payments' as const, label: 'Transactions', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'customers' as const, label: 'Customers', icon: <Users className="h-4 w-4" /> },
    { id: 'products' as const, label: 'Product catalogue', icon: <Package className="h-4 w-4" /> },
    { id: 'developers' as const, label: 'Workbench', icon: <Code className="h-4 w-4" /> },
  ];

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <div className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:hidden shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand font-mono text-xs font-bold text-white">
            S
          </div>
          <span className="text-sm font-semibold text-neutral-900 tracking-tight">Adastra Network</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg border border-neutral-200 p-1.5 text-neutral-600 hover:bg-neutral-50"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-neutral-200 bg-white text-neutral-700 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace switcher */}
        <div className="border-b border-neutral-200 px-3 py-3 shrink-0">
          <div className="flex items-center justify-between gap-1">
            <button className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-neutral-100 transition">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand font-mono text-xs font-bold text-white">
                S
              </div>
              <span className="flex-1 truncate text-sm font-semibold text-neutral-900">Adastra Network</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            </button>

            {/* Close button on Mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-neutral-200 p-1 text-neutral-400 hover:bg-neutral-100 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-0.5 px-2.5 py-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false); // Close on mobile navigation click
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition duration-100 ${
                  isActive
                    ? 'bg-brand-light text-brand font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <span className={isActive ? 'text-brand' : 'text-neutral-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="border-t border-neutral-200 p-3 shrink-0">
          <button className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left hover:bg-neutral-100 transition">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-light font-bold text-brand text-[10px] uppercase">
              AD
            </div>
            <div className="flex flex-1 flex-col truncate">
              <span className="font-medium text-neutral-800 truncate text-xs">{userEmail}</span>
              <span className="text-[10px] text-neutral-400 leading-none">Admin</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-neutral-950/20 backdrop-blur-xs lg:hidden"
        />
      )}
    </>
  );
}
