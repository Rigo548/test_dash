import React from 'react';

interface SidebarProps {
  activeModule?: string;
}

/**
 * Professional sidebar navigation matching enterprise dashboard design
 */
const Sidebar: React.FC<SidebarProps> = ({ activeModule = 'carbon-budget' }) => {
  const menuItems = [
    {
      id: 'carbon-budget',
      label: 'Carbon Budget',
      icon: '🌱',
      disabled: false
    }
  ];

  return (
    <div className="w-64 h-screen bg-slate-800 text-white flex flex-col">
      {/* Logo/Brand Area */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CB</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Carbon Budget</h1>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors
                  ${activeModule === item.id 
                    ? 'bg-slate-700 text-white border-r-2 border-green-400' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>


    </div>
  );
};

export default Sidebar;