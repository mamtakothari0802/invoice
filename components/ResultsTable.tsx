
import React from 'react';
import type { InvoiceData } from '../types';

interface ResultsTableProps {
  data: InvoiceData[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-slate-200">
      <table className="w-full text-sm text-left text-slate-600">
        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
          <tr>
            <th scope="col" className="px-6 py-3">Vendor Name</th>
            <th scope="col" className="px-6 py-3">Invoice #</th>
            <th scope="col" className="px-6 py-3">Date</th>
            <th scope="col" className="px-6 py-3 text-right">Total Amount</th>
            <th scope="col" className="px-6 py-3">Source File</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="bg-white border-b hover:bg-slate-50">
              <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{item.vendorName || 'N/A'}</td>
              <td className="px-6 py-4">{item.invoiceNumber || 'N/A'}</td>
              <td className="px-6 py-4">{item.invoiceDate || 'N/A'}</td>
              <td className="px-6 py-4 text-right font-mono">{item.totalAmount ? `$${item.totalAmount.toFixed(2)}` : 'N/A'}</td>
              <td className="px-6 py-4 text-slate-500 truncate" title={item.fileName}>{item.fileName || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
