/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Calendar, MapPin, DollarSign, Layers, Hash, FileText, ExternalLink, Download, Compass } from 'lucide-react';
import { Property } from '../types';

interface PropertyDetailsModalProps {
  property: Property | null;
  onClose: () => void;
}

export default function PropertyDetailsModal({ property, onClose }: PropertyDetailsModalProps) {
  if (!property) return null;

  const getStatusStyles = (status: Property['status']) => {
    switch (status) {
      case 'Available':
        return 'bg-[#E6EDD8] text-[#5C634D] border-[#D0DCAE]';
      case 'Sold':
        return 'bg-[#F2EDE7] text-[#8C847F] border-[#E6DED4]';
      case 'Hold':
        return 'bg-[#F8F3EE] text-[#A3836B] border-[#ECDCCF]';
      default:
        return 'bg-[#F9F8F6] text-natural-muted border-natural-border';
    }
  };

  const downloadPdf = () => {
    if (!property.pdfData) return;
    const link = document.createElement('a');
    link.href = property.pdfData;
    link.download = property.pdfName || `${property.name}-document.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPdfInNewTab = () => {
    if (!property.pdfData) return;
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(
        `<iframe src="${property.pdfData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
      newTab.document.title = property.pdfName || 'Property Document';
    }
  };

  return (
    <div className="fixed inset-0 bg-natural-title/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-xl border border-natural-border max-w-2xl w-full overflow-hidden flex flex-col my-8 max-h-[90vh]"
        id="property-details-modal"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-natural-border flex justify-between items-start bg-natural-panel">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getStatusStyles(property.status)}`}>
                {property.status}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-natural-muted font-mono uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                <span>Added on {new Date(property.createdAt).toLocaleDateString()}</span>
              </div>
              {property.createdBy && (
                <div className="text-[10px] font-mono text-natural-muted bg-white/65 px-2 py-0.5 rounded border border-natural-border uppercase tracking-wider">
                  By: {property.createdBy}
                </div>
              )}
            </div>
            <h2 className="text-xl font-serif font-semibold text-natural-title" id="details-modal-title">
              {property.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-natural-subtle hover:text-natural-title hover:bg-natural-border/40 transition"
            id="close-details-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {/* Main Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-natural-panel border border-natural-border rounded-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest flex items-center gap-1 mb-1">
                <Hash className="w-3 h-3 text-natural-subtle" />
                Gata No.
              </span>
              <span className="text-sm font-semibold text-natural-title">{property.gataNumber}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest flex items-center gap-1 mb-1">
                <Layers className="w-3 h-3 text-natural-subtle" />
                Area
              </span>
              <span className="text-sm font-semibold text-natural-title">{property.area}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest flex items-center gap-1 mb-1">
                <DollarSign className="w-3 h-3 text-natural-subtle" />
                Price
              </span>
              <span className="text-sm font-semibold text-natural-title">{property.price}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3 text-natural-subtle" />
                Village
              </span>
              <span className="text-sm font-semibold text-natural-title truncate">{property.village}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h4 className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-2">
              Property Description / Notes
            </h4>
            <p className="text-sm text-natural-text leading-relaxed bg-white border border-natural-border p-4 rounded-xl shadow-xs">
              {property.notes || 'No description or additional notes provided.'}
            </p>
          </div>

          {/* Integrations Row (Map and PDF) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Google Map Card */}
            <div className="border border-natural-border bg-white rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-natural-panel text-natural-sage border border-natural-border rounded-lg">
                    <Compass className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="text-sm font-serif font-semibold text-natural-title">Location Map</h4>
                </div>
                <p className="text-xs text-natural-muted mb-4 leading-relaxed">
                  {property.googleMapLink
                    ? 'This property includes external navigation coordinates on Google Maps.'
                    : 'No Map location is attached to this property inventory record.'}
                </p>
              </div>

              {property.googleMapLink ? (
                <a
                  href={property.googleMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-natural-panel hover:bg-natural-border border border-natural-border text-natural-title font-semibold text-xs rounded-full transition-all active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  Navigate on Google Maps
                </a>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-natural-panel/40 text-natural-subtle text-xs rounded-full border border-dashed border-natural-border">
                  Map Link Unavailable
                </div>
              )}
            </div>

            {/* PDF Card */}
            <div className="border border-natural-border bg-white rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-natural-panel text-natural-sage border border-natural-border rounded-lg">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="text-sm font-serif font-semibold text-natural-title">Attached Documents</h4>
                </div>
                <p className="text-xs text-natural-muted mb-4 leading-relaxed">
                  {property.pdfData
                    ? `PDF: ${property.pdfName || 'property_details.pdf'} attached for detailed specifications.`
                    : 'No documents or blueprints are attached to this property.'}
                </p>
              </div>

              {property.pdfData ? (
                <div className="flex gap-2">
                  <button
                    onClick={openPdfInNewTab}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-natural-sage hover:bg-natural-sage-dark text-white font-semibold text-xs rounded-full shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open PDF
                  </button>
                  <button
                    onClick={downloadPdf}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-natural-panel hover:bg-natural-border text-natural-title font-semibold text-xs rounded-full transition-all border border-natural-border cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-natural-panel/40 text-natural-subtle text-xs rounded-full border border-dashed border-natural-border">
                  No PDF Attached
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-natural-panel border-t border-natural-border flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-semibold text-natural-text bg-white hover:bg-natural-panel rounded-full border border-natural-border transition-all cursor-pointer active:scale-95"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
