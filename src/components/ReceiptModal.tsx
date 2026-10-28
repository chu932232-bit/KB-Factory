import React from 'react';
import { HistoryRecord } from '../types/feed';
import { 
  X, 
  CheckCircle2, 
  Download
} from 'lucide-react';

interface ReceiptModalProps {
  record: HistoryRecord | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  record,
  onClose
}) => {
  if (!record) return null;

  const isPurchase = record.category === 'PURCHASE';
  const isThirdParty = record.category === 'THIRD_PARTY';

  const getCleanNotes = (notes?: string) => {
    if (!notes) return '';
    let clean = notes
      .replace(/^Cash Received at Counter\s*-\s*/i, '')
      .replace(/^Cash Received at Counter\s*/i, '')
      .replace(/^Cash\s*-\s*/i, '')
      .trim();
    return clean;
  };

  const cleanNotes = getCleanNotes(record.notes);

  const handleDownload = () => {
    const lines = [
      `==================================================`,
      `              KB FACTORY - VOUCHER              `,
      `==================================================`,
      `Voucher #:       ${record.referenceNumber || record.id}`,
      `Category:        ${record.categoryLabel}`,
      `Party/Company:   ${record.partyName}`,
      `Date:            ${record.date}`,
      record.vehicleNumber && record.vehicleNumber !== 'N/A' ? `Vehicle/Truck:   ${record.vehicleNumber}` : null,
      `--------------------------------------------------`,
      record.quantityBags > 0
        ? `Item Description:${record.itemName}\n` +
          `Quantity:        ${record.quantityBags} Bags (Bori)\n` +
          `Rate:            Rs. ${record.rate?.toLocaleString()} / Bag\n` +
          `Subtotal:        Rs. ${record.amount?.toLocaleString()}`
        : `Transaction Value: Rs. ${record.amount?.toLocaleString()}`,
      `--------------------------------------------------`,
      `Gross Total:     Rs. ${record.amount?.toLocaleString()}`,
      record.paidOrReceived > 0 && record.paidOrReceived !== record.amount
        ? `Paid/Collected:  Rs. ${record.paidOrReceived?.toLocaleString()}`
        : null,
      `Voucher Total:   Rs. ${record.amount?.toLocaleString()}`,
      cleanNotes ? `--------------------------------------------------\nRemarks:         ${cleanNotes}` : null,
      `==================================================`,
      `Status: VERIFIED IN KB FACTORY CLOUD DATABASE`,
      `==================================================`
    ].filter(Boolean).join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KB_Factory_Voucher_${record.referenceNumber || record.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl relative my-auto max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Transaction Voucher</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Download formatted voucher file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-4">
          
          {/* Header */}
          <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 uppercase">
              KB Factory - Vanda &amp; Bori Center
            </h2>
            <div className="inline-block mt-2 px-3 py-0.5 bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold rounded-md shadow-xs">
              {record.categoryLabel}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold uppercase">Transaction / Voucher #</span>
              <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{record.referenceNumber || record.id}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold uppercase">Date</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">{record.date}</span>
            </div>
          </div>

          <div className="text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold uppercase">
              {isPurchase ? 'Supplier / Feed Mill' : isThirdParty ? 'Parties Involved' : 'Party / Customer Name'}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{record.partyName}</span>
          </div>

          {record.vehicleNumber && record.vehicleNumber !== 'N/A' && (
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold uppercase">Vehicle / Truck Number</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-bold uppercase bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded inline-block mt-0.5">
                {record.vehicleNumber}
              </span>
            </div>
          )}

          {/* Line Item Table if applicable */}
          {record.quantityBags > 0 ? (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1 text-[10px] font-bold uppercase">
                    <th className="text-left py-1">Description</th>
                    <th className="text-center py-1">Bags</th>
                    <th className="text-right py-1">Rate</th>
                    <th className="text-right py-1">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                  <tr>
                    <td className="py-2 text-slate-900 dark:text-slate-100 font-sans font-medium">{record.itemName}</td>
                    <td className="py-2 text-center text-slate-700 dark:text-slate-300 font-bold">{record.quantityBags}</td>
                    <td className="py-2 text-right text-slate-700 dark:text-slate-300">Rs. {record.rate?.toLocaleString()}</td>
                    <td className="py-2 text-right text-slate-900 dark:text-slate-100 font-extrabold">Rs. {record.amount?.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Transaction Value:</span>
              <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">Rs. {record.amount?.toLocaleString()}</span>
            </div>
          )}

          {/* Financial summary breakdown */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Gross Total:</span>
              <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">Rs. {record.amount?.toLocaleString()}</span>
            </div>
            {record.paidOrReceived > 0 && record.paidOrReceived !== record.amount && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Paid / Collected:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">Rs. {record.paidOrReceived?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 dark:text-slate-100 font-extrabold pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Voucher Total:</span>
              <span className="font-mono text-amber-800 dark:text-amber-400 text-sm">Rs. {record.amount?.toLocaleString()}</span>
            </div>
          </div>

          {cleanNotes ? (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="text-slate-400 dark:text-slate-500 font-bold">Remarks: </span>
              {cleanNotes}
            </div>
          ) : null}

          {/* Footer stamp */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified in Cloud Database</span>
            </div>
          </div>

        </div>

        <div className="mt-4 flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Close Voucher
          </button>
        </div>

      </div>
    </div>
  );
};
