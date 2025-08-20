import React, { useState } from 'react';
import { Button, Spinner } from '../ui';

export interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  rowKey?: keyof T | ((record: T) => string);
  emptyText?: string;
  className?: string;
  rowClassName?: (record: T, index: number) => string;
  onRowClick?: (record: T, index: number) => void;
}

type SortState = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  onSort,
  rowKey = 'id',
  emptyText = 'No data available',
  className = '',
  rowClassName,
  onRowClick
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<SortState>(null);

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || index.toString();
  };

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    const key = column.key as string;
    let direction: 'asc' | 'desc' = 'asc';

    if (sortState && sortState.key === key && sortState.direction === 'asc') {
      direction = 'desc';
    }

    const newSortState = { key, direction };
    setSortState(newSortState);

    if (onSort) {
      onSort(key, direction);
    }
  };

  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    const key = column.key as string;
    const isActive = sortState?.key === key;
    const direction = sortState?.direction;

    return (
      <span className="ml-1 inline-flex flex-col">
        <svg 
          className={`w-3 h-3 ${isActive && direction === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        <svg 
          className={`w-3 h-3 -mt-1 ${isActive && direction === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </span>
    );
  };

  const renderCell = (column: Column<T>, record: T, index: number) => {
    const value = record[column.key as keyof T];
    
    if (column.render) {
      return column.render(value, record, index);
    }
    
    return value;
  };

  const renderPagination = () => {
    if (!pagination) return null;

    const { current, pageSize, total, onChange } = pagination;
    const totalPages = Math.ceil(total / pageSize);
    const startItem = (current - 1) * pageSize + 1;
    const endItem = Math.min(current * pageSize, total);

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          Showing {startItem} to {endItem} of {total} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(current - 1, pageSize)}
            disabled={current <= 1}
          >
            Previous
          </Button>
          
          {/* Page numbers */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (current <= 3) {
                pageNum = i + 1;
              } else if (current >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = current - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={current === pageNum ? "primary" : "outline"}
                  size="sm"
                  onClick={() => onChange(pageNum, pageSize)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(current + 1, pageSize)}
            disabled={current >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`
                    px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center">
                    {column.title}
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <Spinner size="md" />
                    <span className="ml-2 text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((record, index) => {
                const key = getRowKey(record, index);
                const className = rowClassName ? rowClassName(record, index) : '';
                
                return (
                  <tr
                    key={key}
                    className={`
                      hover:bg-gray-50 transition-colors
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${className}
                    `}
                    onClick={() => onRowClick?.(record, index)}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className={`
                          px-6 py-4 whitespace-nowrap text-sm text-gray-900
                          ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                        `}
                      >
                        {renderCell(column, record, index)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
}

export default DataTable;