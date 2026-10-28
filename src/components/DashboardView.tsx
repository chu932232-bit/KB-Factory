import React, { useState } from 'react';
import { 
  DashboardStats, 
  FeedItem 
} from '../types/feed';
import { 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  AlertTriangle, 
  Plus, 
  Edit3, 
  Truck, 
  ShoppingBag, 
  Users, 
  Building2, 
  ArrowLeftRight,
  X
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  items: FeedItem[];
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
  onOpenNewPurchase: () => void;
  onOpenNewSale: (type: 'WHOLESALE' | 'RETAIL') => void;
  onOpenNewPayment: () => void;
  onOpenThirdPartyPayment: () => void;
  onSaveItem: (item: Partial<FeedItem>) => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  items,
  onRefresh,
  onNavigate,
  onOpenNewPurchase,
  onOpenNewSale,
  onOpenThirdPartyPayment,
  onSaveItem
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [editingItem, setEditingItem] = useState<Partial<FeedItem> | null>(null);
  const [showItemModal, setShowItemModal] = useState<boolean>(false);
  const [savingItem, setSavingItem] = useState<boolean>(false);

  const categories = ['ALL', 'Vanda / Dairy Feed', 'Khal (Oil Cake)', 'Pellets / Calf Feed', 'Churi / Bran', 'Silage / Fodder'];

  const filteredItems = items.filter(item => {
    if (categoryFilter === 'ALL') return true;
    return item.category === categoryFilter;
  });

  const lowStockItems = items.filter(i => (i.stockBags || 0) <= (i.minStockAlert || 50));

  const handleSaveItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.name) return;
    setSavingItem(true);
    try {
      await onSaveItem(editingItem);
      setShowItemModal(false);
      setEditingItem(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingItem(false);
    }
  };

  const formatPKR = (num: number = 0) => {
    return 'Rs. ' + Math.round(num).toLocaleString('en-US');
  };

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
              Animal Feed (Vanda / Bori) Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Live bori inventory, factory purchase ledgers, bulk party dispatches, retail customer khatas, and auto-balancing 3rd-party payments.
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
        
        {/* Card 1: Active Inventory */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Inventory</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                {stats?.totalStockBags?.toLocaleString() || '0'}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bags (Bori)</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Stock Valuation:</span>
              <span className="font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                {formatPKR(stats?.totalStockValue)}
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
              <span className="text-slate-500 dark:text-slate-400">Owed to Feed Mills:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {stats?.companiesCount || 0} Factories
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

      {/* User & Branch Company Balances Summary Bar */}
      {(stats?.userBalance !== undefined || stats?.companyBalance !== undefined) && (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              User &amp; Branch Accounts Status:
            </span>
          </div>
          <div className="flex items-center gap-6 font-mono">
            <div>
              <span className="text-slate-500 dark:text-slate-400">User ({stats?.userName || 'Farooq Gujjar KB'}): </span>
              <strong className="text-indigo-700 dark:text-indigo-400 text-sm font-extrabold">{formatPKR(stats?.userBalance)}</strong>
            </div>
            <div className="border-l border-slate-300 dark:border-slate-700 h-4"></div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Head Office Company Balance: </span>
              <strong className="text-emerald-700 dark:text-emerald-400 text-sm font-extrabold">{formatPKR(stats?.companyBalance)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Today's Operational Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-xs transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Today's Sales Dispatch</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {stats?.todaySalesBags || 0} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bags Sold</span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 ml-2">
                  ({formatPKR(stats?.todaySalesRevenue)})
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('history')} 
            className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-bold cursor-pointer hover:underline"
          >
            History &rarr;
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-xs transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Today's Factory Purchases</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {stats?.todayPurchasesBags || 0} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bags Inward</span>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-400 ml-2">
                  ({formatPKR(stats?.todayPurchasesCost)})
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('purchases')} 
            className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-bold cursor-pointer hover:underline"
          >
            Inward &rarr;
          </button>
        </div>
      </div>

      {/* Low Stock Alert if any */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 flex items-start justify-between gap-3 shadow-xs transition-colors">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Low Stock Warning: {lowStockItems.length} Variety Below Reorder Level
              </h2>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                {lowStockItems.map(i => `${i.name} (${i.stockBags} bags left, min: ${i.minStockAlert})`).join(' · ')}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenNewPurchase}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs shrink-0 cursor-pointer"
          >
            Reorder Stock
          </button>
        </div>
      )}

      {/* Live Stock Management Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
        
        {/* Section Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Live Stock View &amp; Feed Varieties</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Current bag quantities update automatically with purchases and customer dispatches.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingItem({
                  name: '',
                  category: 'Vanda / Dairy Feed',
                  bagWeightKg: 50,
                  unit: 'Bori (Bag)',
                  stockBags: 100,
                  minStockAlert: 50,
                  purchasePrice: 2800,
                  wholesalePrice: 2950,
                  retailPrice: 3050,
                  manufacturer: ''
                });
                setShowItemModal(true);
              }}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Variety</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'All Varieties' : cat}
            </button>
          ))}
        </div>

        {/* High-density Stock Data Grid with min-width safety */}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[760px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Feed Variety</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Bag Wt</th>
                <th className="py-3 px-4 text-right">Stock (Bags)</th>
                <th className="py-3 px-4 text-right">Buy Rate</th>
                <th className="py-3 px-4 text-right">Wholesale Rate</th>
                <th className="py-3 px-4 text-right">Retail Rate</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-600 dark:text-amber-500" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No Feed Varieties Added Yet</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Click &quot;+ Add New Variety&quot; above to register your first Vanda or feed item.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                const isLow = (item.stockBags || 0) <= (item.minStockAlert || 50);
                const totalItemVal = (item.stockBags || 0) * (item.purchasePrice || 0);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {item.manufacturer ? `Mill: ${item.manufacturer}` : 'Direct Stock'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-300 font-mono font-medium">
                      {item.bagWeightKg} kg
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={`text-sm font-bold font-mono tabular-nums ${
                          isLow ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {item.stockBags?.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Bags</span>
                      </div>
                      {isLow && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                          Low (Min: {item.minStockAlert})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {formatPKR(item.purchasePrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-blue-700 dark:text-blue-400 font-semibold">
                      {formatPKR(item.wholesalePrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700 dark:text-amber-400 font-bold">
                      {formatPKR(item.retailPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 font-bold">
                      {formatPKR(totalItemVal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setShowItemModal(true);
                        }}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit variety & pricing"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium gap-2">
          <span>Active Varieties: <strong className="text-slate-800 dark:text-slate-200">{filteredItems.length}</strong></span>
          <span>Total In Stock: <strong className="text-slate-800 dark:text-slate-200 font-mono">{filteredItems.reduce((acc, i) => acc + (i.stockBags || 0), 0).toLocaleString()}</strong> Bags / Bori</span>
        </div>
      </div>

      {/* Add / Edit Feed Variety Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto my-auto text-slate-900 dark:text-slate-100 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingItem?.id ? 'Edit Feed Variety' : 'Add New Feed Variety'}
              </h3>
              <button 
                onClick={() => setShowItemModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Variety Name</label>
                <input
                  type="text"
                  required
                  value={editingItem?.name || ''}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="e.g. Dairy Booster Gold Vanda (50kg)"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={editingItem?.category || 'Vanda / Dairy Feed'}
                    onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Vanda / Dairy Feed">Vanda / Dairy Feed</option>
                    <option value="Khal (Oil Cake)">Khal (Oil Cake)</option>
                    <option value="Pellets / Calf Feed">Pellets / Calf Feed</option>
                    <option value="Churi / Bran">Churi / Bran</option>
                    <option value="Silage / Fodder">Silage / Fodder</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bag Weight (Kg)</label>
                  <input
                    type="number"
                    value={editingItem?.bagWeightKg || 50}
                    onChange={e => setEditingItem({ ...editingItem, bagWeightKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Stock (Bags)</label>
                  <input
                    type="number"
                    value={editingItem?.stockBags || 0}
                    onChange={e => setEditingItem({ ...editingItem, stockBags: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Low Stock Alert (Bags)</label>
                  <input
                    type="number"
                    value={editingItem?.minStockAlert || 50}
                    onChange={e => setEditingItem({ ...editingItem, minStockAlert: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Purchase Rate</label>
                  <input
                    type="number"
                    value={editingItem?.purchasePrice || 0}
                    onChange={e => setEditingItem({ ...editingItem, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Wholesale Rate</label>
                  <input
                    type="number"
                    value={editingItem?.wholesalePrice || 0}
                    onChange={e => setEditingItem({ ...editingItem, wholesalePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Retail Rate</label>
                  <input
                    type="number"
                    value={editingItem?.retailPrice || 0}
                    onChange={e => setEditingItem({ ...editingItem, retailPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Manufacturer / Mill Name</label>
                <input
                  type="text"
                  value={editingItem?.manufacturer || ''}
                  onChange={e => setEditingItem({ ...editingItem, manufacturer: e.target.value })}
                  placeholder="e.g. Supreme Feeds Ltd"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {savingItem ? 'Saving...' : 'Save Variety'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
