import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code, Zap, Shield, Globe } from "lucide-react";
import Waves from "../ui/waves";
import MatrixText from "../ui/matrix-text";
import { ScrollComponent } from "../ui/container-scoll-animation";
import GithubStarButton from "../ui/github-star";
import Previews from "./Previews";

export default function HeroSection() {
  return (
    <ScrollComponent titleComponent={<Component />}>
      <Previews />
    </ScrollComponent>
  );
}

function Component() {
  return (
    <div>
      <GithubStarButton />
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
