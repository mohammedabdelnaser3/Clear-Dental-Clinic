import React, { useState, useCallback } from 'react';
import { Button, Badge } from '../ui';
import {
  Settings,
  Layout,
  Eye,
  EyeOff,
  Move,
  Palette,
  Save,
  RotateCcw,
  Grid,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'feed' | 'calendar' | 'quick-actions';
  title: string;
  description: string;
  icon: React.ReactNode;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  visible: boolean;
  configurable: boolean;
  required?: boolean;
}

export interface DashboardTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  preview: string;
}

interface DashboardCustomizerProps {
  widgets: DashboardWidget[];
  currentTheme: string;
  themes: DashboardTheme[];
  onWidgetToggle: (widgetId: string) => void;
  onWidgetReorder: (widgets: DashboardWidget[]) => void;
  onThemeChange: (themeId: string) => void;
  onSave: () => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({
  widgets,
  currentTheme,
  themes,
  onWidgetToggle,
  onWidgetReorder,
  onThemeChange,
  onSave,
  onReset,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'widgets' | 'themes'>('layout');
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['visible']));

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetWidgetId) return;

    const draggedIndex = widgets.findIndex(w => w.id === draggedWidget);
    const targetIndex = widgets.findIndex(w => w.id === targetWidgetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newWidgets = [...widgets];
    const [draggedItem] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, draggedItem);

    onWidgetReorder(newWidgets);
    setDraggedWidget(null);
  }, [draggedWidget, widgets, onWidgetReorder]);

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'small': return '1/4';
      case 'medium': return '1/2';
      case 'large': return '3/4';
      case 'full': return 'Full';
      default: return size;
    }
  };

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'small': return 'bg-blue-100 text-blue-700';
      case 'medium': return 'bg-green-100 text-green-700';
      case 'large': return 'bg-orange-100 text-orange-700';
      case 'full': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const visibleWidgets = widgets.filter(w => w.visible);
  const hiddenWidgets = widgets.filter(w => !w.visible);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Dashboard Customization</h2>
              <p className="text-sm text-gray-600">Personalize your dashboard layout and appearance</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'layout', label: 'Layout', icon: Layout },
            { id: 'widgets', label: 'Widgets', icon: Grid },
            { id: 'themes', label: 'Themes', icon: Palette }
          ].map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'layout' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Widget Layout</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop widgets to reorder them on your dashboard.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleWidgets.map((widget) => (
                    <div
                      key={widget.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, widget.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, widget.id)}
                      className={`p-4 border-2 border-dashed rounded-lg cursor-move transition-all ${
                        draggedWidget === widget.id
                          ? 'border-blue-500 bg-blue-50 opacity-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Move className="w-4 h-4 text-gray-400" />
                          <div className="text-gray-600">{widget.icon}</div>
                          <div>
                            <h4 className="font-medium text-gray-900">{widget.title}</h4>
                            <p className="text-xs text-gray-500">{widget.description}</p>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getSizeColor(widget.size)}`}>
                          {getSizeLabel(widget.size)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'widgets' && (
            <div className="space-y-6">
              {/* Visible Widgets */}
              <div>
                <button
                  onClick={() => toggleSection('visible')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <span>Visible Widgets</span>
                    <Badge className="bg-green-100 text-green-700">{visibleWidgets.length}</Badge>
                  </h3>
                  {expandedSections.has('visible') ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {expandedSections.has('visible') && (
                  <div className="mt-4 space-y-2">
                    {visibleWidgets.map((widget) => (
                      <div
                        key={widget.id}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-green-600">{widget.icon}</div>
                          <div>
                            <h4 className="font-medium text-gray-900">{widget.title}</h4>
                            <p className="text-xs text-gray-500">{widget.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs ${getSizeColor(widget.size)}`}>
                            {getSizeLabel(widget.size)}
                          </Badge>
                          {!widget.required && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onWidgetToggle(widget.id)}
                              className="text-xs px-2 py-1"
                            >
                              <EyeOff className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hidden Widgets */}
              {hiddenWidgets.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('hidden')}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <span>Hidden Widgets</span>
                      <Badge className="bg-gray-100 text-gray-700">{hiddenWidgets.length}</Badge>
                    </h3>
                    {expandedSections.has('hidden') ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedSections.has('hidden') && (
                    <div className="mt-4 space-y-2">
                      {hiddenWidgets.map((widget) => (
                        <div
                          key={widget.id}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-60"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-gray-400">{widget.icon}</div>
                            <div>
                              <h4 className="font-medium text-gray-700">{widget.title}</h4>
                              <p className="text-xs text-gray-500">{widget.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`text-xs ${getSizeColor(widget.size)}`}>
                              {getSizeLabel(widget.size)}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onWidgetToggle(widget.id)}
                              className="text-xs px-2 py-1"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Color Themes</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Choose a color theme that matches your preference.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => onThemeChange(theme.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        currentTheme === theme.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{theme.name}</h4>
                        {currentTheme === theme.id && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Active</Badge>
                        )}
                      </div>
                      
                      {/* Theme Preview */}
                      <div className="flex space-x-2 mb-3">
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: theme.secondary }}
                        />
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: theme.accent }}
                        />
                      </div>
                      
                      {/* Mini Dashboard Preview */}
                      <div 
                        className="h-16 rounded border p-2"
                        style={{ backgroundColor: theme.background }}
                      >
                        <div className="flex space-x-1 mb-2">
                          <div 
                            className="w-4 h-2 rounded"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <div 
                            className="w-6 h-2 rounded"
                            style={{ backgroundColor: theme.secondary }}
                          />
                          <div 
                            className="w-3 h-2 rounded"
                            style={{ backgroundColor: theme.accent }}
                          />
                        </div>
                        <div className="flex space-x-1">
                          <div 
                            className="w-8 h-6 rounded"
                            style={{ backgroundColor: theme.primary, opacity: 0.3 }}
                          />
                          <div 
                            className="w-8 h-6 rounded"
                            style={{ backgroundColor: theme.secondary, opacity: 0.3 }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onReset}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Default</span>
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onSave();
                onClose();
              }}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCustomizer;
