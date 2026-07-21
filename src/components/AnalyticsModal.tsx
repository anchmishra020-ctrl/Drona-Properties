/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, Landmark, MapPin, Shield, Layers, HelpCircle, AlertCircle, PieChart, BarChart2 } from 'lucide-react';
import { Property } from '../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
}

export default function AnalyticsModal({ isOpen, onClose, properties }: AnalyticsModalProps) {
  // Helper to parse price string to number
  const parsePrice = (priceStr: string): number => {
    const numbersOnly = priceStr.replace(/[^0-9]/g, '');
    const num = parseInt(numbersOnly, 10);
    return isNaN(num) ? 0 : num;
  };

  // Helper to parse area string (e.g. "4.5 Bigha" or "10763 Sq Ft" or "2")
  const parseAreaNumber = (areaStr: string): number => {
    const match = areaStr.match(/[\d.]+/);
    if (!match) return 1;
    const num = parseFloat(match[0]);
    return isNaN(num) ? 1 : num;
  };

  // Compute portfolio stats
  const totalCount = properties.length;
  const portfolioValue = properties.reduce((sum, p) => sum + parsePrice(p.price), 0);
  const avgPrice = totalCount > 0 ? portfolioValue / totalCount : 0;

  const statusCounts = properties.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    { Available: 0, Sold: 0, Hold: 0 } as Record<Property['status'], number>
  );

  // Village list & count
  const villageCounts = properties.reduce((acc, p) => {
    const v = p.village.trim();
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedVillages = Object.entries(villageCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // top 5

  // Average price per village
  const villagePrices = properties.reduce((acc, p) => {
    const v = p.village.trim();
    if (!acc[v]) acc[v] = { total: 0, count: 0 };
    acc[v].total += parsePrice(p.price);
    acc[v].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const sortedVillageAvg = Object.entries(villagePrices)
    .map(([name, data]) => ({ name, avg: data.total / data.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  // Price Distribution buckets
  const priceRanges = [
    { label: 'Under ₹10 Lakhs', min: 0, max: 1000000, count: 0 },
    { label: '₹10L - ₹50 Lakhs', min: 1000000, max: 5000000, count: 0 },
    { label: '₹50L - ₹1 Crore', min: 5000000, max: 10000000, count: 0 },
    { label: 'Over ₹1 Crore', min: 10000000, max: Infinity, count: 0 },
  ];

  properties.forEach((p) => {
    const price = parsePrice(p.price);
    for (const range of priceRanges) {
      if (price >= range.min && price < range.max) {
        range.count += 1;
        break;
      }
    }
  });

  // Calculate highest and lowest properties
  let highestProperty: Property | null = null;
  let lowestProperty: Property | null = null;
  let highestVal = -Infinity;
  let lowestVal = Infinity;

  properties.forEach((p) => {
    const val = parsePrice(p.price);
    if (val > highestVal) {
      highestVal = val;
      highestProperty = p;
    }
    if (val < lowestVal && val > 0) {
      lowestVal = val;
      lowestProperty = p;
    }
  });

  if (!isOpen) return null;

  // Custom SVG donut chart calculations for Status Distribution
  const totalStatus = statusCounts.Available + statusCounts.Sold + statusCounts.Hold;
  let currentAngle = 0;
  const donutSegments = [
    { label: 'Available', count: statusCounts.Available, color: '#5C634D', fill: '#E6EDD8' },
    { label: 'Sold', count: statusCounts.Sold, color: '#8C847F', fill: '#F2EDE7' },
    { label: 'Hold', count: statusCounts.Hold, color: '#A3836B', fill: '#F8F3EE' },
  ].filter((s) => s.count > 0);

  // Max value in village counts for scaling bars
  const maxVillageCount = sortedVillages.length > 0 ? Math.max(...sortedVillages.map((v) => v.count)) : 1;
  const maxVillageAvgPrice = sortedVillageAvg.length > 0 ? Math.max(...sortedVillageAvg.map((v) => v.avg)) : 1;

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

        {/* Modal container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl border border-natural-border shadow-2xl w-full max-w-5xl relative z-10 overflow-hidden text-natural-text max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 bg-[#F2EDE7] border-b border-natural-border flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-natural-sage text-white rounded-xl flex items-center justify-center shadow-xs">
                <TrendingUp className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold text-natural-title">Inventory Analytics &amp; Visual Insights</h3>
                <p className="text-[10px] text-natural-muted font-bold uppercase tracking-wider">
                  Visual Dashboard • Distribution Metrics • Market Valuation Analytics
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

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-natural-bg space-y-6">
            {totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-natural-border rounded-2xl p-8">
                <AlertCircle className="w-12 h-12 text-natural-subtle mb-3" />
                <h4 className="text-base font-serif font-semibold text-natural-title">No Inventory Data Available</h4>
                <p className="text-xs text-natural-muted mt-1 max-w-xs">
                  Add at least 1 property to view interactive visual statistics, charts, and metrics dashboard.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Quick Stats Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Portfolio Value */}
                  <div className="bg-white p-4.5 rounded-2xl border border-natural-border shadow-2xs flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">
                      Portfolio Value
                    </p>
                    <h4 className="text-xl font-serif font-semibold text-natural-title leading-tight">
                      ₹{portfolioValue.toLocaleString('en-IN')}
                    </h4>
                    <p className="text-[10px] text-natural-sage font-medium mt-1.5 flex items-center gap-1">
                      <Landmark className="w-3 h-3" /> Cumulative inventory cost
                    </p>
                  </div>

                  {/* Avg Property Cost */}
                  <div className="bg-white p-4.5 rounded-2xl border border-natural-border shadow-2xs flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">
                      Avg. Unit Price
                    </p>
                    <h4 className="text-xl font-serif font-semibold text-natural-title leading-tight">
                      ₹{Math.round(avgPrice).toLocaleString('en-IN')}
                    </h4>
                    <p className="text-[10px] text-natural-muted font-medium mt-1.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-natural-sage" /> Average rate of properties
                    </p>
                  </div>

                  {/* Highest Valuation */}
                  <div className="bg-white p-4.5 rounded-2xl border border-natural-border shadow-2xs flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">
                      Highest Price Tag
                    </p>
                    <h4 className="text-xl font-serif font-semibold text-natural-title leading-tight truncate" title={highestProperty ? (highestProperty as Property).name : ''}>
                      {highestProperty ? (highestProperty as Property).price : '₹0'}
                    </h4>
                    <p className="text-[10px] text-natural-muted truncate mt-1.5">
                      🏆 {highestProperty ? (highestProperty as Property).name : 'None'}
                    </p>
                  </div>

                  {/* Total Unique Villages */}
                  <div className="bg-white p-4.5 rounded-2xl border border-natural-border shadow-2xs flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">
                      Territorial Reach
                    </p>
                    <h4 className="text-xl font-serif font-semibold text-natural-title leading-tight">
                      {Object.keys(villageCounts).length} Villages
                    </h4>
                    <p className="text-[10px] text-natural-muted mt-1.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-natural-sage" /> Unique registry regions
                    </p>
                  </div>
                </div>

                {/* 2. Visual Charts Row (Grid of 2) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Status Donut Card */}
                  <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-xs flex flex-col">
                    <h4 className="text-xs font-bold text-natural-title uppercase tracking-wider mb-4 border-b border-natural-border pb-2.5 flex items-center gap-1.5">
                      <PieChart className="w-4 h-4 text-natural-sage" />
                      Property Status Share
                    </h4>

                    <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                      {/* SVG Pie Chart */}
                      <div className="relative w-36 h-36">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                          {totalStatus > 0 && donutSegments.map((seg, i) => {
                            // Calculate percentage stroke offset
                            const percentage = (seg.count / totalStatus) * 100;
                            const strokeDasharray = `${percentage} ${100 - percentage}`;
                            const strokeDashoffset = -currentAngle;
                            currentAngle += percentage;
                            return (
                              <circle
                                key={seg.label}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                stroke={seg.color}
                                strokeWidth="16"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-500 hover:stroke-[18] cursor-pointer"
                                title={`${seg.label}: ${seg.count} properties`}
                              />
                            );
                          })}
                          {/* Inner center punch for Donut style */}
                          <circle cx="50" cy="50" r="28" fill="white" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-serif font-bold text-natural-title">{totalCount}</span>
                          <span className="text-[9px] font-bold text-natural-muted uppercase tracking-wider">Total</span>
                        </div>
                      </div>

                      {/* Legends with detail percentage */}
                      <div className="space-y-2.5 flex-1 w-full max-w-[200px]">
                        {donutSegments.map((seg) => {
                          const pct = totalStatus > 0 ? ((seg.count / totalStatus) * 100).toFixed(1) : '0.0';
                          return (
                            <div key={seg.label} className="flex justify-between items-center text-xs font-medium">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-md" style={{ backgroundColor: seg.color }} />
                                <span className="text-natural-title font-semibold">{seg.label}</span>
                              </div>
                              <span className="text-natural-muted font-mono">
                                {seg.count} ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Village Distribution Bar Chart */}
                  <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-xs flex flex-col">
                    <h4 className="text-xs font-bold text-natural-title uppercase tracking-wider mb-4 border-b border-natural-border pb-2.5 flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-natural-sage" />
                      Top Villages by Property Count
                    </h4>

                    <div className="space-y-4 py-2 flex-1 flex flex-col justify-center">
                      {sortedVillages.map((item) => {
                        const pct = (item.count / maxVillageCount) * 100;
                        return (
                          <div key={item.name} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-natural-title flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-natural-sage" />
                                {item.name}
                              </span>
                              <span className="text-natural-muted font-mono">{item.count} properties</span>
                            </div>
                            <div className="w-full h-3 bg-natural-panel rounded-full overflow-hidden border border-natural-border/50">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6 }}
                                className="h-full bg-natural-sage rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* 3. Valuation Insights Column */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Average price per village list (5 cols) */}
                  <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-natural-border shadow-xs">
                    <h4 className="text-xs font-bold text-natural-title uppercase tracking-wider mb-4 border-b border-natural-border pb-2.5">
                      Village Pricing Index
                    </h4>
                    <p className="text-[10px] text-natural-muted mb-3 italic">
                      Average property prices calculated across regional villages
                    </p>

                    <div className="space-y-3.5">
                      {sortedVillageAvg.map((item) => (
                        <div key={item.name} className="flex justify-between items-center text-xs border-b border-natural-border/40 pb-2">
                          <span className="font-semibold text-natural-title">{item.name}</span>
                          <span className="font-mono text-natural-sage-dark font-bold bg-[#E6EDD8] px-2.5 py-1 rounded-lg border border-[#D0DCAE]">
                            ₹{Math.round(item.avg).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price range buckets list (7 cols) */}
                  <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-natural-border shadow-xs flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-natural-title uppercase tracking-wider mb-4 border-b border-natural-border pb-2.5">
                        Price Bracket Distribution
                      </h4>
                      <p className="text-[10px] text-natural-muted mb-4 italic">
                        Classification of catalogued properties by valuation tier
                      </p>

                      <div className="space-y-4">
                        {priceRanges.map((range) => {
                          const percentage = totalCount > 0 ? (range.count / totalCount) * 100 : 0;
                          return (
                            <div key={range.label} className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-natural-title">{range.label}</span>
                                <span className="text-natural-muted font-mono">{range.count} units ({percentage.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full h-2.5 bg-natural-panel rounded-full overflow-hidden border border-natural-border/50">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.5 }}
                                  className="h-full bg-natural-clay rounded-full"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
