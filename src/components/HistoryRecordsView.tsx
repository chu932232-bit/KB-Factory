import React, { useState, useEffect, useMemo } from 'react';
import { HistoryRecord, Company, Party, Customer } from '../types/feed';
import { api } from '../services/api';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  Search, 
  History, 
  RotateCcw, 
  Download, 
  Eye, 
  Trash2, 
  FileText, 
  FileSpreadsheet,
  Building2,
  Users,
  ShoppingBag,
  Coins,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  Banknote,
  Receipt,
  Tag
} from 'lucide-react';

interface HistoryRecordsViewProps {
  companies: Company[];
  parties: Party[];
  customers: Customer[];
  onOpenReceipt: (record: HistoryRecord) => void;
  onRefresh?: () => void;
}

export const HistoryRecordsView: React.FC<HistoryRecordsViewProps> = ({
  companies,
  parties,
  customers,
  onOpenReceipt,
  onRefresh
}) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Deletion state
  const [deleteTarget, setDeleteTarget] = useState<HistoryRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleDeleteClick = (record: HistoryRecord) => {
    setDeleteTarget(record);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.category === 'PURCHASE') {
        await api.deletePurchase(deleteTarget.id);
      } else if (deleteTarget.category === 'SALE_WHOLESALE' || deleteTarget.category === 'SALE_RETAIL') {
        await api.deleteSale(deleteTarget.id);
      } else if (deleteTarget.category === 'PAYMENT') {
        await api.deletePayment(deleteTarget.id);
      } else if (deleteTarget.category === 'THIRD_PARTY') {
        await api.deleteThirdPartyPayment(deleteTarget.id);
      } else if (deleteTarget.category === 'TREASURY') {
        await api.deleteCompanyPayment(deleteTarget.id);
      }
      setDeleteTarget(null);
      await fetchRecords();
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let start = startDate;
      let end = endDate;

      const todayStr = new Date().toISOString().split('T')[0];

      if (datePreset === 'TODAY') {
        start = todayStr;
        end = todayStr;
      } else if (datePreset === 'WEEK') {
        const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        start = lastWeek;
        end = todayStr;
      } else if (datePreset === 'MONTH') {
        const firstDayMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        start = firstDayMonth;
        end = todayStr;
      } else if (datePreset === 'ALL') {
        start = '';
        end = '';
      }

      const res = await api.getHistory({
        q: searchQuery,
        transactionType: selectedType,
        companyId: selectedCompanyId,
        partyId: selectedPartyId,
        vehicleNumber: vehicleFilter,
        startDate: start,
        endDate: end
      });

      setHistory(res.data);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedType, selectedCompanyId, selectedPartyId, datePreset]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedCompanyId('');
    setSelectedPartyId('');
    setVehicleFilter('');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setTimeout(fetchRecords, 50);
  };

  // Aggregated Summary Statistics for the visible records
  const summaryMetrics = useMemo(() => {
    let totalBags = 0;
    let totalAmount = 0;
    let totalSpotCash = 0;
    let totalDanaUdhaar = 0;
    let totalLanaUdhaar = 0;
    let totalUdhaarRecv = 0;

    let factoryBuyCount = 0;
    let wholesaleCount = 0;
    let retailCount = 0;
    let paymentCount = 0;
    let thirdPartyCount = 0;
    let treasuryCount = 0;

    history.forEach((r) => {
      totalBags += r.quantityBags || 0;
      totalAmount += r.amount || 0;
      totalSpotCash += Math.abs(r.spotCash ?? (r.paidOrReceived || 0));

      if (r.category === 'PURCHASE') {
        factoryBuyCount++;
        totalDanaUdhaar += r.borrowedUdhaar || 0;
        totalUdhaarRecv += r.udhaarReceive || 0;
      } else if (r.category === 'SALE_WHOLESALE') {
        wholesaleCount++;
        totalLanaUdhaar += r.borrowedUdhaar || 0;
      } else if (r.category === 'SALE_RETAIL') {
        retailCount++;
        totalLanaUdhaar += r.borrowedUdhaar || 0;
      } else if (r.category === 'PAYMENT') {
        paymentCount++;
      } else if (r.category === 'THIRD_PARTY') {
        thirdPartyCount++;
      } else if (r.category === 'TREASURY') {
        treasuryCount++;
      }
    });

    return {
      totalBags,
      totalAmount,
      totalSpotCash,
      totalDanaUdhaar,
      totalLanaUdhaar,
      totalUdhaarRecv,
      counts: {
        factoryBuy: factoryBuyCount,
        wholesale: wholesaleCount,
        retail: retailCount,
        payments: paymentCount,
        thirdParty: thirdPartyCount,
        treasury: treasuryCount
      }
    };
  }, [history]);

  // Download collectively all records in an arranged, clear, and easy-to-read format
  const handleDownloadAllMasterReport = async (format: 'TXT' | 'CSV' = 'TXT') => {
    setDownloading(true);
    try {
      // Fetch entire historical record dataset (all transactions collectively)
      const allRes = await api.getHistory({ transactionType: 'ALL' });
      const records: HistoryRecord[] = allRes.data || history;

      if (records.length === 0) {
        alert('No transaction records found to download.');
        return;
      }

      // Compute statistics for executive summary
      const purchases = records.filter(r => r.category === 'PURCHASE');
      const wholesale = records.filter(r => r.category === 'SALE_WHOLESALE');
      const retail = records.filter(r => r.category === 'SALE_RETAIL');
      const payments = records.filter(r => r.category === 'PAYMENT');
      const thirdParty = records.filter(r => r.category === 'THIRD_PARTY');
      const treasury = records.filter(r => r.category === 'TREASURY');

      const totalPurAmt = purchases.reduce((sum, r) => sum + (r.amount || 0), 0);
      const totalPurBags = purchases.reduce((sum, r) => sum + (r.quantityBags || 0), 0);
      const totalPurDana = purchases.reduce((sum, r) => sum + (r.borrowedUdhaar || 0), 0);
      const totalPurSpot = purchases.reduce((sum, r) => sum + (r.spotCash || 0), 0);

      const totalWsAmt = wholesale.reduce((sum, r) => sum + (r.amount || 0), 0);
      const totalWsBags = wholesale.reduce((sum, r) => sum + (r.quantityBags || 0), 0);
      const totalWsLana = wholesale.reduce((sum, r) => sum + (r.borrowedUdhaar || 0), 0);

      const totalRetAmt = retail.reduce((sum, r) => sum + (r.amount || 0), 0);
      const totalRetBags = retail.reduce((sum, r) => sum + (r.quantityBags || 0), 0);
      const totalRetLana = retail.reduce((sum, r) => sum + (r.borrowedUdhaar || 0), 0);

      const totalPayAmt = payments.reduce((sum, r) => sum + (r.amount || 0), 0);
      const totalTpAmt = thirdParty.reduce((sum, r) => sum + (r.amount || 0), 0);
      const totalTreasuryAmt = treasury.reduce((sum, r) => sum + (r.amount || 0), 0);
      const grandTotalAmount = records.reduce((sum, r) => sum + (r.amount || 0), 0);

      const timestamp = new Date().toLocaleString();

      if (format === 'TXT') {
        const lines: string[] = [
          `========================================================================================================================`,
          `                                     KB ANIMAL FEED CENTER - MASTER RECORDS REGISTER                                    `,
          `========================================================================================================================`,
          `Report Type:            Complete Master Transaction History (Collectively All Sections)`,
          `Generated Date & Time:  ${timestamp}`,
          `Total Transactions:     ${records.length} Entries`,
          `Grand Total Turnover:   Rs. ${Math.round(grandTotalAmount).toLocaleString()}`,
          `------------------------------------------------------------------------------------------------------------------------`,
          `EXECUTIVE SUMMARY BY APP SECTION:`,
          `------------------------------------------------------------------------------------------------------------------------`,
          `1. FACTORY BUY (PURCHASES & DANA):     Rs. ${Math.round(totalPurAmt).toLocaleString().padStart(12)}  |  ${purchases.length} Records  (${totalPurBags.toLocaleString()} Bags | Spot: Rs. ${Math.round(totalPurSpot).toLocaleString()} | Dana: Rs. ${Math.round(totalPurDana).toLocaleString()})`,
          `2. WHOLESALE (BIG PARTIES & LANA):     Rs. ${Math.round(totalWsAmt).toLocaleString().padStart(12)}  |  ${wholesale.length} Records  (${totalWsBags.toLocaleString()} Bags | Lana: Rs. ${Math.round(totalWsLana).toLocaleString()})`,
          `3. RETAIL KHATA (FARMERS & LANA):       Rs. ${Math.round(totalRetAmt).toLocaleString().padStart(12)}  |  ${retail.length} Records  (${totalRetBags.toLocaleString()} Bags | Lana: Rs. ${Math.round(totalRetLana).toLocaleString()})`,
          `4. DIRECT PAYMENTS & CLEARANCES:        Rs. ${Math.round(totalPayAmt).toLocaleString().padStart(12)}  |  ${payments.length} Payments Processed`,
          `5. THIRD-PARTY DIRECT FACTORY SLIPS:   Rs. ${Math.round(totalTpAmt).toLocaleString().padStart(12)}  |  ${thirdParty.length} Slips Auto-Balanced`,
          `6. CURRENT BALANCE TREASURY (CR/DR):    Rs. ${Math.round(totalTreasuryAmt).toLocaleString().padStart(12)}  |  ${treasury.length} Ledger Adjustments`,
          `------------------------------------------------------------------------------------------------------------------------`,
          ``,
          `------------------------------------------------------------------------------------------------------------------------`,
          `COMPLETE ALL-SECTIONS CHRONOLOGICAL AUDIT LIST:`,
          `------------------------------------------------------------------------------------------------------------------------`,
          `NO. | DATE       | SECTION / SOURCE       | PARTY / MILL NAME        | ITEM / NOTE       | BAGS | RATE     | TOTAL (Rs.)  | CASH (Rs.)   | UDHAAR / DEBT   | REF / SLIP`,
          `------------------------------------------------------------------------------------------------------------------------`,
          ...records.map((r, idx) => {
            const no = String(idx + 1).padStart(3);
            const d = (r.date || '').padEnd(10);
            const sec = (r.sectionName || r.categoryLabel || '').slice(0, 22).padEnd(22);
            const party = (r.partyName || '').slice(0, 24).padEnd(24);
            const item = (r.itemName || 'Feed').slice(0, 17).padEnd(17);
            const bags = r.quantityBags > 0 ? String(r.quantityBags).padStart(4) : '   —';
            const rate = r.rate > 0 ? String(Math.round(r.rate)).padStart(8) : '       —';
            const amt = `Rs. ${Math.round(r.amount || 0).toLocaleString()}`.padStart(12);
            const cashVal = r.spotCash ?? (r.paidOrReceived || 0);
            const cash = cashVal !== 0 ? `Rs. ${Math.round(cashVal).toLocaleString()}`.padStart(12) : '           —';
            let udhaarStr = '           —';
            if (r.udhaarReceive && r.udhaarReceive > 0) {
              udhaarStr = `Rec: ${Math.round(r.udhaarReceive).toLocaleString()}`.padStart(15);
            } else if (r.borrowedUdhaar && r.borrowedUdhaar > 0) {
              const prefix = r.category === 'PURCHASE' ? 'Dana: ' : 'Lana: ';
              udhaarStr = `${prefix}${Math.round(r.borrowedUdhaar).toLocaleString()}`.padStart(15);
            }
            const ref = (r.referenceNumber || '—').slice(0, 14);
            return `${no} | ${d} | ${sec} | ${party} | ${item} | ${bags} | ${rate} | ${amt} | ${cash} | ${udhaarStr} | ${ref}`;
          }),
          `------------------------------------------------------------------------------------------------------------------------`,
          `END OF REPORT - GENERATED BY KB ANIMAL FEED MANAGEMENT SYSTEM`,
          `========================================================================================================================`
        ];

        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `KB_Master_All_Sections_Records_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Arranged CSV with top executive summary and tabular columns
        const summaryRows = [
          ['"KB ANIMAL FEED CENTER - MASTER TRANSACTION REGISTER"'],
          ['"Report Scope:"', '"Complete Master Transaction History (Collectively All Sections)"'],
          ['"Generated Date & Time:"', `"${timestamp}"`],
          ['"Total Transactions Logged:"', records.length],
          ['"Grand Total Turnover (Rs):"', Math.round(grandTotalAmount)],
          ['""'],
          ['"EXECUTIVE SUMMARY BY SECTION:"'],
          ['"1. Factory Buy (Purchases & Dana)"', `"${purchases.length} Shipments"`, `"${totalPurBags.toLocaleString()} Bags"`, `"Rs. ${Math.round(totalPurAmt).toLocaleString()}"`, `"Dana: Rs. ${Math.round(totalPurDana).toLocaleString()}"`],
          ['"2. Wholesale (Big Parties & Lana)"', `"${wholesale.length} Orders"`, `"${totalWsBags.toLocaleString()} Bags"`, `"Rs. ${Math.round(totalWsAmt).toLocaleString()}"`, `"Lana: Rs. ${Math.round(totalWsLana).toLocaleString()}"`],
          ['"3. Retail Khata (Farmers & Lana)"', `"${retail.length} Sales"`, `"${totalRetBags.toLocaleString()} Bags"`, `"Rs. ${Math.round(totalRetAmt).toLocaleString()}"`, `"Lana: Rs. ${Math.round(totalRetLana).toLocaleString()}"`],
          ['"4. Direct Payments & Clearances"', `"${payments.length} Payments"`, '"—"', `"Rs. ${Math.round(totalPayAmt).toLocaleString()}"`],
          ['"5. Third-Party Factory Slips"', `"${thirdParty.length} Slips"`, '"—"', `"Rs. ${Math.round(totalTpAmt).toLocaleString()}"`],
          ['"6. Current Balance Treasury (CR/DR)"', `"${treasury.length} Entries"`, '"—"', `"Rs. ${Math.round(totalTreasuryAmt).toLocaleString()}"`],
          ['""'],
          ['"DETAILED TRANSACTION AUDIT REGISTER (ALL SECTIONS):"']
        ];

        const headers = [
          'No.',
          'Date',
          'Section / Source',
          'Transaction Category',
          'Party or Mill / Supplier',
          'Feed Item / Description',
          'Quantity Bags',
          'Rate Per Bag (Rs)',
          'Total Amount (Rs)',
          'Spot Cash (Rs)',
          'Udhaar Debt (Lana/Dana)',
          'Vehicle Number',
          'Reference Slip No',
          'Status'
        ];

        const rows = records.map((r, idx) => {
          let udhaarVal = 0;
          if (r.udhaarReceive && r.udhaarReceive > 0) {
            udhaarVal = r.udhaarReceive;
          } else if (r.borrowedUdhaar && r.borrowedUdhaar > 0) {
            udhaarVal = r.borrowedUdhaar;
          }

          return [
            idx + 1,
            `"${r.date}"`,
            `"${r.sectionName || r.categoryLabel}"`,
            `"${r.categoryLabel}"`,
            `"${(r.partyName || '').replace(/"/g, '""')}"`,
            `"${(r.itemName || '').replace(/"/g, '""')}"`,
            r.quantityBags || 0,
            r.rate || 0,
            r.amount || 0,
            r.spotCash ?? (r.paidOrReceived || 0),
            udhaarVal,
            `"${(r.vehicleNumber || 'N/A').replace(/"/g, '""')}"`,
            `"${(r.referenceNumber || '').replace(/"/g, '""')}"`,
            `"${r.status || 'RECORDED'}"`
          ];
        });

        const csvContent = '\uFEFF' + [
          ...summaryRows.map(row => row.join(',')),
          headers.join(','),
          ...rows.map(e => e.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `KB_Master_All_Sections_Records_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert(err.message || 'Error downloading records report');
    } finally {
      setDownloading(false);
    }
  };

  // Helper function to render a clear section badge
  const renderSectionBadge = (record: HistoryRecord) => {
    const isPurchase = record.category === 'PURCHASE';
    const isUdhaarReceive = Boolean(record.raw?.isUdhaarReceive || record.udhaarReceive);
    const isWs = record.category === 'SALE_WHOLESALE';
    const isRetail = record.category === 'SALE_RETAIL';
    const isPay = record.category === 'PAYMENT';
    const isThirdParty = record.category === 'THIRD_PARTY';
    const isTreasury = record.category === 'TREASURY';

    if (isTreasury) {
      const isCr = record.status === 'CREDIT_IN' || record.raw?.entryType === 'CR';
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md border ${
          isCr 
            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60'
            : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/60'
        }`}>
          <Banknote className="w-3 h-3" />
          <span>{isCr ? 'Treasury (CR Inflow)' : 'Treasury (DR Expense)'}</span>
        </span>
      );
    }

    if (isThirdParty) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
          <Receipt className="w-3 h-3" />
          <span>Third-Party Factory Deposit</span>
        </span>
      );
    }

    if (isPay) {
      const isSupplier = record.sectionName === 'Supplier Payment' || record.raw?.type === 'PAYMENT_TO_COMPANY';
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md border ${
          isSupplier
            ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800/60'
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
        }`}>
          <Coins className="w-3 h-3" />
          <span>{isSupplier ? 'Supplier Factory Payment' : 'Customer Debt Payback'}</span>
        </span>
      );
    }

    if (isPurchase) {
      if (isUdhaarReceive) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60">
            <Coins className="w-3 h-3" />
            <span>Factory Buy: Udhaar (recieve)</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
          <Building2 className="w-3 h-3" />
          <span>{record.sectionName || 'Factory Buy'}</span>
        </span>
      );
    }

    if (isWs) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
          <Truck className="w-3 h-3" />
          <span>Wholesale (Big Parties)</span>
        </span>
      );
    }

    if (isRetail) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          <ShoppingBag className="w-3 h-3" />
          <span>Retail Khata (Farmers)</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <Tag className="w-3 h-3" />
        <span>{record.categoryLabel}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Past Records &amp; Advanced Multi-Search</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search all historical transactions from Factory Buy, Wholesale Parties, Retail Khata, Payments, and Treasury.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleDownloadAllMasterReport('TXT')}
            disabled={downloading}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            title="Download complete master report in arranged readable text statement"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Preparing...' : 'Download All Records (Statement)'}</span>
          </button>
          <button
            onClick={() => handleDownloadAllMasterReport('CSV')}
            disabled={downloading}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Download all records as an organized, arranged Excel/CSV spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Download All Records (Excel/CSV)</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs transition-colors">
        
        {/* Main Search Row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search across all sections by party, factory, item, truck number, bilty, invoice..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            Search Records
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer border border-slate-300 dark:border-slate-700"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </form>

        {/* Filter Selectors Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          
          {/* Transaction Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Section / Category</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Sections (Factory Buy, Wholesale, Retail, Payments, Treasury)</option>
              <option value="PURCHASE">Factory Buy (Purchases &amp; Factory Dana)</option>
              <option value="SALE_WHOLESALE">Wholesale (Big Parties &amp; Lana)</option>
              <option value="SALE_RETAIL">Retail Khata (Farmer Sales &amp; Lana)</option>
              <option value="PAYMENT">Direct Payments (Customer Paybacks &amp; Factory Payments)</option>
              <option value="THIRD_PARTY">Third-Party Direct Factory Deposits</option>
              <option value="TREASURY">Current Balance Treasury (CR/DR Adjustments)</option>
            </select>
          </div>

          {/* Specific Company Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">By Factory / Mill</label>
            <select
              value={selectedCompanyId}
              onChange={e => setSelectedCompanyId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Factories / Mills</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Specific Party / Customer Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">By Party / Farmer</label>
            <select
              value={selectedPartyId}
              onChange={e => setSelectedPartyId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Parties &amp; Customers</option>
              <optgroup label="Wholesale Big Parties">
                {parties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
              <optgroup label="Retail Farmers">
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.village})</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Vehicle / Truck Number Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Vehicle / Truck Number</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="e.g. TK-8942 / LEA-4190"
                value={vehicleFilter}
                onChange={e => setVehicleFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono uppercase"
              />
              <button
                type="button"
                onClick={fetchRecords}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg font-bold border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Go
              </button>
            </div>
          </div>

        </div>

        {/* Date Presets Row */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 mr-1 text-[11px] font-bold">Date Filter:</span>
            {(['ALL', 'TODAY', 'WEEK', 'MONTH', 'CUSTOM'] as const).map(preset => (
              <button
                key={preset}
                onClick={() => setDatePreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  datePreset === preset
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {preset === 'ALL' ? 'All Time' : preset === 'TODAY' ? 'Today' : preset === 'WEEK' ? 'Last 7 Days' : preset === 'MONTH' ? 'This Month' : 'Custom'}
              </button>
            ))}
          </div>

          {datePreset === 'CUSTOM' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">
            Found <strong className="text-slate-900 dark:text-slate-100">{totalCount}</strong> matching transactions across all sections
          </div>
        </div>

      </div>

      {/* Cross-Section Summary KPI Bar */}
      <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 transition-colors">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <span>Records Breakdown by Section ({history.length} Loaded)</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-rose-100/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-800/60">
              Factory Buy: <strong>{summaryMetrics.counts.factoryBuy}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800/60">
              Wholesale: <strong>{summaryMetrics.counts.wholesale}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-800/60">
              Retail Khata: <strong>{summaryMetrics.counts.retail}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800/60">
              Direct Payments: <strong>{summaryMetrics.counts.payments}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 font-semibold border border-teal-200 dark:border-teal-800/60">
              Third-Party: <strong>{summaryMetrics.counts.thirdParty}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800/60">
              Treasury: <strong>{summaryMetrics.counts.treasury}</strong>
            </span>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-800/80 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Bags Handled</span>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
              {summaryMetrics.totalBags.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">bori</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800/80 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Value / Turnover</span>
            <div className="text-sm sm:text-base font-extrabold text-amber-700 dark:text-amber-400 mt-0.5 font-mono">
              Rs. {Math.round(summaryMetrics.totalAmount).toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800/80 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Spot Cash Movement</span>
            <div className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
              Rs. {Math.round(summaryMetrics.totalSpotCash).toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800/80 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Net Udhaar (Dana / Lana)</span>
            <div className="text-xs sm:text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 flex flex-col gap-0.5 font-mono">
              <span className="text-rose-600 dark:text-rose-400">Dana: Rs. {Math.round(summaryMetrics.totalDanaUdhaar).toLocaleString()}</span>
              <span className="text-amber-600 dark:text-amber-400">Lana: Rs. {Math.round(summaryMetrics.totalLanaUdhaar).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* History High-Density Records Table for All Sections */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[1020px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3.5 whitespace-nowrap">Date &amp; Ref #</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Section / Source</th>
                <th className="py-3 px-3.5">Party / Factory / Counter</th>
                <th className="py-3 px-3.5">Item &amp; Vehicle Info</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Bags</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Rate</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Total Value</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Spot Cash</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Udhaar (Lana/Dana)</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                    Loading historical transactions across all sections...
                  </td>
                </tr>
              ) : history.map((record) => {
                const isPurchase = record.category === 'PURCHASE';
                const isWs = record.category === 'SALE_WHOLESALE';
                const isRetail = record.category === 'SALE_RETAIL';
                const isPay = record.category === 'PAYMENT';
                const isThirdParty = record.category === 'THIRD_PARTY';
                const isTreasury = record.category === 'TREASURY';

                const spotVal = record.spotCash ?? (record.paidOrReceived || 0);
                const hasSpot = spotVal !== 0;

                return (
                  <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Date & Ref / Slip */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-mono text-slate-700 dark:text-slate-200 font-semibold">
                        {record.date}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        {record.referenceNumber && record.referenceNumber !== '—' ? record.referenceNumber : 'No Slip Ref'}
                      </div>
                    </td>

                    {/* Section / Source Badge */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {renderSectionBadge(record)}
                    </td>

                    {/* Party / Factory / Customer */}
                    <td className="py-3 px-3.5 max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {record.partyName}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {record.categoryLabel}
                      </div>
                    </td>

                    {/* Item & Vehicle Description */}
                    <td className="py-3 px-3.5 max-w-xs">
                      <div className="text-slate-700 dark:text-slate-200 font-medium truncate">
                        {record.itemName}
                      </div>
                      {record.vehicleNumber && record.vehicleNumber !== 'N/A' && record.vehicleNumber !== 'Counter' ? (
                        <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[9px] font-semibold rounded border border-slate-200 dark:border-slate-700">
                          <Truck className="w-2.5 h-2.5" />
                          <span>{record.vehicleNumber}</span>
                        </div>
                      ) : null}
                    </td>

                    {/* Bags */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {record.quantityBags > 0 ? (
                        <span>{record.quantityBags} <span className="text-[10px] text-slate-400 font-normal">bags</span></span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Rate */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {record.rate > 0 ? `Rs. ${record.rate.toLocaleString()}` : '—'}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-3.5 text-right font-mono tabular-nums font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      Rs. {record.amount?.toLocaleString()}
                    </td>

                    {/* Spot Cash Movement */}
                    <td className="py-3 px-3.5 text-right font-mono tabular-nums whitespace-nowrap">
                      {hasSpot ? (
                        <span className={`font-bold ${
                          isTreasury
                            ? spotVal > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            : isPurchase || (isPay && record.sectionName === 'Supplier Payment')
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {spotVal > 0 ? `Rs. ${spotVal.toLocaleString()}` : `-Rs. ${Math.abs(spotVal).toLocaleString()}`}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Udhaar (Lana / Dana) */}
                    <td className="py-3 px-3.5 text-right font-mono tabular-nums whitespace-nowrap">
                      {record.udhaarReceive && record.udhaarReceive > 0 ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60">
                          Recv: Rs. {record.udhaarReceive.toLocaleString()}
                        </span>
                      ) : record.borrowedUdhaar && record.borrowedUdhaar > 0 ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          isPurchase
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                        }`}>
                          {isPurchase ? 'Dana: ' : 'Lana: '}Rs. {record.borrowedUdhaar.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        record.status === 'PAID' || record.status === 'CLEARED' || record.status === 'COMPLETED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                          : record.status === 'PARTIAL'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                          : record.status === 'CREDIT'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                          : record.status === 'UDHAAR_RECV'
                          ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60'
                          : record.status === 'AUTO_BALANCED'
                          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60'
                      }`}>
                        {record.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenReceipt(record)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="View printable voucher / receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(record)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete this record permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && history.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                    No transactions match the selected filters. Try adjusting your search query, section filter, or date range.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Comprehensive All-Sections Aggregate Footer */}
            {!loading && history.length > 0 && (
              <tfoot className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50/95 dark:bg-slate-800/95 text-slate-900 dark:text-slate-100 font-bold">
                <tr>
                  <td colSpan={4} className="py-3 px-3.5 text-xs text-slate-600 dark:text-slate-300">
                    Total Displayed ({history.length} transactions across all sections):
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {summaryMetrics.totalBags.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">bags</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    —
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono tabular-nums text-amber-700 dark:text-amber-400 font-extrabold whitespace-nowrap">
                    Rs. {Math.round(summaryMetrics.totalAmount).toLocaleString()}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    Rs. {Math.round(summaryMetrics.totalSpotCash).toLocaleString()}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono tabular-nums text-xs whitespace-nowrap">
                    <span className="text-rose-600 dark:text-rose-400">D: {Math.round(summaryMetrics.totalDanaUdhaar).toLocaleString()}</span>
                    <span className="mx-1 text-slate-400">|</span>
                    <span className="text-amber-600 dark:text-amber-400">L: {Math.round(summaryMetrics.totalLanaUdhaar).toLocaleString()}</span>
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-center text-[10px] text-slate-400 font-normal">
                    Live Multi-Section View
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Reusable in-app deletion confirmation modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.categoryLabel || 'Transaction'}`}
        description={`Are you sure you want to permanently delete this ${deleteTarget?.categoryLabel} entry for "${deleteTarget?.partyName}" (Amount: Rs. ${deleteTarget?.amount?.toLocaleString()})?`}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

    </div>
  );
};
