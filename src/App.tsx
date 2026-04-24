/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CloudUpload, 
  Image as ImageIcon, 
  Settings, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { cn } from './lib/utils';

interface UploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

export default function App() {
  const [cloudName, setCloudName] = useState('');
  const [uploadPreset, setUploadPreset] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setUploadedUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.type.startsWith('image/')) {
        toast.error('Please drop an image file');
        return;
      }
      setFile(droppedFile);
      const url = URL.createObjectURL(droppedFile);
      setPreviewUrl(url);
      setUploadedUrl(null);
    }
  };

  const clearSelection = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploadedUrl(null);
  };

  const handleUpload = async () => {
    if (!cloudName || !uploadPreset) {
      toast.error('Please provide Cloud Name and Upload Preset');
      setShowConfig(true);
      return;
    }

    if (!file) {
      toast.error('Please select a photo first');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data: UploadResponse = await response.json();
      setUploadedUrl(data.secure_url);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copied to clipboard!');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-indigo-50">
      <Toaster position="top-right" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-white/60 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <CloudUpload className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                Cloudinary QuickUpload
              </h1>
              <p className="text-sm text-slate-500 font-medium">Unsigned Instant Uploads</p>
            </div>
          </div>
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={cn(
              "p-2 rounded-full transition-all duration-200",
              showConfig ? "bg-blue-50 text-blue-600 ring-2 ring-blue-100" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Config Section */}
          <AnimatePresence>
            {showConfig && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Cloud Name</label>
                    <input 
                      type="text" 
                      value={cloudName}
                      onChange={(e) => setCloudName(e.target.value)}
                      placeholder="e.g. duo7wzsk5"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Upload Preset (Unsigned)</label>
                    <input 
                      type="text" 
                      value={uploadPreset}
                      onChange={(e) => setUploadPreset(e.target.value)}
                      placeholder="e.g. ml_default"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-amber-800 text-xs border border-amber-100">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Make sure your preset is configured as <strong>Unsigned</strong> in Cloudinary Settings - Upload.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Area */}
          <div className="relative">
            {!previewUrl ? (
              <motion.div
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all border border-slate-100">
                  <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-slate-700">Drop your photo here</h3>
                  <p className="text-sm text-slate-500 mt-1">or click to browse from computer</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200 group"
              >
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button 
                    onClick={clearSelection}
                    className="p-3 bg-white/20 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all"
                    title="Remove image"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Button */}
          {previewUrl && !uploadedUrl && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 group overflow-hidden relative"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading to Cloudinary...</span>
                </>
              ) : (
                <>
                  <span>Upload Image</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          )}

          {/* Result Section */}
          <AnimatePresence>
            {uploadedUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-4"
              >
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900">Upload Complete!</h3>
                    <p className="text-xs text-emerald-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                      Your photo is safe in the cloud.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Secure Image URL</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 font-mono text-sm truncate select-all">
                      {uploadedUrl}
                    </div>
                    <button 
                      onClick={() => copyToClipboard(uploadedUrl)}
                      className="p-3 bg-white border border-slate-200 hover:border-blue-500 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <a 
                      href={uploadedUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-white border border-slate-200 hover:border-blue-500 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm flex items-center"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
                
                <button 
                  onClick={clearSelection}
                  className="w-full py-3 text-slate-500 hover:text-slate-700 font-semibold text-sm transition-colors"
                >
                  Upload another one
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        {!uploadedUrl && (
          <div className="bg-slate-50 p-6 md:p-8 flex items-center justify-center gap-6 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-widest">
              <span>Fast</span>
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>Secure</span>
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>Simple</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Decorative background elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 blur-[100px] rounded-full -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 blur-[100px] rounded-full -z-10" />
    </div>
  );
}

