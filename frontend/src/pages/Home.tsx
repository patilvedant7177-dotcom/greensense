import { useNavigate } from 'react-router-dom'
import { ArrowRight, Zap, BarChart3, ShieldCheck } from 'lucide-react'

import { Button } from '../components/ui/Button'
import { PageShell } from '../components/ui/PageShell'

export function Home() {
  const navigate = useNavigate()

  return (
    <PageShell appName="Intelligence Hub" className="p-0 border-0 bg-transparent shadow-none">
      <div className="relative min-h-[85vh] overflow-hidden rounded-[40px] bg-bgPrimary border border-border">
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />

        <div className="relative flex h-full min-h-[85vh] flex-col lg:flex-row">
          {/* Left Column: Content */}
          <div className="flex flex-1 flex-col justify-center px-12 py-16 lg:px-20">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-textPrimary">
                <Zap className="h-3 w-3 fill-accent" />
                Next-Gen Solar Intelligence
              </div>
              
              <h1 className="text-4xl font-black leading-[1.2] tracking-tighter text-textPrimary lg:text-5xl">
                GreenSense: <br />
                <span className="font-bold">
                  Intelligent Decision <br />
                  Support System <br />
                </span>
                for Solar Panel
              </h1>
              
              <p className="max-w-xl text-lg leading-relaxed text-textMuted">
                GreenSense provides real-time digital twins for your solar installations. 
                Detect faults, optimize load, and track every watt with precision.
              </p>

              <div className="flex flex-col gap-4 pt-6 sm:flex-row">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="h-14 px-10 text-base shadow-xl shadow-accent/20"
                  onClick={() => navigate('/config')}
                >
                  Configure Your Panel
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-16">
                {[
                  { icon: BarChart3, label: 'Real-time', sub: 'Analytics' },
                  { icon: ShieldCheck, label: 'Fault', sub: 'Prediction' },
                  { icon: Zap, label: 'Instant', sub: 'Insights' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <item.icon className="h-6 w-6 text-accent" />
                    <p className="text-sm font-bold uppercase tracking-tight text-textPrimary">{item.label}</p>
                    <p className="text-[11px] text-textMuted uppercase tracking-widest font-medium">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Graphic */}
          <div className="relative flex flex-1 items-center justify-center bg-bgSurface/50 p-12 lg:p-0">
            <div className="relative z-10 w-full max-w-2xl transform transition-transform hover:scale-105 duration-700">
               <img 
                 src="/hero.png" 
                 alt="GreenSense Hero" 
                 className="w-full drop-shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]"
               />
               
               {/* Floating Info Cards */}
               <div className="absolute -left-8 top-1/4 animate-bounce-slow rounded-3xl border border-border bg-white/80 p-4 shadow-xl backdrop-blur-md">
                 <div className="flex items-center gap-3">
                   <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                     <Zap className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-textMuted uppercase">Efficiency</p>
                     <p className="text-sm font-black text-textPrimary">98.4%</p>
                   </div>
                 </div>
               </div>

               <div className="absolute -right-4 bottom-1/4 animate-bounce-slow-delayed rounded-3xl border border-border bg-white/80 p-4 shadow-xl backdrop-blur-md">
                 <div className="flex items-center gap-3">
                   <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black">
                     <BarChart3 className="h-5 w-5 text-accent" />
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-textMuted uppercase">Savings</p>
                     <p className="text-sm font-black text-textPrimary">+$124.50</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

export default Home
