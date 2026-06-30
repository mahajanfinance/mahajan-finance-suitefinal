import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { banks, bankCategoryLabels, type Bank } from "@/data/banks";

const BankSelector = () => {
  const [selectedBank, setSelectedBank] = useState("");
  const [customBank, setCustomBank] = useState("");

  // Group banks by category for the dropdown
  const groupedBanks = banks.reduce((acc, bank) => {
    if (!acc[bank.category]) {
      acc[bank.category] = [];
    }
    acc[bank.category].push(bank);
    return acc;
  }, {} as Record<string, Bank[]>);

  // Sort categories to ensure "Other" is always at the bottom
  const categoryOrder = ["government", "private", "small_finance", "payments", "nbfc", "cooperative", "other"];

  return (
    <div className="w-full max-w-md space-y-4 font-sans">
      
      {/* Bank Dropdown Select */}
      <div className="space-y-1.5">
        <label htmlFor="bank-select" className="block text-sm font-bold text-slate-700">
          Select Bank / NBFC
        </label>
        <div className="relative">
          <select
            id="bank-select"
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:bg-white transition-all cursor-pointer pr-10"
          >
            <option value="" disabled>
              -- Choose your bank --
            </option>
            
            {categoryOrder.map((catKey) => {
              if (!groupedBanks[catKey]) return null;
              return (
                <optgroup key={catKey} label={bankCategoryLabels[catKey]}>
                  {groupedBanks[catKey].map((bank) => (
                    <option key={bank.name} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          {/* Custom Dropdown Arrow */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      </div>

      {/* Conditional Input for "Other" */}
      {selectedBank === "Other (Enter Bank Name)" && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <label htmlFor="custom-bank" className="block text-sm font-bold text-slate-700">
            Enter Bank / NBFC Name
          </label>
          <Input
            type="text"
            placeholder="Enter Bank / NBFC Name"
            value={customBank}
            onChange={(e) => setCustomBank(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default BankSelector;