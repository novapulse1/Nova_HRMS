import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Clock,
  Menu,
  LifeBuoy,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

interface BottomNavigationProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  onOpenDrawer: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeModule,
  setActiveModule,
  onOpenDrawer,
}) => {
  const { unreadCount } = useNotifications();
  const { isEmployee } = useAuth();

  const mainTabs = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck className="w-5 h-5" /> },
    { id: 'leaves', label: 'Leaves', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'shifts', label: 'Shifts', icon: <Clock className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 flex items-center justify-around lg:hidden shadow-lg">
      {mainTabs.map(tab => {
        const isActive = activeModule === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveModule(tab.id)}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer',
              isActive ? 'text-brand-800 font-extrabold' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <div className={cn('p-1 rounded-xl transition-colors', isActive && 'bg-brand-50 text-brand-800')}>
              {tab.icon}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        );
      })}

      {/* More / Menu tab */}
      <button
        onClick={onOpenDrawer}
        className={cn(
          'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative',
          !mainTabs.some(t => t.id === activeModule) ? 'text-brand-800 font-extrabold' : 'text-slate-500 hover:text-slate-800'
        )}
      >
        <div className="p-1 rounded-xl relative">
          <Menu className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">More</span>
      </button>
    </div>
  );
};
