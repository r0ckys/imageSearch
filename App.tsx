
import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingBag, 
  Sparkles, 
  Search, 
  History, 
  Download, 
  Camera, 
  X, 
  RefreshCcw,
  Image as ImageIcon,
  Box,
  Layers,
  Info,
  ArrowRight,
  Upload,
  Code,
  Check,
  ChevronLeft,
  Share2,
  Mic,
  Copy,
  ExternalLink,
  Globe,
  Palette
} from 'lucide-react';
import { Button } from './components/Button';
import { analyzeProduct, visualizeProduct } from './services/geminiService';
import { ImageState, HistoryItem, AppMode, FilterPreset } from './types';

const DEMO_IMAGES = [
  { id: '1', url: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=400', label: 'Eames Chair' },
  { id: '2', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400', label: 'Smart Watch' },
  { id: '3', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400', label: 'Headphones' },
];

const RETAIL_PRESETS: FilterPreset[] = [
  { id: 'luxury', label: 'Luxury Room', prompt: 'Visualize this product in a high-end, luxury minimalist penthouse during golden hour.', icon: 'Box' },
  { id: 'studio', label: 'Studio Shot', prompt: 'Render this product in a professional white studio background with soft cinematic lighting.', icon: 'Maximize2' },
  { id: 'scandi', label: 'Scandinavian', prompt: 'Show this product in a bright, airy Scandinavian living room with light wood accents.', icon: 'Layers' },
  { id: 'vintage', label: 'Vintage Style', prompt: 'Apply a vintage film aesthetic to this image. Warm tones, subtle film grain, and a classic retro 1970s photography style.', icon: 'Palette' },
];

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'assistant'>('home');
  const [state, setState] = useState<ImageState>({
    original: null,
    current: null,
    analysis: null,
    history: []
  });
  const [mode, setMode] = useState<AppMode>(AppMode.ANALYZE);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showIntegrate, setShowIntegrate] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setState(prev => ({ ...prev, original: url, current: url, analysis: null }));
        setView('assistant');
      };
      reader.readAsDataURL(file);
    }
  };

  const useDemoImage = (url: string) => {
    setState(prev => ({ ...prev, original: url, current: url, analysis: null }));
    setView('assistant');
  };

  const startVisualSearch = () => {
    setView('assistant');
    setTimeout(() => startCamera(), 300);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      alert("Please enable camera permissions to use Visual Search.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const url = canvasRef.current.toDataURL('image/jpeg');
        setState(prev => ({ ...prev, original: url, current: url, analysis: null }));
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const handleProcess = async (customPrompt?: string) => {
    if (!state.current) return;
    setLoading(true);
    const finalPrompt = customPrompt || prompt;

    try {
      if (mode === AppMode.ANALYZE && !customPrompt) {
        const result = await analyzeProduct(state.current, finalPrompt);
        setState(prev => ({ ...prev, analysis: result }));
      } else {
        const resultUrl = await visualizeProduct(state.current, finalPrompt);
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          url: resultUrl,
          prompt: finalPrompt,
          timestamp: Date.now()
        };
        setState(prev => ({
          ...prev,
          current: resultUrl,
          history: [newItem, ...prev.history]
        }));
        if (!customPrompt) setPrompt('');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyEmbed = () => {
    const code = `<button onclick="window.open('${window.location.href}?embed=true')"><img src="camera-icon.png" /></button>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetToHome = () => {
    stopCamera();
    setView('home');
    setState(prev => ({ ...prev, current: null, original: null, analysis: null }));
  };

  const HomeView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-16 animate-in fade-in duration-1000">
      <div className="w-full max-w-3xl space-y-10 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4">
            <Globe className="w-3 h-3" /> Public Release v1.2
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter leading-tight">
            See it. Shop it. <span className="text-transparent bg-clip-text accent-gradient">AI Powered.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            The world's first universal visual commerce assistant. Analyze materials, styles, and visualize products in your home instantly.
          </p>
        </div>

        {/* SEARCH BAR ENTRY POINT */}
        <div className="relative group max-w-2xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative flex items-center bg-[#151515] border border-white/10 rounded-[2.5rem] overflow-hidden h-24 px-8 gap-5">
            <Search className="w-7 h-7 text-slate-600" />
            <input 
              type="text" 
              placeholder="Search for clothes, furniture, or upload a photo..." 
              className="flex-1 bg-transparent border-none outline-none text-white text-xl placeholder:text-slate-700 font-medium"
            />
            <div className="flex items-center gap-3">
              <button className="p-3 text-slate-600 hover:text-indigo-400 transition-colors">
                <Mic className="w-6 h-6" />
              </button>
              <div className="w-px h-10 bg-white/10 mx-2" />
              <button 
                onClick={startVisualSearch}
                className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500 text-white hover:bg-indigo-400 transition-all shadow-2xl shadow-indigo-500/40 group/btn"
              >
                <Camera className="w-7 h-7 group-hover/btn:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DEMO GALLERY */}
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Quick Demos</h4>
          <span className="text-[10px] text-indigo-400 font-bold">Try one-click AI analysis</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {DEMO_IMAGES.map(img => (
            <button 
              key={img.id}
              onClick={() => useDemoImage(img.url)}
              className="group relative h-48 rounded-3xl overflow-hidden border border-white/5 bg-white/5 hover:border-indigo-500/50 transition-all"
            >
              <img src={img.url} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  {img.label} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const AssistantView = () => (
    <main className="flex-1 container mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-8 duration-700">
      <div className="lg:col-span-4 space-y-8">
        <div className="glass-card rounded-[2rem] p-8 space-y-8 border-white/10">
          <button onClick={resetToHome} className="flex items-center text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest gap-2">
            <ChevronLeft className="w-4 h-4" /> Exit Workspace
          </button>
          
          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Workspace Mode</h3>
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
              <button onClick={() => setMode(AppMode.ANALYZE)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${mode === AppMode.ANALYZE ? 'bg-white text-black shadow-xl' : 'text-slate-400 hover:text-white'}`}>
                <Search className="w-4 h-4" /> Insight
              </button>
              <button onClick={() => setMode(AppMode.EDIT)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${mode === AppMode.EDIT ? 'bg-white text-black shadow-xl' : 'text-slate-400 hover:text-white'}`}>
                <Sparkles className="w-4 h-4" /> Visualizer
              </button>
            </div>
          </div>

          {state.current && (
            <div className="grid grid-cols-2 gap-2">
              {RETAIL_PRESETS.map(p => (
                <button key={p.id} onClick={() => handleProcess(p.prompt)} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 transition-all text-left">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                    {p.id === 'vintage' ? <Palette className="w-4 h-4" /> : <Box className="w-4 h-4" />}
                  </div>
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Custom Instruction</h3>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'What is this made of?' or 'Put this in a modern loft'"
              className="w-full h-32 bg-black/60 border border-white/5 rounded-2xl p-5 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm placeholder:text-slate-700"
            />
          </div>

          <Button className="w-full py-5 text-xs font-black uppercase tracking-widest accent-gradient border-none" onClick={() => handleProcess()} isLoading={loading} disabled={!state.current}>
            Execute AI Task
          </Button>
        </div>

        {state.analysis && (
          <div className="glass-card rounded-[2rem] p-8 space-y-6 border-white/10 animate-in fade-in duration-500">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">Gemini Intelligence</h3>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed font-light italic">
               {state.analysis.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-8">
        <div className="glass-card rounded-[3rem] overflow-hidden relative group min-h-[600px] flex items-center justify-center border-white/5">
          {state.current ? (
            <div className="relative w-full h-full flex items-center justify-center p-12">
              <img src={state.current} className="max-w-full max-h-[70vh] object-contain rounded-3xl shadow-2xl" alt="Preview" />
              <div className="absolute top-10 left-10">
                <span className="bg-white/10 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                  {state.current === state.original ? 'Original Source' : 'AI Render'}
                </span>
              </div>
              <div className="absolute bottom-10 right-10 flex gap-3">
                <Button variant="secondary" className="bg-white/10 border-white/10 backdrop-blur text-white h-12 rounded-2xl" onClick={() => setState(prev => ({ ...prev, current: prev.original, analysis: null }))}>
                  <RefreshCcw className="w-4 h-4 mr-2" /> Revert
                </Button>
                <Button className="accent-gradient border-none h-12 rounded-2xl px-6">
                  Save Visualization <Download className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : isCameraActive ? (
            <div className="relative w-full aspect-[4/3] bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex flex-col items-center justify-end p-10 gap-6">
                <button onClick={capturePhoto} className="w-24 h-24 rounded-full border-[6px] border-white/20 hover:border-white transition-all flex items-center justify-center p-2">
                  <div className="w-full h-full rounded-full bg-white"></div>
                </button>
                <Button variant="danger" className="rounded-full px-8 h-12 uppercase text-[10px] font-black" onClick={stopCamera}>
                  <X className="w-4 h-4 mr-2" /> Exit Camera
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-8 p-16">
              <div className="w-24 h-24 bg-white/5 rounded-[2rem] mx-auto flex items-center justify-center border border-white/5">
                <ImageIcon className="text-slate-700 w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">No Visual Selected</h2>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">Upload a product image or open the camera to begin your visual journey.</p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button className="accent-gradient border-none h-14 px-10 rounded-2xl" onClick={() => fileInputRef.current?.click()}>
                   Upload Photo
                </Button>
                <Button variant="ghost" className="h-14 px-8 border border-white/10 rounded-2xl" onClick={startCamera}>
                  <Camera className="w-5 h-5 mr-3" /> Live Camera
                </Button>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500 bg-[#080808] selection:bg-indigo-500/30">
      <nav className="border-b border-white/5 px-8 py-6 flex items-center justify-between sticky top-0 z-50 glass-card">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={resetToHome}>
          <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
            <ShoppingBag className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tight text-white leading-none">ShopVision</h1>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Universal AI</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-[10px] font-black uppercase border border-white/10" onClick={() => setShowIntegrate(true)}>
            <Code className="w-4 h-4 mr-2 text-indigo-400" /> Integrate
          </Button>
          <Button variant="ghost" className="text-[10px] font-black uppercase border border-white/10" onClick={() => setShowHistory(true)}>
            <History className="w-4 h-4 mr-2" /> Lookbook
          </Button>
          <Button variant="primary" className="accent-gradient border-none rounded-xl h-10 px-5 text-[10px] font-black uppercase shadow-xl" onClick={() => alert('App link copied to clipboard!')}>
            <Share2 className="w-4 h-4 mr-2" /> Share App
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>
      </nav>

      {view === 'home' ? <HomeView /> : <AssistantView />}

      {/* FLOATING ACTION */}
      {view === 'home' && (
        <button 
          onClick={() => setShowIntegrate(true)}
          className="fixed bottom-10 right-10 bg-white text-black px-6 py-4 rounded-3xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all z-40 border border-black/10"
        >
          <Code className="w-5 h-5" /> Add to Your Site
        </button>
      )}

      {/* INTEGRATION MODAL */}
      {showIntegrate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowIntegrate(false)} />
          <div className="relative w-full max-w-4xl glass-card rounded-[3rem] p-12 border-white/10 animate-in zoom-in duration-300">
            <button onClick={() => setShowIntegrate(false)} className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full text-white">
              <X className="w-6 h-6" />
            </button>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="w-16 h-16 accent-gradient rounded-2xl flex items-center justify-center">
                  <Code className="text-white w-8 h-8" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-white tracking-tight leading-tight">Bring AI to your Search Bar</h2>
                  <p className="text-slate-400 font-medium">Add the ShopVision Camera Icon to your search bar to allow customers to search by photo. Perfect for Shopify, Wix, or custom sites.</p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-indigo-400">Step 1: Your Embed Code</h4>
                  <div className="relative group">
                    <div className="bg-black/60 rounded-2xl p-6 font-mono text-[11px] text-indigo-300 border border-white/5 h-32 overflow-auto">
                      &lt;iframe src="{window.location.href}?embed=true" width="100%" height="700px" style="border:none;"&gt;&lt;/iframe&gt;
                    </div>
                    <button 
                      onClick={copyEmbed}
                      className="absolute top-4 right-4 p-2 bg-indigo-500 rounded-lg text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-indigo-500/10 rounded-[2.5rem] p-10 flex flex-col justify-center space-y-10 border border-indigo-500/20">
                <div className="space-y-2">
                  <h4 className="text-white font-bold">Visual Search Preview</h4>
                  <p className="text-indigo-200/50 text-xs">How it will look in your header:</p>
                </div>
                <div className="relative max-w-sm mx-auto w-full">
                   <div className="h-14 bg-white/10 rounded-2xl flex items-center px-4 border border-white/10">
                      <Search className="w-4 h-4 text-slate-500 mr-3" />
                      <div className="flex-1 text-slate-600 text-xs">Search brands...</div>
                      <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                        <Camera className="w-4 h-4" />
                      </div>
                   </div>
                </div>
                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">1</div>
                    <p className="text-xs text-indigo-100 font-medium">Copy the generated code snippet.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">2</div>
                    <p className="text-xs text-indigo-100 font-medium">Paste it into your theme's header file.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">3</div>
                    <p className="text-xs text-indigo-100 font-medium">Go live and watch your conversions grow.</p>
                  </div>
                </div>
                <Button className="w-full h-14 bg-white text-indigo-600 hover:bg-indigo-50 border-none font-black text-[11px] uppercase">
                   View Documentation <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowHistory(false)} />
          <div className="relative w-full max-w-sm bg-[#0a0a0a] h-full shadow-2xl p-10 overflow-y-auto animate-in slide-in-from-right duration-500 border-l border-white/5">
             <div className="flex items-center justify-between mb-12">
               <h3 className="text-xl font-black text-white uppercase tracking-tighter">Your Lookbook</h3>
               <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6 text-white" /></button>
             </div>
             {state.history.length === 0 ? (
               <div className="text-center py-20 space-y-6">
                  <Sparkles className="w-12 h-12 text-slate-800 mx-auto" />
                  <p className="text-slate-600 text-sm font-medium">Capture styles to start your collection.</p>
               </div>
             ) : (
               <div className="space-y-8">
                {state.history.map(item => (
                  <div key={item.id} className="group relative rounded-3xl overflow-hidden border border-white/10 bg-white/5">
                    <img src={item.url} className="w-full h-56 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="p-4">
                      <p className="text-[10px] text-slate-500 italic line-clamp-2">{item.prompt}</p>
                    </div>
                  </div>
                ))}
               </div>
             )}
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-2xl">
          <div className="relative">
            <div className="w-32 h-32 border-[6px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <Sparkles className="absolute inset-0 m-auto text-indigo-400 w-10 h-10 animate-pulse" />
          </div>
          <p className="mt-12 text-3xl font-black text-white tracking-tighter">Generating Vision...</p>
          <p className="mt-2 text-indigo-400/60 font-medium">Powered by Gemini AI</p>
        </div>
      )}
    </div>
  );
};

export default App;
