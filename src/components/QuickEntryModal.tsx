import React from 'react';
import { 
  X, 
  Truck, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: 'PURCHASE' | 'WHOLESALE' | 'RETAIL' | 'PAYMENT' | 'THIRD_PARTY') => void;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'PURCHASE' as const,
      title: 'Factory / Mill Purchase',
      subtitle: 'Borrowing from Factory (Dana) or Money Given on Spot for goods.',
      icon: Truck,
      color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    },
    {
      id: 'WHOLESALE' as const,
      title: 'Wholesale Big Party Entry',
      subtitle: 'Money Borrowed by Dealer (Lana / Udhaar) or Paid on Spot.',
      icon: Users,
      color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    },
    {
      id: 'RETAIL' as const,
      title: 'Retail Farmer Counter Sale',
      subtitle: 'Money Borrowed by Customer (Lana / Udhaar) or Paid on Spot.',
      icon: ShoppingBag,
      color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    },
    {
      id: 'THIRD_PARTY' as const,
      title: 'Company Payment (Farooq or Big Party)',
      subtitle: 'Send payment to Head Company from Farooq Gujjar KB or Wholesale Big Party with automatic balance calculations.',
      icon: CreditCard,
      color: 'bg-indigo-600 text-white border-indigo-700'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl relative my-auto max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Create New ERP Transaction</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Select an entry type to launch the appropriate transaction module:
        </p>

        <div className="space-y-2.5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  onSelectAction(act.id);
                  onClose();
                }}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl flex items-center gap-3.5 text-left transition-colors group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${act.color} shadow-xs`}>
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {act.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
                    {act.subtitle}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
