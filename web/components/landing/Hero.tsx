"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code, Zap, Shield, Globe } from "lucide-react";
import Waves from "../ui/waves";
import MatrixText from "../ui/matrix-text";
import { ScrollComponent } from "../ui/container-scoll-animation";
import GithubStarButton from "../ui/github-star";
import Previews from "./Previews";
import HeroVideoDialog from "../magicui/hero-video-dialog";
import { useState } from "react";

export default function HeroSection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  return (
    <>
      <HeroVideoDialog
        isVideoOpen={isVideoOpen}
        setIsVideoOpen={setIsVideoOpen}
        animationStyle="from-center"
        videoSrc="https://www.youtube.com/embed/Tlck20bJeFE"
      />
      <ScrollComponent
        titleComponent={<Component openVideo={() => setIsVideoOpen(true)} />}
      >
        <Previews />
      </ScrollComponent>
    </>
  );
}

function Component({ openVideo }: { openVideo: () => void }) {
  return (
    <div className="max-md:pt-28">
      <GithubStarButton />
      {/* Badge */}
      <div
        className="flex justify-center mb-8 cursor-pointer"
        onClick={openVideo}
      >
        <Badge
          variant="outline"
          className="border-emerald-500/80 bg-emerald-800/50 text-emerald-300 hover:bg-emerald-600 hover:text-white duration-300 transition-colors px-4 py-2 text-sm font-medium"
        >
          <Zap className="w-4 h-4 mr-2" />
          Checkout Demo Video
        </Badge>
      </div>

      <div className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8">
        <MatrixText text="DevEx" />
      </div>

      {/* Main Heading */}
      <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold tracking-tight mb-8">
        <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent ">
          Your Best Developer Experience on Cloud
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
        The ultimate cloud-based development IDE. Create, code, and deploy with
        <span className="text-emerald-400 font-semibold">
          {" "}
          isolated containers
        </span>
        ,
        <span className="text-emerald-400 font-semibold"> dynamic scaling</span>
        , and
        <span className="text-emerald-400 font-semibold">
          {" "}
          seamless deployment
        </span>{" "}
        — all in your browser.
      </p>
    </div>
  );
}
