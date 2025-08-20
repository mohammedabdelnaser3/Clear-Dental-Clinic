import React from 'react';
import type { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((data: T) => ReactNode);
  cell?: (data: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  isSelectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
}

function Table<T>({ 
  columns, 
  data, 
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data available',
  className = '',
  tableClassName = '',
  headerClassName = '',
  bodyClassName = '',
  rowClassName,
  onRowClick,
  isSelectable = false,
  selectedIds = [],
  onSelectionChange,
}: TableProps<T>) {
  const handleRowClick = (item: T) => {
    if (onRowClick) {
      onRowClick(item);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelectionChange) {
      if (e.target.checked) {
        onSelectionChange(data.map(item => keyExtractor(item)));
      } else {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, item: T) => {
    e.stopPropagation();
    if (onSelectionChange) {
      const id = keyExtractor(item);
      if (e.target.checked) {
        onSelectionChange([...selectedIds, id]);
      } else {
        onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
      }
    }
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={`min-w-full divide-y divide-gray-200 ${tableClassName}`}>
        <thead className={`bg-gray-50 ${headerClassName}`}>
          <tr>
            {isSelectable && (
              <th scope="col" className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`bg-white divide-y divide-gray-200 ${bodyClassName}`}>
          {isLoading ? (
            <tr>
              <td colSpan={isSelectable ? columns.length + 1 : columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                <div className="flex justify-center items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={isSelectable ? columns.length + 1 : columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => {
              const key = keyExtractor(item);
              const isSelected = selectedIds.includes(key);
              return (
                <tr
                  key={key}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${isSelected ? 'bg-blue-50' : ''} ${
                    rowClassName ? rowClassName(item, rowIndex) : ''
                  }`}
                  onClick={() => handleRowClick(item)}
                >
                  {isSelectable && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(e, item)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((column, colIndex) => {
                    const cellContent = typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : column.cell
                        ? column.cell(item)
                        : (item[column.accessor] as ReactNode);
                    
                    return (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;