import React from 'react';
import { 
  DashboardStats, 
  FeedItem,
  Sale,
  Purchase
} from '../types/feed';
import { 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  Truck, 
  ShoppingBag, 
  Users, 
  Building2, 
  ArrowLeftRight,
  Layers,
  ChevronRight
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  items?: FeedItem[];
  sales?: Sale[];
  purchases?: Purchase[];
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
  onOpenNewPurchase: () => void;
  onOpenNewSale: (type: 'WHOLESALE' | 'RETAIL') => void;
  onOpenNewPayment?: () => void;
  onOpenThirdPartyPayment: () => void;
  onSaveItem?: (item: Partial<FeedItem>) => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  sales = [],
  purchases = [],
  onNavigate,
  onOpenNewPurchase,
  onOpenNewSale,
  onOpenThirdPartyPayment
}) => {
  const formatPKR = (num: number = 0) => {
    return 'Rs. ' + Math.round(num).toLocaleString('en-US');
  };

  // Aggregated Bag Accounting
  const totalPurchasedBags = stats?.totalPurchasedBags ?? purchases.filter(p => !p.isUdhaarReceive).reduce((acc, p) => acc + (Number(p.quantityBags) || 0), 0);
  const totalSoldBags = stats?.totalSoldBags ?? sales.reduce((acc, s) => acc + (Number(s.quantityBags) || 0), 0);
  const wholesaleBagsSold = stats?.totalWholesaleBags ?? sales.filter(s => s.saleType === 'WHOLESALE').reduce((acc, s) => acc + (Number(s.quantityBags) || 0), 0);
  const retailBagsSold = stats?.totalRetailBags ?? sales.filter(s => s.saleType === 'RETAIL').reduce((acc, s) => acc + (Number(s.quantityBags) || 0), 0);
  const currentStockBags = stats?.totalStockBags ?? Math.max(0, totalPurchasedBags - totalSoldBags);

  // Recent sales with bag details
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Welcome & Quick Actions Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span>Real-Time Wholesale &amp; Retail Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Animal Feed &amp; Bag Accounting Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Track factory purchase bags, customer sales bags, wholesale dispatches, retail khatas, and real-time balances.
            </p>
          </div>

          {/* Quick Action Matrix - 4 distinct, clean buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <button
              onClick={onOpenNewPurchase}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-600 rounded-xl flex flex-col items-center justify-center text-center transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">+ Factory Buy</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Stock Inward</span>
            </button>

            <button
              onClick={() => onOpenNewSale('WHOLESALE')}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl flex flex-col items-center justify-center text-center transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">+ Big Party</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Wholesale Out</span>
            </button>

            <button
              onClick={() => onOpenNewSale('RETAIL')}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-600 rounded-xl flex flex-col items-center justify-center text-center transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">+ Retail Khata</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Counter Bill</span>
            </button>

            <button
              onClick={onOpenThirdPartyPayment}
              className="p-3 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 border border-amber-300 dark:border-amber-700/80 rounded-xl flex flex-col items-center justify-center text-center transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center mb-1 group-hover:scale-105 transition-transform shadow-xs">
                <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 whitespace-nowrap">Auto-Pay Factory</span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Dual Ledger</span>
            </button>
          </div>

        </div>
      </div>

      {/* KPI Financial & Inventory Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Active Bag Inventory */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Remaining Stock</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                {currentStockBags.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bags in Stock</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Total Bought:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {totalPurchasedBags.toLocaleString()} Bags
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Company Payables (Dena) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Factory Payables (Dena)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
                {formatPKR(stats?.totalCompanyPayables)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Owed to Factory:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {stats?.companiesCount || 0} Accounts
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Customer Receivables (Lena) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer Receivables (Lena)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatPKR(stats?.totalCustomerReceivables)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Wholesale: {formatPKR(stats?.totalWholesaleReceivables)}</span>
              <span className="text-slate-500 dark:text-slate-400">Retail: {formatPKR(stats?.totalRetailReceivables)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Net Position */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Position</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400 tabular-nums">
                {formatPKR(stats?.netPosition)}
              </span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              (Receivables + Stock) &minus; Payables
            </div>
          </div>
        </div>

      </div>


      {/* Bag Sales Summary Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Bags Sales &amp; Stock Summary</h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Live Automatic Calculation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Bags Sold (All Time)</div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {totalSoldBags.toLocaleString()} <span className="text-xs font-normal text-slate-400">Bags</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-x-2">
              <span>WS: <strong>{wholesaleBagsSold}</strong></span>
              <span>·</span>
              <span>Retail: <strong>{retailBagsSold}</strong></span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
            <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider">Today's Bags Sold</div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-1">
              {(stats?.todaySalesBags || 0).toLocaleString()} <span className="text-xs font-normal text-emerald-600 dark:text-emerald-500">Bags</span>
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
              Today: {formatPKR(stats?.todaySalesRevenue)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60">
            <div className="text-[11px] text-blue-800 dark:text-blue-300 font-bold uppercase tracking-wider">Bags Bought from Factory</div>
            <div className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono tabular-nums mt-1">
              {totalPurchasedBags.toLocaleString()} <span className="text-xs font-normal text-blue-600 dark:text-blue-500">Bags</span>
            </div>
            <div className="text-[11px] text-blue-700 dark:text-blue-400 mt-1">
              Total Inward from Company
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
            <div className="text-[11px] text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider">Current Bags Remaining</div>
            <div className="text-2xl font-black text-amber-900 dark:text-amber-300 font-mono tabular-nums mt-1">
              {currentStockBags.toLocaleString()} <span className="text-xs font-normal text-amber-700 dark:text-amber-400">Bags</span>
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
              (Bought &minus; Sold) in Stock
            </div>
          </div>
        </div>
      </div>

      {/* Recent Customer Bags Sales Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Recent Customer Bag Sales &amp; Dispatches</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Showing bag sales across wholesale big parties and retail counter customers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('wholesale')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Wholesale &rarr;
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              onClick={() => onNavigate('retail')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Retail &rarr;
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[760px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Date &amp; Invoice #</th>
                <th className="py-3 px-4">Customer / Party Name</th>
                <th className="py-3 px-4">Sales Channel</th>
                <th className="py-3 px-4 text-center">Vehicle / Counter</th>
                <th className="py-3 px-4 text-right">Bags Purchased</th>
                <th className="py-3 px-4 text-right">Spot Paid (Normal Money)</th>
                <th className="py-3 px-4 text-right">Lana (Udhaar Added)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-600 dark:text-amber-500" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No Customer Bag Sales Recorded Yet</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Click &quot;+ Big Party&quot; or &quot;+ Retail Khata&quot; above to log your first bag sale.
                    </p>
                  </td>
                </tr>
              ) : (
                recentSales.map((s) => {
                  const isWholesale = s.saleType === 'WHOLESALE';
                  const spotMoney = Number(s.paidSpot) || Number(s.paidAmount) || 0;
                  const lanaMoney = Number(s.borrowedLana) || Number(s.remainingBalance) || 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{s.date}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{s.invoiceNumber || '—'}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {s.partyName}
                      </td>
                      <td className="py-3 px-4">
                        {isWholesale ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Wholesale Big Party
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Retail Counter Sale
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {s.vehicleNumber || 'Counter'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black font-mono bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 tabular-nums">
                          {s.quantityBags ? `${s.quantityBags} Bags` : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                        {spotMoney > 0 ? `Rs. ${spotMoney.toLocaleString()}` : <span className="text-slate-400 font-normal">Rs. 0</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-amber-800 dark:text-amber-400">
                        {lanaMoney > 0 ? `Rs. ${lanaMoney.toLocaleString()}` : <span className="text-slate-400 font-normal">Rs. 0</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium gap-2">
          <span>Total Bag Sales Transactions: <strong className="text-slate-800 dark:text-slate-200">{sales.length}</strong></span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('wholesale')}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
            >
              <span>Wholesale Dispatches</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('retail')}
              className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
            >
              <span>Retail Khatas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
