import React from 'react';
import { GlassCard } from '../ui/Components';

export const DataTable = ({ columns, data, onRowClick }) => {
  if (!data || data.length === 0) {
    return (
      <GlassCard className="text-center py-12">
        <p className="text-slate-500">No records found.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="!p-0 overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-200">
            {columns.map((col, idx) => (
              <th key={idx} className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rowIdx) => (
            <tr 
              key={row.id || rowIdx} 
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="py-4 px-6 text-sm text-slate-700">
                  {col.cell ? col.cell(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
};
