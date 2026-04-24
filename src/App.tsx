import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
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
  Trash2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { cn } from './lib/utils';

// Environment variables
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD;

interface UploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('app_auth_token') === APP_PASSWORD;
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadStats, setUploadStats] = useState<{size: string, format: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const maskString = (str: string) => {
    if (!str) return 'NOT_CONFIGURED';
    if (str.length <= 4) return '•••••';
    return str.slice(0, 3) + '••••' + str.slice(-2);
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === APP_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('app_auth_token', passwordInput);
      toast.success('Access granted');
    } else {
      toast.error('Incorrect password');
      setPasswordInput('');
    }
  };

  const logout = () => {
    localStorage.removeItem('app_auth_token');
    setIsAuthenticated(false);
    toast.success('Logged out');
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setUploadedUrl(null);
    setUploadStats(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  };

  const clearSelection = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploadedUrl(null);
    setUploadStats(null);
  };

  const handleUpload = async () => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      toast.error('Cloudinary environment variables missing. Check your settings.');
      return;
    }

    if (!file) {
      toast.error('No photo selected');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME.trim()}/image/upload`,
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
      setUploadStats({
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        format: data.format.toUpperCase()
      });
      toast.success('Pushed to cloud!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-[#0A0A0A] flex items-center justify-center font-sans tracking-tight">
        <Toaster position="top-right" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm p-8 bg-zinc-900 border border-zinc-800 rounded-3xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
              <Lock className="text-black w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase">Protected</h2>
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Entry required</p>
            </div>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="group">
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2 group-focus-within:text-white transition-colors">Access Token</label>
              <input 
                type="password"
                value={passwordInput}
                autoFocus
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-all placeholder:text-zinc-700"
                placeholder="••••••••"
              />
            </div>
            <button className="w-full bg-white text-black font-black uppercase py-4 rounded-xl text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
              Verify
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#0A0A0A] text-white flex flex-col lg:flex-row overflow-x-hidden font-sans">
      <Toaster position="top-right" />
      
      {/* Left Section: Brand - Hidden on mobile, visible on LG */}
      <div className="hidden lg:flex lg:w-3/5 p-16 flex-col justify-between border-r border-zinc-900 bg-[radial-gradient(circle_at_top_right,_#1a1a1a,_transparent)] sticky top-0 h-screen">
        <div>
          <div className="text-zinc-500 font-mono text-sm tracking-[0.3em] mb-12 uppercase flex items-center gap-3">
             <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
             Cloudinary Utility v2.0
          </div>
          <h1 className="text-huge font-black leading-[0.8] tracking-tighter">
            IMAGE<br/><span className="text-zinc-800 font-black">PUSH.</span>
          </h1>
        </div>

        <div className="text-[10px] text-zinc-800 font-mono flex items-center gap-3 tracking-[0.2em]">
          <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full"></div>
          NO DATABASE PERSISTENCE ACTIVE
        </div>
      </div>

      {/* Right Section: Main Flow */}
      <div className="w-full lg:w-2/5 bg-[#050505] p-8 md:p-16 flex flex-col justify-center relative min-h-screen">
        <div className="lg:hidden mb-12 mt-8 lg:mt-0">
           <h1 className="text-6xl font-black leading-none tracking-tighter mb-2 italic">PUSH.</h1>
           <div className="text-zinc-600 font-mono text-[10px] tracking-widest uppercase flex items-center gap-2">
              <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
              Cloudinary Utility
           </div>
        </div>

        <div className="max-w-md w-full mx-auto space-y-12">
          {/* Success State Card - Moved here for mobile visibility */}
          <AnimatePresence>
            {uploadedUrl && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-zinc-900 border border-emerald-500/20 p-6 md:p-8 rounded-3xl shadow-2xl shadow-emerald-500/5"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"></div>
                  <span className="text-emerald-400 font-black text-xs uppercase tracking-[0.2em]">Upload Successful</span>
                </div>
                <div className="space-y-4">
                  <div className="bg-black p-3 rounded-xl border border-zinc-800 flex justify-between items-center group overflow-hidden">
                    <code className="text-[10px] md:text-xs text-zinc-400 truncate w-48 md:w-64 block font-mono">
                      {uploadedUrl}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(uploadedUrl)}
                      className="bg-zinc-800 hover:bg-white hover:text-black text-white text-[10px] px-4 py-2 rounded-lg uppercase font-black transition-all shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                      Size: {uploadStats?.size} &bull; Format: {uploadStats?.format}
                    </p>
                    <a 
                      href={uploadedUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="ml-auto text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tight">Configuration</h2>
              <button 
                onClick={logout}
                className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full flex items-center gap-2 hover:border-red-500/50 hover:bg-red-500/10 transition-all group"
              >
                 <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full group-hover:bg-red-500"></span>
                 <span className="text-[10px] uppercase font-bold text-zinc-400 group-hover:text-red-500">Exit Session</span>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0">
                  <CloudUpload className="text-zinc-500 w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Target Cloud</p>
                  <p className="text-sm font-mono truncate text-zinc-300">{maskString(CLOUD_NAME)}</p>
                </div>
              </div>
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0">
                  <Settings className="text-zinc-500 w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Unsigned Preset</p>
                  <p className="text-sm font-mono truncate text-zinc-300">{maskString(UPLOAD_PRESET)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="space-y-6">
            {!previewUrl ? (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-zinc-800 rounded-3xl p-10 text-center hover:border-white hover:bg-zinc-900/30 transition-all cursor-pointer group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  <ImageIcon className="w-10 h-10 mb-4 text-zinc-600 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                  <span className="font-black text-zinc-400 group-hover:text-white uppercase tracking-widest text-sm">Drop photo here</span>
                  <span className="text-[10px] text-zinc-700 mt-2 uppercase font-mono">Max size 10MB</span>
                </div>
              </div>
            ) : (
              <div className="relative group rounded-3xl overflow-hidden aspect-video border border-zinc-800 bg-black">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                  <button 
                    onClick={clearSelection}
                    className="p-4 bg-red-500/20 hover:bg-red-500 text-white rounded-full transition-all border border-red-500/20"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
            
            <button 
              onClick={handleUpload}
              disabled={isUploading || !file}
              className={cn(
                "w-full font-black uppercase py-5 rounded-full text-sm transition-all tracking-[0.3em] flex items-center justify-center gap-3",
                isUploading || !file 
                  ? "bg-zinc-900 text-zinc-600 cursor-not-allowed" 
                  : "bg-white text-black hover:scale-[1.02] active:scale-100"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  PUSHING...
                </>
              ) : (
                <>
                  INITIALIZE PUSH
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

