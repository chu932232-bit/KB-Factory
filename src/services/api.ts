import { 
  FeedItem, 
  Company, 
  Party, 
  Customer, 
  Purchase, 
  Sale, 
  Payment, 
  ThirdPartyPayment, 
  DashboardStats,
  HistoryRecord,
  LedgerEntry,
  BranchAccount,
  CompanyPayment,
  RetentionStatus,
  RetentionResult
} from '../types/feed';
import { localStorageBackup } from './localStorageBackup';

const API_BASE = '/api';

export const api = {
  // 1. Dashboard
  getDashboard: async (): Promise<DashboardStats> => {
    try {
      const res = await fetch(`${API_BASE}/dashboard`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch dashboard');
      localStorageBackup.save('dashboard', json.data);
      return json.data;
    } catch (err) {
      const cached = localStorageBackup.get<DashboardStats>('dashboard');
      if (cached) return cached;
      throw err;
    }
  },

  // 2. Feed Items
  getItems: async (): Promise<FeedItem[]> => {
    try {
      const res = await fetch(`${API_BASE}/items`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch items');
      localStorageBackup.save('items', json.data);
      return json.data;
    } catch (err) {
      const cached = localStorageBackup.get<FeedItem[]>('items');
      if (cached) return cached;
      throw err;
    }
  },

  createItem: async (item: Partial<FeedItem>): Promise<FeedItem> => {
    const res = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create item');
    return json.data;
  },

  updateItem: async (id: string, item: Partial<FeedItem>): Promise<FeedItem> => {
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update item');
    return json.data;
  },

  // 3. Companies / Factories
  getCompanies: async (): Promise<Company[]> => {
    try {
      const res = await fetch(`${API_BASE}/companies`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch companies');
      localStorageBackup.save('companies', json.data);
      return json.data;
    } catch (err) {
      const cached = localStorageBackup.get<Company[]>('companies');
      if (cached) return cached;
      throw err;
    }
  },

  createCompany: async (company: Partial<Company>): Promise<Company> => {
    const res = await fetch(`${API_BASE}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create company');
    return json.data;
  },

  getCompanyLedger: async (companyId: string): Promise<{ company: Company; ledgerEntries: LedgerEntry[]; calculatedBalance: number }> => {
    const res = await fetch(`${API_BASE}/companies/${companyId}/ledger`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch company ledger');
    return json.data;
  },

  deleteCompany: async (companyId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/companies/${companyId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete company');
  },

  // 4. Wholesale Big Parties
  getParties: async (): Promise<Party[]> => {
    try {
      const res = await fetch(`${API_BASE}/parties`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch wholesale parties');
      localStorageBackup.save('parties', json.data);
      return json.data;
    } catch (err) {
      const cached = localStorageBackup.get<Party[]>('parties');
      if (cached) return cached;
      throw err;
    }
  },

  createParty: async (party: any): Promise<Party> => {
    const res = await fetch(`${API_BASE}/parties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(party),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create party');
    return json.data;
  },

  deleteParty: async (partyId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/parties/${partyId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete party');
  },

  getPartyLedger: async (partyId: string): Promise<{ party: Party; ledgerEntries: LedgerEntry[]; calculatedBalance: number }> => {
    const res = await fetch(`${API_BASE}/parties/${partyId}/ledger`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch party ledger');
    return json.data;
  },

  // 5. Local Customers (Retail Khata)
  getCustomers: async (): Promise<Customer[]> => {
    try {
      const res = await fetch(`${API_BASE}/customers`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch customers');
      localStorageBackup.save('customers', json.data);
      return json.data;
    } catch (err) {
      const cached = localStorageBackup.get<Customer[]>('customers');
      if (cached) return cached;
      throw err;
    }
  },

  createCustomer: async (customer: any): Promise<Customer> => {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create customer');
    return json.data;
  },

  deleteCustomer: async (customerId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/customers/${customerId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete customer');
  },

  getCustomerLedger: async (customerId: string): Promise<{ customer: Customer; ledgerEntries: LedgerEntry[]; calculatedBalance: number }> => {
    const res = await fetch(`${API_BASE}/customers/${customerId}/ledger`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch customer ledger');
    return json.data;
  },

  // 6. Purchases
  getPurchases: async (): Promise<Purchase[]> => {
    try {
      const res = await fetch(`${API_BASE}/purchases`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch purchases');
      localStorageBackup.save('purchases', json.data);
      return json.data;
    } catch (err) {
      const cached = localStorageBackup.get<Purchase[]>('purchases');
      if (cached) return cached;
      throw err;
    }
  },

  recordPurchase: async (payload: {
    companyId: string;
    partyId?: string;
    partyName?: string;
    partyCutAmount?: number;
    isUdhaarReceive?: boolean;
    udhaarReceiveAmount?: number;
    itemId?: string;
    quantityBags?: number;
    ratePerBag?: number;
    vehicleNumber?: string;
    biltyNumber?: string;
    driverName?: string;
    date: string;
    paidNow?: number;
    borrowedAmount?: number;
    givenOnSpot?: number;
    amount?: number;
    transactionMode?: 'BORROW_DANA' | 'GIVEN_ON_SPOT';
    notes?: string;
  }): Promise<{ message: string; data: Purchase; currentBalance?: number; partyBalance?: number }> => {
    const res = await fetch(`${API_BASE}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to record purchase');
    return json;
  },

  deletePurchase: async (purchaseId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/purchases/${purchaseId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete purchase');
  },

  // 7. Sales (Wholesale & Retail)
  getSales: async (): Promise<Sale[]> => {
    try {
      const res = await fetch(`${API_BASE}/sales`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch sales');
      localStorageBackup.save('sales', json.data);
      return json.data;
    } catch (err) {
      const cached = localStorageBackup.get<Sale[]>('sales');
      if (cached) return cached;
      throw err;
    }
  },

  recordSale: async (payload: {
    saleType: 'WHOLESALE' | 'RETAIL';
    partyId: string;
    itemId?: string;
    quantityBags?: number;
    ratePerBag?: number;
    discount?: number;
    paidAmount?: number;
    borrowedLana?: number;
    paidSpot?: number;
    totalAmount?: number;
    vehicleNumber?: string;
    driverName?: string;
    date: string;
    notes?: string;
  }): Promise<{ message: string; data: Sale }> => {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to record sale');
    return json;
  },

  deleteSale: async (saleId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/sales/${saleId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete sale');
  },

  // 8. Direct Payments
  recordPayment: async (payload: {
    type: 'PAYMENT_TO_COMPANY' | 'PAYMENT_FROM_CUSTOMER';
    targetId: string;
    amount: number;
    paymentMethod: string;
    referenceNumber?: string;
    date: string;
    notes?: string;
  }): Promise<{ message: string; data: Payment }> => {
    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to record payment');
    return json;
  },

  deletePayment: async (paymentId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/payments/${paymentId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete payment');
  },

  // 9. Third-Party Direct Factory Payments (Crucial Auto-Balancing feature)
  recordThirdPartyPayment: async (payload: {
    customerPartyId: string;
    companyId: string;
    amount: number;
    bankName: string;
    factoryAccountTitle?: string;
    depositSlipNumber: string;
    date: string;
    recordedBy?: string;
    notes?: string;
  }): Promise<{ message: string; data: ThirdPartyPayment }> => {
    const res = await fetch(`${API_BASE}/third-party-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to record third-party payment');
    return json;
  },

  deleteThirdPartyPayment: async (tppId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/third-party-payments/${tppId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete third-party payment');
  },

  // 10. History & Advanced Search
  getHistory: async (params?: {
    q?: string;
    partyId?: string;
    companyId?: string;
    vehicleNumber?: string;
    startDate?: string;
    endDate?: string;
    transactionType?: string;
  }): Promise<{ totalCount: number; data: HistoryRecord[] }> => {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.partyId) query.set('partyId', params.partyId);
    if (params?.companyId) query.set('companyId', params.companyId);
    if (params?.vehicleNumber) query.set('vehicleNumber', params.vehicleNumber);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.transactionType) query.set('transactionType', params.transactionType);

    const res = await fetch(`${API_BASE}/history?${query.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch history');
    return json;
  },

  // 11. Database Backup & Clear
  clearAllData: async () => {
    localStorageBackup.clearAll();
    const res = await fetch(`${API_BASE}/backup/clear-all`, { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to clear all data');
    return json;
  },

  resetDemoData: async () => {
    localStorageBackup.clearAll();
    const res = await fetch(`${API_BASE}/backup/clear-all`, { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to reset data');
    return json;
  },

  // 11. 1-Year Retention Lifecycle & Maintenance
  getRetentionStatus: async (): Promise<RetentionStatus> => {
    const res = await fetch(`${API_BASE}/retention/status`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch retention status');
    return json.data;
  },

  runRetentionCleanup: async (): Promise<RetentionResult> => {
    const res = await fetch(`${API_BASE}/retention/run`, { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to run retention cleanup');
    return json;
  },

  // 12. Small Branch Account & Payments Sent to Company (Farooq Gujjar KB & Big Parties)
  getBranchAccount: async (): Promise<{
    branchAccount: BranchAccount;
    companyPayments: CompanyPayment[];
    companies: Company[];
    parties: Party[];
  }> => {
    try {
      const res = await fetch(`${API_BASE}/branch-account`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch branch account');
      localStorageBackup.save('branchAccount', json.data);
      return json.data;
    } catch (err) {
      const cached = localStorageBackup.get<{
        branchAccount: BranchAccount;
        companyPayments: CompanyPayment[];
        companies: Company[];
        parties: Party[];
      }>('branchAccount');
      if (cached) return cached;
      throw err;
    }
  },

  recordCompanyPayment: async (payload: {
    entryType: 'CR' | 'DR';
    amount: number;
    description: string;
    referenceNumber?: string;
    date: string;
    notes?: string;
  }): Promise<{ message: string; data: CompanyPayment; branchAccount: BranchAccount }> => {
    const res = await fetch(`${API_BASE}/company-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to record CR/DR transaction');
    return json;
  },

  deleteCompanyPayment: async (paymentId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/company-payments/${paymentId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete company payment');
  },

  updateBranchBalance: async (payload: {
    userBalance?: number;
    companyBalance?: number;
  }): Promise<{ message: string; branchAccount: BranchAccount }> => {
    const res = await fetch(`${API_BASE}/branch-account/update-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update branch balance');
    return json;
  }
};

