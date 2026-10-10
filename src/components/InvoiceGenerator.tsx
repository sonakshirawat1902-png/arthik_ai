'use client';

import React, { useState, useRef } from 'react';
import { formatINR } from '@/lib/formatter';
import {
  Plus,
  Trash2,
  Printer,
  FileText,
  ArrowLeft,
  Building2,
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { ExtractedBillData } from '@/app/api/scan-bill/route';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

interface InvoiceGeneratorProps {
  businessName?: string;
  onClose?: () => void;
  onBackToDashboard?: () => void;
}

export const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  businessName = 'Rangoli Home & Gifts',
  onClose,
  onBackToDashboard,
}) => {
  const handleBack = onClose || onBackToDashboard;
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerName, setCustomerName] = useState('Sharma Retailers');
  const [customerContact, setCustomerContact] = useState('+91 98290 12345, Jaipur');
  const [notes, setNotes] = useState('Thank you for your business! Terms: Net 15 days.');

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'Block-Print Bedsheet Set (P01)', quantity: 2, unitPrice: 1800, discount: 0, taxRate: 5 },
    { id: '2', description: 'Blue Pottery Vase (P02)', quantity: 1, unitPrice: 950, discount: 50, taxRate: 5 },
  ]);

  // AI Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showImageComparison, setShowImageComparison] = useState(false);
  const [confidenceNotes, setConfidenceNotes] = useState<string | null>(null);
  const [isDemoScan, setIsDemoScan] = useState(false);
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false);
  const [pendingExtractedData, setPendingExtractedData] = useState<ExtractedBillData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: 'New Product / Service',
        quantity: 1,
        unitPrice: 500,
        discount: 0,
        taxRate: 5,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(
      items.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Calculations (100% deterministic in client code)
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const totalDiscount = items.reduce((acc, item) => acc + (item.discount || 0), 0);
  const totalTax = items.reduce((acc, item) => {
    const itemSub = item.quantity * item.unitPrice - (item.discount || 0);
    return acc + (itemSub * (item.taxRate || 0)) / 100;
  }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // File Upload & Gemini Scanner logic
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input value so re-selecting same file works
    e.target.value = '';

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setScanError('Image file is too large (max 5MB). Please upload a smaller file.');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setScanError('Invalid file format. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    // Show client preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    setShowImageComparison(true);

    // Call API
    await scanBillFile(file);
  };

  const scanBillFile = async (file: File) => {
    setIsScanning(true);
    setScanError(null);
    setScanSuccess(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/scan-bill', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to extract bill data');
      }

      const extracted: ExtractedBillData = await res.json();

      // Check if user already has custom entries
      if (items.length > 0) {
        setPendingExtractedData(extracted);
        setShowConfirmOverwrite(true);
      } else {
        applyExtractedData(extracted);
      }
    } catch (err: any) {
      setScanError(err.message || 'Error processing bill photo. You can still enter details manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const applyExtractedData = (data: ExtractedBillData) => {
    if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
    if (data.invoiceDate) setInvoiceDate(data.invoiceDate);
    if (data.customerName) setCustomerName(data.customerName);
    if (data.customerContact) setCustomerContact(data.customerContact);
    if (data.confidenceNotes) setConfidenceNotes(data.confidenceNotes);
    setIsDemoScan(Boolean(data.isDemoFallback));

    if (data.lineItems && data.lineItems.length > 0) {
      const formattedItems: InvoiceItem[] = data.lineItems.map((item, idx) => ({
        id: (Date.now() + idx).toString(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate,
      }));
      setItems(formattedItems);
    }

    setScanSuccess(
      data.isDemoFallback
        ? 'AI Vision extracted sample receipt details. All fields below are fully editable.'
        : 'AI successfully extracted bill details! Please review line items and totals.'
    );
  };

  return (
    <div className="space-y-6">
      {/* Print-Only CSS Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header Controls (No Print) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {handleBack && (
            <button
              onClick={handleBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-sky-400" />
              GST Invoice Generator & AI Scanner
            </h2>
            <p className="text-xs text-slate-400">Scan bill photos with Gemini Vision or create custom invoices</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Hidden File Inputs for Mobile Camera and Desktop Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          {/* AI Bill Scanner Action Buttons */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-sky-300" />
                <span>Scanning Bill with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                <Camera className="h-4 w-4" />
                <span>Scan Bill with AI</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white shadow-sm transition-all flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Scan Status Banner / Messages */}
      {scanError && (
        <div className="no-print p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{scanError}</span>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 rounded-lg bg-rose-500 text-white font-bold text-[11px]"
          >
            Try Again
          </button>
        </div>
      )}

      {scanSuccess && (
        <div className="no-print p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{scanSuccess}</span>
          </div>
          {imagePreviewUrl && (
            <button
              onClick={() => setShowImageComparison(!showImageComparison)}
              className="text-emerald-400 hover:underline font-bold flex items-center gap-1 text-[11px]"
            >
              {showImageComparison ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showImageComparison ? 'Hide Bill Photo' : 'Compare Bill Photo'}
            </button>
          )}
        </div>
      )}

      {/* Confirmation Overwrite Modal */}
      {showConfirmOverwrite && pendingExtractedData && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-sky-500/30 p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-400" />
              Populate Form with Extracted Bill Data?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              AI extracted details from <strong>{pendingExtractedData.merchantName || 'Uploaded Receipt'}</strong>. Would you like to replace the current invoice details with the extracted fields?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowConfirmOverwrite(false);
                  setPendingExtractedData(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  applyExtractedData(pendingExtractedData);
                  setShowConfirmOverwrite(false);
                  setPendingExtractedData(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-500 text-white hover:bg-sky-400"
              >
                Replace & Populate Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Original Uploaded Bill Comparison */}
      {showImageComparison && imagePreviewUrl && (
        <div className="no-print p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 relative">
              <img src={imagePreviewUrl} alt="Scanned Bill Preview" className="h-full w-full object-cover" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-sky-400" />
                Scanned Bill Document Preview
              </h4>
              {confidenceNotes && <p className="text-[11px] text-slate-400 mt-0.5">{confidenceNotes}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={imagePreviewUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              View Full Size Image
            </a>
            <button
              onClick={() => setShowImageComparison(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Invoice Generator Grid (Form + Live Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Inputs (No Print) */}
        <div className="no-print rounded-2xl bg-slate-900/80 p-5 border border-slate-800/80 backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Invoice Details & Line Items</h3>
            {isDemoScan && (
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                AI Vision Demo Data
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Customer / Merchant Name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Customer Contact / Address</label>
              <input
                type="text"
                value={customerContact}
                onChange={e => setCustomerContact(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Line Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300">Itemized Products / Services</span>
              <button
                onClick={handleAddItem}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium"
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <label className="text-slate-400 block mb-0.5">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => handleItemChange(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={e => handleItemChange(item.id, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Disc (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={item.discount}
                      onChange={e => handleItemChange(item.id, 'discount', Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">GST (%)</label>
                    <input
                      type="number"
                      min={0}
                      value={item.taxRate}
                      onChange={e => handleItemChange(item.id, 'taxRate', Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Invoice Notes / Terms</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Printable Live Invoice Preview */}
        <div
          id="printable-invoice"
          className="rounded-2xl bg-white text-slate-900 p-6 shadow-2xl border border-slate-200 space-y-6"
        >
          {/* Invoice Business Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{businessName}</h1>
              <p className="text-xs text-slate-600">Jaipur, Rajasthan • GSTIN: 08ABCDE1234F1Z5</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">TAX INVOICE</span>
              <span className="text-sm font-bold text-slate-900 block">{invoiceNumber}</span>
              <span className="text-xs text-slate-500 block">Date: {invoiceDate}</span>
            </div>
          </div>

          {/* Customer Bill To */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Bill To:</span>
            <p className="font-bold text-slate-900">{customerName}</p>
            <p className="text-slate-600">{customerContact}</p>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-2 font-bold">Item Description</th>
                <th className="py-2.5 px-2 text-center font-bold">Qty</th>
                <th className="py-2.5 px-2 text-right font-bold">Price</th>
                <th className="py-2.5 px-2 text-right font-bold">Disc</th>
                <th className="py-2.5 px-2 text-right font-bold">GST</th>
                <th className="py-2.5 px-2 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                const itemSub = item.quantity * item.unitPrice - (item.discount || 0);
                const itemTax = (itemSub * (item.taxRate || 0)) / 100;
                const itemTotal = itemSub + itemTax;

                return (
                  <tr key={idx}>
                    <td className="py-2.5 px-2 font-medium">{item.description}</td>
                    <td className="py-2.5 px-2 text-center">{item.quantity}</td>
                    <td className="py-2.5 px-2 text-right">{formatINR(item.unitPrice)}</td>
                    <td className="py-2.5 px-2 text-right text-slate-500">{formatINR(item.discount || 0)}</td>
                    <td className="py-2.5 px-2 text-right text-slate-500">{item.taxRate}%</td>
                    <td className="py-2.5 px-2 text-right font-bold">{formatINR(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Summary Totals */}
          <div className="flex justify-end border-t border-slate-200 pt-3">
            <div className="w-64 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Discount:</span>
                <span>-{formatINR(totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST Tax:</span>
                <span>+{formatINR(totalTax)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-300 pt-2">
                <span>Grand Total:</span>
                <span className="text-indigo-600">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Footer */}
          {notes && (
            <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 italic">
              <p>{notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
