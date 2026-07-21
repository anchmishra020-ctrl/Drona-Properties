/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  LogOut,
  Search,
  Plus,
  Home,
  CheckCircle,
  XCircle,
  AlertCircle,
  FilePlus2,
  ListFilter,
  Notebook,
  UserCog,
  Calculator,
  TrendingUp,
  Sun,
  Moon
} from 'lucide-react';
import { Property, PropertyStatus, User } from '../types';
import { propertyDb } from '../services/db';
import { safeStorage } from '../services/storage';
import PropertyCard from './PropertyCard';
import PropertyModal from './PropertyModal';
import PropertyDetailsModal from './PropertyDetailsModal';
import UserNotesDrawer from './UserNotesDrawer';
import UserProfileModal from './UserProfileModal';
import AreaCalculatorModal from './AreaCalculatorModal';
import AnalyticsModal from './AnalyticsModal';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

export default function Dashboard({ user, onLogout, onUpdateUser }: DashboardProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<PropertyStatus | 'All'>('All');
  
  // Theme state for switching between Theme 1 (classic) and Theme 4 (dark mode)
  const [theme, setTheme] = useState<'classic' | 'dark'>(() => {
    return (safeStorage.getItem('terralink_theme') as 'classic' | 'dark') || 'classic';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'theme-dark');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
    }
    safeStorage.setItem('terralink_theme', theme);
  }, [theme]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Load properties
  const loadProperties = async () => {
    try {
      const data = await propertyDb.getAllProperties();
      // If user is 'admin', show all properties.
      // Otherwise, filter by user.username.
      const isSystemAdmin = user.username.toLowerCase() === 'admin';
      const filtered = isSystemAdmin
        ? data
        : data.filter((p) => p.createdBy?.toLowerCase() === user.username.toLowerCase());
      setProperties(filtered);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  // Stats calculations
  const totalCount = properties.length;
  const availableCount = properties.filter((p) => p.status === 'Available').length;
  const soldCount = properties.filter((p) => p.status === 'Sold').length;
  const holdCount = properties.filter((p) => p.status === 'Hold').length;

  // Add or edit property action
  const handleSaveProperty = async (propertyData: Omit<Property, 'id' | 'createdAt'> & { id?: string }) => {
    try {
      if (propertyData.id) {
        // Edit
        await propertyDb.updateProperty(propertyData.id, propertyData);
      } else {
        // Add
        // Associate the new property with the currently logged in user
        await propertyDb.addProperty({
          ...propertyData,
          createdBy: user.username,
        });
      }
      await loadProperties();
    } catch (error) {
      console.error('Error saving property:', error);
    }
  };

  // Delete property action
  const handleDeleteProperty = async (id: string) => {
    try {
      await propertyDb.deleteProperty(id);
      await loadProperties();
      if (viewingProperty && viewingProperty.id === id) {
        setViewingProperty(null);
      }
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  // Filtered properties
  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.gataNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'All' || p.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col text-natural-text">
      {/* Top Header Navigation */}
      <header className="bg-natural-card/95 border-b border-natural-border py-4 px-4 sm:px-6 sticky top-0 z-30 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-natural-sage rounded-xl flex items-center justify-center text-white shadow-md font-serif text-xl font-bold animate-fade-in">
              A
            </div>
            <div>
              <h1 className="text-xl font-serif font-semibold text-natural-title tracking-tight leading-none animate-fade-in" id="app-header-title">
                AcreBook
              </h1>
              <p className="text-xs text-natural-muted mt-1 font-medium tracking-wide">
                Property Inventory Management
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap justify-center gap-2 sm:gap-3">
            {/* Theme Toggle Slider (Switch between Light Mode & Dark Mode) */}
            <button
              onClick={() => setTheme(theme === 'classic' ? 'dark' : 'classic')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-natural-border text-xs font-semibold bg-natural-card text-natural-muted hover:text-natural-sage cursor-pointer transition-all active:scale-95 shadow-xs"
              title={theme === 'classic' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              id="theme-toggle-btn"
            >
              {theme === 'classic' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-full border border-natural-border text-xs font-semibold text-natural-muted hover:text-natural-sage cursor-pointer transition-all active:scale-95 shadow-xs"
              title="View & Edit My Profile"
              id="profile-trigger-btn"
            >
              <UserCog className="w-3.5 h-3.5 text-natural-sage" />
              <span>
                {user.fullName || user.username}
                <span className="hidden md:inline text-[10px] text-natural-subtle font-normal ml-1 border-l border-natural-border pl-1.5">
                  {user.designation || 'System Admin'}
                </span>
              </span>
            </button>
            <button
              onClick={() => setIsCalculatorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/70 rounded-full border border-amber-200 transition-all cursor-pointer shadow-xs active:scale-95"
              id="calculator-modal-btn"
              title="Open Area & Price Valuation Calculator"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calculator</span>
            </button>
            <button
              onClick={() => setIsAnalyticsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/85 rounded-full border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
              id="analytics-modal-btn"
              title="Open Inventory Analytics Dashboard"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Analytics</span>
            </button>
            <button
              onClick={() => setIsNotesDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-natural-sage hover:text-natural-sage-dark bg-emerald-50 hover:bg-emerald-100/70 rounded-full border border-emerald-200 transition-all cursor-pointer shadow-xs active:scale-95"
              id="notes-drawer-btn"
              title="Open Notes"
            >
              <Notebook className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My Notes</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 rounded-full border border-natural-border transition-all cursor-pointer shadow-xs active:scale-95"
              id="logout-btn"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-dashboard-row">
          
          {/* Total Properties */}
          <div
            onClick={() => setSelectedStatusFilter('All')}
            className={`bg-white rounded-2xl border p-5 flex items-center justify-between shadow-xs transition duration-200 cursor-pointer ${
              selectedStatusFilter === 'All' ? 'border-natural-sage ring-2 ring-natural-sage/15' : 'border-natural-border hover:border-natural-sage/40'
            }`}
          >
            <div>
              <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">
                Total Properties
              </p>
              <p className="text-3xl font-serif font-semibold text-natural-title">{totalCount}</p>
            </div>
            <div className="w-10 h-10 bg-natural-panel rounded-xl flex items-center justify-center text-natural-sage shrink-0 border border-natural-border">
              <Home className="w-5 h-5" />
            </div>
          </div>

          {/* Available Properties */}
          <div
            onClick={() => setSelectedStatusFilter('Available')}
            className={`bg-white rounded-2xl border p-5 flex items-center justify-between shadow-xs transition duration-200 cursor-pointer ${
              selectedStatusFilter === 'Available' ? 'border-[#8C947F] bg-[#E6EDD8]/10 ring-2 ring-[#8C947F]/15' : 'border-natural-border hover:border-natural-sage/40'
            }`}
          >
            <div>
              <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">
                Available
              </p>
              <p className="text-3xl font-serif font-semibold text-natural-title">{availableCount}</p>
            </div>
            <div className="w-10 h-10 bg-[#E6EDD8] rounded-xl flex items-center justify-center shrink-0 border border-[#D0DCAE]">
              <span className="w-3 h-3 rounded-full bg-[#5C634D]" />
            </div>
          </div>

          {/* Sold Properties */}
          <div
            onClick={() => setSelectedStatusFilter('Sold')}
            className={`bg-white rounded-2xl border p-5 flex items-center justify-between shadow-xs transition duration-200 cursor-pointer ${
              selectedStatusFilter === 'Sold' ? 'border-[#8C847F] bg-natural-panel/20 ring-2 ring-[#8C847F]/15' : 'border-natural-border hover:border-natural-sage/40'
            }`}
          >
            <div>
              <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">
                Sold
              </p>
              <p className="text-3xl font-serif font-semibold text-natural-title">{soldCount}</p>
            </div>
            <div className="w-10 h-10 bg-[#F2EDE7] rounded-xl flex items-center justify-center shrink-0 border border-natural-border">
              <span className="w-3 h-3 rounded-full bg-[#8C847F]" />
            </div>
          </div>

          {/* Hold Properties */}
          <div
            onClick={() => setSelectedStatusFilter('Hold')}
            className={`bg-white rounded-2xl border p-5 flex items-center justify-between shadow-xs transition duration-200 cursor-pointer ${
              selectedStatusFilter === 'Hold' ? 'border-[#A3836B] bg-[#F8F3EE]/20 ring-2 ring-[#A3836B]/15' : 'border-natural-border hover:border-natural-sage/40'
            }`}
          >
            <div>
              <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">
                Hold
              </p>
              <p className="text-3xl font-serif font-semibold text-natural-title">{holdCount}</p>
            </div>
            <div className="w-10 h-10 bg-[#F8F3EE] rounded-xl flex items-center justify-center shrink-0 border border-[#ECDCCF]">
              <span className="w-3 h-3 rounded-full bg-[#A3836B]" />
            </div>
          </div>

        </div>

        {/* Filter & Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between" id="search-action-bar">
          
          {/* Search Box */}
          <div className="relative w-full md:max-w-md flex-1">
            <Search className="absolute left-4 top-3 w-4.5 h-4.5 text-natural-subtle" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties by name, village, gata..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-natural-border rounded-full text-sm text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition duration-200 shadow-xs"
            />
          </div>

          {/* Quick filter selector badge displays */}
          <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-3 shrink-0">
            {selectedStatusFilter !== 'All' && (
              <div className="flex items-center gap-1.5 text-xs text-natural-text bg-[#F2EDE7] px-3.5 py-2 rounded-full border border-natural-border">
                <ListFilter className="w-3.5 h-3.5 text-natural-sage" />
                <span>Filter: <b className="text-natural-title font-bold">{selectedStatusFilter}</b></span>
                <button
                  onClick={() => setSelectedStatusFilter('All')}
                  className="font-bold ml-1.5 text-natural-muted hover:text-natural-title text-sm shrink-0 leading-none"
                >
                  ×
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setEditingProperty(null);
                setIsModalOpen(true);
              }}
              className="w-full md:w-auto bg-natural-sage hover:bg-natural-sage-dark text-white py-2.5 px-6 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              id="add-property-btn"
            >
              <Plus className="w-4 h-4" />
              Add Property
            </button>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium text-natural-title">Recent Inventory</h2>
            <p className="text-xs text-natural-muted font-medium">
              Showing {filteredProperties.length} of {totalCount} records
            </p>
          </div>

          {filteredProperties.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              id="properties-grid"
            >
              <AnimatePresence mode="popLayout">
                {filteredProperties.map((property) => (
                  <motion.div
                    key={property.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                  >
                    <PropertyCard
                      property={property}
                      onView={(prop) => setViewingProperty(prop)}
                      onEdit={(prop) => {
                        setEditingProperty(prop);
                        setIsModalOpen(true);
                      }}
                      onDelete={handleDeleteProperty}
                      showCreator={user.username.toLowerCase() === 'admin'}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="bg-white rounded-2xl border border-natural-border p-12 text-center shadow-xs" id="empty-state-view">
              <Building2 className="w-12 h-12 text-natural-subtle mx-auto mb-3" />
              <h3 className="text-lg font-serif font-medium text-natural-title">No properties found</h3>
              <p className="text-sm text-natural-muted mt-1.5 max-w-sm mx-auto">
                We couldn't find any property matches for your filter or search query. Try adding a new property or adjusting your search term.
              </p>
              {searchQuery || selectedStatusFilter !== 'All' ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatusFilter('All');
                  }}
                  className="mt-5 px-4 py-2 bg-[#F2EDE7] hover:bg-[#E6DED4] text-natural-title font-semibold text-xs rounded-full border border-natural-border transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingProperty(null);
                    setIsModalOpen(true);
                  }}
                  className="mt-5 px-5 py-2.5 bg-natural-sage hover:bg-natural-sage-dark text-white font-semibold text-xs rounded-full shadow-md transition-all cursor-pointer"
                >
                  Add Your First Property
                </button>
              )}
            </div>
          )}
        </div>

      </main>

      {/* Add / Edit Property Modal */}
      <PropertyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProperty(null);
        }}
        onSave={handleSaveProperty}
        propertyToEdit={editingProperty}
      />

      {/* Property Details View Modal */}
      <PropertyDetailsModal
        property={viewingProperty}
        onClose={() => setViewingProperty(null)}
      />

      {/* User Notes Sliding Drawer */}
      <UserNotesDrawer
        isOpen={isNotesDrawerOpen}
        onClose={() => setIsNotesDrawerOpen(false)}
        username={user.username}
      />

      {/* User Profile Settings Modal */}
      <UserProfileModal
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdateUser={onUpdateUser}
      />

      {/* Advanced Land Calculator Modal */}
      <AreaCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        username={user.username}
      />

      {/* Advanced Visual Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        properties={properties}
      />
    </div>
  );
}
