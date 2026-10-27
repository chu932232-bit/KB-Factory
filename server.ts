import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'feed_business_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Clean starting data for new software setup
function getInitialData() {
  return {
    items: [],
    companies: [{
      id: 'comp-default',
      name: 'Supreme Feeds Ltd',
      city: 'Gujranwala',
      contactPerson: 'Farooq Gujjar',
      phone: '0300-1234567',
      bankDetails: 'HBL 1234567890',
      totalPurchases: 0,
      totalPayments: 0,
      currentBalance: 0
    }],
    parties: [],
    customers: [],
    purchases: [],
    sales: [],
    payments: [],
    thirdPartyPayments: [],
    companyPayments: [],
    branchAccount: {
      userName: 'Farooq Gujjar KB',
      branchName: 'Farooq Gujjar KB (Branch)',
      userBalance: 0,
      companyBalance: 0,
      primaryCompanyId: '',
      primaryCompanyName: ''
    },
    meta: {
      businessName: 'KB Factory',
      tagline: 'Wholesale Distributor & Retail Center',
      ownerName: 'Farooq Gujjar KB',
      phone: '',
      address: '',
      currency: 'Rs. (PKR)',
      lastSyncTimestamp: new Date().toISOString()
    }
  };
}

// 1-Year Retention Policy Configuration
const RETENTION_DAYS = 365;
let lastAutoPruneCheckTime = 0;

function getRetentionCutoffDate(): string {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  return cutoff.toISOString().split('T')[0];
}

interface PruneResult {
  prunedCount: number;
  cutoffDate: string;
  details: {
    purchasesPruned: number;
    salesPruned: number;
    paymentsPruned: number;
    thirdPartyPaymentsPruned: number;
    companyPaymentsPruned: number;
  };
}

function applyAutoRetentionPolicy(db: any, force = false): PruneResult {
  const now = Date.now();
  // Throttle automatic checks to at most once per 15 minutes unless forced
  if (!force && (now - lastAutoPruneCheckTime < 1000 * 60 * 15)) {
    return {
      prunedCount: 0,
      cutoffDate: getRetentionCutoffDate(),
      details: {
        purchasesPruned: 0,
        salesPruned: 0,
        paymentsPruned: 0,
        thirdPartyPaymentsPruned: 0,
        companyPaymentsPruned: 0
      }
    };
  }
  lastAutoPruneCheckTime = now;

  const cutoffDate = getRetentionCutoffDate();

  const prevPurCount = db.purchases.length;
  const prevSalesCount = db.sales.length;
  const prevPayCount = db.payments.length;
  const prevTppCount = db.thirdPartyPayments.length;
  const prevCpCount = db.companyPayments.length;

  db.purchases = db.purchases.filter((p: any) => !p.date || p.date >= cutoffDate);
  db.sales = db.sales.filter((s: any) => !s.date || s.date >= cutoffDate);
  db.payments = db.payments.filter((p: any) => !p.date || p.date >= cutoffDate);
  db.thirdPartyPayments = db.thirdPartyPayments.filter((t: any) => !t.date || t.date >= cutoffDate);
  db.companyPayments = db.companyPayments.filter((c: any) => !c.date || c.date >= cutoffDate);

  const purchasesPruned = prevPurCount - db.purchases.length;
  const salesPruned = prevSalesCount - db.sales.length;
  const paymentsPruned = prevPayCount - db.payments.length;
  const thirdPartyPaymentsPruned = prevTppCount - db.thirdPartyPayments.length;
  const companyPaymentsPruned = prevCpCount - db.companyPayments.length;

  const prunedCount = purchasesPruned + salesPruned + paymentsPruned + thirdPartyPaymentsPruned + companyPaymentsPruned;

  db.meta = db.meta || {};
  db.meta.retention = db.meta.retention || {
    active: true,
    policyDays: RETENTION_DAYS,
    totalPrunedLifetime: 0
  };

  if (prunedCount > 0 || force) {
    db.meta.retention.lastPruneTimestamp = new Date().toISOString();
    db.meta.retention.lastCutoffDate = cutoffDate;
    db.meta.retention.totalPrunedLifetime = (db.meta.retention.totalPrunedLifetime || 0) + prunedCount;
    saveDb(db);
  }

  return {
    prunedCount,
    cutoffDate,
    details: {
      purchasesPruned,
      salesPruned,
      paymentsPruned,
      thirdPartyPaymentsPruned,
      companyPaymentsPruned
    }
  };
}

// Read database
function loadDb(shouldPrune = true) {
  try {
    let data;
    if (!fs.existsSync(DB_FILE)) {
      data = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } else {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      data = JSON.parse(raw);
    }
    
    // Ensure all required collections exist as arrays
    data.items = data.items || [];
    data.companies = data.companies || [];
    if (data.companies.length === 0) {
      data.companies.push({
        id: 'comp-default',
        name: 'Supreme Feeds Ltd',
        city: 'Gujranwala',
        contactPerson: 'Farooq Gujjar',
        phone: '0300-1234567',
        bankDetails: 'HBL 1234567890',
        totalPurchases: 0,
        totalPayments: 0,
        currentBalance: 0
      });
    }
    data.parties = data.parties || [];
    data.customers = data.customers || [];
    data.purchases = data.purchases || [];
    data.sales = data.sales || [];
    data.payments = data.payments || [];
    data.thirdPartyPayments = data.thirdPartyPayments || [];
    data.companyPayments = data.companyPayments || [];

    if (!data.branchAccount) {
      data.branchAccount = {
        userName: 'Farooq Gujjar KB',
        branchName: 'Farooq Gujjar KB (Branch)',
        userBalance: 0,
        companyBalance: 0,
        primaryCompanyId: '',
        primaryCompanyName: ''
      };
    }

    if (shouldPrune) {
      applyAutoRetentionPolicy(data, false);
    }

    return data;
  } catch (err) {
    console.error('Error reading DB, using initial data:', err);
    return getInitialData();
  }
}

// Save database
function saveDb(data: any) {
  try {
    data.meta = data.meta || {};
    data.meta.lastSyncTimestamp = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

function recalculateBranchAccount(db: any) {
  const factorySpotTotal = (db.purchases || []).reduce(
    (sum: number, p: any) => sum + (Number(p.paidNow) || Number(p.givenOnSpot) || 0),
    0
  );
  const factoryUdhaarTotal = (db.purchases || [])
    .filter((p: any) => p.isUdhaarReceive || Number(p.udhaarReceiveAmount) > 0)
    .reduce((sum: number, p: any) => sum + (Number(p.udhaarReceiveAmount) || Number(p.partyCutAmount) || 0), 0);
  const factoryDanaTotal = (db.purchases || [])
    .filter((p: any) => !p.isUdhaarReceive)
    .reduce((sum: number, p: any) => sum + (Number(p.borrowedAmount) || 0), 0);
  const factoryDirectTotal = (db.payments || [])
    .filter((p: any) => p.type === 'PAYMENT_TO_COMPANY')
    .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  const crSum = (db.companyPayments || []).filter((cp: any) => cp.entryType === 'CR').reduce((s: number, cp: any) => s + (Number(cp.amount) || 0), 0);
  const drSum = (db.companyPayments || []).filter((cp: any) => cp.entryType === 'DR').reduce((s: number, cp: any) => s + (Number(cp.amount) || 0), 0);

  const wsSpotCash = (db.sales || []).filter((s: any) => s.saleType === 'WHOLESALE').reduce((s: number, sal: any) => s + (Number(sal.paidAmount) || Number(sal.paidSpot) || 0), 0);
  const retSpotCash = (db.sales || []).filter((s: any) => s.saleType === 'RETAIL').reduce((s: number, sal: any) => s + (Number(sal.paidAmount) || Number(sal.paidSpot) || 0), 0);
  const custPayTotal = (db.payments || []).filter((p: any) => p.type === 'PAYMENT_FROM_CUSTOMER' && !p.isLinkedToFactoryBuy).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);

  const grossUserCash = wsSpotCash + retSpotCash + custPayTotal;
  const availableUserCash = Math.max(0, grossUserCash - factorySpotTotal);
  const activeFactoryDana = Math.max(0, factoryDanaTotal - factoryDirectTotal);
  const danaCutFromUser = Math.min(availableUserCash, activeFactoryDana);

  db.branchAccount = db.branchAccount || {
    userName: 'Farooq Gujjar KB',
    branchName: 'Farooq Gujjar KB (Branch)'
  };
  db.branchAccount.companyBalance = Math.max(0, factorySpotTotal + factoryDirectTotal + factoryUdhaarTotal + (crSum - drSum) + danaCutFromUser);
  db.branchAccount.userBalance = Math.max(0, availableUserCash - danaCutFromUser);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  
  // 1. Full Dashboard Summary
  app.get('/api/dashboard', (req, res) => {
    const db = loadDb();
    
    // Inventory summary
    let totalStockBags = 0;
    let totalStockValue = 0;
    db.items.forEach((item: any) => {
      totalStockBags += (item.stockBags || 0);
      totalStockValue += (item.stockBags || 0) * (item.purchasePrice || 0);
    });

    // Live compute user cut for dana
    const wsSpot = (db.sales || []).filter((s: any) => s.saleType === 'WHOLESALE').reduce((s: number, sal: any) => s + (Number(sal.paidAmount) || Number(sal.paidSpot) || 0), 0);
    const retSpot = (db.sales || []).filter((s: any) => s.saleType === 'RETAIL').reduce((s: number, sal: any) => s + (Number(sal.paidAmount) || Number(sal.paidSpot) || 0), 0);
    const custPay = (db.payments || []).filter((p: any) => p.type === 'PAYMENT_FROM_CUSTOMER' && !p.isLinkedToFactoryBuy).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
    const wsFactSpot = (db.purchases || []).filter((p: any) => p.partyId && !p.isUdhaarReceive).reduce((s: number, p: any) => s + (Number(p.paidNow) || Number(p.givenOnSpot) || 0), 0);
    const grossCash = wsSpot + retSpot + custPay + wsFactSpot;

    const factDana = (db.purchases || []).filter((p: any) => !p.isUdhaarReceive).reduce((sum: number, p: any) => sum + (Number(p.borrowedAmount) || 0), 0);
    const factDirect = (db.payments || []).filter((p: any) => p.type === 'PAYMENT_TO_COMPANY').reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const actFactDana = Math.max(0, factDana - factDirect);
    const userCutDana = Math.min(grossCash, actFactDana);

    // Total Company Payables (Dana Owed remaining after user cut)
    const totalCompanyPayables = Math.max(0, actFactDana - userCutDana);

    // Total Customer Receivables (Wholesale Parties + Retail Customers)
    let totalWholesaleReceivables = 0;
    db.parties.forEach((p: any) => {
      totalWholesaleReceivables += (p.currentBalance || 0);
    });

    let totalRetailReceivables = 0;
    db.customers.forEach((c: any) => {
      totalRetailReceivables += (c.currentBalance || 0);
    });

    const totalCustomerReceivables = totalWholesaleReceivables + totalRetailReceivables;

    // Recent activity counts
    const today = new Date().toISOString().split('T')[0];
    const todaySales = db.sales.filter((s: any) => s.date === today);
    const todaySalesBags = todaySales.reduce((acc: number, s: any) => acc + (s.quantityBags || 0), 0);
    const todaySalesRevenue = todaySales.reduce((acc: number, s: any) => acc + (s.netAmount || 0), 0);

    const todayPurchases = db.purchases.filter((p: any) => p.date === today);
    const todayPurchasesBags = todayPurchases.reduce((acc: number, p: any) => acc + (p.quantityBags || 0), 0);
    const todayPurchasesCost = todayPurchases.reduce((acc: number, p: any) => acc + (p.totalAmount || 0), 0);

    res.json({
      success: true,
      data: {
        totalStockBags,
        totalStockValue,
        totalCompanyPayables,
        totalWholesaleReceivables,
        totalRetailReceivables,
        totalCustomerReceivables,
        netPosition: (totalCustomerReceivables + totalStockValue) - totalCompanyPayables,
        todaySalesBags,
        todaySalesRevenue,
        todayPurchasesBags,
        todayPurchasesCost,
        itemsCount: db.items.length,
        companiesCount: db.companies.length,
        partiesCount: db.parties.length,
        customersCount: db.customers.length,
        lastSync: db.meta?.lastSyncTimestamp || new Date().toISOString(),
        meta: db.meta
      }
    });
  });

  // 2. Stock & Varieties
  app.get('/api/items', (req, res) => {
    const db = loadDb();
    res.json({ success: true, data: db.items });
  });

  app.post('/api/items', (req, res) => {
    const db = loadDb();
    const newItem = {
      id: 'item-' + Date.now(),
      name: req.body.name,
      category: req.body.category || 'Vanda / Dairy Feed',
      bagWeightKg: Number(req.body.bagWeightKg) || 50,
      unit: req.body.unit || 'Bori (Bag)',
      stockBags: Number(req.body.stockBags) || 0,
      minStockAlert: Number(req.body.minStockAlert) || 50,
      purchasePrice: Number(req.body.purchasePrice) || 0,
      wholesalePrice: Number(req.body.wholesalePrice) || 0,
      retailPrice: Number(req.body.retailPrice) || 0,
      manufacturer: req.body.manufacturer || ''
    };
    db.items.push(newItem);
    saveDb(db);
    res.json({ success: true, data: newItem });
  });

  app.put('/api/items/:id', (req, res) => {
    const db = loadDb();
    const index = db.items.findIndex((i: any) => i.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Item not found' });
    
    db.items[index] = {
      ...db.items[index],
      ...req.body,
      bagWeightKg: Number(req.body.bagWeightKg ?? db.items[index].bagWeightKg),
      stockBags: Number(req.body.stockBags ?? db.items[index].stockBags),
      minStockAlert: Number(req.body.minStockAlert ?? db.items[index].minStockAlert),
      purchasePrice: Number(req.body.purchasePrice ?? db.items[index].purchasePrice),
      wholesalePrice: Number(req.body.wholesalePrice ?? db.items[index].wholesalePrice),
      retailPrice: Number(req.body.retailPrice ?? db.items[index].retailPrice)
    };
    saveDb(db);
    res.json({ success: true, data: db.items[index] });
  });

  // 3. Companies / Factories & Ledgers
  app.get('/api/companies', (req, res) => {
    const db = loadDb();
    
    // Live compute user cut for dana
    const wsSpotCash = (db.sales || []).filter((s: any) => s.saleType === 'WHOLESALE').reduce((s: number, sal: any) => s + (Number(sal.paidAmount) || Number(sal.paidSpot) || 0), 0);
    const retSpotCash = (db.sales || []).filter((s: any) => s.saleType === 'RETAIL').reduce((s: number, sal: any) => s + (Number(sal.paidAmount) || Number(sal.paidSpot) || 0), 0);
    const custPayTotal = (db.payments || []).filter((p: any) => p.type === 'PAYMENT_FROM_CUSTOMER' && !p.isLinkedToFactoryBuy).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
    const factorySpotTotal = (db.purchases || []).reduce((sum: number, p: any) => sum + (Number(p.paidNow) || Number(p.givenOnSpot) || 0), 0);

    const grossUserCash = wsSpotCash + retSpotCash + custPayTotal;
    const availableUserCash = Math.max(0, grossUserCash - factorySpotTotal);

    const factoryDanaTotal = (db.purchases || []).filter((p: any) => !p.isUdhaarReceive).reduce((sum: number, p: any) => sum + (Number(p.borrowedAmount) || 0), 0);
    const factoryDirectTotal = (db.payments || [])
      .filter((p: any) => p.type === 'PAYMENT_TO_COMPANY')
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const activeFactoryDana = Math.max(0, factoryDanaTotal - factoryDirectTotal);
    const danaCutFromUser = Math.min(availableUserCash, activeFactoryDana);

    const companiesWithCut = (db.companies || []).map((comp: any) => {
      const compDana = (db.purchases || []).filter((p: any) => p.companyId === comp.id && !p.isUdhaarReceive).reduce((sum: number, p: any) => sum + (Number(p.borrowedAmount) || 0), 0);
      const compDirect = (db.payments || []).filter((p: any) => p.companyId === comp.id && p.type === 'PAYMENT_TO_COMPANY').reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      const compActiveDana = Math.max(0, compDana - compDirect);
      const compCut = activeFactoryDana > 0 ? (compActiveDana / activeFactoryDana) * danaCutFromUser : 0;
      return {
        ...comp,
        currentBalance: Math.max(0, compActiveDana - compCut)
      };
    });

    res.json({ success: true, data: companiesWithCut });
  });

  app.post('/api/companies', (req, res) => {
    const db = loadDb();
    const newCompany = {
      id: 'comp-' + Date.now(),
      name: req.body.name,
      contactPerson: req.body.contactPerson || '',
      phone: req.body.phone || '',
      city: req.body.city || '',
      bankDetails: req.body.bankDetails || '',
      totalPurchases: Number(req.body.initialBalance) || 0,
      totalPayments: 0,
      currentBalance: Number(req.body.initialBalance) || 0
    };
    db.companies.push(newCompany);
    saveDb(db);
    res.json({ success: true, data: newCompany });
  });

  app.delete('/api/companies/:id', (req, res) => {
    const db = loadDb();
    const compIndex = db.companies.findIndex((c: any) => c.id === req.params.id);
    if (compIndex === -1) return res.status(404).json({ success: false, error: 'Company not found' });
    const deleted = db.companies.splice(compIndex, 1)[0];
    const compId = deleted.id;

    // Delete related purchases
    db.purchases = (db.purchases || []).filter((p: any) => p.companyId !== compId);
    // Delete related direct company payments
    db.payments = (db.payments || []).filter((p: any) => !(p.type === 'PAYMENT_TO_COMPANY' && p.companyId === compId));
    // Delete related third-party factory deposits
    db.thirdPartyPayments = (db.thirdPartyPayments || []).filter((t: any) => t.companyId !== compId);

    recalculateBranchAccount(db);
    saveDb(db);
    res.json({ success: true, message: `Company ${deleted.name} and related records deleted successfully`, data: deleted });
  });

  // Company Ledger detail
  app.get('/api/companies/:id/ledger', (req, res) => {
    const db = loadDb();
    const company = db.companies.find((c: any) => c.id === req.params.id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });

    // Gather all purchases from this company
    const purchases = db.purchases.filter((p: any) => p.companyId === company.id);
    // Gather all direct payments to this company
    const directPayments = db.payments.filter((p: any) => p.companyId === company.id && p.type === 'PAYMENT_TO_COMPANY');
    // Gather all third-party payments where customer deposited directly to this company!
    const thirdPartyDeposits = db.thirdPartyPayments.filter((t: any) => t.companyId === company.id);

    // Build timeline ledger
    const ledgerEntries: any[] = [];

    purchases.forEach((pur: any) => {
      if (pur.isUdhaarReceive) {
        // Udhaar (recieve) is a wholesale normal transaction payback, not a purchase of goods
        return;
      }
      const danaAmount = Number(pur.borrowedAmount !== undefined ? pur.borrowedAmount : (pur.balanceAdded > 0 ? pur.totalAmount : (pur.paidNow ? 0 : pur.totalAmount)));
      if (danaAmount > 0) {
        ledgerEntries.push({
          id: pur.id,
          date: pur.date,
          type: 'PURCHASE',
          description: pur.notes || (pur.quantityBags > 0 ? `Purchased ${pur.quantityBags} Bags of ${pur.itemName} @ Rs. ${pur.ratePerBag}` : 'Factory Product / Dana Borrowed'),
          vehicleNumber: pur.vehicleNumber,
          biltyNumber: pur.biltyNumber,
          debit: 0,
          credit: danaAmount, // Increases payable to factory (Dana)
          paidNow: pur.paidNow || 0,
          reference: pur.biltyNumber || pur.vehicleNumber
        });
      }
      if (pur.paidNow && pur.paidNow > 0) {
        ledgerEntries.push({
          id: `pay-pur-${pur.id}`,
          date: pur.date,
          type: 'PAYMENT_AT_PURCHASE',
          description: `Cash paid on spot to Factory (Normal Transaction)`,
          vehicleNumber: pur.vehicleNumber,
          debit: pur.paidNow, // Decreases payable to factory
          credit: 0,
          reference: 'Cash/Spot Payment'
        });
      }
    });

    directPayments.forEach((dp: any) => {
      ledgerEntries.push({
        id: dp.id,
        date: dp.date,
        type: 'DIRECT_PAYMENT',
        description: `Direct Payment to Company via ${dp.paymentMethod}`,
        debit: dp.amount, // Decreases our payable to company
        credit: 0,
        reference: dp.referenceNumber
      });
    });

    thirdPartyDeposits.forEach((tpp: any) => {
      ledgerEntries.push({
        id: tpp.id,
        date: tpp.date,
        type: 'THIRD_PARTY_DEPOSIT',
        description: `Direct Factory Deposit by Customer: ${tpp.customerName} on our behalf`,
        debit: tpp.amount, // Decreases our payable to company!
        credit: 0,
        reference: `Slip: ${tpp.depositSlipNumber} (${tpp.bankName})`
      });
    });

    // Sort by date ascending
    ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate delta and check for opening balance
    const sumCredits = ledgerEntries.reduce((acc, e) => acc + (e.credit || 0), 0);
    const sumDebits = ledgerEntries.reduce((acc, e) => acc + (e.debit || 0), 0);
    const delta = sumCredits - sumDebits;
    const openingBalance = (company.currentBalance || 0) - delta;

    if (openingBalance !== 0) {
      ledgerEntries.unshift({
        id: `open-${company.id}`,
        date: purchases[0]?.date ? new Date(new Date(purchases[0].date).getTime() - 86400000).toISOString().split('T')[0] : 'Opening',
        type: 'OPENING_BALANCE',
        description: 'Account Opening Balance (Carried Forward)',
        debit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        credit: openingBalance > 0 ? openingBalance : 0,
        reference: 'Ledger B/F'
      });
    }

    // Calculate running balance
    let runningBalance = 0;
    ledgerEntries.forEach((entry) => {
      runningBalance = runningBalance + entry.credit - entry.debit;
      entry.runningBalance = runningBalance;
    });

    res.json({
      success: true,
      data: {
        company,
        ledgerEntries,
        calculatedBalance: runningBalance
      }
    });
  });

  // 4. Big Parties (Wholesale) & Ledgers
  app.get('/api/parties', (req, res) => {
    const db = loadDb();
    res.json({ success: true, data: db.parties });
  });

  app.post('/api/parties', (req, res) => {
    const db = loadDb();
    let vehicles: string[] = [];
    if (Array.isArray(req.body.vehicleNumbers)) {
      vehicles = req.body.vehicleNumbers.map((s: any) => String(s).trim()).filter(Boolean);
    } else if (typeof req.body.vehicleNumbers === 'string') {
      vehicles = req.body.vehicleNumbers.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    const newParty = {
      id: 'party-' + Date.now(),
      name: req.body.name,
      type: 'WHOLESALE_DEALER',
      phone: req.body.phone || '',
      area: req.body.area || '',
      vehicleNumbers: vehicles,
      creditLimit: Number(req.body.creditLimit) || 500000,
      totalSales: Number(req.body.initialBalance) || 0,
      totalReceived: 0,
      currentBalance: Number(req.body.initialBalance) || 0
    };
    db.parties.push(newParty);
    saveDb(db);
    res.json({ success: true, data: newParty });
  });

  app.put('/api/parties/:id', (req, res) => {
    const db = loadDb();
    const index = db.parties.findIndex((p: any) => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Party not found' });

    let vehicles = db.parties[index].vehicleNumbers || [];
    if (Array.isArray(req.body.vehicleNumbers)) {
      vehicles = req.body.vehicleNumbers.map((s: any) => String(s).trim()).filter(Boolean);
    } else if (typeof req.body.vehicleNumbers === 'string') {
      vehicles = req.body.vehicleNumbers.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    db.parties[index] = {
      ...db.parties[index],
      ...req.body,
      vehicleNumbers: vehicles,
      creditLimit: req.body.creditLimit !== undefined ? Number(req.body.creditLimit) : db.parties[index].creditLimit
    };
    saveDb(db);
    res.json({ success: true, data: db.parties[index] });
  });

  app.delete('/api/parties/:id', (req, res) => {
    const db = loadDb();
    const partyIndex = db.parties.findIndex((p: any) => p.id === req.params.id);
    if (partyIndex === -1) return res.status(404).json({ success: false, error: 'Party not found' });
    const deletedParty = db.parties.splice(partyIndex, 1)[0];
    const partyId = deletedParty.id;
    const partyName = deletedParty.name;

    // 1. Delete all related sales across wholesale & restore inventory stock
    const isMatchingSale = (s: any) =>
      s.partyId === partyId ||
      s.partyName === partyName ||
      s.customerName === partyName;

    const salesToDelete = (db.sales || []).filter(isMatchingSale);
    salesToDelete.forEach((s: any) => {
      const item = db.items.find((i: any) => i.id === s.itemId);
      if (item && Number(s.quantityBags) > 0) {
        item.stockBags = (item.stockBags || 0) + Number(s.quantityBags);
      }
    });
    db.sales = (db.sales || []).filter((s: any) => !isMatchingSale(s));

    // 2. Delete all related payments (customer payments & factory-linked payments)
    const isMatchingPayment = (p: any) =>
      p.partyId === partyId ||
      p.customerId === partyId ||
      p.partyName === partyName ||
      (p.notes && p.notes.includes(partyName));
    db.payments = (db.payments || []).filter((p: any) => !isMatchingPayment(p));

    // 3. Delete all related third-party customer deposits
    const isMatchingTPP = (t: any) =>
      t.customerPartyId === partyId ||
      t.customerId === partyId ||
      t.customerName === partyName;
    db.thirdPartyPayments = (db.thirdPartyPayments || []).filter((t: any) => !isMatchingTPP(t));

    // 4. Delete all related purchases / Factory Buy wholesale entries
    const isMatchingPurchase = (p: any) =>
      p.partyId === partyId ||
      p.partyName === partyName ||
      (p.notes && (p.notes.includes(`Wholesale Party: ${partyName}`) || p.notes.includes(partyName)));

    const purchasesToDelete = (db.purchases || []).filter(isMatchingPurchase);
    purchasesToDelete.forEach((p: any) => {
      // Revert stock if feed bags were purchased
      if (!p.isUdhaarReceive && p.itemId && Number(p.quantityBags) > 0) {
        const item = db.items.find((i: any) => i.id === p.itemId);
        if (item) {
          item.stockBags = Math.max(0, (item.stockBags || 0) - Number(p.quantityBags));
        }
      }
      // Revert company balance if affected
      if (p.companyId) {
        const comp = db.companies.find((c: any) => c.id === p.companyId);
        if (comp) {
          comp.totalPurchases = Math.max(0, (comp.totalPurchases || 0) - (p.borrowedAmount || p.totalAmount || 0));
          comp.totalPayments = Math.max(0, (comp.totalPayments || 0) - (p.paidNow || 0));
          comp.currentBalance = Math.max(0, (comp.currentBalance || 0) - (p.balanceDelta !== undefined ? p.balanceDelta : (p.balanceAdded || 0)));
        }
      }
    });
    db.purchases = (db.purchases || []).filter((p: any) => !isMatchingPurchase(p));

    // 5. Recalculate branch treasury live balances
    recalculateBranchAccount(db);

    saveDb(db);
    res.json({
      success: true,
      message: `Party ${deletedParty.name} and all related sales, payments, and transactions deleted successfully across all sections.`,
      data: deletedParty,
      deletedSalesCount: salesToDelete.length,
      deletedPurchasesCount: purchasesToDelete.length
    });
  });

  // Party Ledger detail
  app.get('/api/parties/:id/ledger', (req, res) => {
    const db = loadDb();
    const party = db.parties.find((p: any) => p.id === req.params.id);
    if (!party) return res.status(404).json({ success: false, error: 'Party not found' });

    const sales = db.sales.filter((s: any) => s.partyId === party.id);
    const directPayments = db.payments.filter((p: any) => p.partyId === party.id && p.type === 'PAYMENT_FROM_CUSTOMER');
    const thirdPartyDeposits = db.thirdPartyPayments.filter((t: any) => t.customerPartyId === party.id);

    const ledgerEntries: any[] = [];

    sales.forEach((s: any) => {
      const lanaVal = Number(s.borrowedLana !== undefined ? s.borrowedLana : (s.remainingBalance > 0 ? s.netAmount : (s.paidAmount ? 0 : s.netAmount)));
      if (lanaVal > 0) {
        ledgerEntries.push({
          id: s.id,
          date: s.date,
          type: 'SALE_INVOICE',
          description: s.notes || (s.quantityBags > 0 ? `Dispatched ${s.quantityBags} Bags of ${s.itemName} @ Rs. ${s.ratePerBag}` : 'Wholesale Feed Dispatch / Lana Borrowed'),
          vehicleNumber: s.vehicleNumber,
          invoiceNumber: s.invoiceNumber,
          debit: lanaVal, // Party owes us this amount (Lana)
          credit: 0,
          reference: s.invoiceNumber || s.vehicleNumber
        });
      }
      const spotVal = Number(s.paidSpot !== undefined ? s.paidSpot : s.paidAmount);
      if (spotVal > 0) {
        ledgerEntries.push({
          id: `pay-sale-${s.id}`,
          date: s.date,
          type: 'PAYMENT_ON_DELIVERY',
          description: `Cash/Spot Received on delivery (Normal Transaction)`,
          vehicleNumber: s.vehicleNumber,
          debit: 0,
          credit: spotVal, // Reduces party's balance
          reference: 'Cash Received'
        });
      }
    });

    directPayments.forEach((p: any) => {
      ledgerEntries.push({
        id: p.id,
        date: p.date,
        type: 'DIRECT_PAYMENT_RECEIVED',
        description: `Payment Received via ${p.paymentMethod}`,
        debit: 0,
        credit: p.amount,
        reference: p.referenceNumber
      });
    });

    thirdPartyDeposits.forEach((tpp: any) => {
      ledgerEntries.push({
        id: tpp.id,
        date: tpp.date,
        type: 'THIRD_PARTY_FACTORY_DEPOSIT',
        description: `Direct Payment by party into Factory (${tpp.companyName}) Account on our credit`,
        debit: 0,
        credit: tpp.amount, // Directly deducts from customer balance!
        reference: `Slip: ${tpp.depositSlipNumber} (${tpp.bankName})`
      });
    });

    // Factory Buy entries where Udhaar (recieve) was entered to cut party's balance
    const factoryBuyEntries = db.purchases.filter((p: any) => p.partyId === party.id && (p.partyCutAmount > 0 || p.udhaarReceiveAmount > 0 || p.borrowedAmount > 0));
    factoryBuyEntries.forEach((pur: any) => {
      const cutAmt = Number(pur.partyCutAmount || pur.udhaarReceiveAmount || pur.borrowedAmount || 0);
      if (cutAmt > 0) {
        ledgerEntries.push({
          id: `pur-party-${pur.id}`,
          date: pur.date,
          type: 'UDHAAR_RECEIVE_PAYBACK',
          description: `Factory Buy: Udhaar (recieve) Payback (${pur.biltyNumber || pur.vehicleNumber || 'Normal transaction payback'})`,
          vehicleNumber: pur.vehicleNumber,
          biltyNumber: pur.biltyNumber,
          debit: 0,
          credit: cutAmt, // Cuts dana of this wholesale party (normal payback)
          reference: pur.biltyNumber || 'Udhaar (recieve)'
        });
      }
    });

    ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate delta and check for opening balance
    const sumDebits = ledgerEntries.reduce((acc, e) => acc + (e.debit || 0), 0);
    const sumCredits = ledgerEntries.reduce((acc, e) => acc + (e.credit || 0), 0);
    const delta = sumDebits - sumCredits;
    const openingBalance = (party.currentBalance || 0) - delta;

    if (openingBalance !== 0) {
      ledgerEntries.unshift({
        id: `open-${party.id}`,
        date: sales[0]?.date ? new Date(new Date(sales[0].date).getTime() - 86400000).toISOString().split('T')[0] : 'Opening',
        type: 'OPENING_BALANCE',
        description: 'Account Opening Balance (Carried Forward)',
        debit: openingBalance > 0 ? openingBalance : 0,
        credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        reference: 'Ledger B/F'
      });
    }

    let runningBalance = 0;
    ledgerEntries.forEach((entry) => {
      runningBalance = runningBalance + entry.debit - entry.credit;
      entry.runningBalance = runningBalance;
    });

    res.json({
      success: true,
      data: {
        party,
        ledgerEntries,
        calculatedBalance: runningBalance
      }
    });
  });

  // 5. Local Retail Customers (Khata) & Ledgers
  app.get('/api/customers', (req, res) => {
    const db = loadDb();
    res.json({ success: true, data: db.customers });
  });

  app.post('/api/customers', (req, res) => {
    const db = loadDb();
    const newCust = {
      id: 'cust-' + Date.now(),
      name: req.body.name,
      phone: req.body.phone || '',
      village: req.body.village || '',
      cattleCount: Number(req.body.cattleCount) || 0,
      totalSales: Number(req.body.initialBalance) || 0,
      totalReceived: 0,
      currentBalance: Number(req.body.initialBalance) || 0
    };
    db.customers.push(newCust);
    saveDb(db);
    res.json({ success: true, data: newCust });
  });

  app.delete('/api/customers/:id', (req, res) => {
    const db = loadDb();
    const custIndex = db.customers.findIndex((c: any) => c.id === req.params.id);
    if (custIndex === -1) return res.status(404).json({ success: false, error: 'Customer not found' });
    const deletedCustomer = db.customers.splice(custIndex, 1)[0];
    const custId = deletedCustomer.id;
    const custName = deletedCustomer.name;

    // 1. Delete all related sales across retail khata & restore inventory stock
    const isMatchingSale = (s: any) =>
      s.partyId === custId ||
      s.customerId === custId ||
      s.partyName === custName ||
      s.customerName === custName;

    const salesToDelete = (db.sales || []).filter(isMatchingSale);
    salesToDelete.forEach((s: any) => {
      const item = db.items.find((i: any) => i.id === s.itemId);
      if (item && Number(s.quantityBags) > 0) {
        item.stockBags = (item.stockBags || 0) + Number(s.quantityBags);
      }
    });
    db.sales = (db.sales || []).filter((s: any) => !isMatchingSale(s));

    // 2. Delete all related payments
    const isMatchingPayment = (p: any) =>
      p.partyId === custId ||
      p.customerId === custId ||
      p.partyName === custName ||
      (p.notes && p.notes.includes(custName));
    db.payments = (db.payments || []).filter((p: any) => !isMatchingPayment(p));

    // 3. Delete all related third-party payments
    const isMatchingTPP = (t: any) =>
      t.customerPartyId === custId ||
      t.customerId === custId ||
      t.customerName === custName;
    db.thirdPartyPayments = (db.thirdPartyPayments || []).filter((t: any) => !isMatchingTPP(t));

    // 4. Recalculate branch treasury live balances
    recalculateBranchAccount(db);

    saveDb(db);
    res.json({
      success: true,
      message: `Customer ${deletedCustomer.name} and all related sales and payments deleted successfully across all sections.`,
      data: deletedCustomer,
      deletedSalesCount: salesToDelete.length
    });
  });

  app.get('/api/customers/:id/ledger', (req, res) => {
    const db = loadDb();
    const cust = db.customers.find((c: any) => c.id === req.params.id);
    if (!cust) return res.status(404).json({ success: false, error: 'Customer not found' });

    const sales = db.sales.filter((s: any) => s.partyId === cust.id);
    const directPayments = db.payments.filter((p: any) => p.partyId === cust.id && p.type === 'PAYMENT_FROM_CUSTOMER');
    const thirdPartyDeposits = db.thirdPartyPayments.filter((t: any) => t.customerPartyId === cust.id);

    const ledgerEntries: any[] = [];

    sales.forEach((s: any) => {
      const lanaVal = Number(s.borrowedLana !== undefined ? s.borrowedLana : (s.remainingBalance > 0 ? s.netAmount : (s.paidAmount ? 0 : s.netAmount)));
      if (lanaVal > 0) {
        ledgerEntries.push({
          id: s.id,
          date: s.date,
          type: 'RETAIL_SALE',
          description: s.notes || (s.quantityBags > 0 ? `Brought ${s.quantityBags} Bags of ${s.itemName} @ Rs. ${s.ratePerBag}` : 'Retail Feed Purchase / Lana Borrowed'),
          vehicleNumber: s.vehicleNumber,
          invoiceNumber: s.invoiceNumber,
          debit: lanaVal, // Lana increases what customer owes
          credit: 0,
          reference: s.invoiceNumber
        });
      }
      const spotVal = Number(s.paidSpot !== undefined ? s.paidSpot : s.paidAmount);
      if (spotVal > 0) {
        ledgerEntries.push({
          id: `pay-sale-${s.id}`,
          date: s.date,
          type: 'CASH_PAID_AT_PURCHASE',
          description: `Cash paid on spot (Normal Transaction)`,
          debit: 0,
          credit: spotVal, // Normal transaction cuts customer debt
          reference: 'Cash Received'
        });
      }
    });

    directPayments.forEach((p: any) => {
      ledgerEntries.push({
        id: p.id,
        date: p.date,
        type: 'KHATA_PAYMENT_RECEIVED',
        description: `Payment Received (Lana Cleared) via ${p.paymentMethod}`,
        debit: 0,
        credit: p.amount,
        reference: p.referenceNumber
      });
    });

    thirdPartyDeposits.forEach((tpp: any) => {
      ledgerEntries.push({
        id: tpp.id,
        date: tpp.date,
        type: 'THIRD_PARTY_FACTORY_DEPOSIT',
        description: `Paid directly to Factory (${tpp.companyName}) account on our behalf`,
        debit: 0,
        credit: tpp.amount,
        reference: `Slip: ${tpp.depositSlipNumber}`
      });
    });

    ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate delta and check for opening balance
    const sumDebits = ledgerEntries.reduce((acc, e) => acc + (e.debit || 0), 0);
    const sumCredits = ledgerEntries.reduce((acc, e) => acc + (e.credit || 0), 0);
    const delta = sumDebits - sumCredits;
    const openingBalance = (cust.currentBalance || 0) - delta;

    if (openingBalance !== 0) {
      ledgerEntries.unshift({
        id: `open-${cust.id}`,
        date: sales[0]?.date ? new Date(new Date(sales[0].date).getTime() - 86400000).toISOString().split('T')[0] : 'Opening',
        type: 'OPENING_BALANCE',
        description: 'Khata Opening Balance (Carried Forward)',
        debit: openingBalance > 0 ? openingBalance : 0,
        credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        reference: 'Khata B/F'
      });
    }

    let runningBalance = 0;
    ledgerEntries.forEach((entry) => {
      runningBalance = runningBalance + entry.debit - entry.credit;
      entry.runningBalance = runningBalance;
    });

    res.json({
      success: true,
      data: {
        customer: cust,
        ledgerEntries,
        calculatedBalance: runningBalance
      }
    });
  });

  // 6. RECORD PURCHASES (Auto-updates Stock & Factory Payable Ledger)
  app.get('/api/purchases', (req, res) => {
    const db = loadDb();
    res.json({ success: true, data: db.purchases });
  });

  app.post('/api/purchases', (req, res) => {
    const db = loadDb();
    const {
      companyId,
      partyId,
      partyName,
      itemId,
      quantityBags,
      ratePerBag,
      vehicleNumber,
      biltyNumber,
      driverName,
      date,
      paidNow,
      borrowedAmount,
      givenOnSpot,
      transactionMode, // 'BORROW_DANA' | 'GIVEN_ON_SPOT'
      notes
    } = req.body;

    let company = db.companies.find((c: any) => c.id === companyId);
    if (!company) {
      company = db.companies[0];
    }
    if (!company) {
      company = {
        id: 'comp-default',
        name: 'Supreme Feeds Ltd',
        city: 'Gujranwala',
        contactPerson: 'Farooq Gujjar',
        phone: '0300-1234567',
        bankDetails: 'HBL 1234567890',
        totalPurchases: 0,
        totalPayments: 0,
        currentBalance: 0
      };
      db.companies.push(company);
    }

    let item = db.items.find((i: any) => i.id === itemId);
    if (!item && db.items.length > 0) {
      item = db.items[0];
    }
    const itemName = item ? item.name : 'Factory Product / Stock';

    const isUdhaarReceive = Boolean(
      req.body.isUdhaarReceive || 
      req.body.entryType === 'UDHAAR_RECEIVE' ||
      (partyId && Number(req.body.udhaarReceiveAmount) > 0)
    );
    const udhaarReceiveVal = Number(req.body.udhaarReceiveAmount) || (isUdhaarReceive ? Number(borrowedAmount || req.body.amount || 0) : 0);

    // If Udhaar (recieve), strictly NO purchase of goods (bag count = 0, purchase rate = 0, total purchase = 0)
    const qty = isUdhaarReceive ? 0 : (Number(quantityBags) || 0);
    const rate = isUdhaarReceive ? 0 : (Number(ratePerBag) || 0);

    const borrowed = isUdhaarReceive ? 0 : (Number(borrowedAmount) || (transactionMode === 'BORROW_DANA' ? (Number(req.body.amount) || 0) : 0));
    const paid = Number(paidNow) || Number(givenOnSpot) || (transactionMode === 'GIVEN_ON_SPOT' ? (Number(req.body.amount) || 0) : 0);

    const totalAmount = isUdhaarReceive ? 0 : (Number(req.body.totalAmount) || Math.max(borrowed, paid) || (qty * rate) || Number(req.body.amount) || 0);
    
    // Normal transactions add borrowed amount to Dana udhaar.
    // Udhaar (recieve) does NOT add to Dana udhaar because it's a payback!
    const balanceAdded = borrowed;
    const oldBalance = company.currentBalance || 0;
    const newBalance = oldBalance + borrowed;
    const balanceDelta = borrowed;

    // Check linked wholesale party if provided
    let linkedParty: any = partyId ? db.parties.find((p: any) => p.id === partyId) : null;
    let actualPartyName = linkedParty ? linkedParty.name : (partyName || '');

    // In Factory Buy section: Udhaar (recieve) cuts Dana of that wholesale party as a normal transaction payback (no purchase of goods)
    let partyCutAmount = 0;
    if (linkedParty && (udhaarReceiveVal > 0 || isUdhaarReceive)) {
      partyCutAmount = udhaarReceiveVal > 0 ? udhaarReceiveVal : Number(borrowedAmount || 0);
      linkedParty.totalReceived = (linkedParty.totalReceived || 0) + partyCutAmount;
      linkedParty.currentBalance = Math.max(0, (linkedParty.currentBalance || 0) - partyCutAmount);
    }

    // 1. Create record (added as factory record because it's added in Factory Buy section)
    const newPurchase = {
      id: 'pur-' + Date.now(),
      companyId: company.id,
      companyName: company.name,
      partyId: linkedParty ? linkedParty.id : undefined,
      partyName: actualPartyName || undefined,
      partyCutAmount,
      isUdhaarReceive,
      udhaarReceiveAmount: isUdhaarReceive ? partyCutAmount : 0,
      entryType: isUdhaarReceive ? 'UDHAAR_RECEIVE' : 'PURCHASE',
      itemId: isUdhaarReceive ? 'none' : (item ? item.id : 'gen-item'),
      itemName: isUdhaarReceive ? 'Udhaar (recieve) - Pay/Receive (No Purchase)' : itemName,
      quantityBags: qty,
      ratePerBag: rate,
      totalAmount,
      borrowedAmount: borrowed,
      givenOnSpot: paid,
      vehicleNumber: vehicleNumber || 'N/A',
      biltyNumber: biltyNumber || (isUdhaarReceive ? `REC-${Math.floor(10000 + Math.random() * 90000)}` : `BL-${Math.floor(10000 + Math.random() * 90000)}`),
      driverName: driverName || '',
      date: date || new Date().toISOString().split('T')[0],
      paidNow: paid,
      balanceAdded,
      balanceDelta,
      companyBalanceAfter: newBalance,
      paymentStatus: borrowed === 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'CREDIT'),
      notes: notes || (isUdhaarReceive 
        ? `Wholesale Party: ${actualPartyName} - Udhaar (recieve) Pay/Receive payback (No Purchase)` 
        : (borrowed > 0 && paid > 0 ? `Dana: Rs. ${borrowed.toLocaleString()} | Paid on spot: Rs. ${paid.toLocaleString()}` : borrowed > 0 ? 'Borrow from Factory (Dana)' : 'Paid on Spot to Factory (Normal Transaction)'))
    };

    db.purchases.unshift(newPurchase);

    // 2. If Udhaar (recieve) was entered for a Wholesale Party, also log in db.payments as Pay/Receive:
    // It acts as Pay/Receive, cuts the Dana of that customer, and does not act as factory purchase.
    if (linkedParty && isUdhaarReceive && partyCutAmount > 0) {
      const linkedPayment = {
        id: 'pay-pur-' + newPurchase.id,
        type: 'PAYMENT_FROM_CUSTOMER',
        partyId: linkedParty.id,
        partyName: linkedParty.name,
        partyType: 'WHOLESALE_DEALER',
        amount: partyCutAmount,
        paymentMethod: 'Factory Buy - Udhaar (recieve)',
        referenceNumber: newPurchase.biltyNumber,
        date: newPurchase.date,
        isLinkedToFactoryBuy: true,
        purchaseId: newPurchase.id,
        notes: `Pay/Receive: Normal payback received from wholesale party ${linkedParty.name} via Factory Buy (No Purchase)`
      };
      db.payments.unshift(linkedPayment);
    }

    // 3. AUTO-UPDATE STOCK (if not Udhaar receive and qty > 0)
    if (!isUdhaarReceive && item && qty > 0) {
      item.stockBags = (item.stockBags || 0) + qty;
      if (rate > 0) item.purchasePrice = rate;
    }

    // 4. AUTO-UPDATE FACTORY PAYABLE:
    // Udhaar (recieve) is a payback without purchase, so it does NOT increase company totalPurchases!
    if (!isUdhaarReceive) {
      company.totalPurchases = (company.totalPurchases || 0) + (borrowed > 0 ? borrowed : totalAmount);
    }
    company.totalPayments = (company.totalPayments || 0) + paid;

    // 5. Update branchAccount live balances
    const factorySpotTotal = (db.purchases || []).reduce(
      (sum: number, p: any) => sum + (Number(p.paidNow) || Number(p.givenOnSpot) || 0),
      0
    );
    const factoryUdhaarTotal = (db.purchases || [])
      .filter((p: any) => p.isUdhaarReceive || Number(p.udhaarReceiveAmount) > 0)
      .reduce((sum: number, p: any) => sum + (Number(p.udhaarReceiveAmount) || Number(p.partyCutAmount) || 0), 0);
    const factoryDanaTotal = (db.purchases || [])
      .filter((p: any) => !p.isUdhaarReceive)
      .reduce((sum: number, p: any) => sum + (Number(p.borrowedAmount) || 0), 0);
    const factoryDirectTotal = (db.payments || [])
      .filter((p: any) => p.type === 'PAYMENT_TO_COMPANY')
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const crSum = (db.companyPayments || []).filter((cp: any) => cp.entryType === 'CR').reduce((s: number, cp: any) => s + (Number(cp.amount) || 0), 0);
    const drSum = (db.companyPayments || []).filter((cp: any) => cp.entryType === 'DR').reduce((s: number, cp: any) => s + (Number(cp.amount) || 0), 0);

    const wsSpotCash = (db.sales || []).filter((s: any) => s.saleType === 'WHOLESALE').reduce((s: number, sal: any) => s + (Number(sal.paidAmount) || Number(sal.paidSpot) || 0), 0);
    const retSpotCash = (db.sales || []).filter((s: any) => s.saleType === 'RETAIL').reduce((s: number, sal: any) => s + (Number(sal.paidAmount) || Number(sal.paidSpot) || 0), 0);
    const custPayTotal = (db.payments || []).filter((p: any) => p.type === 'PAYMENT_FROM_CUSTOMER' && !p.isLinkedToFactoryBuy).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);

    const grossUserCash = wsSpotCash + retSpotCash + custPayTotal;
    const availableUserCash = Math.max(0, grossUserCash - factorySpotTotal);
    const activeFactoryDana = Math.max(0, factoryDanaTotal - factoryDirectTotal);
    const danaCutFromUser = Math.min(availableUserCash, activeFactoryDana);

    company.currentBalance = Math.max(0, newBalance - danaCutFromUser);
    newPurchase.companyBalanceAfter = company.currentBalance;

    db.branchAccount = db.branchAccount || {
      userName: 'Farooq Gujjar KB',
      branchName: 'Farooq Gujjar KB (Branch)'
    };
    db.branchAccount.companyBalance = Math.max(0, factorySpotTotal + factoryDirectTotal + factoryUdhaarTotal + (crSum - drSum) + danaCutFromUser);
    db.branchAccount.userBalance = Math.max(0, availableUserCash - danaCutFromUser);

    saveDb(db);
    res.json({
      success: true,
      message: isUdhaarReceive 
        ? `Udhaar (recieve) recorded as Pay/Receive. Rs. ${partyCutAmount.toLocaleString()} received and cut from ${actualPartyName} Dana balance (No Purchase), and added ONLY to Factory balance.`
        : `Factory transaction recorded. ${paid > 0 && linkedParty ? `Rs. ${paid.toLocaleString()} added to User and Factory balance for Wholesale.` : borrowed > 0 ? `Rs. ${borrowed.toLocaleString()} recorded under Factory Purchases.` : `Rs. ${paid.toLocaleString()} paid on spot.`}`,
      data: newPurchase,
      currentBalance: company.currentBalance,
      partyBalance: linkedParty?.currentBalance,
      branchAccount: db.branchAccount
    });
  });

  app.delete('/api/purchases/:id', (req, res) => {
    const db = loadDb();
    const cleanPurId = req.params.id.replace(/^pay-pur-/, '');
    const purIndex = db.purchases.findIndex((p: any) => p.id === cleanPurId || p.id === req.params.id);
    if (purIndex === -1) return res.status(404).json({ success: false, error: 'Purchase record not found' });
    const purchase = db.purchases[purIndex];

    // Revert stock if it was a real purchase
    const item = db.items.find((i: any) => i.id === purchase.itemId);
    if (item && purchase.quantityBags > 0) {
      item.stockBags = Math.max(0, (item.stockBags || 0) - (purchase.quantityBags || 0));
    }

    // Revert company ledger if it was not Udhaar receive
    const company = db.companies.find((c: any) => c.id === purchase.companyId);
    if (company) {
      if (!purchase.isUdhaarReceive) {
        company.totalPurchases = Math.max(0, (company.totalPurchases || 0) - (purchase.borrowedAmount || purchase.totalAmount || 0));
        company.currentBalance = Math.max(0, (company.currentBalance || 0) - (purchase.borrowedAmount || 0));
      }
      company.totalPayments = Math.max(0, (company.totalPayments || 0) - (purchase.paidNow || purchase.givenOnSpot || 0));
    }

    // Revert wholesale party balance if this entry cut their Dana
    const cutToRevert = Number(purchase.partyCutAmount || purchase.udhaarReceiveAmount || 0);
    if (purchase.partyId && cutToRevert > 0) {
      const party = db.parties.find((p: any) => p.id === purchase.partyId);
      if (party) {
        party.totalReceived = Math.max(0, (party.totalReceived || 0) - cutToRevert);
        party.currentBalance = (party.currentBalance || 0) + cutToRevert;
      }
    }

    // Also remove any linked payment in db.payments
    const payIdx = db.payments.findIndex((p: any) => p.purchaseId === purchase.id || p.id === `pay-pur-${purchase.id}` || p.id === `pay-pur-${cleanPurId}`);
    if (payIdx !== -1) {
      db.payments.splice(payIdx, 1);
    }

    db.purchases.splice(purIndex, 1);
    saveDb(db);
    res.json({ success: true, message: 'Purchase record deleted and balances reversed successfully', data: purchase });
  });

  // 7. RECORD SALES (Wholesale Big Parties & Retail Local Khatas)
  app.get('/api/sales', (req, res) => {
    const db = loadDb();
    res.json({ success: true, data: db.sales });
  });

  app.post('/api/sales', (req, res) => {
    const db = loadDb();
    const {
      saleType, // 'WHOLESALE' or 'RETAIL'
      partyId,
      itemId,
      quantityBags,
      ratePerBag,
      discount,
      paidAmount,
      borrowedLana,
      paidSpot,
      vehicleNumber,
      driverName,
      date,
      notes
    } = req.body;

    const isWholesale = saleType === 'WHOLESALE';
    let customerOrParty: any = null;

    if (isWholesale) {
      customerOrParty = db.parties.find((p: any) => p.id === partyId);
    } else {
      customerOrParty = db.customers.find((c: any) => c.id === partyId);
    }

    if (!customerOrParty) {
      return res.status(400).json({ success: false, error: 'Customer / Party not found' });
    }

    let item = db.items.find((i: any) => i.id === itemId);
    if (!item && db.items.length > 0) {
      item = db.items[0];
    }
    const itemName = item ? item.name : 'Feed Sale';

    const qty = Number(quantityBags) || 0;
    const rate = Number(ratePerBag) || 0;
    const disc = Number(discount) || 0;

    const lanaAmount = Number(borrowedLana) || 0;
    const spotAmount = Number(paidAmount) || Number(paidSpot) || 0;

    const totalAmount = Number(req.body.totalAmount) || Math.max(lanaAmount, spotAmount) || (qty * rate) || 0;
    const netAmount = Math.max(0, totalAmount - disc);
    const paid = spotAmount;

    // Normal transactions add borrowedLana to Lana udhaar.
    // Spot payments (paidSpot) do NOT cut existing Lana udhaar!
    const remainingBalance = lanaAmount > 0 ? Math.max(0, lanaAmount - disc) : 0;
    const oldBalance = customerOrParty.currentBalance || 0;
    const newBalance = oldBalance + remainingBalance;
    const balanceDelta = remainingBalance;

    // Check stock if qty > 0
    let newStock = item ? (item.stockBags || 0) : 0;
    if (item && qty > 0) {
      newStock = (item.stockBags || 0) - qty;
      item.stockBags = newStock;
    }

    const invoicePrefix = isWholesale ? 'INV-WS-' : 'INV-RET-';
    const invoiceNumber = `${invoicePrefix}${Math.floor(1000 + Math.random() * 9000)}`;

    const newSale = {
      id: 'sale-' + Date.now(),
      saleType,
      partyId,
      partyName: customerOrParty.name,
      customerPhone: customerOrParty.phone,
      itemId: item ? item.id : 'gen-sale',
      itemName,
      quantityBags: qty,
      ratePerBag: rate,
      totalAmount,
      discount: disc,
      netAmount,
      borrowedLana: lanaAmount,
      paidSpot: spotAmount,
      paidAmount: paid,
      remainingBalance,
      balanceDelta,
      customerBalanceAfter: newBalance,
      vehicleNumber: vehicleNumber || (isWholesale ? 'Truck/Pickup' : 'Counter/Rickshaw'),
      driverName: driverName || '',
      date: date || new Date().toISOString().split('T')[0],
      invoiceNumber,
      notes: notes || (lanaAmount > 0 && spotAmount > 0 ? `Borrowed (Lana): Rs. ${lanaAmount.toLocaleString()} | Paid on spot: Rs. ${spotAmount.toLocaleString()}` : lanaAmount > 0 ? `Borrowed (Lana): Rs. ${lanaAmount.toLocaleString()}` : `Paid on spot: Rs. ${spotAmount.toLocaleString()}`)
    };

    db.sales.unshift(newSale);

    // 2. AUTO-UPDATE CUSTOMER / PARTY LEDGER:
    // Normal spot transaction does NOT cut Lana udhaar. Only borrowing (Lana) adds to balance.
    customerOrParty.totalSales = (customerOrParty.totalSales || 0) + (lanaAmount > 0 ? lanaAmount : netAmount);
    customerOrParty.totalReceived = (customerOrParty.totalReceived || 0) + paid;
    customerOrParty.currentBalance = newBalance;

    saveDb(db);
    res.json({
      success: true,
      message: `Sale recorded. ${remainingBalance > 0 ? `Rs. ${remainingBalance.toLocaleString()} added to ${customerOrParty.name} Udhaar/Lana balance.` : `Rs. ${paid.toLocaleString()} paid on spot.`}`,
      data: newSale,
      currentBalance: customerOrParty.currentBalance
    });
  });

  app.delete('/api/sales/:id', (req, res) => {
    const db = loadDb();
    const cleanSaleId = req.params.id.replace(/^pay-sale-/, '');
    const saleIndex = db.sales.findIndex((s: any) => s.id === cleanSaleId || s.id === req.params.id);
    if (saleIndex === -1) return res.status(404).json({ success: false, error: 'Sale record not found' });
    const sale = db.sales[saleIndex];

    // 1. Revert stock
    const item = db.items.find((i: any) => i.id === sale.itemId);
    if (item) {
      item.stockBags = (item.stockBags || 0) + (Number(sale.quantityBags) || 0);
    }

    // 2. Revert party or customer ledger balance
    let entity = db.parties.find((p: any) => p.id === sale.partyId);
    if (!entity) {
      entity = db.customers.find((c: any) => c.id === sale.partyId);
    }
    if (entity) {
      entity.totalSales = Math.max(0, (entity.totalSales || 0) - (Number(sale.borrowedLana || sale.netAmount) || 0));
      entity.totalReceived = Math.max(0, (entity.totalReceived || 0) - (Number(sale.paidAmount || sale.paidSpot) || 0));
      entity.currentBalance = Math.max(0, (entity.currentBalance || 0) - (Number(sale.borrowedLana) || 0));
    }

    db.sales.splice(saleIndex, 1);
    saveDb(db);
    res.json({
      success: true,
      message: `Sale record ${sale.invoiceNumber || sale.id} deleted. Stock restored by ${sale.quantityBags} bags.`,
      data: sale
    });
  });

  // 8. DIRECT PAYMENTS (Us to Company, or Customer to Us)
  app.get('/api/payments', (req, res) => {
    const db = loadDb();
    res.json({ success: true, data: db.payments });
  });

  app.post('/api/payments', (req, res) => {
    const db = loadDb();
    const {
      type, // 'PAYMENT_TO_COMPANY' or 'PAYMENT_FROM_CUSTOMER'
      targetId,
      amount,
      paymentMethod,
      referenceNumber,
      date,
      notes
    } = req.body;

    const amt = Number(amount) || 0;
    if (amt <= 0) return res.status(400).json({ success: false, error: 'Amount must be greater than 0' });

    if (type === 'PAYMENT_TO_COMPANY') {
      const company = db.companies.find((c: any) => c.id === targetId);
      if (!company) return res.status(400).json({ success: false, error: 'Company not found' });

      const newPayment = {
        id: 'pay-' + Date.now(),
        type,
        companyId: company.id,
        companyName: company.name,
        amount: amt,
        paymentMethod: paymentMethod || 'Bank Transfer',
        referenceNumber: referenceNumber || `REF-${Math.floor(10000 + Math.random() * 90000)}`,
        date: date || new Date().toISOString().split('T')[0],
        notes: notes || ''
      };

      db.payments.unshift(newPayment);

      // Deduct from our payable to factory (cuts Dana)
      company.totalPayments = (company.totalPayments || 0) + amt;
      company.currentBalance = Math.max(0, (company.currentBalance || 0) - amt);

      saveDb(db);
      return res.json({
        success: true,
        message: `Payment of Rs. ${amt} recorded to ${company.name}. Remaining payable is now Rs. ${company.currentBalance}.`,
        data: newPayment
      });
    } else {
      // PAYMENT_FROM_CUSTOMER: Could be party or retail customer
      let entity: any = db.parties.find((p: any) => p.id === targetId);
      let partyType = 'WHOLESALE_DEALER';
      if (!entity) {
        entity = db.customers.find((c: any) => c.id === targetId);
        partyType = 'RETAIL_CUSTOMER';
      }

      if (!entity) return res.status(400).json({ success: false, error: 'Party or Customer not found' });

      const newPayment = {
        id: 'pay-' + Date.now(),
        type,
        partyId: entity.id,
        partyName: entity.name,
        partyType,
        amount: amt,
        paymentMethod: paymentMethod || 'Cash',
        referenceNumber: referenceNumber || `REC-${Math.floor(10000 + Math.random() * 90000)}`,
        date: date || new Date().toISOString().split('T')[0],
        notes: notes || ''
      };

      db.payments.unshift(newPayment);

      // Deduct from customer's receivable balance (cuts Lana Udhaar)
      entity.totalReceived = (entity.totalReceived || 0) + amt;
      entity.currentBalance = Math.max(0, (entity.currentBalance || 0) - amt);

      saveDb(db);
      return res.json({
        success: true,
        message: `Payment of Rs. ${amt} received from ${entity.name}. Remaining balance is now Rs. ${entity.currentBalance}.`,
        data: newPayment
      });
    }
  });

  app.delete('/api/payments/:id', (req, res) => {
    const db = loadDb();
    const cleanId = req.params.id.replace(/^pay-(sale|pur)-/, '');
    const payIndex = db.payments.findIndex((p: any) => p.id === req.params.id || p.id === cleanId);
    if (payIndex === -1) {
      // Check if this was a spot payment entry for a sale
      const saleIndex = db.sales.findIndex((s: any) => s.id === cleanId || s.id === req.params.id);
      if (saleIndex !== -1) {
        const sale = db.sales[saleIndex];
        const item = db.items.find((i: any) => i.id === sale.itemId);
        if (item) item.stockBags = (item.stockBags || 0) + (Number(sale.quantityBags) || 0);
        let entity = db.parties.find((p: any) => p.id === sale.partyId) || db.customers.find((c: any) => c.id === sale.partyId);
        if (entity) {
          entity.totalSales = Math.max(0, (entity.totalSales || 0) - (Number(sale.borrowedLana || sale.netAmount) || 0));
          entity.totalReceived = Math.max(0, (entity.totalReceived || 0) - (Number(sale.paidAmount || sale.paidSpot) || 0));
          entity.currentBalance = Math.max(0, (entity.currentBalance || 0) - (sale.balanceDelta !== undefined ? sale.balanceDelta : (Number(sale.remainingBalance) || 0)));
        }
        db.sales.splice(saleIndex, 1);
        saveDb(db);
        return res.json({ success: true, message: `Sale transaction ${sale.invoiceNumber || sale.id} deleted.`, data: sale });
      }

      // Check if this was a spot payment entry for a purchase
      const purIndex = db.purchases.findIndex((p: any) => p.id === cleanId || p.id === req.params.id);
      if (purIndex !== -1) {
        const purchase = db.purchases[purIndex];
        const item = db.items.find((i: any) => i.id === purchase.itemId);
        if (item && purchase.quantityBags > 0) item.stockBags = Math.max(0, (item.stockBags || 0) - (purchase.quantityBags || 0));
        const company = db.companies.find((c: any) => c.id === purchase.companyId);
        if (company) {
          company.totalPurchases = Math.max(0, (company.totalPurchases || 0) - (purchase.borrowedAmount || purchase.totalAmount || 0));
          company.totalPayments = Math.max(0, (company.totalPayments || 0) - (purchase.paidNow || 0));
          company.currentBalance = Math.max(0, (company.currentBalance || 0) - (purchase.balanceDelta !== undefined ? purchase.balanceDelta : (purchase.balanceAdded || 0)));
        }
        if (purchase.partyId && purchase.partyCutAmount > 0) {
          const party = db.parties.find((p: any) => p.id === purchase.partyId);
          if (party) {
            party.totalReceived = Math.max(0, (party.totalReceived || 0) - purchase.partyCutAmount);
            party.currentBalance = (party.currentBalance || 0) + purchase.partyCutAmount;
          }
        }
        db.purchases.splice(purIndex, 1);
        saveDb(db);
        return res.json({ success: true, message: `Purchase transaction ${purchase.biltyNumber || purchase.id} deleted.`, data: purchase });
      }

      return res.status(404).json({ success: false, error: 'Payment or linked transaction not found' });
    }
    const payment = db.payments[payIndex];

    if (payment.type === 'PAYMENT_TO_COMPANY') {
      const company = db.companies.find((c: any) => c.id === payment.companyId);
      if (company) {
        company.totalPayments = Math.max(0, (company.totalPayments || 0) - (payment.amount || 0));
        company.currentBalance = (company.currentBalance || 0) + (payment.amount || 0);
      }
    } else {
      let entity = db.parties.find((p: any) => p.id === payment.partyId) || db.customers.find((c: any) => c.id === payment.partyId);
      if (entity) {
        entity.totalReceived = Math.max(0, (entity.totalReceived || 0) - (payment.amount || 0));
        entity.currentBalance = (entity.currentBalance || 0) + (payment.amount || 0);
      }
    }

    db.payments.splice(payIndex, 1);
    saveDb(db);
    res.json({ success: true, message: 'Payment record deleted successfully', data: payment });
  });

  // 9. THIRD-PARTY DIRECT FACTORY PAYMENTS (Crucial Auto-Balancing Feature)
  // If customer pays money directly into factory's account on our behalf:
  // 1. Deducts that amount from Customer's outstanding balance
  // 2. Deducts that exact amount from our Payable ledger to the Factory
  app.get('/api/third-party-payments', (req, res) => {
    const db = loadDb();
    res.json({ success: true, data: db.thirdPartyPayments });
  });

  app.post('/api/third-party-payments', (req, res) => {
    const db = loadDb();
    const {
      customerPartyId,
      companyId,
      amount,
      bankName,
      factoryAccountTitle,
      depositSlipNumber,
      date,
      recordedBy,
      notes
    } = req.body;

    const amt = Number(amount) || 0;
    if (amt <= 0) return res.status(400).json({ success: false, error: 'Amount must be greater than 0' });

    // Find customer (could be wholesale party or retail customer)
    let customer: any = db.parties.find((p: any) => p.id === customerPartyId);
    let partyType = 'WHOLESALE_DEALER';
    if (!customer) {
      customer = db.customers.find((c: any) => c.id === customerPartyId);
      partyType = 'RETAIL_CUSTOMER';
    }
    if (!customer) return res.status(400).json({ success: false, error: 'Customer / Party not found' });

    // Find company / factory
    const company = db.companies.find((c: any) => c.id === companyId);
    if (!company) return res.status(400).json({ success: false, error: 'Factory / Company not found' });

    const newRecord = {
      id: 'tpp-' + Date.now(),
      customerPartyId: customer.id,
      customerName: customer.name,
      partyType,
      companyId: company.id,
      companyName: company.name,
      amount: amt,
      bankName: bankName || 'Bank Deposit / Online Transfer',
      factoryAccountTitle: factoryAccountTitle || company.bankDetails || company.name,
      depositSlipNumber: depositSlipNumber || `SLIP-${Math.floor(10000 + Math.random() * 90000)}`,
      date: date || new Date().toISOString().split('T')[0],
      recordedBy: recordedBy || 'System Admin',
      notes: notes || `Direct payment into ${company.name} on behalf of ${customer.name}`
    };

    db.thirdPartyPayments.unshift(newRecord);

    // ATOMIC DOUBLE-DEDUCTION:
    // 1. Deduct from customer's receivable balance
    customer.totalReceived = (customer.totalReceived || 0) + amt;
    customer.currentBalance = (customer.currentBalance || 0) - amt;

    // 2. Deduct from our payable ledger to the factory
    company.totalPayments = (company.totalPayments || 0) + amt;
    company.currentBalance = (company.currentBalance || 0) - amt;

    saveDb(db);
    res.json({
      success: true,
      message: `Auto-Balancing Completed! Rs. ${amt} was deducted from Customer (${customer.name})'s balance, and simultaneously deducted from our payable to Factory (${company.name}). Both ledgers updated atomically.`,
      data: newRecord
    });
  });

  app.delete('/api/third-party-payments/:id', (req, res) => {
    const db = loadDb();
    const index = db.thirdPartyPayments.findIndex((t: any) => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Third-party payment record not found' });
    const tpp = db.thirdPartyPayments[index];

    // Revert customer balance:
    const customer = db.parties.find((p: any) => p.id === tpp.customerPartyId) || db.customers.find((c: any) => c.id === tpp.customerPartyId);
    if (customer) {
      customer.totalReceived = Math.max(0, (customer.totalReceived || 0) - (tpp.amount || 0));
      customer.currentBalance = (customer.currentBalance || 0) + (tpp.amount || 0);
    }

    // Revert company balance:
    const company = db.companies.find((c: any) => c.id === tpp.companyId);
    if (company) {
      company.totalPayments = Math.max(0, (company.totalPayments || 0) - (tpp.amount || 0));
      company.currentBalance = (company.currentBalance || 0) + (tpp.amount || 0);
    }

    db.thirdPartyPayments.splice(index, 1);
    saveDb(db);
    res.json({ success: true, message: 'Third-party payment deleted successfully', data: tpp });
  });

  // 9b. BRANCH ACCOUNT & PAYMENTS SENT TO COMPANY (User Farooq Gujjar KB or Big Parties)
  app.get('/api/branch-account', (req, res) => {
    const db = loadDb();

    // 1. Live Factory Balance from "factory buy":
    // Spot cash + Direct payments + Udhaar Receive payback + Factory Udhaar (Dana money) + Net CR/DR
    const factorySpotPurchases = (db.purchases || []).reduce(
      (sum: number, p: any) => sum + (Number(p.paidNow) || Number(p.givenOnSpot) || 0),
      0
    );
    const factoryDirectPayments = (db.payments || [])
      .filter((p: any) => p.type === 'PAYMENT_TO_COMPANY')
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const factoryUdhaarReceive = (db.purchases || [])
      .filter((p: any) => p.isUdhaarReceive || Number(p.udhaarReceiveAmount) > 0)
      .reduce((sum: number, p: any) => sum + (Number(p.udhaarReceiveAmount) || Number(p.partyCutAmount) || 0), 0);
    const factoryDanaUdhaar = (db.purchases || [])
      .filter((p: any) => !p.isUdhaarReceive)
      .reduce((sum: number, p: any) => sum + (Number(p.borrowedAmount) || 0), 0);
    const crTotal = (db.companyPayments || [])
      .filter((cp: any) => cp.entryType === 'CR')
      .reduce((sum: number, cp: any) => sum + (Number(cp.amount) || 0), 0);
    const drTotal = (db.companyPayments || [])
      .filter((cp: any) => cp.entryType === 'DR')
      .reduce((sum: number, cp: any) => sum + (Number(cp.amount) || 0), 0);
    // 2. Live User Balance from "wholesale" and "retail khata":
    // Wholesale spot + Retail spot + Customer Payments + Factory Buy Wholesale spot
    const wholesaleSpotCash = (db.sales || [])
      .filter((s: any) => s.saleType === 'WHOLESALE')
      .reduce((sum: number, s: any) => sum + (Number(s.paidAmount) || Number(s.paidSpot) || 0), 0);
    const retailSpotCash = (db.sales || [])
      .filter((s: any) => s.saleType === 'RETAIL')
      .reduce((sum: number, s: any) => sum + (Number(s.paidAmount) || Number(s.paidSpot) || 0), 0);
    const customerPayments = (db.payments || [])
      .filter((p: any) => p.type === 'PAYMENT_FROM_CUSTOMER' && !p.isLinkedToFactoryBuy)
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

    const grossUserCash = wholesaleSpotCash + retailSpotCash + customerPayments;
    const availableUserCash = Math.max(0, grossUserCash - factorySpotPurchases);
    const activeFactoryDana = Math.max(0, factoryDanaUdhaar - factoryDirectPayments);
    const danaCutFromUser = Math.min(availableUserCash, activeFactoryDana);

    const liveCompanyBalance = Math.max(0, factorySpotPurchases + factoryDirectPayments + factoryUdhaarReceive + (crTotal - drTotal) + danaCutFromUser);
    const liveUserBalance = Math.max(0, availableUserCash - danaCutFromUser);

    db.branchAccount = db.branchAccount || {
      userName: 'Farooq Gujjar KB',
      branchName: 'Farooq Gujjar KB (Branch)'
    };
    db.branchAccount.companyBalance = liveCompanyBalance;
    db.branchAccount.userBalance = liveUserBalance;

    res.json({
      success: true,
      data: {
        branchAccount: db.branchAccount,
        companyPayments: db.companyPayments || [],
        companies: db.companies || [],
        parties: db.parties || []
      }
    });
  });

  app.post('/api/branch-account/update-balance', (req, res) => {
    const db = loadDb();
    const { userBalance, companyBalance } = req.body;
    if (typeof userBalance === 'number') {
      db.branchAccount.userBalance = userBalance;
    }
    if (typeof companyBalance === 'number') {
      db.branchAccount.companyBalance = companyBalance;
    }
    saveDb(db);
    res.json({
      success: true,
      message: 'Branch account balances updated successfully.',
      branchAccount: db.branchAccount
    });
  });

  app.get('/api/company-payments', (req, res) => {
    const db = loadDb();
    res.json({
      success: true,
      data: db.companyPayments || [],
      branchAccount: db.branchAccount
    });
  });

  app.post('/api/company-payments', (req, res) => {
    const db = loadDb();
    const {
      entryType, // 'CR' | 'DR'
      amount,
      description,
      referenceNumber,
      date,
      notes
    } = req.body;

    const amt = Number(amount) || 0;
    if (amt <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be greater than zero.' });
    }

    if (entryType === 'CR') {
      db.branchAccount.companyBalance = (db.branchAccount.companyBalance || 0) + amt;
      db.branchAccount.userBalance = (db.branchAccount.userBalance || 0) + amt;
    } else {
      db.branchAccount.companyBalance = Math.max(0, (db.branchAccount.companyBalance || 0) - amt);
      db.branchAccount.userBalance = Math.max(0, (db.branchAccount.userBalance || 0) - amt);
    }

    const newRecord = {
      id: 'cpay-' + Date.now(),
      entryType: entryType || 'CR',
      amount: amt,
      description: description || (entryType === 'CR' ? 'Credit Received / Deposit' : 'Debit Paid / Expense'),
      referenceNumber: referenceNumber || `REF-${Math.floor(10000 + Math.random() * 90000)}`,
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      companyBalanceAfter: db.branchAccount.companyBalance,
      userBalanceAfter: db.branchAccount.userBalance,
      createdAt: new Date().toISOString()
    };

    db.companyPayments.unshift(newRecord);
    saveDb(db);

    return res.json({
      success: true,
      message: `${entryType === 'CR' ? 'Credit (CR)' : 'Debit (DR)'} transaction of Rs. ${amt.toLocaleString()} recorded successfully.`,
      data: newRecord,
      branchAccount: db.branchAccount
    });
  });

  app.delete('/api/company-payments/:id', (req, res) => {
    const db = loadDb();
    const index = db.companyPayments.findIndex((cp: any) => cp.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Transaction record not found' });
    const cp = db.companyPayments[index];

    if (cp.entryType === 'CR') {
      db.branchAccount.companyBalance = Math.max(0, (db.branchAccount.companyBalance || 0) - (cp.amount || 0));
      db.branchAccount.userBalance = Math.max(0, (db.branchAccount.userBalance || 0) - (cp.amount || 0));
    } else {
      db.branchAccount.companyBalance = (db.branchAccount.companyBalance || 0) + (cp.amount || 0);
      db.branchAccount.userBalance = (db.branchAccount.userBalance || 0) + (cp.amount || 0);
    }

    db.companyPayments.splice(index, 1);
    saveDb(db);
    res.json({ success: true, message: 'Transaction record deleted successfully', data: cp });
  });

  // 10. PAST RECORDS & ADVANCED SEARCH
  // Unified history query supporting filters by party, company, vehicle, date range, type
  app.get('/api/history', (req, res) => {
    const db = loadDb();
    const {
      q, // Free text search (truck, party name, company, invoice, slip)
      partyId,
      companyId,
      vehicleNumber,
      startDate,
      endDate,
      transactionType // 'ALL', 'PURCHASE', 'SALE_WHOLESALE', 'SALE_RETAIL', 'PAYMENT', 'THIRD_PARTY'
    } = req.query;

    const allRecords: any[] = [];

    // Purchases
    db.purchases.forEach((p: any) => {
      allRecords.push({
        id: p.id,
        category: 'PURCHASE',
        categoryLabel: 'Factory Purchase',
        date: p.date,
        partyName: p.companyName,
        relatedEntityId: p.companyId,
        itemName: p.itemName,
        quantityBags: p.quantityBags,
        rate: p.ratePerBag,
        amount: p.totalAmount,
        paidOrReceived: p.paidNow,
        vehicleNumber: p.vehicleNumber,
        referenceNumber: p.biltyNumber,
        notes: p.notes,
        status: p.paymentStatus,
        raw: p
      });
    });

    // Sales
    db.sales.forEach((s: any) => {
      const isWs = s.saleType === 'WHOLESALE';
      allRecords.push({
        id: s.id,
        category: isWs ? 'SALE_WHOLESALE' : 'SALE_RETAIL',
        categoryLabel: isWs ? 'Wholesale Big Party Sale' : 'Retail Customer Sale',
        date: s.date,
        partyName: s.partyName,
        relatedEntityId: s.partyId,
        itemName: s.itemName,
        quantityBags: s.quantityBags,
        rate: s.ratePerBag,
        amount: s.netAmount,
        paidOrReceived: s.paidAmount,
        vehicleNumber: s.vehicleNumber,
        referenceNumber: s.invoiceNumber,
        notes: s.notes,
        status: s.remainingBalance > 0 ? 'CREDIT' : 'CLEARED',
        raw: s
      });
    });

    // Direct Payments
    db.payments.forEach((pay: any) => {
      const isToComp = pay.type === 'PAYMENT_TO_COMPANY';
      allRecords.push({
        id: pay.id,
        category: 'PAYMENT',
        categoryLabel: isToComp ? 'Payment to Company' : 'Payment Received from Customer',
        date: pay.date,
        partyName: isToComp ? pay.companyName : pay.partyName,
        relatedEntityId: isToComp ? pay.companyId : pay.partyId,
        itemName: 'Financial Transaction',
        quantityBags: 0,
        rate: 0,
        amount: pay.amount,
        paidOrReceived: pay.amount,
        vehicleNumber: 'N/A',
        referenceNumber: pay.referenceNumber,
        notes: pay.notes ? `${pay.paymentMethod ? pay.paymentMethod + ' - ' : ''}${pay.notes}` : (pay.paymentMethod && pay.paymentMethod !== 'Cash Received at Counter' && pay.paymentMethod !== 'Cash' ? pay.paymentMethod : ''),
        status: 'COMPLETED',
        raw: pay
      });
    });

    // Third-party direct factory payments
    db.thirdPartyPayments.forEach((tpp: any) => {
      allRecords.push({
        id: tpp.id,
        category: 'THIRD_PARTY',
        categoryLabel: 'Third-Party Direct Factory Deposit',
        date: tpp.date,
        partyName: `${tpp.customerName} ➔ ${tpp.companyName}`,
        relatedEntityId: `${tpp.customerPartyId}_${tpp.companyId}`,
        itemName: 'Direct Bank Deposit to Factory',
        quantityBags: 0,
        rate: 0,
        amount: tpp.amount,
        paidOrReceived: tpp.amount,
        vehicleNumber: 'N/A',
        referenceNumber: tpp.depositSlipNumber,
        notes: `Bank: ${tpp.bankName} | Slip: ${tpp.depositSlipNumber} | ${tpp.notes || ''}`,
        status: 'AUTO_BALANCED',
        raw: tpp
      });
    });

    // Company Payments (Farooq Gujjar KB & Big Parties to Company)
    (db.companyPayments || []).forEach((cp: any) => {
      allRecords.push({
        id: cp.id,
        category: 'PAYMENT',
        categoryLabel: cp.senderType === 'USER_FAROOQ'
          ? 'Farooq Gujjar KB ➔ Company Payment'
          : cp.paymentType === 'PARTY_RECEIVABLE'
          ? 'Big Party Receivable ➔ Company'
          : 'Big Party Normal Payment ➔ Company',
        date: cp.date,
        partyName: `${cp.senderName} ➔ ${cp.companyName}`,
        relatedEntityId: cp.partyId || cp.companyId,
        itemName: cp.senderType === 'USER_FAROOQ'
          ? 'Branch Payment to Company'
          : cp.paymentType === 'PARTY_RECEIVABLE'
          ? 'Party Receivable Cleared to Company'
          : 'Party Normal Advance to Company',
        quantityBags: 0,
        rate: 0,
        amount: cp.amount,
        paidOrReceived: cp.amount,
        vehicleNumber: 'N/A',
        referenceNumber: cp.referenceNumber,
        notes: `Method: ${cp.paymentMethod} | Farooq Impact: ${cp.farooqBalanceImpact >= 0 ? '+' : ''}${cp.farooqBalanceImpact} | ${cp.notes || ''}`,
        status: 'CONFIRMED',
        raw: cp
      });
    });

    // Apply filtering
    let filtered = allRecords;

    if (transactionType && transactionType !== 'ALL') {
      filtered = filtered.filter((r) => r.category === transactionType);
    }

    if (companyId) {
      filtered = filtered.filter((r) => r.raw.companyId === companyId);
    }

    if (partyId) {
      filtered = filtered.filter((r) => r.raw.partyId === partyId || r.raw.customerPartyId === partyId);
    }

    if (vehicleNumber) {
      const vQuery = String(vehicleNumber).toLowerCase();
      filtered = filtered.filter((r) => r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(vQuery));
    }

    if (startDate) {
      filtered = filtered.filter((r) => r.date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((r) => r.date <= endDate);
    }

    if (q) {
      const qLower = String(q).toLowerCase();
      filtered = filtered.filter((r) => 
        (r.partyName && r.partyName.toLowerCase().includes(qLower)) ||
        (r.itemName && r.itemName.toLowerCase().includes(qLower)) ||
        (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(qLower)) ||
        (r.referenceNumber && r.referenceNumber.toLowerCase().includes(qLower)) ||
        (r.notes && r.notes.toLowerCase().includes(qLower))
      );
    }

    // Sort descending by date
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      success: true,
      totalCount: filtered.length,
      data: filtered
    });
  });

  // 11. 1-Year Cloud Storage Retention Lifecycle & Maintenance
  app.get('/api/retention/status', (req, res) => {
    const db = loadDb(false);
    const cutoffDate = getRetentionCutoffDate();
    const totalEntriesWithinWindow = 
      (db.purchases?.length || 0) +
      (db.sales?.length || 0) +
      (db.payments?.length || 0) +
      (db.thirdPartyPayments?.length || 0) +
      (db.companyPayments?.length || 0);

    res.json({
      success: true,
      data: {
        active: true,
        retentionDays: RETENTION_DAYS,
        cutoffDate,
        totalEntriesWithinWindow,
        lastPrunedTimestamp: db.meta?.retention?.lastPruneTimestamp || db.meta?.lastSyncTimestamp,
        totalPrunedLifetime: db.meta?.retention?.totalPrunedLifetime || 0,
        collectionBreakdown: {
          purchases: db.purchases?.length || 0,
          sales: db.sales?.length || 0,
          payments: db.payments?.length || 0,
          thirdPartyPayments: db.thirdPartyPayments?.length || 0,
          companyPayments: db.companyPayments?.length || 0
        }
      }
    });
  });

  app.post('/api/retention/run', (req, res) => {
    const db = loadDb(false);
    const result = applyAutoRetentionPolicy(db, true);
    const totalEntriesWithinWindow = 
      (db.purchases?.length || 0) +
      (db.sales?.length || 0) +
      (db.payments?.length || 0) +
      (db.thirdPartyPayments?.length || 0) +
      (db.companyPayments?.length || 0);

    res.json({
      success: true,
      message: result.prunedCount > 0 
        ? `1-Year Data Maintenance: Purged ${result.prunedCount} records older than ${result.cutoffDate} (1 year)`
        : `1-Year Data Maintenance: Storage is clean and optimized. All current records are within the 1-year window (since ${result.cutoffDate}).`,
      prunedCount: result.prunedCount,
      cutoffDate: result.cutoffDate,
      details: result.details,
      status: {
        active: true,
        retentionDays: RETENTION_DAYS,
        cutoffDate: result.cutoffDate,
        totalEntriesWithinWindow,
        lastPrunedTimestamp: db.meta?.retention?.lastPruneTimestamp || new Date().toISOString(),
        totalPrunedLifetime: db.meta?.retention?.totalPrunedLifetime || 0,
        collectionBreakdown: {
          purchases: db.purchases?.length || 0,
          sales: db.sales?.length || 0,
          payments: db.payments?.length || 0,
          thirdPartyPayments: db.thirdPartyPayments?.length || 0,
          companyPayments: db.companyPayments?.length || 0
        }
      }
    });
  });

  // System Database Reset (Fresh Software Setup)
  app.post('/api/system/clear-all', (req, res) => {
    const clean = getInitialData();
    saveDb(clean);
    res.json({ success: true, message: 'All entries and data cleared. Software is now clean and fresh.', data: clean });
  });

  // Backward compatibility alias
  app.post('/api/backup/clear-all', (req, res) => {
    const clean = getInitialData();
    saveDb(clean);
    res.json({ success: true, message: 'All entries and data cleared. Software is now clean and fresh.', data: clean });
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Periodic background retention check every 6 hours
  setInterval(() => {
    try {
      const db = loadDb(false);
      applyAutoRetentionPolicy(db, true);
    } catch (e) {
      console.error('Error running background 1-year retention check:', e);
    }
  }, 1000 * 60 * 60 * 6);

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Animal Feed ERP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
