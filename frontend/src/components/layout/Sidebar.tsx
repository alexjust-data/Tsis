'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LineChart,
  FileText,
  BookOpen,
  Calendar,
  Users,
  Upload,
  Settings,
  PlusCircle,
  Search,
  Tag,
} from 'lucide-react';

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const MAIN_ITEMS: SidebarItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reports', label: 'Reports', icon: LineChart },
];

const TRADES_ITEMS: SidebarItem[] = [
  { href: '/trades', label: 'Trades', icon: FileText },
  { href: '/trades/new', label: 'New Trade', icon: PlusCircle },
  { href: '/trades/import', label: 'Import', icon: Upload },
  { href: '/trades/search', label: 'Search', icon: Search },
];

const JOURNAL_ITEMS: SidebarItem[] = [
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/tags', label: 'Tags', icon: Tag },
];

const BOTTOM_ITEMS: SidebarItem[] = [
  { href: '/community', label: 'Community', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function SidebarSection({ title, items }: { title?: string; items: SidebarItem[] }) {
  const pathname = usePathname();

  return (
    <div className="mb-4">
      {title && (
        <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-green-500 bg-green-500/10 border-l-2 border-green-500'
                    : 'text-gray-400 hover:text-white hover:bg-[#1e2329] border-l-2 border-transparent'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-[220px] bg-[#0b0e11] border-r border-[#1e2329] flex flex-col h-full">
      {/* Main Navigation */}
      <div className="flex-1 py-4 overflow-y-auto">
        <SidebarSection items={MAIN_ITEMS} />
        <SidebarSection title="Trades" items={TRADES_ITEMS} />
        <SidebarSection title="Analysis" items={JOURNAL_ITEMS} />
      </div>

      {/* Bottom Section */}
      <div className="border-t border-[#1e2329] py-4">
        <SidebarSection items={BOTTOM_ITEMS} />

        {/* Version */}
        <div className="px-4 mt-4">
          <p className="text-xs text-gray-600">TSIS.ai v1.0</p>
        </div>
      </div>
    </aside>
  );
}
