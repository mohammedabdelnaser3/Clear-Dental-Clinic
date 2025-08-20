import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string | React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
  tabListClassName?: string;
  tabPanelClassName?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTabId,
  onChange,
  variant = 'default',
  className = '',
  tabListClassName = '',
  tabPanelClassName = '',
}) => {
  const [activeTabId, setActiveTabId] = useState<string>(defaultTabId || tabs[0]?.id || '');

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };

  const getTabListClasses = () => {
    switch (variant) {
      case 'pills':
        return 'flex space-x-2 p-1 bg-gray-100 rounded-lg';
      case 'underline':
        return 'flex border-b border-gray-200';
      default:
        return 'flex space-x-8 border-b border-gray-200';
    }
  };

  const getTabClasses = (tab: Tab) => {
    const isActive = activeTabId === tab.id;
    const isDisabled = tab.disabled;

    const baseClasses = 'py-2 px-3 text-sm font-medium focus:outline-none';
    const disabledClasses = 'text-gray-400 cursor-not-allowed';

    switch (variant) {
      case 'pills':
        return `${baseClasses} rounded-md ${isActive ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'} ${isDisabled ? disabledClasses : ''}`;
      case 'underline':
        return `${baseClasses} ${isActive ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'} ${isDisabled ? disabledClasses : ''}`;
      default:
        return `${baseClasses} ${isActive ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'} ${isDisabled ? disabledClasses : ''}`;
    }
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className={className}>
      <div className={`${getTabListClasses()} ${tabListClassName}`} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTabId === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={getTabClasses(tab)}
            onClick={() => !tab.disabled && handleTabClick(tab.id)}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={`mt-4 ${tabPanelClassName}`}>
        {activeTab && (
          <div
            role="tabpanel"
            aria-labelledby={`tab-${activeTab.id}`}
            id={`panel-${activeTab.id}`}
          >
            {activeTab.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tabs;