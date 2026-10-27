import React, { useState, useEffect } from 'react';
import { 
  Company, 
  Party, 
  Customer, 
  Purchase,
  Sale,
  ThirdPartyPayment, 
  Payment,
  BranchAccount,
  CompanyPayment 
} from '../types/feed';
import { api } from '../services/api';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  Building2, 
  Plus, 
  Search, 
  HelpCircle,
  Coins,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  Trash2,
  X
} from 'lucide-react';

interface PaymentsAutoBalancingViewProps {
  companies: Company[];
  parties: Party[];
  customers: Customer[];
  purchases?: Purchase[];
  sales?: Sale[];
  thirdPartyPayments: ThirdPartyPayment[];
  directPayments: Payment[];
  onRefresh: () => void;
}

export const PaymentsAutoBalancingView: React.FC<PaymentsAutoBalancingViewProps> = ({
  companies,
  parties,
  customers,
  purchases = [],
  sales = [],
  thirdPartyPayments,
  directPayments = [],
  onRefresh
}) => {
  const [branchAccount, setBranchAccount] = useState<BranchAccount>({
    userName: 'Farooq Gujjar KB',
    branchName: 'Farooq Gujjar KB (Branch Account)',
    userBalance: 500000,
    companyBalance: 1250000,
    primaryCompanyId: companies[0]?.id || 'comp-1',
    primaryCompanyName: companies[0]?.name || 'Supreme Feeds Ltd'
  });
  const [companyPayments, setCompanyPayments] = useState<CompanyPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CR' | 'DR'>('ALL');

  // Modal: Record CR/DR Transaction
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<'CR' | 'DR'>('CR');
  const [amount, setAmount] = useState<number>(50000);
  const [description, setDescription] = useState<string>('Cash Deposit / Money Received');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load branch data
  const loadBranchData = async () => {
    setLoading(true);
    try {
      const res = await api.getBranchAccount();
      if (res.branchAccount) {
        setBranchAccount(res.branchAccount);
      }
      if (res.companyPayments) {
        setCompanyPayments(res.companyPayments);
      }
    } catch (err) {
      console.error('Error fetching branch account:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete confirmation modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCompanyPayment = (p: CompanyPayment) => {
    setDeleteConfirmation({
      isOpen: true,
      title: 'Delete CR/DR Transaction Record',
      description: `Are you sure you want to delete ${p.entryType === 'CR' ? 'Credit' : 'Debit'} transaction of Rs. ${Number(p.amount).toLocaleString()} (${p.description})? Associated balances will be reverted.`,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await api.deleteCompanyPayment(p.id);
          await loadBranchData();
          onRefresh();
        } catch (err: any) {
          console.error('Failed to delete transaction record', err);
          setStatusMessage({ type: 'error', text: err.message || 'Failed to delete transaction record' });
        } finally {
          setIsDeleting(false);
          setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  useEffect(() => {
    loadBranchData();
  }, [purchases, sales, directPayments, thirdPartyPayments]);

  // Submit CR/DR transaction
  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await api.recordCompanyPayment({
        entryType,
        amount: Number(amount),
        description: description || (entryType === 'CR' ? 'Credit Received' : 'Debit Paid'),
        referenceNumber: referenceNumber || `CRDR-${Math.floor(10000 + Math.random() * 90000)}`,
        date: paymentDate,
        notes
      });

      setStatusMessage({ type: 'success', text: res.message });
      if (res.branchAccount) {
        setBranchAccount(res.branchAccount);
      }

      await loadBranchData();
      onRefresh();

      setTimeout(() => {
        setIsModalOpen(false);
        setStatusMessage(null);
        setAmount(50000);
        setDescription('Cash Deposit / Money Received');
        setReferenceNumber('');
        setNotes('');
      }, 1200);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to record transaction' });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const totalPayables = companies.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const totalWholesaleReceivables = parties.reduce((sum, p) => sum + (p.currentBalance || 0), 0);
  const totalRetailReceivables = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const totalDebt = totalPayables + totalWholesaleReceivables + totalRetailReceivables;

  // Filter transactions
  const filteredPayments = companyPayments.filter(p => {
    if (filterType !== 'ALL' && p.entryType !== filterType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchRef = (p.referenceNumber || '').toLowerCase().includes(q);
      const matchNotes = (p.notes || '').toLowerCase().includes(q);
      return matchDesc || matchRef || matchNotes;
    }
    return true;
  });

  const totalCredits = companyPayments.filter(p => p.entryType === 'CR').reduce((sum, p) => sum + p.amount, 0);
  const totalDebits = companyPayments.filter(p => p.entryType === 'DR').reduce((sum, p) => sum + p.amount, 0);

  // Gross User Cash collected from sales and received customer debt payments
  const wholesaleSpotCash = sales
    .filter(s => s.saleType === 'WHOLESALE')
    .reduce((sum, s) => sum + (Number(s.paidAmount) || Number(s.paidSpot) || 0), 0);
  const retailSpotCash = sales
    .filter(s => s.saleType === 'RETAIL')
    .reduce((sum, s) => sum + (Number(s.paidAmount) || Number(s.paidSpot) || 0), 0);
  const receivedCustomerPayments = directPayments
    .filter(p => p.type === 'PAYMENT_FROM_CUSTOMER' && !(p as any).isLinkedToFactoryBuy)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const grossUserCashCollected = wholesaleSpotCash + retailSpotCash + receivedCustomerPayments;

  // Factory transactions
  const factorySpotPurchases = purchases.reduce(
    (sum, p) => sum + (Number(p.paidNow) || Number(p.givenOnSpot) || 0),
    0
  );
  const factoryDirectPayments = directPayments
    .filter(p => p.type === 'PAYMENT_TO_COMPANY')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const factoryUdhaarReceive = purchases
    .filter(p => p.isUdhaarReceive || Number(p.udhaarReceiveAmount) > 0)
    .reduce((sum, p) => sum + (Number(p.udhaarReceiveAmount) || Number(p.partyCutAmount) || 0), 0);
  const factoryDanaUdhaar = purchases
    .filter(p => !p.isUdhaarReceive)
    .reduce((sum, p) => sum + (Number(p.borrowedAmount) || 0), 0);

  // Available User Cash after sending normal transaction factory purchase spot payments to Factory Balance
  const availableUserCash = Math.max(0, grossUserCashCollected - factorySpotPurchases);

  // Active Factory Dana in Factory Buy (gross Dana minus any direct payments already made to factory)
  const activeFactoryDana = Math.max(0, factoryDanaUdhaar - factoryDirectPayments);

  // Cut amount of Factory Dana from User Balance
  const danaCutFromUser = Math.min(availableUserCash, activeFactoryDana);

  // 1. Live User Balance: Deduct factory dana cut amount from available user cash
  const liveUserBalance = Math.max(0, availableUserCash - danaCutFromUser);

  // 2. Live Factory Balance: Cash paid to factory (spot + direct + wholesale payback + net CR/DR) + Dana cut amount transferred from user balance
  const netCrDrTreasury = totalCredits - totalDebits;
  const liveFactoryBalance = Math.max(0, factorySpotPurchases + factoryDirectPayments + factoryUdhaarReceive + netCrDrTreasury + danaCutFromUser);

  // Remaining Factory Dana in Factory Buy (subtract cut amount from user)
  const remainingFactoryDana = Math.max(0, activeFactoryDana - danaCutFromUser);

  const totalCustomerUdhaarExcluded = sales.reduce((sum, s) => sum + (Number(s.borrowedLana) || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              Live Real-Time Treasury
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Account: <strong className="text-slate-800 dark:text-slate-200">{branchAccount.userName} (Unified Account)</strong>
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Current Balance
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record CR / DR Entry</span>
          </button>
        </div>
      </div>

      {/* 2. Core Balances Cards (Factory Balance & User Balance) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Factory Balance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/60 shadow-xs transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              Factory Balance
            </span>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Live Total Cash
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums tracking-tight">
              Rs. {Math.round(liveFactoryBalance).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live total cash received in Factory Buy (spot payments, direct payments, wholesale udhaar receive &amp; user dana cut)
            </div>
          </div>

          {/* Breakdown summary */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>Spot Purchases (Factory Buy):</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                Rs. {factorySpotPurchases.toLocaleString()}
              </span>
            </div>
            {factoryUdhaarReceive > 0 && (
              <div className="flex items-center justify-between">
                <span>Wholesale Udhaar (recieve) Payback:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +Rs. {factoryUdhaarReceive.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Direct Supplier Payments:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                Rs. {factoryDirectPayments.toLocaleString()}
              </span>
            </div>
            {danaCutFromUser > 0 && (
              <div className="flex items-center justify-between">
                <span>Dana Cleared from User Balance:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +Rs. {danaCutFromUser.toLocaleString()}
                </span>
              </div>
            )}
            {netCrDrTreasury !== 0 && (
              <div className="flex items-center justify-between">
                <span>Net Treasury Audit (CR - DR):</span>
                <span className={`font-bold tabular-nums ${netCrDrTreasury >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {netCrDrTreasury > 0 ? `+Rs. ${netCrDrTreasury.toLocaleString()}` : `-Rs. ${Math.abs(netCrDrTreasury).toLocaleString()}`}
                </span>
              </div>
            )}
            {remainingFactoryDana > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                <span>Remaining Factory Dana (Unpaid):</span>
                <span className="tabular-nums">Rs. {remainingFactoryDana.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* User Balance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-xs transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              User Balance
            </span>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
              Live Customer Cash
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              Rs. {Math.round(liveUserBalance).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live spot cash received from sales (minus factory dana deducted)
            </div>
          </div>

          {/* Breakdown summary */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>Wholesale Big Parties Cash:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                Rs. {wholesaleSpotCash.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Retail Counter Cash:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                Rs. {retailSpotCash.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Received Debt Payments:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                Rs. {receivedCustomerPayments.toLocaleString()}
              </span>
            </div>
            {factorySpotPurchases > 0 && (
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-semibold">
                <span>Factory Purchase Spot Payment (Sent to Factory):</span>
                <span className="tabular-nums">
                  -Rs. {factorySpotPurchases.toLocaleString()}
                </span>
              </div>
            )}
            {danaCutFromUser > 0 && (
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-semibold">
                <span>Factory Dana Deducted:</span>
                <span className="tabular-nums">
                  -Rs. {danaCutFromUser.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
              <span>Excluded Lana Udhaar (Unpaid):</span>
              <span className="tabular-nums">Rs. {totalCustomerUdhaarExcluded.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search CR/DR records by description, reference, notes..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                filterType === 'ALL' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({companyPayments.length})
            </button>
            <button
              onClick={() => setFilterType('CR')}
              className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                filterType === 'CR' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Credit (CR)
            </button>
            <button
              onClick={() => setFilterType('DR')}
              className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                filterType === 'DR' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Debit (DR)
            </button>
          </div>
        </div>
      </div>

      {/* 4. Transactions Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Company &amp; User CR/DR Audit Trail</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Chronological record of all credit and debit entries for company pay treasury.</p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Showing {filteredPayments.length} entries</span>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No CR/DR Transactions Recorded Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Click &quot;Add CR / DR Entry&quot; above to log your first credit or debit transaction.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Date &amp; Ref #</th>
                  <th className="py-3 px-4">Type &amp; Description</th>
                  <th className="py-3 px-4 text-right">Credit (CR) (+)</th>
                  <th className="py-3 px-4 text-right">Debit (DR) (-)</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map((p) => {
                  const isCR = p.entryType === 'CR';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{p.date}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{p.referenceNumber}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                          {isCR ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <ArrowDownCircle className="w-3 h-3" /> CR (Credit)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <ArrowUpCircle className="w-3 h-3" /> DR (Debit)
                            </span>
                          )}
                          <span>{p.description}</span>
                        </div>
                        {p.notes && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5">{p.notes}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isCR ? (
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
                            + Rs. {Number(p.amount).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!isCR ? (
                          <span className="font-extrabold text-rose-600 dark:text-rose-400 tabular-nums text-sm">
                            - Rs. {Number(p.amount).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        Rs. {Number(p.companyBalanceAfter ?? branchAccount.companyBalance).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteCompanyPayment(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete transaction record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD CR / DR ENTRY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Credit (CR) or Debit (DR) Entry</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Unified treasury update for company &amp; user account.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordTransaction} className="p-6 space-y-4 overflow-y-auto flex-1">
              {statusMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {statusMessage.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Transaction Type (CR / DR)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('CR');
                      setDescription('Cash Deposit / Money Received');
                    }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      entryType === 'CR'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    <span>Credit (CR - Money In)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('DR');
                      setDescription('Supplier Payment / Expense Paid');
                    }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      entryType === 'DR'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>Debit (DR - Money Out)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (Rs.) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Category
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Factory Payment, Bank Deposit, Cash Withdrawn..."
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reference / Slip Number</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. TRF-98214"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Remarks (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Additional remarks..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                ></textarea>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Recording...' : `Save ${entryType} Transaction`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmation.isOpen}
        title={deleteConfirmation.title}
        description={deleteConfirmation.description}
        isDeleting={isDeleting}
        onConfirm={deleteConfirmation.onConfirm}
        onClose={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
