"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Check,
  Star,
  Zap,
  Code,
  Database,
  Cpu,
  HardDrive,
  GitBranch,
  Box,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";

// Define your plans with DevX-specific features
const plans = [
  {
    name: "FREE",
    price: "0",
    yearlyPrice: "0",
    period: "forever",
    badge: "Perfect for Learning",
    features: [
      { icon: Code, text: "Up to 2 REPLs" },
      { icon: Cpu, text: "125m CPU per REPL" },
      { icon: HardDrive, text: "256Mi RAM per REPL" },
      { icon: Database, text: "200MB backup storage" },
      { icon: Box, text: "Basic container templates" },
      { icon: Shield, text: "Community support" },
    ],
    description: "Get started with cloud development for free",
    buttonText: "Start Coding",
    href: "/dashboard",
    isPopular: false,
    gradient: "from-gray-600 to-gray-800",
  },
  {
    name: "PROFESSIONAL",
    price: "15",
    yearlyPrice: "12",
    period: "per month",
    badge: "Most Popular",
    features: [
      { icon: Code, text: "Up to 25 REPLs" },
      { icon: Cpu, text: "1.25 CPU cores per REPL" },
      { icon: HardDrive, text: "2.5GB RAM per REPL" },
      { icon: Database, text: "15GB backup storage" },
      { icon: Sparkles, text: "Premium templates library" },
      { icon: GitBranch, text: "GitHub Actions integration" },
      { icon: Shield, text: "Priority support" },
      { icon: Zap, text: "Advanced analytics" },
    ],
    description: "Perfect for professional developers and teams",
    buttonText: "Go Professional",
    href: "/dashboard",
    isPopular: true,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    name: "ENTERPRISE SDK",
    price: "99",
    yearlyPrice: "79",
    period: "per month",
    badge: "For Businesses",
    features: [
      { icon: Code, text: "Unlimited REPLs" },
      { icon: Cpu, text: "Custom resource allocation" },
      { icon: Database, text: "Unlimited backup storage" },
      { icon: Box, text: "DevX Sandbox SDK access" },
      { icon: Zap, text: "API rate limiting: 10k/hour" },
      { icon: GitBranch, text: "Custom integrations" },
      { icon: Shield, text: "SLA & dedicated support" },
      { icon: Sparkles, text: "White-label options" },
    ],
    description: "Integrate DevX sandboxes into your applications",
    buttonText: "Contact Sales",
    href: "https://parthkapoor.me",
    isPopular: false,
    gradient: "from-purple-600 to-blue-600",
  },
];

interface PricingFeature {
  icon: any;
  text: string;
}

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  badge: string;
  features: PricingFeature[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  gradient: string;
}

export default function DevXPricing() {
  const [isMonthly, setIsMonthly] = useState(true);
  const switchRef = useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 60,
        spread: 70,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: ["#14b8a6", "#10b981", "#06b6d4", "#8b5cf6", "#f59e0b"],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle", "square"],
      });
    }
  };

  return (
    <div className="container py-20 max-md:px-8">
      {/* Header */}
      <div className="mb-16 flex flex-col gap-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 sm:text-6xl">
            Power Up Your Development
          </h2>
          <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto">
            From learning to enterprise-scale applications, DevX scales with
            your needs. Choose the perfect plan for your cloud development
            journey.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center items-center gap-4"
        >
          <span
            className={cn(
              "font-semibold transition-colors",
              isMonthly ? "text-white" : "text-gray-400",
            )}
          >
            Monthly
          </span>
          <label className="relative inline-flex cursor-pointer items-center">
            <Switch
              ref={switchRef as any}
              checked={!isMonthly}
              onCheckedChange={handleToggle}
              className="relative bg-amber-500"
            />
          </label>
          <span
            className={cn(
              "font-semibold transition-colors",
              !isMonthly ? "text-white" : "text-gray-400",
            )}
          >
            Annual
          </span>
          <span className="ml-2 px-2 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-full">
            Save 20%
          </span>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 gap-0 max-md:gap-4 md:grid-cols-3 max-w-7xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={
              !isMobile
                ? {
                    opacity: 1,
                    y: plan.isPopular ? -10 : 0,
                    x: index === 2 ? -20 : index === 0 ? 20 : 0,
                    scale: index === 0 || index === 2 ? 0.95 : 1.0,
                  }
                : { opacity: 1, y: 0 }
            }
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: index * 0.1,
            }}
            className={cn(
              "relative rounded-3xl border bg-black/40 backdrop-blur-sm p-8 text-center flex flex-col",
              plan.isPopular
                ? "border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/20"
                : "border-gray-600/30",
              "transform-gpu transition-all duration-300 hover:scale-[1.02]",
              index === 0 || index === 2 ? "z-0" : "z-10",
            )}
          >
            {/* Background Gradient */}
            <div
              className={cn(
                "absolute inset-0 rounded-3xl opacity-10 bg-gradient-to-br",
                plan.gradient,
              )}
            />

            {/* Popular Badge */}
            {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 rounded-full">
                  <Star className="h-4 w-4 fill-current text-white" />
                  <span className="text-white font-semibold text-sm">
                    Most Popular
                  </span>
                </div>
              </div>
            )}

            <div className="relative z-10 flex flex-1 flex-col">
              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-400 font-medium">
                  {plan.badge}
                </p>
              </div>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-5xl font-bold text-white">
                    <NumberFlow
                      value={
                        isMonthly
                          ? Number(plan.price)
                          : Number(plan.yearlyPrice)
                      }
                      format={{
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }}
                      transformTiming={{
                        duration: 500,
                        easing: "ease-out",
                      }}
                      willChange
                      className="font-variant-numeric: tabular-nums"
                    />
                  </span>
                  {plan.period !== "forever" && (
                    <span className="text-gray-400 text-sm">
                      / {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {plan.period === "forever"
                    ? "No credit card required"
                    : isMonthly
                      ? "billed monthly"
                      : "billed annually"}
                </p>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-2 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                      <feature.icon className="h-3 w-3 text-emerald-400" />
                    </div>
                    <span className="text-gray-300 text-sm text-left">
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href={plan.href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tight py-6 rounded-xl transition-all duration-300",
                  plan.isPopular
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
                    : "bg-transparent text-white border-gray-600 hover:bg-white hover:text-black hover:border-white",
                )}
              >
                {plan.buttonText}
              </Link>

              {/* Description */}
              <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                {plan.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-16 text-center"
      >
        <p className="text-gray-400 mb-4">
          Need something custom? We're here to help.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
        >
          Contact our team <Zap className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}
