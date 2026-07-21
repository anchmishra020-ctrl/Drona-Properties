/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calculator, RefreshCw, Copy, BookOpen, Check, HelpCircle, FileText } from 'lucide-react';
import { safeStorage } from '../services/storage';

interface AreaCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

type AreaUnit = 'sqft' | 'sqm' | 'hectare' | 'acre' | 'bigha' | 'biswa' | 'sqyard';

interface ConversionFactors {
  sqft: number; // base unit: square feet
  sqm: number;
  hectare: number;
  acre: number;
  bigha: number;
  biswa: number;
  sqyard: number;
}

const UNIT_LABELS: Record<AreaUnit, string> = {
  sqft: 'Square Feet (Sq.Ft.)',
  sqm: 'Square Meters (Sq.M.)',
  hectare: 'Hectares (Ha.)',
  acre: 'Acres (Ac.)',
  bigha: 'Bigha (UP/Standard)',
  biswa: 'Biswa',
  sqyard: 'Square Yards (Gaj)',
};

// Standard conversion factors to Sq.Ft.
const TO_SQFT_FACTORS: Record<AreaUnit, number> = {
  sqft: 1,
  sqm: 10.76391,
  hectare: 107639.1,
  acre: 43560,
  bigha: 27000, // Standard UP Bigha
  biswa: 1350,  // UP Biswa (1/20 of Bigha)
  sqyard: 9,
};

export default function AreaCalculatorModal({ isOpen, onClose, username }: AreaCalculatorModalProps) {
  const [inputValue, setInputValue] = useState<string>('1');
  const [inputUnit, setInputUnit] = useState<AreaUnit>('bigha');
  
  // Rate & Valuation fields
  const [rateValue, setRateValue] = useState<string>('150000');
  const [rateUnit, setRateUnit] = useState<AreaUnit>('bigha');
  const [stampDutyPercent, setStampDutyPercent] = useState<string>('6');
  const [registrationPercent, setRegistrationPercent] = useState<string>('1');
  
  // UI states
  const [copied, setCopied] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  // Conversion table results
  const [conversions, setConversions] = useState<Record<AreaUnit, number>>({
    sqft: 0,
    sqm: 0,
    hectare: 0,
    acre: 0,
    bigha: 0,
    biswa: 0,
    sqyard: 0,
  });

  // Calculate conversions
  useEffect(() => {
    const val = parseFloat(inputValue) || 0;
    const baseSqft = val * TO_SQFT_FACTORS[inputUnit];

    const results = {} as Record<AreaUnit, number>;
    (Object.keys(TO_SQFT_FACTORS) as AreaUnit[]).forEach((unit) => {
      results[unit] = baseSqft / TO_SQFT_FACTORS[unit];
    });

    setConversions(results);
    setNoteSaved(false);
  }, [inputValue, inputUnit]);

  // Pricing calculations
  const totalSqft = (parseFloat(inputValue) || 0) * TO_SQFT_FACTORS[inputUnit];
  const ratePerSqft = (parseFloat(rateValue) || 0) / TO_SQFT_FACTORS[rateUnit];
  
  const baseLandValue = totalSqft * ratePerSqft;
  const stampDutyCost = baseLandValue * ((parseFloat(stampDutyPercent) || 0) / 100);
  const registrationCost = baseLandValue * ((parseFloat(registrationPercent) || 0) / 100);
  const totalAcquisitionCost = baseLandValue + stampDutyCost + registrationCost;

  const handleCopySummary = () => {
    const textSummary = `--- TerraLink Property Valuation Quote ---
User Agent: ${username}
Calculated on: ${new Date().toLocaleString()}

Input Land Details:
- Area: ${inputValue} ${UNIT_LABELS[inputUnit]}
- Rate: ₹${parseFloat(rateValue).toLocaleString('en-IN')} per ${UNIT_LABELS[rateUnit]}

Area Conversions:
- Square Feet: ${conversions.sqft.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Sq.Ft.
- Square Meters: ${conversions.sqm.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Sq.M.
- Bigha: ${conversions.bigha.toLocaleString('en-IN', { maximumFractionDigits: 3 })} Bigha
- Hectares: ${conversions.hectare.toLocaleString('en-IN', { maximumFractionDigits: 4 })} Ha
- Acres: ${conversions.acre.toLocaleString('en-IN', { maximumFractionDigits: 3 })} Ac

Financial Breakdowns:
- Base Land Value: ₹${Math.round(baseLandValue).toLocaleString('en-IN')}
- Stamp Duty (${stampDutyPercent}%): ₹${Math.round(stampDutyCost).toLocaleString('en-IN')}
- Registration Fee (${registrationPercent}%): ₹${Math.round(registrationCost).toLocaleString('en-IN')}
- Total Estimated Cost: ₹${Math.round(totalAcquisitionCost).toLocaleString('en-IN')}
------------------------------------------`;

    navigator.clipboard.writeText(textSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToNotes = () => {
    try {
      const storageKey = `terralink_notes_${username.toLowerCase()}`;
      const savedNotes = safeStorage.getItem(storageKey);
      const notesList = savedNotes ? JSON.parse(savedNotes) : [];

      const textSummary = `🏡 Valuation Quote: ${inputValue} ${UNIT_LABELS[inputUnit]}
• Base Land: ₹${Math.round(baseLandValue).toLocaleString('en-IN')} (₹${parseFloat(rateValue).toLocaleString('en-IN')} per ${UNIT_LABELS[rateUnit]})
• Stamp Duty (${stampDutyPercent}%): ₹${Math.round(stampDutyCost).toLocaleString('en-IN')}
• Registration (${registrationPercent}%): ₹${Math.round(registrationCost).toLocaleString('en-IN')}
• Total Acquisition: ₹${Math.round(totalAcquisitionCost).toLocaleString('en-IN')}
• Conversions: ${conversions.bigha.toFixed(2)} Bigha | ${conversions.hectare.toFixed(3)} Ha | ${conversions.sqft.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Sq.Ft.`;

      const newNote = {
        id: `note-calc-${Date.now()}`,
        content: textSummary,
        createdAt: new Date().toISOString(),
      };

      notesList.unshift(newNote);
      safeStorage.setItem(storageKey, JSON.stringify(notesList));
      setNoteSaved(true);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl border border-natural-border shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden text-natural-text max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 bg-[#F2EDE7] border-b border-natural-border flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-natural-sage text-white rounded-xl flex items-center justify-center shadow-xs">
                <Calculator className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold text-natural-title">Area Converter &amp; Valuation Tool</h3>
                <p className="text-[10px] text-natural-muted font-bold uppercase tracking-wider">
                  Registry Calculator • Land Unit Converter • Stamp Duty Estimator
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-natural-bg text-natural-muted hover:text-natural-title border border-natural-border flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dual Panel Body */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-natural-bg">
            
            {/* Left Column: Input Form & Unit Conversions (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Box 1: Inputs */}
              <div className="p-5 bg-white rounded-2xl border border-natural-border shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-natural-title uppercase tracking-wider border-b border-natural-border pb-2.5">
                  1. Enter Land Specifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Land Area */}
                  <div>
                    <label className="block text-[11px] font-semibold text-natural-muted mb-1.5">
                      Land Area Size
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full px-3 py-2 bg-natural-bg border border-natural-border rounded-xl text-xs text-natural-title focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
                      />
                    </div>
                  </div>

                  {/* Input Unit Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-natural-muted mb-1.5">
                      Selected Unit
                    </label>
                    <select
                      value={inputUnit}
                      onChange={(e) => setInputUnit(e.target.value as AreaUnit)}
                      className="w-full px-3 py-2 bg-natural-bg border border-natural-border rounded-xl text-xs text-natural-title focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
                    >
                      {Object.entries(UNIT_LABELS).map(([unit, label]) => (
                        <option key={unit} value={unit}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Rate value */}
                  <div>
                    <label className="block text-[11px] font-semibold text-natural-muted mb-1.5">
                      Rate / Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={rateValue}
                      onChange={(e) => setRateValue(e.target.value)}
                      className="w-full px-3 py-2 bg-natural-bg border border-natural-border rounded-xl text-xs text-natural-title focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
                    />
                  </div>

                  {/* Rate Unit */}
                  <div>
                    <label className="block text-[11px] font-semibold text-natural-muted mb-1.5">
                      Rate Per Unit
                    </label>
                    <select
                      value={rateUnit}
                      onChange={(e) => setRateUnit(e.target.value as AreaUnit)}
                      className="w-full px-3 py-2 bg-natural-bg border border-natural-border rounded-xl text-xs text-natural-title focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
                    >
                      {Object.entries(UNIT_LABELS).map(([unit, label]) => (
                        <option key={unit} value={unit}>Per {label.split(' ')[0]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Box 2: Conversion Table */}
              <div className="p-5 bg-white rounded-2xl border border-natural-border shadow-xs">
                <div className="flex justify-between items-center mb-3 border-b border-natural-border pb-2.5">
                  <h4 className="text-xs font-bold text-natural-title uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-natural-sage" />
                    2. Regional Unit Conversions
                  </h4>
                  <span className="text-[10px] bg-natural-panel text-natural-muted px-2 py-0.5 rounded-md border border-natural-border font-mono">
                    Base: {parseFloat(inputValue) || 0} {inputUnit.toUpperCase()}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-natural-border text-[10px] text-natural-muted uppercase font-bold tracking-wider">
                        <th className="py-2">Standard Unit</th>
                        <th className="py-2 text-right">Equivalent Area Value</th>
                        <th className="py-2 text-right">Unit Ratio (to {inputUnit})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-natural-border/50 text-natural-title font-medium">
                      {(Object.keys(UNIT_LABELS) as AreaUnit[]).map((unit) => {
                        const isCurrent = unit === inputUnit;
                        return (
                          <tr key={unit} className={`hover:bg-natural-bg/40 transition-colors ${isCurrent ? 'bg-[#E6EDD8]/45 text-natural-sage font-semibold' : ''}`}>
                            <td className="py-2.5 flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-natural-sage animate-pulse' : 'bg-natural-subtle/55'}`} />
                              {UNIT_LABELS[unit]}
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold">
                              {conversions[unit].toLocaleString('en-IN', {
                                maximumFractionDigits: unit === 'hectare' ? 4 : unit === 'bigha' || unit === 'acre' ? 3 : 2
                              })}
                            </td>
                            <td className="py-2.5 text-right font-mono text-natural-muted text-[10px]">
                              {(TO_SQFT_FACTORS[inputUnit] / TO_SQFT_FACTORS[unit]).toLocaleString('en-IN', {
                                maximumFractionDigits: 5
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Cost Valuation & Share Actions (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Box 3: Stamp Duty & Registration Configuration */}
              <div className="p-5 bg-white rounded-2xl border border-natural-border shadow-xs space-y-3.5">
                <h4 className="text-xs font-bold text-natural-title uppercase tracking-wider border-b border-natural-border pb-2.5">
                  3. Duty &amp; Registration Rates
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-natural-muted font-medium mb-1">
                      Stamp Duty Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={stampDutyPercent}
                      onChange={(e) => setStampDutyPercent(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-natural-bg border border-natural-border rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-natural-muted font-medium mb-1">
                      Registration Fee (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={registrationPercent}
                      onChange={(e) => setRegistrationPercent(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-natural-bg border border-natural-border rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Box 4: Total Land Valuation Report (PREMIUM TICKET LOOK) */}
              <div className="bg-[#FAF8F5] rounded-2xl border border-[#EBE3D9] overflow-hidden shadow-sm flex flex-col relative">
                {/* Visual design element: paper cuts */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-natural-sage" />

                <div className="p-5 pt-7 space-y-4">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-natural-sage uppercase tracking-widest leading-none mb-1.5">
                      Official Cost Estimate
                    </p>
                    <h5 className="font-serif text-2xl font-bold text-natural-title">
                      ₹{Math.round(totalAcquisitionCost).toLocaleString('en-IN')}
                    </h5>
                    <p className="text-[10px] text-natural-muted mt-1 font-sans italic">
                      Total Project Acquisition Cost
                    </p>
                  </div>

                  <div className="border-t border-dashed border-[#DCD3C7] pt-3.5 space-y-2.5 text-xs text-natural-title font-medium">
                    <div className="flex justify-between">
                      <span className="text-natural-muted font-normal">Base Land Cost:</span>
                      <span className="font-mono">₹{Math.round(baseLandValue).toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-natural-muted font-normal">Stamp Duty ({stampDutyPercent}%):</span>
                      <span className="font-mono text-natural-clay">₹{Math.round(stampDutyCost).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-natural-muted font-normal">Registration Fee ({registrationPercent}%):</span>
                      <span className="font-mono text-natural-clay">₹{Math.round(registrationCost).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="border-t border-dashed border-[#DCD3C7] pt-3 flex justify-between font-bold text-sm">
                      <span className="text-natural-title">Estimated Total:</span>
                      <span className="font-serif text-natural-sage-dark">₹{Math.round(totalAcquisitionCost).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Footnote */}
                  <div className="text-[9px] text-natural-subtle bg-white/50 border border-[#E6DDD1] p-2.5 rounded-xl leading-relaxed">
                    * Conversion factors are calculated based on standard North Indian land measurements (1 Bigha = 27,000 Sq.Ft.). Exact state rates may vary slightly.
                  </div>
                </div>

                {/* Report Actions */}
                <div className="bg-[#F2EDE7] border-t border-[#E6DED4] p-4 flex gap-2">
                  <button
                    onClick={handleCopySummary}
                    className="flex-1 py-2 bg-white hover:bg-natural-bg text-natural-title text-xs font-semibold rounded-xl border border-[#D9D1C5] transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Quote
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSaveToNotes}
                    className="flex-1 py-2 bg-natural-sage hover:bg-natural-sage-dark text-white text-xs font-semibold rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    disabled={noteSaved}
                  >
                    {noteSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Saved in Notes
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-3.5 h-3.5" />
                        Save to Notes
                      </>
                    )}
                  </button>
                </div>
              </div>
              
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
