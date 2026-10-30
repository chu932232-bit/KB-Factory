export interface FeedItem {
  id: string;
  name: string;
  category: string;
  bagWeightKg: number;
  unit: string;
  stockBags: number;
  minStockAlert: number;
  purchasePrice: number;
  wholesalePrice: number;
  retailPrice: number;
  manufacturer: string;
}

export interface Company {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  city: string;
  bankDetails: string;
  totalPurchases: number;
  totalPayments: number;
  currentBalance: number; // Positive means we owe them
}

export interface Party {
  id: string;
  name: string;
  type: 'WHOLESALE_DEALER';
  phone: string;
  area: string;
  vehicleNumbers: string[];
  creditLimit: number;
  totalSales: number;
  totalReceived: number;
  currentBalance: number; // Positive means they owe us
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  village: string;
  cattleCount: number;
  totalSales: number;
  totalReceived: number;
  currentBalance: number; // Positive means they owe us
}

export interface Purchase {
  id: string;
  companyId: string;
  companyName: string;
  partyId?: string;
  partyName?: string;
  partyCutAmount?: number;
  isUdhaarReceive?: boolean;
  udhaarReceiveAmount?: number;
  entryType?: 'PURCHASE' | 'UDHAAR_RECEIVE';
  itemId: string;
  itemName: string;
  quantityBags: number;
  ratePerBag: number;
  totalAmount: number;
  vehicleNumber: string;
  biltyNumber: string;
  driverName?: string;
  date: string;
  paidNow: number;
  borrowedAmount?: number;
  givenOnSpot?: number;
  balanceAdded: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'CREDIT';
  notes?: string;
}

export interface Sale {
  id: string;
  saleType: 'WHOLESALE' | 'RETAIL';
  partyId: string;
  partyName: string;
  customerPhone?: string;
  itemId: string;
  itemName: string;
  quantityBags: number;
  ratePerBag: number;
  totalAmount: number;
  discount: number;
  netAmount: number;
  paidAmount: number;
  paidSpot?: number;
  borrowedLana?: number;
  remainingBalance: number;
  vehicleNumber: string;
  driverName?: string;
  date: string;
  invoiceNumber: string;
  notes?: string;
}

export interface Payment {
  id: string;
  type: 'PAYMENT_TO_COMPANY' | 'PAYMENT_FROM_CUSTOMER';
  companyId?: string;
  companyName?: string;
  partyId?: string;
  partyName?: string;
  partyType?: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  date: string;
  isLinkedToFactoryBuy?: boolean;
  notes?: string;
}

export interface ThirdPartyPayment {
  id: string;
  customerPartyId: string;
  customerName: string;
  partyType: string;
  companyId: string;
  companyName: string;
  amount: number;
  bankName: string;
  factoryAccountTitle: string;
  depositSlipNumber: string;
  date: string;
  recordedBy: string;
  notes?: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: string;
  description: string;
  vehicleNumber?: string;
  biltyNumber?: string;
  invoiceNumber?: string;
  debit: number;
  credit: number;
  runningBalance?: number;
  reference?: string;
}

export interface DashboardStats {
  totalStockBags: number;
  totalStockValue: number;
  totalCompanyPayables: number;
  totalWholesaleReceivables: number;
  totalRetailReceivables: number;
  totalCustomerReceivables: number;
  netPosition: number;
  todaySalesBags: number;
  todaySalesRevenue: number;
  todayPurchasesBags: number;
  todayPurchasesCost: number;
  totalPurchasedBags?: number;
  totalSoldBags?: number;
  totalWholesaleBags?: number;
  totalRetailBags?: number;
  itemsCount: number;
  companiesCount: number;
  partiesCount: number;
  userBalance?: number;
  companyBalance?: number;
  userName?: string;
  lastSync: string;
  meta?: {
    businessName: string;
    tagline: string;
    ownerName: string;
    phone: string;
    currency: string;
  };
}

export interface HistoryRecord {
  id: string;
  category: 'PURCHASE' | 'SALE_WHOLESALE' | 'SALE_RETAIL' | 'PAYMENT' | 'THIRD_PARTY' | 'TREASURY';
  categoryLabel: string;
  date: string;
  partyName: string;
  relatedEntityId: string;
  itemName: string;
  quantityBags: number;
  rate: number;
  amount: number;
  paidOrReceived: number;
  spotCash?: number;
  borrowedUdhaar?: number;
  udhaarReceive?: number;
  sectionName?: string;
  vehicleNumber: string;
  referenceNumber: string;
  notes: string;
  status: string;
  raw: any;
}

export interface BranchAccount {
  userName: string;
  branchName: string;
  userBalance: number;
  companyBalance: number;
  factoryDana?: number;
  primaryCompanyId: string;
  primaryCompanyName: string;
}

export interface CompanyPayment {
  id: string;
  entryType: 'CR' | 'DR';
  amount: number;
  description: string;
  referenceNumber: string;
  date: string;
  notes?: string;
  companyBalanceAfter?: number;
  userBalanceAfter?: number;
  createdAt?: string;
}

export interface RetentionStatus {
  active: boolean;
  retentionDays: number;
  cutoffDate: string;
  totalEntriesWithinWindow: number;
  lastPrunedTimestamp?: string;
  totalPrunedLifetime: number;
  collectionBreakdown: {
    purchases: number;
    sales: number;
    payments: number;
    thirdPartyPayments: number;
    companyPayments: number;
  };
}

export interface RetentionResult {
  prunedCount: number;
  cutoffDate: string;
  message: string;
  details: {
    purchasesPruned: number;
    salesPruned: number;
    paymentsPruned: number;
    thirdPartyPaymentsPruned: number;
    companyPaymentsPruned: number;
  };
  status: RetentionStatus;
}

