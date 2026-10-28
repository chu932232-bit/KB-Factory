import React, { useState } from 'react';
import { 
  Party, 
  FeedItem, 
  Sale, 
  LedgerEntry 
} from '../types/feed';
import { api } from '../services/api';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  Users, 
  Plus, 
  Search, 
  Truck, 
  FileText, 
  Download, 
  Phone, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  X, 
  ShieldAlert,
  Trash2 
} from 'lucide-react';

interface WholesaleViewProps {
  parties: Party[];
  items: FeedItem[];
  sales: Sale[];
  onRefresh: () => void;
  openNewSaleModal: boolean;
  setOpenNewSaleModal: (open: boolean) => void;
}

export const WholesaleView: React.FC<WholesaleViewProps> = ({
  parties,
  items,
  sales,
  onRefresh,
  openNewSaleModal,
  setOpenNewSaleModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartyForLedger, setSelectedPartyForLedger] = useState<Party | null>(null);
  const [partyLedgerData, setPartyLedgerData] = useState<{
    party: Party;
    ledgerEntries: LedgerEntry[];
    calculatedBalance: number;
  } | null>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Modal: Add New Party
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newPartyData, setNewPartyData] = useState({
    name: '',
    phone: '',
    area: '',
    creditLimit: 500000,
    vehicleNumbers: '',
    initialBalance: 0
  });

  // Modal: Receive Payment from Party
  const [showPayPartyModal, setShowPayPartyModal] = useState<Party | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('Cash Received at Counter');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payingParty, setPayingParty] = useState(false);

  // Form State for Wholesale Sale
  const [formData, setFormData] = useState({
    partyId: parties[0]?.id || '',
    borrowedLana: 0,
    paidSpot: 0,
    vehicleNumber: '',
    driverName: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  React.useEffect(() => {
    if (parties && parties.length > 0 && !formData.partyId) {
      setFormData(prev => ({ ...prev, partyId: parties[0].id }));
    }
  }, [parties]);

  // Handle party select to auto-fill preferred vehicles
  const handlePartySelect = (partyId: string) => {
    const selectedParty = parties.find(p => p.id === partyId);
    setFormData(prev => ({
      ...prev,
      partyId,
      vehicleNumber: selectedParty?.vehicleNumbers?.[0] || prev.vehicleNumber
    }));
  };

  const lanaVal = Number(formData.borrowedLana) || 0;
  const spotVal = Number(formData.paidSpot) || 0;
  const netPayableAdded = lanaVal;
  const targetPartyId = formData.partyId || (parties && parties.length > 0 ? parties[0].id : '');
  const selectedPartyObj = parties.find(p => p.id === targetPartyId);
  const currentPartyDue = selectedPartyObj?.currentBalance || 0;
  const resultingPartyBalance = currentPartyDue + lanaVal;

  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPartyId = formData.partyId || (parties && parties.length > 0 ? parties[0].id : '');
    if (!finalPartyId) {
      alert('Please select a wholesale party / dealer');
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
        saleType: 'WHOLESALE',
        partyId: finalPartyId,
        borrowedLana: lanaVal,
        paidAmount: spotVal,
        paidSpot: spotVal,
        totalAmount: Math.max(lanaVal, spotVal),
        vehicleNumber: formData.vehicleNumber.toUpperCase() || 'TRUCK/PICKUP',
        driverName: formData.driverName,
        date: formData.date,
        notes: formData.notes
      });

      setSuccessMsg(resultingPartyBalance === 0 ? 'Recorded! Dealer payable is now Rs. 0 (ZERO).' : 'Wholesale entry recorded! Party khata updated.');
      onRefresh();
      setTimeout(() => {
        setSuccessMsg('');
        setOpenNewSaleModal(false);
      }, 350);

      // Reset form
      setFormData({
        partyId: parties[0]?.id || '',
        borrowedLana: 0,
        paidSpot: 0,
        vehicleNumber: '',
        driverName: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (err: any) {
      alert(err.message || 'Error recording wholesale entry');
    } finally {
      setSubmitting(false);
    }
  };

  const wholesaleSales = sales.filter(s => s.saleType === 'WHOLESALE');

  const handleOpenLedger = async (party: Party) => {
    setSelectedPartyForLedger(party);
    setLoadingLedger(true);
    try {
      const data = await api.getPartyLedger(party.id);
      setPartyLedgerData(data);
    } catch (err: any) {
      alert(err.message || 'Error fetching party khata');
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleAddParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyData.name) return;
    try {
      await api.createParty({
        ...newPartyData,
        vehicleNumbers: newPartyData.vehicleNumbers ? newPartyData.vehicleNumbers.split(',').map(s => s.trim()) : []
      });
      setShowAddPartyModal(false);
      setNewPartyData({
        name: '',
        phone: '',
        area: '',
        creditLimit: 500000,
        vehicleNumbers: '',
        initialBalance: 0
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error creating party');
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

  const handleDeleteParty = (party: Party) => {
    setDeleteConfirmation({
      isOpen: true,
      title: `Delete Wholesale Party "${party.name}"`,
      description: `Are you sure you want to delete wholesale party "${party.name}"? This will delete this dealer's khata and permanently delete all related sales, dispatches, payments, third-party deposits, and factory records across all sections (inventory stock will be restored).`,
      action: async () => {
        await api.deleteParty(party.id);
        onRefresh();
      }
    });
  };

  const handleDeleteSale = (sale: Sale) => {
    setDeleteConfirmation({
      isOpen: true,
      title: `Delete Wholesale Dispatch #${sale.invoiceNumber || sale.id}`,
      description: `Are you sure you want to delete Wholesale Dispatch #${sale.invoiceNumber || sale.id} for "${sale.partyName}"? This will return ${sale.quantityBags} bags to inventory and deduct Rs. ${sale.remainingBalance?.toLocaleString()} from the party ledger balance.`,
      action: async () => {
        await api.deleteSale(sale.id);
        onRefresh();
        if (selectedPartyForLedger && selectedPartyForLedger.id === sale.partyId) {
          handleOpenLedger(selectedPartyForLedger);
        }
      }
    });
  };

  const handleDeleteLedgerEntry = (entry: LedgerEntry) => {
    if (entry.type === 'OPENING_BALANCE') {
      alert('Opening balance is automatically computed from account history.');
      return;
    }
    const isSale = entry.type === 'SALE' || entry.type === 'SALE_INVOICE' || entry.id.startsWith('sale-') || entry.id.startsWith('spot-');
    const isPayment = entry.type === 'PAYMENT' || entry.type === 'DIRECT_PAYMENT_RECEIVED' || entry.id.startsWith('pay-') || entry.type === 'PAYMENT_ON_DELIVERY';
    const isPurchase = entry.type === 'PURCHASE' || entry.type === 'FACTORY_BUY_DANA_CREDIT' || entry.id.startsWith('pur-');
    const isTpp = entry.type === 'THIRD_PARTY_DEPOSIT' || entry.id.startsWith('tpp-');
    
    setDeleteConfirmation({
      isOpen: true,
      title: 'Delete Ledger Transaction',
      description: `Are you sure you want to delete ledger transaction "${entry.description}"? Associated inventory and financial ledger balances will be automatically reversed.`,
      action: async () => {
        if (isSale) {
          await api.deleteSale(entry.id);
        } else if (isPayment) {
          await api.deletePayment(entry.id);
        } else if (isPurchase) {
          await api.deletePurchase(entry.id);
        } else if (isTpp) {
          await api.deleteThirdPartyPayment(entry.id);
        }
        await onRefresh();
        if (selectedPartyForLedger) {
          handleOpenLedger(selectedPartyForLedger);
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

  const handleDownloadLedger = (party: Party) => {
    if (!partyLedgerData?.ledgerEntries) return;
    const lines = [
      `==================================================================`,
      `            WHOLESALE DEALER KHATA STATEMENT - KB FACTORY          `,
      `==================================================================`,
      `Dealer Name:   ${party.name}`,
      `Area / City:   ${party.area || 'N/A'}`,
      `Phone:         ${party.phone || 'N/A'}`,
      `Vehicles:      ${party.vehicleNumbers?.join(', ') || 'N/A'}`,
      `Generated On:  ${new Date().toLocaleDateString()}`,
      `------------------------------------------------------------------`,
      `TOTAL SALES DISPATCHED:  Rs. ${Math.round(party.totalSales || 0).toLocaleString()}`,
      `TOTAL PAYMENTS RECEIVED: Rs. ${Math.round(party.totalReceived || 0).toLocaleString()}`,
      `CURRENT OUTSTANDING:     Rs. ${Math.round(partyLedgerData.calculatedBalance ?? party.currentBalance).toLocaleString()}`,
      `------------------------------------------------------------------`,
      `DATE       | DESCRIPTION                              | DEBIT (BILL)    | CREDIT (REC)   | RUNNING BALANCE`,
      `------------------------------------------------------------------`,
      ...partyLedgerData.ledgerEntries.map(e => {
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
    link.download = `Dealer_Khata_${party.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReceivePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayPartyModal || payAmount <= 0) return;
    setPayingParty(true);
    try {
      const targetPartyId = showPayPartyModal.id;
      await api.recordPayment({
        type: 'PAYMENT_FROM_CUSTOMER',
        targetId: showPayPartyModal.id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        referenceNumber: payRef || `REC-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        notes: payNotes
      });
      setShowPayPartyModal(null);
      setPayAmount(0);
      setPayRef('');
      setPayNotes('');
      onRefresh();
      if (selectedPartyForLedger && selectedPartyForLedger.id === targetPartyId) {
        handleOpenLedger(selectedPartyForLedger);
      }
    } catch (err: any) {
      alert(err.message || 'Error recording payment');
    } finally {
      setPayingParty(false);
    }
  };

  const filteredParties = parties.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.vehicleNumbers?.some(v => v.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalWholesaleReceivables = parties.reduce((acc, p) => acc + (p.currentBalance || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Big Parties &amp; Wholesale Dispatches</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage bulk dealers taking 50-800+ bags or full trucks, registered truck numbers, credit limits, and running khatas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block bg-slate-50 dark:bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Wholesale Receivables</div>
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
              Rs. {Math.round(totalWholesaleReceivables).toLocaleString()}
            </div>
          </div>
          <button
            onClick={() => setShowAddPartyModal(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>+ Add Big Party</span>
          </button>
          <button
            onClick={() => {
              if (parties.length > 0 && !formData.partyId) {
                setFormData(prev => ({ ...prev, partyId: parties[0].id }));
              }
              setOpenNewSaleModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Wholesale Dispatch</span>
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
            placeholder="Search party name, market area, phone, or truck number..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
          Showing {filteredParties.length} Wholesale Parties
        </div>
      </div>

      {/* Wholesale Parties Grid */}
      {filteredParties.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-10 text-center shadow-xs">
          <Users className="w-10 h-10 mx-auto text-blue-600 dark:text-blue-500 mb-2 opacity-50" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">No Wholesale Parties Added Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Click &quot;+ Add Wholesale Party&quot; above to register your first dealership or dairy farm buyer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParties.map((party) => {
          const isOverLimit = party.creditLimit && party.currentBalance > party.creditLimit;

          return (
            <div 
              key={party.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{party.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{party.area || 'Regional Market'}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md font-mono tabular-nums ${
                    isOverLimit 
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60' 
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                  }`}>
                    {isOverLimit ? 'Limit Exceeded' : 'Active Account'}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{party.phone || 'N/A'}</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Limit: Rs. {(party.creditLimit || 0).toLocaleString()}</span>
                </div>

                {party.vehicleNumbers && party.vehicleNumbers.length > 0 && (
                  <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 font-mono">
                    <span className="text-slate-400 font-sans font-medium">Trucks: </span>
                    {party.vehicleNumbers.join(' · ')}
                  </div>
                )}

                {/* Balance breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Total Billed</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums mt-0.5">
                      Rs. {Math.round(party.totalSales || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Received</div>
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-0.5">
                      Rs. {Math.round(party.totalReceived || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Receivable</div>
                    <div className="text-xs font-extrabold text-amber-800 dark:text-amber-400 font-mono tabular-nums mt-0.5">
                      Rs. {Math.round(party.currentBalance || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenLedger(party)}
                  className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>View Khata</span>
                </button>
                {party.currentBalance > 0 && (
                  <button
                    onClick={() => {
                      setShowPayPartyModal(party);
                      setPayAmount(party.currentBalance > 0 ? party.currentBalance : 0);
                    }}
                    className="py-1.5 px-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    title="Receive Udhaar (Lana) Payment"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Receive</span>
                  </button>
                )}
                <button
                  onClick={() => handleDeleteParty(party)}
                  className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 rounded-lg transition-colors cursor-pointer"
                  title={`Delete party ${party.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Recent Wholesale Dispatches List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs mt-8 transition-colors">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Recent Wholesale Dispatches &amp; Orders</h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total: {wholesaleSales.length}</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[820px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Date &amp; Invoice #</th>
                <th className="py-3 px-4">Party Name</th>
                <th className="py-3 px-4 text-center">Vehicle / Truck No.</th>
                <th className="py-3 px-4 text-center">Driver Name / Contact</th>
                <th className="py-3 px-4 text-right">Paid on Spot (Normal Transaction)</th>
                <th className="py-3 px-4 text-right">Lana (Udhaar / Borrowed)</th>
                <th className="py-3 px-4">Notes / Destination</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {wholesaleSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-600 dark:text-blue-400" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No Wholesale Dispatches Recorded Yet</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Click &quot;New Wholesale Dispatch&quot; above to log your first dispatch.
                    </p>
                  </td>
                </tr>
              ) : (
                wholesaleSales.map((s) => {
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
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold rounded border border-slate-200 dark:border-slate-700">
                          {s.vehicleNumber || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-300">
                        {s.driverName || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                        {spotMoney > 0 ? `Rs. ${spotMoney.toLocaleString()}` : <span className="text-slate-400 font-normal">Rs. 0</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-amber-800 dark:text-amber-400">
                        {lanaMoney > 0 ? `Rs. ${lanaMoney.toLocaleString()}` : <span className="text-slate-400 font-normal">Rs. 0</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">
                        <span className="truncate max-w-[200px] block" title={s.notes || ''}>
                          {s.notes || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteSale(s)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title={`Delete dispatch ${s.invoiceNumber || s.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: RECORD WHOLESALE DISPATCH */}
      {openNewSaleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-xl relative my-auto max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
            <button
              onClick={() => setOpenNewSaleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Record Wholesale Big Party Sale</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Inventory will decrease automatically, and remaining unpaid balance will be added to the party's ledger.
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Wholesale Party *</label>
                  <select
                    required
                    value={formData.partyId || (parties[0]?.id || '')}
                    onChange={e => handlePartySelect(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-bold"
                  >
                    {parties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Balance: Rs. {p.currentBalance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dispatch Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Two Financial Input Options */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-3">
                <div className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center justify-between">
                  <span>Wholesale Transaction Amounts</span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">Enter either or both</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      1. Money Borrowed by Dealer (Lana / Udhaar) (Rs.)
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
                      Increases dealer's outstanding balance
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
                      Received as spot payment
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Vehicle / Truck Number</label>
                  <input
                    type="text"
                    placeholder="e.g. TK-8942 / LES-5012"
                    value={formData.vehicleNumber}
                    onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Driver Name / Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. Rashid Khan"
                    value={formData.driverName}
                    onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
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
                  <span>Added to Dealer Khata:</span>
                  <span className={`font-mono ${netPayableAdded === 0 ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : 'text-blue-700 dark:text-blue-400 font-bold'}`}>
                    {netPayableAdded === 0 ? 'Rs. 0 (ZERO / CLEARED)' : `Rs. ${netPayableAdded.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold border-t border-slate-200/60 dark:border-slate-700/60 pt-1 items-center">
                  <span>Resulting Dealer Payable:</span>
                  <span className={`font-mono text-xs px-2 py-0.5 rounded ${resultingPartyBalance === 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-extrabold' : 'text-blue-900 dark:text-blue-300 font-bold'}`}>
                    {resultingPartyBalance === 0 ? 'Rs. 0 (ZERO - PAID IN FULL)' : `Rs. ${resultingPartyBalance.toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Destination Farm</label>
                <input
                  type="text"
                  placeholder="e.g. Dispatched to Kasur dairy branch"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Generating Invoice...' : 'Confirm Wholesale Dispatch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: PARTY LEDGER STATEMENT VIEWER */}
      {selectedPartyForLedger && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-xl relative my-auto max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
            <button
              onClick={() => {
                setSelectedPartyForLedger(null);
                setPartyLedgerData(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
              <div>
                <span className="text-xs text-blue-700 dark:text-blue-400 font-bold tracking-wider uppercase">WHOLESALE DEALER KHATA</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{selectedPartyForLedger.name}</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Area: <strong>{selectedPartyForLedger.area}</strong></span>
                  <span>Phone: <strong>{selectedPartyForLedger.phone}</strong></span>
                  <span>Vehicles: <strong>{selectedPartyForLedger.vehicleNumbers?.join(', ') || 'N/A'}</strong></span>
                </div>
              </div>

              <div className="text-right flex items-center gap-3">
                {(partyLedgerData?.calculatedBalance ?? selectedPartyForLedger.currentBalance) > 0 && (
                  <button
                    onClick={() => {
                      setShowPayPartyModal(selectedPartyForLedger);
                      setPayAmount(Math.max(0, partyLedgerData?.calculatedBalance ?? selectedPartyForLedger.currentBalance));
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Receive payment from dealer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Receive</span>
                  </button>
                )}
                <button
                  onClick={() => handleDownloadLedger(selectedPartyForLedger)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Download dealer khata statement document"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Statement</span>
                </button>
              </div>
            </div>

            {/* Balance Overview */}
            <div className="my-4 grid grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Total Dispatched Sales</div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
                  Rs. {Math.round(selectedPartyForLedger.totalSales || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Total Payments Received</div>
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-1">
                  Rs. {Math.round(selectedPartyForLedger.totalReceived || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Current Outstanding Balance</div>
                <div className="text-base font-extrabold text-amber-800 dark:text-amber-400 font-mono tabular-nums mt-1">
                  Rs. {Math.round(partyLedgerData?.calculatedBalance ?? selectedPartyForLedger.currentBalance).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            {loadingLedger ? (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">Loading party ledger statement...</div>
            ) : (
              <div className="overflow-x-auto max-h-96 border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Transaction &amp; Vehicle</th>
                      <th className="py-2.5 px-3">Invoice / Ref #</th>
                      <th className="py-2.5 px-3 text-right">Debit (Sale Bill)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Received)</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {partyLedgerData?.ledgerEntries?.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">{entry.date}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{entry.description}</div>
                          {entry.vehicleNumber && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Truck: {entry.vehicleNumber}</span>
                          )}
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
                    {(!partyLedgerData?.ledgerEntries || partyLedgerData.ledgerEntries.length === 0) && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          No ledger records found for this party.
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
                  setSelectedPartyForLedger(null);
                  setPartyLedgerData(null);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: ADD NEW WHOLESALE PARTY */}
      {showAddPartyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl text-slate-900 dark:text-slate-100 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Add Wholesale Big Party</h3>
            <form onSubmit={handleAddParty} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Party / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Rehman Agro &amp; Cattle Farm"
                  value={newPartyData.name}
                  onChange={e => setNewPartyData({ ...newPartyData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0300-9876543"
                    value={newPartyData.phone}
                    onChange={e => setNewPartyData({ ...newPartyData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Market / Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Chunian Dairy Zone"
                    value={newPartyData.area}
                    onChange={e => setNewPartyData({ ...newPartyData, area: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Registered Vehicle / Truck Numbers</label>
                <input
                  type="text"
                  placeholder="e.g. TK-8942, LES-5012"
                  value={newPartyData.vehicleNumbers}
                  onChange={e => setNewPartyData({ ...newPartyData, vehicleNumbers: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Credit Limit (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPartyData.creditLimit}
                    onChange={e => setNewPartyData({ ...newPartyData, creditLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Opening Udhaar (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newPartyData.initialBalance}
                    onChange={e => setNewPartyData({ ...newPartyData, initialBalance: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPartyModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  Save Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: RECEIVE PAYMENT FROM PARTY */}
      {showPayPartyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl text-slate-900 dark:text-slate-100 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Receive Payment from Party</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Payment received from {showPayPartyModal.name}. Outstanding balance: <span className="text-amber-800 dark:text-amber-400 font-mono font-bold">Rs. {showPayPartyModal.currentBalance?.toLocaleString()}</span>
            </p>

            <form onSubmit={handleReceivePaymentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Amount Received (Rs.) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-emerald-700 dark:text-emerald-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Cuts dealer&apos;s Udhaar (Lana) balance directly.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="Cash Received at Counter">Cash Received at Counter</option>
                  <option value="Direct Bank Transfer / Online">Direct Bank Transfer / Online</option>
                  <option value="Cheque Deposit">Cheque Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Receipt / Reference Number</label>
                <input
                  type="text"
                  placeholder="e.g. REC-88291 / Cheque # 1120"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Wasooli against dispatch INV-WS-1001"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPayPartyModal(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payingParty}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {payingParty ? 'Recording...' : 'Confirm Receipt'}
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
