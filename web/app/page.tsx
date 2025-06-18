import {
  ChevronRight,
  Code,
  Zap,
  Cloud,
  GitBranch,
  Play,
  Terminal,
  Layers,
} from "lucide-react";
import HeroSection from "@/components/landing/Hero";
import Waves from "@/components/ui/waves";
import Previews from "@/components/landing/Previews";
import FeaturedPills from "@/components/landing/FeaturedPills";

const LandingPage = () => {
  return (
    <div className="z-10 relative overflow-hidden  pb-20">
      <Waves
        lineColor="#10b981" // Emerald green to match theme
        backgroundColor="rgba(16, 185, 129, 0.03)" // Very subtle emerald background
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
      <div className="max-w-6xl mx-auto text-center">
        <HeroSection />
        <FeaturedPills />
      </div>
    </div>
  );
};

export default LandingPage;
