import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationBell } from './notifications/NotificationBell';
import { ThemeToggle } from './ui/ThemeToggle';
import { 
  LayoutDashboard, 
  CheckSquare, 
  User, 
  LogOut, 
  Menu,
  X,
  Home,
  ListTodo,
  UserCircle
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'text-purple-600', bgColor: 'bg-purple-100', hoverBg: 'hover:bg-purple-50' },
    { name: 'Tasks', href: '/tasks', icon: ListTodo, color: 'text-blue-600', bgColor: 'bg-blue-100', hoverBg: 'hover:bg-blue-50' },
    { name: 'Profile & Settings', href: '/profile', icon: User, color: 'text-green-600', bgColor: 'bg-green-100', hoverBg: 'hover:bg-green-50' },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'} flex flex-col md:flex-row`}>
      <aside className={`hidden md:flex flex-col w-64 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r fixed h-full z-30`}>
        <div className={`p-6 ${isDark ? 'border-gray-700' : 'border-gray-200'} border-b`}>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            TaskMgr
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive(item.href)
                  ? `${item.bgColor} ${item.color} shadow-md translate-x-1 border-l-4 border-current`
                  : `text-gray-700 dark:text-gray-300 ${item.hoverBg} dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 hover:translate-x-0.5`
              }`}
            >
              <div className={`w-5 h-5 mr-3 ${isActive(item.href) ? item.color : 'text-gray-500'}`}>
                <item.icon className="w-full h-full" />
              </div>
              <span className={isActive(item.href) ? 'font-semibold' : ''}>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className={`p-4 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} border-t`}>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-lg">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'} truncate`}>{user?.firstName} {user?.lastName}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate`}>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 hover:translate-x-0.5 border border-red-200"
          >
            <LogOut className="w-5 h-5 mr-3 text-red-500" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        
        <div className={`md:hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4 flex items-center justify-between sticky top-0 z-40 shadow-sm`}>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
               className="p-2 -ml-2 rounded-md hover:bg-gray-100 transition-colors"
               aria-label="Toggle menu"
             >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
              TaskMgr
            </h1>
          </div>
          <NotificationBell />
        </div>

        <div className="hidden md:flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-3 justify-end items-center sticky top-0 z-20 shadow-sm">
           <div className="flex items-center gap-4">
             <ThemeToggle />
             <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>
             <NotificationBell />
             <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>
             <Link to="/profile" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors">
               Settings
             </Link>
           </div>
        </div>

        <div 
          className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ease-in-out ${
            isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={!isMobileMenuOpen}
        >
          <div 
            className="absolute inset-0 bg-gray-800 bg-opacity-50 transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <div 
            className={`absolute top-0 left-0 w-64 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            onClick={e => e.stopPropagation()}
          >
             <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-white" />
                  </div>
                  TaskMgr
                </span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
             </div>

             <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive(item.href)
                        ? `${item.bgColor} ${item.color} shadow-md translate-x-1 border-l-4 border-current`
                        : `text-gray-700 ${item.hoverBg} hover:text-gray-900 hover:translate-x-0.5`
                    }`}
                  >
                    <div className={`w-5 h-5 mr-3 ${isActive(item.href) ? item.color : 'text-gray-500'}`}>
                      <item.icon className="w-full h-full" />
                    </div>
                    <span className={isActive(item.href) ? 'font-semibold' : ''}>{item.name}</span>
                  </Link>
                ))}
                
                <div className="h-px bg-gray-200 my-4"></div>
                
                <Link
                  to="/profile"
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive('/profile')
                      ? 'bg-green-100 text-green-600 shadow-md translate-x-1 border-l-4 border-green-600'
                      : 'text-gray-700 hover:bg-green-50 hover:text-gray-900 hover:translate-x-0.5'
                  }`}
                >
                  <div className={`w-5 h-5 mr-3 ${isActive('/profile') ? 'text-green-600' : 'text-gray-500'}`}>
                    <User className="w-full h-full" />
                  </div>
                  <span className={isActive('/profile') ? 'font-semibold' : ''}>Profile & Settings</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 hover:translate-x-0.5 border border-red-200 mt-auto"
                >
                  <LogOut className="w-5 h-5 mr-3 text-red-500" />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>

              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-lg">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                  <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;