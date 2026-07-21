/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Trash2, Link } from 'lucide-react';
import { Property, PropertyStatus } from '../types';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Omit<Property, 'id' | 'createdAt'> & { id?: string }) => void;
  propertyToEdit?: Property | null;
}

export default function PropertyModal({ isOpen, onClose, onSave, propertyToEdit }: PropertyModalProps) {
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [gataNumber, setGataNumber] = useState('');
  const [area, setArea] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<PropertyStatus>('Available');
  const [googleMapLink, setGoogleMapLink] = useState('');
  const [notes, setNotes] = useState('');
  
  // PDF state
  const [pdfData, setPdfData] = useState<string | undefined>(undefined);
  const [pdfName, setPdfName] = useState<string | undefined>(undefined);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (propertyToEdit) {
      setName(propertyToEdit.name);
      setVillage(propertyToEdit.village);
      setGataNumber(propertyToEdit.gataNumber);
      setArea(propertyToEdit.area);
      setPrice(propertyToEdit.price);
      setStatus(propertyToEdit.status);
      setGoogleMapLink(propertyToEdit.googleMapLink || '');
      setNotes(propertyToEdit.notes || '');
      setPdfData(propertyToEdit.pdfData);
      setPdfName(propertyToEdit.pdfName);
    } else {
      setName('');
      setVillage('');
      setGataNumber('');
      setArea('');
      setPrice('');
      setStatus('Available');
      setGoogleMapLink('');
      setNotes('');
      setPdfData(undefined);
      setPdfName(undefined);
    }
  }, [propertyToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Only PDF documents are allowed.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) { // 4MB safe limit
      alert('PDF size must be smaller than 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPdfData(reader.result as string);
      setPdfName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-formatting the price with rupee symbol if not present
    let formattedPrice = price.trim();
    if (formattedPrice && !formattedPrice.startsWith('₹')) {
      formattedPrice = '₹' + formattedPrice;
    }

    onSave({
      ...(propertyToEdit ? { id: propertyToEdit.id } : {}),
      name,
      village,
      gataNumber,
      area,
      price: formattedPrice,
      status,
      googleMapLink: googleMapLink.trim() || undefined,
      pdfData,
      pdfName,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-natural-title/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-xl border border-natural-border max-w-2xl w-full overflow-hidden flex flex-col my-8 max-h-[90vh]"
        id="property-modal-container"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-natural-border flex justify-between items-start bg-natural-panel">
          <div>
            <h2 className="text-xl font-serif font-semibold text-natural-title" id="modal-title">
              {propertyToEdit ? 'Edit Property Details' : 'Add New Property Inventory'}
            </h2>
            <p className="text-xs text-natural-muted mt-1">
              {propertyToEdit ? 'Update the details and specifications of this property' : 'Fill in the details to add a new property record'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-natural-subtle hover:text-natural-title hover:bg-natural-border/40 transition"
            id="close-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-natural-muted uppercase tracking-wider mb-1.5">
                Property Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter property name"
                className="w-full px-3.5 py-2.5 bg-white border border-natural-border rounded-lg text-sm text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-natural-muted uppercase tracking-wider mb-1.5">
                Village *
              </label>
              <input
                type="text"
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Enter village name"
                className="w-full px-3.5 py-2.5 bg-white border border-natural-border rounded-lg text-sm text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-natural-muted uppercase tracking-wider mb-1.5">
                Gata Number *
              </label>
              <input
                type="text"
                required
                value={gataNumber}
                onChange={(e) => setGataNumber(e.target.value)}
                placeholder="Enter gata number"
                className="w-full px-3.5 py-2.5 bg-white border border-natural-border rounded-lg text-sm text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-natural-muted uppercase tracking-wider mb-1.5">
                Area *
              </label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g., 1000 sq ft, 2 Acre"
                className="w-full px-3.5 py-2.5 bg-white border border-natural-border rounded-lg text-sm text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-natural-muted uppercase tracking-wider mb-1.5">
                Price *
              </label>
              <input
                type="text"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 50,00,000"
                className="w-full px-3.5 py-2.5 bg-white border border-natural-border rounded-lg text-sm text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-natural-muted uppercase tracking-wider mb-1.5">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                className="w-full px-3.5 py-2.5 bg-white border border-natural-border rounded-lg text-sm text-natural-title focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
              >
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
                <option value="Hold">Hold</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-natural-muted uppercase tracking-wider mb-1.5">
              Google Map Link <span className="text-natural-subtle font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Link className="absolute left-3.5 top-3.5 w-4 h-4 text-natural-subtle" />
              <input
                type="url"
                value={googleMapLink}
                onChange={(e) => setGoogleMapLink(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-natural-border rounded-lg text-sm text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
              />
            </div>
          </div>

          {/* PDF Uploader Optional Feature */}
          <div>
            <label className="block text-xs font-bold text-natural-muted uppercase tracking-wider mb-1.5">
              Document PDF <span className="text-natural-subtle font-normal">(Optional)</span>
            </label>

            {!pdfData ? (
              <div
                onDragEnter={onDrag}
                onDragOver={onDrag}
                onDragLeave={onDrag}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-natural-sage bg-[#E6EDD8]/10'
                    : 'border-natural-border hover:border-natural-sage/60 hover:bg-natural-panel/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <Upload className="w-8 h-8 text-natural-subtle mb-2" />
                <p className="text-sm font-semibold text-natural-title">
                  Drag and drop your PDF here, or <span className="text-natural-sage hover:underline font-medium">browse</span>
                </p>
                <p className="text-xs text-natural-muted mt-1">
                  Only PDF files up to 4MB
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-natural-panel rounded-xl border border-natural-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-red-100 text-red-700 rounded-lg shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-natural-title truncate">
                      {pdfName || 'property_document.pdf'}
                    </p>
                    <p className="text-xs text-natural-muted font-medium">
                      PDF Document Attached
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPdfData(undefined);
                    setPdfName(undefined);
                  }}
                  className="p-1.5 text-natural-subtle hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Remove document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-natural-muted uppercase tracking-wider mb-1.5">
              Notes <span className="text-natural-subtle font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about the property..."
              className="w-full px-3.5 py-2.5 bg-white border border-natural-border rounded-lg text-sm text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-natural-panel border-t border-natural-border flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-natural-text hover:bg-white rounded-full transition-all border border-natural-border active:scale-95 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleFormSubmit}
            type="submit"
            className="px-6 py-2 text-sm font-semibold text-white bg-natural-sage hover:bg-natural-sage-dark rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            {propertyToEdit ? 'Save Changes' : 'Create Inventory'}
          </button>
        </div>
      </div>
    </div>
  );
}
