import React from 'react';
import { cn } from '@/utils/helpers';
import Spinner from './Spinner';
import EmptyState from './EmptyState';

/**
 * Table Component
 * 
 * @param {Array} columns - Array of column definitions { key, label, render, className }
 * @param {Array} data - Array of data objects
 * @param {boolean} isLoading - Loading state
 * @param {string} emptyMessage - Message when data is empty
 * @param {function} onRowClick - Optional click handler for rows
 * @param {string} className - Container className
 */
const Table = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = "No data found",
  onRowClick,
  className = ""
}) => {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            {columns.map((column) => (
              <th 
                key={column.key}
                className={cn(
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap",
                  column.className
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12">
                <div className="flex justify-center items-center">
                  <Spinner size="lg" />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12">
                <EmptyState message={emptyMessage} />
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr 
                key={row.id || index}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(
                  "transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((column) => (
                  <td 
                    key={column.key}
                    className={cn(
                      "px-4 py-4 text-sm text-slate-700 dark:text-slate-300",
                      column.className
                    )}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
