import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code, Zap, Shield, Globe } from "lucide-react";
import Waves from "../ui/waves";

export default function HeroSection() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      <Waves
        lineColor="#fff"
        backgroundColor="rgba(255, 255, 255, 0.2)"
        waveSpeedX={0.02}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={12}
        yGap={36}
      />

      <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

      <div className="relative z-10 container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <Badge
              variant="outline"
              className="border-emerald-500/80 bg-emerald-800/50 text-emerald-300 px-4 py-2 text-sm font-medium"
            >
              <Zap className="w-4 h-4 mr-2" />
              Repl-as-a-Service Platform
            </Badge>
          </div>

          <div className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8">
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Devex
            </span>
            <br />
          </div>

          {/* Main Heading */}
          <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold tracking-tight mb-8">
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              Your Best Developer Experience on Cloud
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            The ultimate cloud-based development IDE. Create, code, and deploy
            with
            <span className="text-emerald-400 font-semibold">
              {" "}
              isolated containers
            </span>
            ,
            <span className="text-emerald-400 font-semibold">
              {" "}
              dynamic scaling
            </span>
            , and
            <span className="text-emerald-400 font-semibold">
              {" "}
              seamless deployment
            </span>{" "}
            — all in your browser.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-full px-4 py-2 backdrop-blur-sm">
              <Code className="w-4 h-4 text-emerald-400" />
              <span className="text-gray-300 text-sm">Kubernetes Powered</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-full px-4 py-2 backdrop-blur-sm">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-gray-300 text-sm">Isolated Containers</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-full px-4 py-2 backdrop-blur-sm">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="text-gray-300 text-sm">Custom Subdomains</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-4 text-lg rounded-full transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
            >
              Start Coding Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-4 text-lg rounded-full transition-all duration-200"
            >
              View Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">
                99.9%
              </div>
              <div className="text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">
                {"<"}30s
              </div>
              <div className="text-gray-400">Deploy Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">
                ∞
              </div>
              <div className="text-gray-400">Scalability</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}
