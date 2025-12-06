import { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

type Tab = 'all' | 'trending' | 'popular' | 'new' | 'genres';

const tabs = [
  { id: 'all' as Tab, label: 'All' },
  { id: 'trending' as Tab, label: 'Trending' },
  { id: 'popular' as Tab, label: 'Popular' },
  { id: 'new' as Tab, label: 'New' },
  { id: 'genres' as Tab, label: 'Genres', hasDropdown: true },
];

export default function Header() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="fixed top-0 left-0 right-0 h-[70px] bg-bg-primary z-30">
      <div className="h-full flex items-center justify-between px-8">
        {/* Left Section - Navigation Tabs */}
        <nav className="flex items-center gap-8 ml-[220px]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'relative px-1 py-2 text-base font-normal transition-colors duration-200 flex items-center gap-1',
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-white hover:text-primary'
              )}
            >
              <span>{tab.label}</span>
              {tab.hasDropdown && <ChevronDown className="w-4 h-4" />}
              {/* Yellow underline for active tab */}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
              )}
            </button>
          ))}
        </nav>

        {/* Right Section - Search, Notification, User Avatar */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search the movies ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[280px] pl-10 pr-4 py-2.5 bg-transparent border border-border rounded-lg text-sm text-white placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
          </div>

          {/* Grid Icon */}
          <button
            className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
            aria-label="Grid view"
          >
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>

          {/* Notifications */}
          <button
            className="relative w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6 text-white" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-accent-red rounded-full"></span>
          </button>

          {/* User Avatar */}
          <button
            className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden"
            aria-label="User menu"
          >
            <img 
              src="https://via.placeholder.com/40" 
              alt="User avatar" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="hidden text-sm font-semibold text-white">DF</span>
          </button>
        </div>
      </div>
    </header>
  );
}

