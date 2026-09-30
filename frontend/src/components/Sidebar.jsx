import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LayoutDashboard, Box, ShoppingCart, ArrowLeftRight, ClipboardCheck, Target, ScrollText, Users, Settings as SettingsIcon } from 'lucide-react';

export default function Sidebar() {
  const { user } = useContext(AuthContext);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} />, roles: ['ADMIN', 'BASE_COMMANDER'] },
    { name: 'Inventory', path: '/inventory', icon: <Box size={18} />, roles: ['ADMIN', 'BASE_COMMANDER'] },
    { name: 'Purchases', path: '/purchases', icon: <ShoppingCart size={18} />, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
    { name: 'Transfers', path: '/transfers', icon: <ArrowLeftRight size={18} />, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
    { name: 'Assignments', path: '/assignments', icon: <ClipboardCheck size={18} />, roles: ['ADMIN', 'BASE_COMMANDER'] },
    { name: 'Expenditures', path: '/expenditures', icon: <Target size={18} />, roles: ['ADMIN', 'BASE_COMMANDER'] },
  ];

  const adminItems = [
    { name: 'Audit Logs', path: '/audit-logs', icon: <ScrollText size={18} />, roles: ['ADMIN'] },
    { name: 'Users', path: '/users', icon: <Users size={18} />, roles: ['ADMIN'] },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon size={18} />, roles: ['ADMIN'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(user.role));
  const allowedAdminItems = adminItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="w-60 bg-[#1e293b] border-r border-slate-700 text-slate-300 flex flex-col h-screen transition-all shadow-xl">
      <div className="p-6 mb-2 border-b border-slate-700">
        <h2 className="text-xl font-bold tracking-widest text-white uppercase">Military Ops</h2>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {allowedItems.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md transition-colors text-sm font-medium ${
                isActive 
                  ? 'bg-[#334155] text-white' 
                  : 'text-slate-300 hover:bg-[#1e293b] hover:text-white'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}

        {allowedAdminItems.length > 0 && (
          <>
            <div className="my-6 border-t border-slate-700/50 mx-4"></div>
            {allowedAdminItems.map(item => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md transition-colors text-sm font-medium ${
                    isActive 
                      ? 'bg-[#334155] text-white' 
                      : 'text-slate-300 hover:bg-[#1e293b] hover:text-white'
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
