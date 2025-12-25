
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
  const [isEmbedded, setIsEmbedded] = useState(false);
  
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

  // Get current base URL without trailing slash or queries to avoid 404s
  const getBaseAppUrl = () => {
    return window.location.href.split('?')[0].replace(/\/$/, "");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === 'true') {
      setIsEmbedded(true);
    }
  }, []);

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

  const copySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetToHome = () => {
    stopCamera();
    setView('home');
    setState(prev => ({ ...prev, current: null, original: null, analysis: null }));
  };

  const HomeView = () => (
    <div className={`flex-1 flex flex-col items-center justify-center p-6 space-y-16 animate-in fade-in duration-1000 ${isEmbedded ? 'pt-0' : ''}`}>
      <div className="w-full max-w-3xl space-y-10 text-center">
        {!isEmbedded && (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <Globe className="w-3 h-3" /> Ecommerce Solution
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter leading-tight">
              See it. Shop it. <span className="text-transparent bg-clip-text accent-gradient">AI Powered.</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              Universal visual commerce assistant. Let your customers search your site using their camera.
            </p>
          </div>
        )}

        <div className="relative group max-w-2xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative flex items-center bg-[#151515] border border-white/10 rounded-[2.5rem] overflow-hidden h-24 px-8 gap-5">
            <Search className="w-7 h-7 text-slate-600" />
            <input 
              type="text" 
              placeholder="Search or upload a photo..." 
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

      {!isEmbedded && (
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
      )}
    </div>
  );

  const AssistantView = () => (
    <main className={`flex-1 container mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-8 duration-700 ${isEmbedded ? 'pt-0' : ''}`}>
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
                    <Palette className="w-4 h-4" />
                  </div>
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Instruction</h3>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What would you like to know?"
              className="w-full h-32 bg-black/60 border border-white/5 rounded-2xl p-5 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm placeholder:text-slate-700"
            />
          </div>

          <Button className="w-full py-5 text-xs font-black uppercase tracking-widest accent-gradient border-none" onClick={() => handleProcess()} isLoading={loading} disabled={!state.current}>
            Run AI
          </Button>
        </div>
      </div>

      <div className="lg:col-span-8">
        <div className="glass-card rounded-[3rem] overflow-hidden relative min-h-[600px] flex items-center justify-center border-white/5">
          {state.current ? (
            <div className="relative w-full h-full flex items-center justify-center p-12">
              <img src={state.current} className="max-w-full max-h-[70vh] object-contain rounded-3xl shadow-2xl" alt="Preview" />
              <div className="absolute bottom-10 right-10 flex gap-3">
                <Button variant="secondary" className="bg-white/10 border-white/10 backdrop-blur text-white h-12 rounded-2xl" onClick={() => setState(prev => ({ ...prev, current: prev.original, analysis: null }))}>
                  <RefreshCcw className="w-4 h-4" /> Revert
                </Button>
                <Button className="accent-gradient border-none h-12 rounded-2xl px-6">
                  Save <Download className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : isCameraActive ? (
            <div className="relative w-full aspect-[4/3] bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex flex-col items-center justify-end p-10 gap-6">
                <button onClick={capturePhoto} className="w-24 h-24 rounded-full border-[6px] border-white/20 flex items-center justify-center p-2">
                  <div className="w-full h-full rounded-full bg-white"></div>
                </button>
                <Button variant="danger" className="rounded-full px-8 h-12 uppercase text-[10px] font-black" onClick={stopCamera}>
                  <X className="w-4 h-4 mr-2" /> Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center p-16">
              <ImageIcon className="text-slate-700 w-16 h-16 mx-auto mb-6" />
              <div className="flex gap-4 justify-center">
                <Button className="accent-gradient border-none h-14 px-10 rounded-2xl" onClick={() => fileInputRef.current?.click()}>Upload</Button>
                <Button variant="ghost" className="h-14 px-8 border border-white/10 rounded-2xl" onClick={startCamera}>Camera</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 selection:bg-indigo-500/30 ${isEmbedded ? 'bg-transparent' : 'bg-[#080808]'}`}>
      {!isEmbedded && (
        <nav className="border-b border-white/5 px-8 py-6 flex items-center justify-between sticky top-0 z-50 glass-card">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={resetToHome}>
            <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center">
              <ShoppingBag className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">ShopVision</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-[10px] font-black uppercase border border-white/10" onClick={() => setShowIntegrate(true)}>
              <Code className="w-4 h-4 mr-2 text-indigo-400" /> Integrate
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
        </nav>
      )}

      {view === 'home' ? <HomeView /> : <AssistantView />}

      {/* INTEGRATION MODAL */}
      {showIntegrate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowIntegrate(false)} />
          <div className="relative w-full max-w-5xl glass-card rounded-[3rem] p-12 border-white/10 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowIntegrate(false)} className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full text-white">
              <X className="w-6 h-6" />
            </button>
            <div className="grid md:grid-cols-2 gap-16">
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 accent-gradient rounded-2xl flex items-center justify-center shadow-xl">
                    <Code className="text-white w-7 h-7" />
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tight leading-tight">Add Visual Search to Your Shop</h2>
                </div>
                
                <p className="text-slate-400 font-medium leading-relaxed">Copy this snippet to add a camera button to your site's search bar. It correctly handles complex URLs to prevent 404 errors.</p>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-indigo-400 tracking-widest">Ecommerce Code Snippet</h4>
                    <button 
                      onClick={() => window.open(getBaseAppUrl() + "?embed=true", '_blank')}
                      className="text-[10px] font-black uppercase text-white bg-white/10 px-3 py-1 rounded-lg flex items-center gap-2 hover:bg-white/20 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Test Embed Link
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="bg-black/60 rounded-2xl p-6 font-mono text-[11px] text-indigo-300 border border-white/5 h-64 overflow-auto leading-relaxed whitespace-pre">
{`<!-- 1. ADD THE BUTTON TO YOUR SEARCH BAR -->
<div class="search-wrap" style="position:relative; max-width:400px; font-family: sans-serif;">
  <input type="text" placeholder="Search products..." style="width:100%; padding:10px 45px 10px 15px; border-radius:20px; border:1px solid #ddd;">
  <button onclick="openShopVision()" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; padding:5px;">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">
       <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
       <circle cx="12" cy="13" r="4"></circle>
    </svg>
  </button>
</div>

<!-- 2. ADD THIS SCRIPT (FIXES 404 ERRORS) -->
<script>
  function openShopVision() {
    // Robust URL generation to prevent 404 errors
    const baseUrl = "${getBaseAppUrl()}";
    const finalUrl = baseUrl + "?embed=true";
    
    const width = 500;
    const height = 800;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(finalUrl, 'ShopVision', 
      'width='+width+',height='+height+',top='+top+',left='+left+',scrollbars=no,resizable=no');
  }
</script>`}
                    </div>
                    <button 
                      onClick={() => copySnippet(`<div class="search-wrap" style="position:relative; max-width:400px; font-family: sans-serif;">\n  <input type="text" placeholder="Search products..." style="width:100%; padding:10px 45px 10px 15px; border-radius:20px; border:1px solid #ddd;">\n  <button onclick="openShopVision()" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; padding:5px;">\n    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">\n       <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>\n       <circle cx="12" cy="13" r="4"></circle>\n    </svg>\n  </button>\n</div>\n\n<script>\n  function openShopVision() {\n    const baseUrl = "${getBaseAppUrl()}";\n    const finalUrl = baseUrl + "?embed=true";\n    const width = 500;\n    const height = 800;\n    window.open(finalUrl, 'ShopVision', 'width='+width+',height='+height+',scrollbars=no,resizable=no');\n  }\n</script>`)}
                      className="absolute top-4 right-4 p-3 bg-indigo-500 rounded-xl text-white shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-[2.5rem] p-12 flex flex-col justify-center space-y-12 border border-white/5">
                <div className="text-center space-y-2">
                  <h4 className="text-white font-bold text-lg">Real-Time Preview</h4>
                  <p className="text-slate-500 text-xs">Verify how it triggers the AI assistant:</p>
                </div>
                
                <div className="relative w-full max-w-sm mx-auto">
                   <div className="h-16 bg-white/5 rounded-2xl flex items-center px-6 border border-white/10">
                      <Search className="w-5 h-5 text-slate-600 mr-4" />
                      <div className="flex-1 text-slate-700 text-sm">Preview store...</div>
                      <button 
                        className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-lg"
                        onClick={() => startVisualSearch()}
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                   </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest text-center">Important Note</p>
                  <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-[11px] text-yellow-200/80 leading-relaxed">
                    If you still see a 404, check if your hosting platform blocks query parameters like <strong>?embed=true</strong>. Use the "Test Embed Link" above to verify your hosting settings first.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-2xl">
          <div className="w-24 h-24 border-[4px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="mt-8 text-xl font-black text-white">Gemini is processing...</p>
        </div>
      )}
    </div>
  );
};

export default App;
