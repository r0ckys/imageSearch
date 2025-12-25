
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
  ArrowRight,
  Code,
  Check,
  ChevronLeft,
  Mic,
  Copy,
  ExternalLink,
  Globe,
  Palette,
  Tag,
  DollarSign,
  Package,
  Star
} from 'lucide-react';
import { Button } from './components/Button';
import { analyzeProduct, visualizeProduct } from './services/geminiService';
import { ImageState, HistoryItem, AppMode, FilterPreset, ProductData } from './types';

const DEMO_IMAGES = [
  { id: '1', url: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=400', label: 'Eames Chair' },
  { id: '2', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400', label: 'Smart Watch' },
  { id: '3', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400', label: 'Headphones' },
];

const RETAIL_PRESETS: FilterPreset[] = [
  { id: 'luxury', label: 'Penthouse', prompt: 'Inside a luxury minimalist penthouse, golden hour lighting.', icon: 'Box' },
  { id: 'studio', label: 'Studio', prompt: 'Professional white studio background, cinematic soft light.', icon: 'Maximize2' },
  { id: 'scandi', label: 'Bright Home', prompt: 'Bright Scandinavian living room, light wood, plants.', icon: 'Layers' },
  { id: 'nature', label: 'Outdoor', prompt: 'Lush garden setting, natural morning sunlight, 85mm lens.', icon: 'Sun' },
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

  const getBaseAppUrl = () => window.location.origin;

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
      alert("Enable camera permissions.");
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
              <Sparkles className="w-3 h-3" /> Powered by Gemini AI
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-tight">
              Analyze. <span className="text-transparent bg-clip-text accent-gradient">Visualize.</span> Shop.
            </h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              Identify any product instantly and see it in your dream space.
            </p>
          </div>
        )}

        <div className="relative group max-w-2xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative flex items-center bg-[#151515] border border-white/10 rounded-[2.5rem] overflow-hidden h-24 px-8 gap-5">
            <Search className="w-7 h-7 text-slate-600" />
            <input 
              type="text" 
              placeholder="Paste image URL or search..." 
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
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Popular Queries</h4>
            <span className="text-[10px] text-indigo-400 font-bold">Quick test</span>
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
                    {img.label} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const AnalysisResults = ({ data }: { data: ProductData }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="md:col-span-2 glass-card rounded-2xl p-6 border-white/5">
        <h2 className="text-2xl font-black text-white mb-2">{data.name}</h2>
        <p className="text-slate-400 text-sm leading-relaxed">{data.description}</p>
      </div>
      
      <div className="glass-card rounded-2xl p-5 border-white/5 space-y-1">
        <div className="flex items-center gap-2 text-indigo-400 mb-2">
          <Tag className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Brand / Tier</span>
        </div>
        <p className="text-white font-bold">{data.brandSuggestion}</p>
      </div>

      <div className="glass-card rounded-2xl p-5 border-white/5 space-y-1">
        <div className="flex items-center gap-2 text-green-400 mb-2">
          <DollarSign className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Market Value</span>
        </div>
        <p className="text-white font-bold">{data.estimatedPrice}</p>
      </div>

      <div className="glass-card rounded-2xl p-5 border-white/5 space-y-3">
        <div className="flex items-center gap-2 text-orange-400">
          <Package className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Materials</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.materials.map((m, i) => (
            <span key={i} className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-slate-300 font-medium">{m}</span>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 border-white/5 space-y-3">
        <div className="flex items-center gap-2 text-purple-400">
          <Star className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Complements</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.complementaryItems.map((item, i) => (
            <span key={i} className="px-2 py-1 rounded bg-indigo-500/10 text-[10px] text-indigo-300 font-bold border border-indigo-500/20">{item}</span>
          ))}
        </div>
      </div>
    </div>
  );

  const AssistantView = () => (
    <main className={`flex-1 container mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-8 duration-700 ${isEmbedded ? 'pt-0' : ''}`}>
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-card rounded-[2rem] p-8 space-y-8 border-white/10 sticky top-32">
          <button onClick={resetToHome} className="flex items-center text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest gap-2">
            <ChevronLeft className="w-4 h-4" /> Exit Assistant
          </button>
          
          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Tool Selection</h3>
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
              <button onClick={() => setMode(AppMode.ANALYZE)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${mode === AppMode.ANALYZE ? 'bg-white text-black shadow-xl' : 'text-slate-400 hover:text-white'}`}>
                <Search className="w-4 h-4" /> Analysis
              </button>
              <button onClick={() => setMode(AppMode.EDIT)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${mode === AppMode.EDIT ? 'bg-white text-black shadow-xl' : 'text-slate-400 hover:text-white'}`}>
                <Sparkles className="w-4 h-4" /> Visualize
              </button>
            </div>
          </div>

          {mode === AppMode.EDIT && state.current && (
            <div className="grid grid-cols-2 gap-2">
              {RETAIL_PRESETS.map(p => (
                <button key={p.id} onClick={() => handleProcess(p.prompt)} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 transition-all text-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-1">
                    <Palette className="w-5 h-5" />
                  </div>
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Custom Prompt</h3>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === AppMode.ANALYZE ? "Ask specific questions..." : "Describe the environment..."}
              className="w-full h-24 bg-black/60 border border-white/5 rounded-2xl p-5 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm placeholder:text-slate-700"
            />
          </div>

          <Button className="w-full py-5 text-xs font-black uppercase tracking-widest accent-gradient border-none rounded-2xl" onClick={() => handleProcess()} isLoading={loading} disabled={!state.current}>
            Execute AI Magic
          </Button>

          <Button variant="ghost" onClick={() => setShowHistory(!showHistory)} className="w-full py-4 text-[10px] font-black uppercase tracking-widest border border-white/5 text-slate-500">
            <History className="w-4 h-4 mr-2" /> View Sessions ({state.history.length})
          </Button>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-8">
        <div className="glass-card rounded-[3rem] overflow-hidden relative min-h-[500px] flex items-center justify-center border-white/5 group">
          {state.current ? (
            <div className="relative w-full h-full flex items-center justify-center p-8 md:p-12">
              <img src={state.current} className="max-w-full max-h-[65vh] object-contain rounded-3xl shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]" alt="Active" />
              <div className="absolute bottom-10 right-10 flex gap-3">
                <Button variant="secondary" className="bg-black/40 border-white/10 backdrop-blur-xl text-white h-12 rounded-2xl px-5" onClick={() => setState(prev => ({ ...prev, current: prev.original, analysis: null }))}>
                  <RefreshCcw className="w-4 h-4 mr-2" /> Reset
                </Button>
                <Button className="accent-gradient border-none h-12 rounded-2xl px-6">
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </div>
            </div>
          ) : isCameraActive ? (
            <div className="relative w-full aspect-[16/9] bg-black overflow-hidden rounded-[3rem]">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 flex flex-col items-center justify-end p-10 gap-8">
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 animate-pulse">
                   <div className="w-2 h-2 rounded-full bg-red-500"></div>
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">Camera Live</span>
                </div>
                <button onClick={capturePhoto} className="w-24 h-24 rounded-full border-[6px] border-white/20 flex items-center justify-center p-2 group transition-all hover:scale-110 active:scale-95">
                  <div className="w-full h-full rounded-full bg-white group-hover:bg-indigo-400 transition-colors"></div>
                </button>
                <Button variant="danger" className="rounded-full px-8 h-12 uppercase text-[10px] font-black bg-white/10 backdrop-blur" onClick={stopCamera}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center p-20">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-indigo-500/20">
                <ImageIcon className="text-indigo-400 w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-6">No media active</h3>
              <div className="flex gap-4 justify-center">
                <Button className="accent-gradient border-none h-14 px-10 rounded-2xl" onClick={() => fileInputRef.current?.click()}>Upload Photo</Button>
                <Button variant="ghost" className="h-14 px-8 border border-white/10 rounded-2xl text-white" onClick={startCamera}>Open Camera</Button>
              </div>
            </div>
          )}
        </div>

        {state.analysis && mode === AppMode.ANALYZE && (
          <AnalysisResults data={state.analysis} />
        )}

        {showHistory && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-500">
            {state.history.length === 0 && (
              <div className="col-span-full py-10 text-center glass-card rounded-3xl border-dashed border-white/5 text-slate-600 text-xs font-bold uppercase tracking-widest">
                Session history is empty
              </div>
            )}
            {state.history.map(item => (
              <button 
                key={item.id} 
                onClick={() => setState(prev => ({ ...prev, current: item.url }))}
                className="group relative aspect-square rounded-3xl overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all"
              >
                <img src={item.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <RefreshCcw className="text-white w-6 h-6" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 selection:bg-indigo-500/30 ${isEmbedded ? 'bg-transparent' : 'bg-[#080808]'}`}>
      {!isEmbedded && (
        <nav className="border-b border-white/5 px-8 py-6 flex items-center justify-between sticky top-0 z-[100] glass-card">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={resetToHome}>
            <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShoppingBag className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">ShopVision <span className="text-indigo-500 text-[10px] ml-1 uppercase">AI</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-[10px] font-black uppercase border border-white/10 px-6 h-11" onClick={() => setShowIntegrate(true)}>
              <Code className="w-4 h-4 mr-2 text-indigo-400" /> API Integration
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
        </nav>
      )}

      {view === 'home' ? <HomeView /> : <AssistantView />}

      {/* INTEGRATION MODAL */}
      {showIntegrate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowIntegrate(false)} />
          <div className="relative w-full max-w-5xl glass-card rounded-[3.5rem] p-12 border-white/10 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowIntegrate(false)} className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full text-white">
              <X className="w-6 h-6" />
            </button>
            <div className="grid md:grid-cols-2 gap-16">
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 accent-gradient rounded-[1.5rem] flex items-center justify-center shadow-2xl">
                    <Code className="text-white w-8 h-8" />
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tight leading-tight">Universal Visual Commerce</h2>
                </div>
                
                <p className="text-slate-400 font-medium leading-relaxed text-lg">Bring the power of Gemini Vision to your own storefront. One script, endless retail possibilities.</p>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Embed Snippet (Copy & Paste)</h4>
                  </div>
                  <div className="relative group">
                    <div className="bg-black/60 rounded-[2rem] p-8 font-mono text-[11px] text-indigo-300 border border-white/5 h-80 overflow-auto leading-relaxed whitespace-pre thin-scrollbar">
{`<!-- 1. BUTTON ELEMENT -->
<div class="search-with-ai" style="position:relative; width:100%;">
  <input type="text" placeholder="Search with AI..." style="width:100%; border:1px solid #eee; border-radius:30px; padding:15px 50px 15px 20px;">
  <button onclick="openShopVision()" style="position:absolute; right:15px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer;">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
  </button>
</div>

<!-- 2. POPUP HANDLER -->
<script>
  function openShopVision() {
    const url = "${getBaseAppUrl()}/?embed=true";
    const w = 480, h = 800;
    const l = (screen.width - w) / 2, t = (screen.height - h) / 2;
    window.open(url, 'ShopVision', 'width='+w+',height='+h+',top='+t+',left='+l);
  }
</script>`}
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`<script>\n  function openShopVision() {\n    const url = "${getBaseAppUrl()}/?embed=true";\n    window.open(url, 'ShopVision', 'width=480,height=800');\n  }\n</script>`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="absolute top-6 right-6 p-4 bg-indigo-500 rounded-2xl text-white shadow-2xl opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-[3rem] p-12 flex flex-col justify-center space-y-12 border border-white/5">
                <div className="text-center space-y-4">
                  <h4 className="text-white font-black text-2xl">Production Ready</h4>
                  <p className="text-slate-500 text-sm">Follow these steps for a perfect launch:</p>
                </div>
                
                <div className="space-y-4">
                   {[
                     { step: 1, text: "Push code to Vercel/GitHub" },
                     { step: 2, text: "Add API_KEY to Environment Variables" },
                     { step: 3, text: "Paste the snippet in your site footer" }
                   ].map(item => (
                     <div key={item.step} className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-5 group hover:bg-white/10 transition-all cursor-default">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">{item.step}</div>
                        <div className="text-sm text-slate-300 font-bold">{item.text}</div>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/80 backdrop-blur-3xl">
          <div className="relative">
             <div className="w-32 h-32 border-[2px] border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
             <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
             </div>
          </div>
          <p className="mt-10 text-2xl font-black text-white tracking-tight">Gemini is processing...</p>
          <p className="mt-2 text-slate-500 text-sm font-bold uppercase tracking-widest">Optimizing pixels & data</p>
        </div>
      )}
    </div>
  );
};

export default App;
