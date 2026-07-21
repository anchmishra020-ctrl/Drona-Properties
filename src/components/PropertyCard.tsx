/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { MapPin, MoreVertical, FileText, Map, Eye, Trash2, Edit3 } from 'lucide-react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  onView: (property: Property) => void;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
  showCreator?: boolean;
}

export default function PropertyCard({ property, onView, onEdit, onDelete, showCreator }: PropertyCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const getStatusStyles = (status: Property['status']) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Sold':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Hold':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div
      className="bg-white rounded-2xl border border-natural-border shadow-sm hover:shadow-md hover:border-natural-sage/40 transition-all duration-300 p-6 flex flex-col justify-between relative group"
      id={`property-card-${property.id}`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex justify-between items-start gap-3 mb-2">
          <h3
            className="text-lg font-serif font-semibold text-natural-title group-hover:text-natural-sage transition duration-250 line-clamp-1"
            id={`property-title-${property.id}`}
          >
            {property.name}
          </h3>
          
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getStatusStyles(property.status)}`}
              id={`property-status-badge-${property.id}`}
            >
              {property.status}
            </span>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 text-natural-subtle hover:text-natural-title hover:bg-natural-panel rounded-lg transition"
                id={`property-menu-btn-${property.id}`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 mt-1 w-36 bg-white border border-natural-border rounded-xl shadow-lg py-1.5 z-20 text-sm"
                    id={`property-menu-dropdown-${property.id}`}
                  >
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onView(property);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-natural-panel text-natural-text flex items-center gap-2 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-natural-subtle" />
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(property);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-natural-panel text-natural-text flex items-center gap-2 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-natural-subtle" />
                      Edit Property
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (confirm('Are you sure you want to delete this property?')) {
                          onDelete(property.id);
                        }
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Location Row */}
        <div className="flex items-center justify-between gap-1.5 text-sm text-natural-muted mb-6">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-4 h-4 text-natural-subtle shrink-0" />
            <span className="truncate">{property.village}</span>
          </div>
          {showCreator && property.createdBy && (
            <span 
              className="text-[10px] font-mono bg-natural-panel text-natural-muted px-2 py-0.5 rounded-md border border-natural-border truncate max-w-[120px]" 
              title={`Added by: ${property.createdBy}`}
            >
              By: {property.createdBy}
            </span>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 border-t border-natural-border pt-4">
          <div>
            <p className="text-[10px] font-bold text-natural-subtle uppercase tracking-widest mb-1">
              Gata Number
            </p>
            <p className="text-base font-semibold text-natural-title" id={`property-gata-${property.id}`}>
              {property.gataNumber}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-natural-subtle uppercase tracking-widest mb-1">
              Area
            </p>
            <p className="text-base font-semibold text-natural-title" id={`property-area-${property.id}`}>
              {property.area}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer Row */}
      <div className="border-t border-natural-border pt-4 flex justify-between items-center mt-auto">
        <div>
          <p className="text-[10px] font-bold text-natural-subtle uppercase tracking-widest mb-0.5">
            Price
          </p>
          <p className="text-lg font-bold text-natural-title" id={`property-price-${property.id}`}>
            {property.price}
          </p>
        </div>

        {/* Dynamic feature indicators (PDF, Maps link) */}
        <div className="flex gap-1.5">
          {property.pdfData && (
            <div
              className="p-2 bg-[#F2EDE7] text-[#8C947F] hover:bg-[#E6DED4] border border-[#E6DED4] rounded-full transition duration-150 tooltip cursor-pointer flex items-center gap-1"
              title={`PDF Attached: ${property.pdfName || 'Document'}`}
              onClick={(e) => {
                e.stopPropagation();
                onView(property);
              }}
            >
              <FileText className="w-3.5 h-3.5" />
            </div>
          )}
          {property.googleMapLink && (
            <a
              href={property.googleMapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-[#F2EDE7] text-[#8C947F] hover:bg-[#E6DED4] border border-[#E6DED4] rounded-full transition duration-150 cursor-pointer flex items-center gap-1"
              title="Google Map Link"
              onClick={(e) => e.stopPropagation()}
            >
              <Map className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
