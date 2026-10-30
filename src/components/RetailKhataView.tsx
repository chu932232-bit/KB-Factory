import React, { useState } from 'react';
import { 
  Customer, 
  FeedItem, 
  Sale, 
  LedgerEntry 
} from '../types/feed';
import { api } from '../services/api';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  UserCheck, 
  Plus, 
  Search, 
  ShoppingBag, 
  FileText, 
  Download, 
  Phone, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  X, 
  Trash2 
} from 'lucide-react';

interface RetailKhataViewProps {
  customers: Customer[];
  items: FeedItem[];
  sales: Sale[];
  onRefresh: () => void;
  openNewSaleModal: boolean;
  setOpenNewSaleModal: (open: boolean) => void;
}

export const RetailKhataView: React.FC<RetailKhataViewProps> = ({
  customers,
  items,
  sales,
  onRefresh,
  openNewSaleModal,
  setOpenNewSaleModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);
  const [customerLedgerData, setCustomerLedgerData] = useState<{
    customer: Customer;
    ledgerEntries: LedgerEntry[];
    calculatedBalance: number;
  } | null>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Modal: Add New Customer
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustData, setNewCustData] = useState({
    name: '',
    phone: '',
    village: '',
    cattleCount: 5,
    initialBalance: 0
  });

  // Modal: Receive Payment from Customer
  const [showPayCustomerModal, setShowPayCustomerModal] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('Cash Received at Counter');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payingCustomer, setPayingCustomer] = useState(false);

  // Form State for Retail Sale
  const [formData, setFormData] = useState({
    customerId: customers[0]?.id || '',
    quantityBags: 0,
    borrowedLana: 0,
    paidSpot: 0,
    date: new Date().toISOString().split('T')[0],
    vehicleNumber: 'Counter Pickup',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  React.useEffect(() => {
    if (customers && customers.length > 0 && !formData.customerId) {
      setFormData(prev => ({ ...prev, customerId: customers[0].id }));
    }
  }, [customers]);

  const lanaVal = Number(formData.borrowedLana) || 0;
  const spotVal = Number(formData.paidSpot) || 0;
  const netPayableAdded = lanaVal;
  const targetCustomerId = formData.customerId || (customers && customers.length > 0 ? customers[0].id : '');
  const selectedCustomerObj = customers.find(c => c.id === targetCustomerId);
  const currentCustomerDue = selectedCustomerObj?.currentBalance || 0;
  const resultingCustomerBalance = currentCustomerDue + lanaVal;

  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCustomerId = formData.customerId || (customers && customers.length > 0 ? customers[0].id : '');
    if (!finalCustomerId) {
      alert('Please select a farmer customer');
      return;
    }
    if (lanaVal <= 0 && spotVal <= 0) {
      alert('Please enter an amount for either Borrowed (Lana) or Paid on Spot (Normal Transaction)');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    try {
      await api.recordSale({
        saleType: 'RETAIL',
        partyId: finalCustomerId,
        quantityBags: Number(formData.quantityBags) || 0,
        borrowedLana: lanaVal,
        paidAmount: spotVal,
        paidSpot: spotVal,
        totalAmount: Math.max(lanaVal, spotVal),
        vehicleNumber: formData.vehicleNumber || 'Counter Pickup',
        date: formData.date,
        notes: formData.notes
      });

      setSuccessMsg(resultingCustomerBalance === 0 ? 'Recorded! Customer payable is now Rs. 0 (ZERO).' : 'Retail entry recorded! Farmer khata updated.');
      onRefresh();
      setTimeout(() => {
        setSuccessMsg('');
        setOpenNewSaleModal(false);
      }, 350);

      // Reset form
      setFormData({
        customerId: customers[0]?.id || '',
        quantityBags: 0,
        borrowedLana: 0,
        paidSpot: 0,
        date: new Date().toISOString().split('T')[0],
        vehicleNumber: 'Counter Pickup',
        notes: ''
      });
    } catch (err: any) {
      alert(err.message || 'Error recording retail entry');
    } finally {
      setSubmitting(false);
    }
  };

  const retailSales = sales.filter(s => s.saleType === 'RETAIL');

  const handleOpenLedger = async (cust: Customer) => {
    setSelectedCustomerForLedger(cust);
    setLoadingLedger(true);
    try {
      const data = await api.getCustomerLedger(cust.id);
      setCustomerLedgerData(data);
    } catch (err: any) {
      alert(err.message || 'Error fetching customer khata');
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustData.name) return;
    try {
      await api.createCustomer(newCustData);
      setShowAddCustomerModal(false);
      setNewCustData({
        name: '',
        phone: '',
        village: '',
        cattleCount: 5,
        initialBalance: 0
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error adding customer');
    }
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {}
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCustomer = (cust: Customer) => {
    setDeleteConfirmation({
      isOpen: true,
      title: `Delete Customer "${cust.name}"`,
      description: `Are you sure you want to delete customer "${cust.name}"? This will delete this customer's khata and permanently delete all related retail sales, debt records, and payments across all sections (inventory stock will be restored).`,
      action: async () => {
        await api.deleteCustomer(cust.id);
        setSelectedCustomerForLedger(null);
        setCustomerLedgerData(null);
        onRefresh();
      }
    });
  };

  const handleDeleteSale = (sale: Sale) => {
    setDeleteConfirmation({
      isOpen: true,
      title: `Delete Sale #${sale.invoiceNumber || sale.id}`,
      description: `Are you sure you want to delete Retail Sale #${sale.invoiceNumber || sale.id} for "${sale.partyName}"? This will restore ${sale.quantityBags} bags to stock and reverse customer khata balances.`,
      action: async () => {
        await api.deleteSale(sale.id);
        onRefresh();
        if (selectedCustomerForLedger && selectedCustomerForLedger.id === sale.partyId) {
          handleOpenLedger(selectedCustomerForLedger);
        }
      }
    });
  };

  const handleDeleteLedgerEntry = (entry: LedgerEntry) => {
    if (entry.type === 'OPENING_BALANCE') {
      alert('Opening balance is automatically computed from account history.');
      return;
    }
    const isSale = entry.type === 'SALE' || entry.type === 'RETAIL_SALE' || entry.id.startsWith('sale-') || entry.id.startsWith('spot-');
    const isPayment = entry.type === 'PAYMENT' || entry.type === 'KHATA_PAYMENT_RECEIVED' || entry.id.startsWith('pay-') || entry.type === 'CASH_PAID_AT_PURCHASE';
    const isTpp = entry.type === 'THIRD_PARTY_DEPOSIT' || entry.id.startsWith('tpp-');

    setDeleteConfirmation({
      isOpen: true,
      title: 'Delete Ledger Entry',
      description: `Are you sure you want to delete ledger entry "${entry.description}"? Linked balances and stock will be automatically reversed.`,
      action: async () => {
        if (isSale) {
          await api.deleteSale(entry.id);
        } else if (isPayment) {
          await api.deletePayment(entry.id);
        } else if (isTpp) {
          await api.deleteThirdPartyPayment(entry.id);
        }
        await onRefresh();
        if (selectedCustomerForLedger) {
          handleOpenLedger(selectedCustomerForLedger);
        }
      }
    });
  };

  const handleExecuteDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteConfirmation.action();
      setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      alert(err.message || 'Error executing deletion');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReceivePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayCustomerModal || payAmount <= 0) return;
    setPayingCustomer(true);
    try {
      const targetCustId = showPayCustomerModal.id;
      await api.recordPayment({
        type: 'PAYMENT_FROM_CUSTOMER',
        targetId: showPayCustomerModal.id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        referenceNumber: payRef || `REC-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        notes: payNotes
      });
      setShowPayCustomerModal(null);
      setPayAmount(0);
      setPayRef('');
      setPayNotes('');
      onRefresh();
      if (selectedCustomerForLedger && selectedCustomerForLedger.id === targetCustId) {
        handleOpenLedger(selectedCustomerForLedger);
      }
    } catch (err: any) {
      alert(err.message || 'Error recording payment');
    } finally {
      setPayingCustomer(false);
    }
  };

  const handleDownloadLedger = (cust: Customer) => {
    if (!customerLedgerData?.ledgerEntries) return;
    const lines = [
      `==================================================================`,
      `               FARMER KHATA STATEMENT - KB FACTORY               `,
      `==================================================================`,
      `Farmer Name:   ${cust.name}`,
      `Village:       ${cust.village || 'N/A'}`,
      `Phone:         ${cust.phone || 'N/A'}`,
      `Cattle Count:  ${cust.cattleCount || 0} Animals`,
      `Generated On:  ${new Date().toLocaleDateString()}`,
      `------------------------------------------------------------------`,
      `TOTAL FEED BROUGHT:    Rs. ${Math.round(cust.totalSales || 0).toLocaleString()}`,
      `TOTAL CASH PAID:       Rs. ${Math.round(cust.totalReceived || 0).toLocaleString()}`,
      `CURRENT KHATA UDHAAR:  Rs. ${Math.round(customerLedgerData.calculatedBalance ?? cust.currentBalance).toLocaleString()}`,
      `------------------------------------------------------------------`,
      `DATE       | DESCRIPTION                              | DEBIT (BILL)    | CREDIT (RECEIVED)| RUNNING UDHAAR`,
      `------------------------------------------------------------------`,
      ...customerLedgerData.ledgerEntries.map(e => {
        const d = (e.date || '').padEnd(10);
        const desc = (e.description || '').slice(0, 40).padEnd(40);
        const debit = e.debit > 0 ? `Rs. ${e.debit.toLocaleString()}`.padStart(15) : '—'.padStart(15);
        const credit = e.credit > 0 ? `Rs. ${e.credit.toLocaleString()}`.padStart(14) : '—'.padStart(14);
        const bal = `Rs. ${(e.runningBalance || 0).toLocaleString()}`.padStart(16);
        return `${d} | ${desc} | ${debit} | ${credit} | ${bal}`;
      }),
      `==================================================================`
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Farmer_Khata_${cust.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRetailReceivables = customers.reduce((acc, c) => acc + (c.currentBalance || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Local Dairy Farmers &amp; Retail Khata Book</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fast counter sales for local dairy farmers taking 2, 5, 10, or 20 bori, with instant Udhaar balance tracking and WhatsApp bills.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block bg-slate-50 dark:bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Retail Udhaar</div>
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
              Rs. {Math.round(totalRetailReceivables).toLocaleString()}
            </div>
          </div>
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>+ Add Farmer</span>
          </button>
          <button
            onClick={() => {
              if (customers.length > 0 && !formData.customerId) {
                setFormData(prev => ({ ...prev, customerId: customers[0].id }));
              }
              setOpenNewSaleModal(true);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Retail Sale</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search farmer name, village, mobile number..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-800"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
          Showing {filteredCustomers.length} Farmer Khatas
        </div>
      </div>

      {/* Customer Khatas Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-10 text-center shadow-xs">
          <UserCheck className="w-10 h-10 mx-auto text-amber-600 dark:text-amber-500 mb-2 opacity-50" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">No Farmer Khatas Added Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Click &quot;+ Add Farmer Khata&quot; above to create your first dairy farmer or cattle owner khata.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCustomers.map((cust) => {
          return (
            <div 
              key={cust.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">{cust.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cust.village || 'Local Village'}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md font-mono tabular-nums ${
                    cust.currentBalance > 0 
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60' 
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                  }`}>
                    {cust.currentBalance > 0 ? 'Udhaar Due' : 'Paid Clear'}
                  </span>
                </div>

                <div className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cust.phone || 'No mobile'}</span>
                  </div>
                  {cust.cattleCount > 0 && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {cust.cattleCount} Cattle
                    </span>
                  )}
                </div>

                {/* Balance breakdown */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Total Feed</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums mt-0.5">
                      Rs. {Math.round(cust.totalSales || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Balance Due</div>
                    <div className="text-xs font-extrabold text-amber-800 dark:text-amber-400 font-mono tabular-nums mt-0.5">
                      Rs. {Math.round(cust.currentBalance || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenLedger(cust)}
                  className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Khata</span>
                </button>
                {cust.currentBalance > 0 && (
                  <button
                    onClick={() => {
                      setShowPayCustomerModal(cust);
                      setPayAmount(cust.currentBalance > 0 ? cust.currentBalance : 0);
                    }}
                    className="py-1.5 px-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    title="Receive Udhaar (Lana) Payment"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Receive</span>
                  </button>
                )}
                <button
                  onClick={() => handleDeleteCustomer(cust)}
                  className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 rounded-lg transition-colors cursor-pointer"
                  title={`Delete customer ${cust.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Recent Retail Counter Sales */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs mt-8 transition-colors">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Recent Retail Counter &amp; Farmer Sales</h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total: {retailSales.length}</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[820px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Date &amp; Receipt #</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Feed Variety</th>
                <th className="py-3 px-4 text-center">Transport / Pickup</th>
                <th className="py-3 px-4 text-right">Bags</th>
                <th className="py-3 px-4 text-right">Rate</th>
                <th className="py-3 px-4 text-right">Net Bill</th>
                <th className="py-3 px-4 text-right">Cash Received</th>
                <th className="py-3 px-4 text-right">Khata Added</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {retailSales.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-600 dark:text-amber-500" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No Retail Counter Sales Yet</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Click &quot;New Retail Sale&quot; above to log your first cash or udhaar counter sale.
                    </p>
                  </td>
                </tr>
              ) : (
                retailSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{s.date}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{s.invoiceNumber}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {s.partyName}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {s.itemName}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400">
                    {s.vehicleNumber}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                    {s.quantityBags} Bags
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    Rs. {s.ratePerBag?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                    Rs. {s.netAmount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                    Rs. {(s.paidAmount || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-amber-800 dark:text-amber-400">
                    Rs. {(s.remainingBalance || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      s.remainingBalance === 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      {s.remainingBalance === 0 ? 'Cash Paid' : 'On Khata'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDeleteSale(s)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title={`Delete sale ${s.invoiceNumber || s.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: RECORD RETAIL SALE */}
      {openNewSaleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl relative my-auto max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
            <button
              onClick={() => setOpenNewSaleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Record Retail Khata Sale</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              For local dairy farmers taking smaller quantities (2, 5, 10, 20 bori). Stock decrements immediately.
            </p>

            {successMsg && (
              <div className="p-3 mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSale} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Customer / Farmer *</label>
                  <select
                    required
                    value={formData.customerId || (customers[0]?.id || '')}
                    onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.village || 'Local'} - Due: Rs. {c.currentBalance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  How Many Bags Purchased by Customer? (Bags Count)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 5"
                  value={formData.quantityBags || ''}
                  onChange={e => setFormData({ ...formData, quantityBags: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Two Direct Financial Transaction Options */}
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-3">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                  <span>Transaction Amounts</span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Enter either or both</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      1. Money Borrowed by Customer (Lana / Udhaar) (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.borrowedLana || ''}
                      onChange={e => setFormData({ ...formData, borrowedLana: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-mono font-bold text-amber-900 dark:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Increases customer's khata due
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      2. Paid on Spot (Normal Transaction) (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.paidSpot || ''}
                      onChange={e => setFormData({ ...formData, paidSpot: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Received as spot cash
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic summary */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Money Borrowed (Lana / Udhaar):</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">Rs. {lanaVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Paid on Spot (Normal Transaction):</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">Rs. {spotVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold border-t border-slate-200 dark:border-slate-700 pt-1.5 items-center">
                  <span>Added to Customer's Khata:</span>
                  <span className={`font-mono ${netPayableAdded === 0 ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : 'text-amber-800 dark:text-amber-400 font-bold'}`}>
                    {netPayableAdded === 0 ? 'Rs. 0 (ZERO / CLEARED)' : `Rs. ${netPayableAdded.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold border-t border-slate-200/60 dark:border-slate-700/60 pt-1 items-center">
                  <span>Resulting Customer Payable:</span>
                  <span className={`font-mono text-xs px-2 py-0.5 rounded ${resultingCustomerBalance === 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-extrabold' : 'text-amber-900 dark:text-amber-300 font-bold'}`}>
                    {resultingCustomerBalance === 0 ? 'Rs. 0 (ZERO - PAID IN FULL)' : `Rs. ${resultingCustomerBalance.toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Transport / Vehicle (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Motorcycle Loader / Rickshaw / Self Pickup"
                  value={formData.vehicleNumber}
                  onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setOpenNewSaleModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : 'Confirm Khata Sale'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: CUSTOMER KHATA STATEMENT VIEWER */}
      {selectedCustomerForLedger && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-xl relative my-6 text-slate-900 dark:text-slate-100 transition-colors">
            <button
              onClick={() => {
                setSelectedCustomerForLedger(null);
                setCustomerLedgerData(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
              <div>
                <span className="text-xs text-amber-700 dark:text-amber-400 font-bold tracking-wider uppercase">FARMER KHATA STATEMENT</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{selectedCustomerForLedger.name}</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Village: <strong>{selectedCustomerForLedger.village}</strong></span>
                  <span>Phone: <strong>{selectedCustomerForLedger.phone}</strong></span>
                  <span>Cattle: <strong>{selectedCustomerForLedger.cattleCount} Animals</strong></span>
                </div>
              </div>

              <div className="text-right flex items-center gap-2">
                {(customerLedgerData?.calculatedBalance ?? selectedCustomerForLedger.currentBalance) > 0 && (
                  <button
                    onClick={() => {
                      setShowPayCustomerModal(selectedCustomerForLedger);
                      setPayAmount(Math.max(0, customerLedgerData?.calculatedBalance ?? selectedCustomerForLedger.currentBalance));
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Receive Udhaar payment from customer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Receive</span>
                  </button>
                )}
                <button
                  onClick={() => handleDownloadLedger(selectedCustomerForLedger)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Download farmer khata statement document"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Statement</span>
                </button>
              </div>
            </div>

            {/* Balance Overview */}
            <div className="my-4 grid grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Total Feed Brought</div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
                  Rs. {Math.round(selectedCustomerForLedger.totalSales || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Total Cash Paid</div>
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-1">
                  Rs. {Math.round(selectedCustomerForLedger.totalReceived || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Current Khata (Udhaar)</div>
                <div className="text-base font-extrabold text-amber-800 dark:text-amber-400 font-mono tabular-nums mt-1">
                  Rs. {Math.round(customerLedgerData?.calculatedBalance ?? selectedCustomerForLedger.currentBalance).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            {loadingLedger ? (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">Loading khata records...</div>
            ) : (
              <div className="overflow-x-auto max-h-96 border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Transaction Description</th>
                      <th className="py-2.5 px-3">Bill / Ref #</th>
                      <th className="py-2.5 px-3 text-right">Debit (Feed Bill)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Cash Received)</th>
                      <th className="py-2.5 px-3 text-right">Running Udhaar</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customerLedgerData?.ledgerEntries?.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">{entry.date}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{entry.description}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {entry.reference || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                          {entry.debit > 0 ? `Rs. ${entry.debit.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                          {entry.credit > 0 ? `Rs. ${entry.credit.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-extrabold text-amber-800 dark:text-amber-400">
                          Rs. {entry.runningBalance?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {entry.type !== 'OPENING_BALANCE' && (
                            <button
                              onClick={() => handleDeleteLedgerEntry(entry)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                              title="Delete this entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!customerLedgerData?.ledgerEntries || customerLedgerData.ledgerEntries.length === 0) && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          No transactions found in this khata.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSelectedCustomerForLedger(null);
                  setCustomerLedgerData(null);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Close Khata
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: ADD NEW CUSTOMER / FARMER */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl text-slate-900 dark:text-slate-100 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Add Local Dairy Farmer / Customer</h3>
            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Farmer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Haji Bashir Gujjar"
                  value={newCustData.name}
                  onChange={e => setNewCustData({ ...newCustData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0302-4433221"
                    value={newCustData.phone}
                    onChange={e => setNewCustData({ ...newCustData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Village / Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Mouza Rakh / Chak 42"
                    value={newCustData.village}
                    onChange={e => setNewCustData({ ...newCustData, village: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cattle / Buffalo Count</label>
                  <input
                    type="number"
                    min="0"
                    value={newCustData.cattleCount}
                    onChange={e => setNewCustData({ ...newCustData, cattleCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Opening Udhaar (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newCustData.initialBalance}
                    onChange={e => setNewCustData({ ...newCustData, initialBalance: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 shadow-xs cursor-pointer"
                >
                  Save Farmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: RECEIVE PAYMENT FROM FARMER */}
      {showPayCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl text-slate-900 dark:text-slate-100 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Receive Udhaar (Lana) Payment</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Payment received from {showPayCustomerModal.name}. Current Udhaar balance: <span className="text-amber-800 dark:text-amber-400 font-mono font-bold">Rs. {showPayCustomerModal.currentBalance?.toLocaleString()}</span>
            </p>

            <form onSubmit={handleReceivePaymentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Receive Amount (Rs.) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-emerald-700 dark:text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Cuts customer&apos;s Udhaar (Lana) balance directly.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Cash Received at Counter">Cash Received at Counter</option>
                  <option value="Milk Deduction / Adjust">Milk Deduction / Adjust</option>
                  <option value="Online / Easypaisa / JazzCash">Online / Easypaisa / JazzCash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Receipt / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Counter Receive Slip # 992"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared 10 bags vanda balance"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPayCustomerModal(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payingCustomer}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{payingCustomer ? 'Receiving...' : 'Confirm Receive'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable in-app deletion confirmation modal */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmation.isOpen}
        title={deleteConfirmation.title}
        description={deleteConfirmation.description}
        isDeleting={isDeleting}
        onConfirm={handleExecuteDelete}
        onClose={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
};
