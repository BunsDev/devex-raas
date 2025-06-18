"use client";

import { useEffect, useState, type MouseEvent } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  type MotionStyle,
  type MotionValue,
} from "motion/react";
import {
  Github,
  Play,
  Code,
  CheckCircle,
  Terminal,
  Sparkles,
} from "lucide-react";

const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

type WrapperStyle = MotionStyle & {
  "--x": MotionValue<string>;
  "--y": MotionValue<string>;
};

interface CardProps {
  title: string;
  description: string;
  bgClass?: string;
}

function FeatureCard({
  title,
  description,
  bgClass,
  children,
}: CardProps & {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const isMobile = useIsMobile();

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    if (isMobile) return;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.div
      className="animated-cards h-full relative w-full rounded-[16px]"
      onMouseMove={handleMouseMove}
      style={
        {
          "--x": useMotionTemplate`${mouseX}px`,
          "--y": useMotionTemplate`${mouseY}px`,
        } as WrapperStyle
      }
    >
      <div
        className={cn(
          "group relative h-full w-full overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-b from-neutral-900/90 to-stone-800 transition duration-300 dark:from-neutral-950/90 dark:to-neutral-800/90",
          "md:hover:border-transparent",
          bgClass,
        )}
      >
        <div className="m-6 h-full w-full">
          <div className="flex flex-col gap-3 mb-6">
            <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
              {title}
            </h2>
            <p className="text-sm leading-5 text-neutral-300 dark:text-zinc-400 sm:text-base sm:leading-5">
              {description}
            </p>
          </div>
          {mounted ? children : null}
        </div>
      </div>
    </motion.div>
  );
}

// Step 1: GitHub Authentication
function Step1Component() {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="mb-6"
        animate={{ rotate: isAnimating ? [0, 10, -10, 0] : 0 }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        <Github className="w-16 h-16 text-white" />
      </motion.div>

      <h3 className="text-white text-lg font-semibold mb-4 text-center">
        Authenticate with GitHub
      </h3>

      <motion.button
        className="flex items-center gap-3 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Github className="w-5 h-5" />
        Login with GitHub
      </motion.button>

      <motion.div
        className="mt-4 flex items-center gap-2 text-emerald-400 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: isAnimating ? 1 : 0 }}
        transition={{ delay: 1 }}
      >
        <CheckCircle className="w-4 h-4" />
        Secure OAuth Authentication
      </motion.div>
    </motion.div>
  );
}

// Step 2: Terminal Animation
function Step2Component() {
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const terminalSequence = [
    { text: "$ create new repl", delay: 500, isCommand: true },
    {
      text: "🔄 Initializing new development environment...",
      delay: 1000,
      isCommand: false,
    },
    { text: "📦 Setting up dependencies...", delay: 1500, isCommand: false },
    { text: "⚡ Configuring runtime...", delay: 2000, isCommand: false },
    {
      text: "✅ Created new repl successfully!",
      delay: 2500,
      isCommand: false,
    },
    {
      text: "🚀 Opening your development environment...",
      delay: 3000,
      isCommand: false,
    },
  ];

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];

    terminalSequence.forEach((item, index) => {
      const timeout = setTimeout(() => {
        setIsTyping(true);
        typeWriter(item.text, item.isCommand, () => {
          setLines((prev) => [...prev, item.text]);
          setCurrentLine("");
          setIsTyping(false);
        });
      }, item.delay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  const typeWriter = (
    text: string,
    isCommand: boolean,
    callback: () => void,
  ) => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setCurrentLine(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setTimeout(callback, 300);
      }
    }, 50);
  };

  return (
    <div className="bg-black border border-neutral-700 rounded-lg p-4 font-mono text-sm h-64 overflow-hidden">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-700">
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <span className="text-neutral-400 text-xs">Terminal</span>
      </div>

      <div className="text-emerald-400">
        {lines.map((line, index) => (
          <div key={index} className="mb-1">
            {line.startsWith("$") ? (
              <span className="text-white">{line}</span>
            ) : (
              <span className="text-emerald-400">{line}</span>
            )}
          </div>
        ))}

        {currentLine && (
          <div className="mb-1">
            {currentLine.startsWith("$") ? (
              <span className="text-white">{currentLine}</span>
            ) : (
              <span className="text-emerald-400">{currentLine}</span>
            )}
            {isTyping && <span className="animate-pulse">▋</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// Step 3: VS Code Editor
function Step3Component() {
  const [codeLines, setCodeLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState("");

  const code = [
    "import React from 'react';",
    "",
    "function App() {",
    "  return (",
    "    <div className='app'>",
    "      <h1>Hello DevX! 🚀</h1>",
    "      <p>Your cloud IDE is ready!</p>",
    "    </div>",
    "  );",
    "}",
    "",
    "export default App;",
  ];

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < code.length) {
        typeWriterCode(code[index], () => {
          setCodeLines((prev) => [...prev, code[index]]);
          setCurrentLine("");
          index++;
        });
      } else {
        clearInterval(timer);
      }
    }, 800);

    return () => clearInterval(timer);
  }, []);

  const typeWriterCode = (text: string, callback: () => void) => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= text.length) {
        setCurrentLine(text.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
        setTimeout(callback, 200);
      }
    }, 30);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg h-80 overflow-hidden">
      {/* VS Code Header */}
      <div className="flex items-center gap-2 p-3 bg-neutral-800 border-b border-neutral-700">
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Code className="w-4 h-4 text-blue-400" />
          <span className="text-white text-sm">App.jsx</span>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-4 font-mono text-sm h-full bg-neutral-900">
        <div className="text-neutral-400 mb-2">
          <span className="text-emerald-400">
            # Start coding in your DevX environment
          </span>
        </div>

        {codeLines.map((line, index) => (
          <div key={index} className="flex items-start gap-3 mb-1">
            <span className="text-neutral-500 text-xs w-6 text-right">
              {index + 1}
            </span>
            <code className="text-white">
              <span
                dangerouslySetInnerHTML={{
                  __html: syntaxHighlight(line),
                }}
              />
            </code>
          </div>
        ))}

        {currentLine && (
          <div className="flex items-start gap-3 mb-1">
            <span className="text-neutral-500 text-xs w-6 text-right">
              {codeLines.length + 1}
            </span>
            <code className="text-white">
              <span
                dangerouslySetInnerHTML={{
                  __html: syntaxHighlight(currentLine),
                }}
              />
              <span className="animate-pulse">▋</span>
            </code>
          </div>
        )}
      </div>
    </div>
  );
}

function syntaxHighlight(code: string): string {
  return code
    .replace(
      /import|from|function|return|export|default/g,
      '<span style="color: #e879f9">$&</span>',
    )
    .replace(/'[^']*'/g, '<span style="color: #10b981">$&</span>')
    .replace(/React|App/g, '<span style="color: #60a5fa">$&</span>')
    .replace(/className|div|h1|p/g, '<span style="color: #f59e0b">$&</span>');
}

// Step 4: Success Message
function Step4Component() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-emerald-900/50 to-neutral-900 border border-emerald-500/30 text-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="mb-6"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      >
        <Sparkles className="w-16 h-16 text-emerald-400" />
      </motion.div>

      <h3 className="text-white text-xl font-bold mb-4">🎉 Congratulations!</h3>

      <p className="text-emerald-400 text-lg mb-6">
        Your app is now running on the cloud
      </p>

      <div className="flex items-center gap-3 px-6 py-3 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg">
        <Play className="w-5 h-5" />
        <span className="font-medium">Live at: your-app.devx.cloud</span>
      </div>

      <motion.div
        className="mt-6 text-neutral-400 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Ready to build something amazing! ✨
      </motion.div>
    </motion.div>
  );
}

const steps = [
  { id: "1", name: "Authenticate" },
  { id: "2", name: "Initialize" },
  { id: "3", name: "Code" },
  { id: "4", name: "Deploy" },
];

interface StepComponents {
  step1: React.ComponentType<any>;
  step2: React.ComponentType<any>;
  step3: React.ComponentType<any>;
  step4: React.ComponentType<any>;
  step1Props?: any;
  step2Props?: any;
  step3Props?: any;
  step4Props?: any;
}

export function SkiperCard({
  components,
  step1Class,
  step2Class,
  step3Class,
  ...props
}: CardProps & {
  step1Class?: string;
  step2Class?: string;
  step3Class?: string;
  components: StepComponents;
}) {
  const { currentNumber: step, increment } = useNumberCycler();

  const {
    step1: Step1,
    step2: Step2,
    step3: Step3,
    step4: Step4,
    step1Props,
    step2Props,
    step3Props,
    step4Props,
  } = components;

  const getStepCaption = (stepNum: number) => {
    const captions = [
      "Connect your GitHub account securely",
      "Creating your cloud development environment",
      "Your personal IDE is ready to use",
      "Your application is live and deployed",
    ];
    return captions[stepNum];
  };

  return (
    <FeatureCard {...props}>
      {/* Step Progress */}
      <div className="mb-6">
        <Steps current={step} onChange={() => {}} steps={steps} />
      </div>

      {/* Step Caption */}
      <motion.div
        key={step}
        className="text-center mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-neutral-300 text-sm">{getStepCaption(step)}</p>
      </motion.div>

      {/* Step Content */}
      <div className="relative h-80">
        {/* Step 1 */}
        <motion.div
          className={cn("absolute inset-0 w-[95%]", step1Class)}
          initial={{ opacity: 0, x: -50 }}
          animate={{
            opacity: step === 1 ? 1 : 0,
            x: step === 1 ? 0 : -50,
          }}
          transition={{ duration: 0.5 }}
        >
          {step === 1 && <Step1 {...step1Props} />}
        </motion.div>

        {/* Step 2 */}
        <motion.div
          className={cn("absolute inset-0 w-[95%]", step2Class)}
          initial={{ opacity: 0, x: -50 }}
          animate={{
            opacity: step === 2 ? 1 : 0,
            x: step === 2 ? 0 : -50,
          }}
          transition={{ duration: 0.5 }}
        >
          {step === 2 && <Step2 {...step2Props} />}
        </motion.div>

        {/* Step 3 */}
        <motion.div
          className={cn("absolute inset-0 w-[95%]", step3Class)}
          initial={{ opacity: 0, x: -50 }}
          animate={{
            opacity: step === 3 ? 1 : 0,
            x: step === 3 ? 0 : -50,
          }}
          transition={{ duration: 0.5 }}
        >
          {step === 3 && <Step3 {...step3Props} />}
        </motion.div>

        {/* Step 4 */}
        <motion.div
          className="absolute inset-0 w-[95%]"
          initial={{ opacity: 0, x: -50 }}
          animate={{
            opacity: step === 0 ? 1 : 0,
            x: step === 0 ? 0 : -50,
          }}
          transition={{ duration: 0.5 }}
        >
          {step === 0 && <Step4 {...step4Props} />}
        </motion.div>
      </div>

      {/* Click overlay for navigation */}
      <div
        className="absolute inset-0 cursor-pointer z-10"
        onClick={() => increment()}
      />
    </FeatureCard>
  );
}

function IconCheck({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path d="m229.66 77.66-128 128a8 8 0 0 1-11.32 0l-56-56a8 8 0 0 1 11.32-11.32L96 188.69 218.34 66.34a8 8 0 0 1 11.32 11.32Z" />
    </svg>
  );
}

interface StepsProps {
  steps: { id: string; name: string }[];
  current: number;
  onChange: (stepIdx: number) => void;
}

export function Steps({ steps, current, onChange }: StepsProps) {
  return (
    <nav aria-label="Progress" className="flex justify-center px-4">
      <ol
        className="flex w-full flex-wrap items-start justify-center gap-2"
        role="list"
      >
        {steps.map((step, stepIdx) => {
          const isCompleted =
            current > stepIdx || (current === 0 && stepIdx < 4);
          const isCurrent =
            current === stepIdx || (current === 0 && stepIdx === 3);

          return (
            <li
              className={cn(
                "relative rounded-full px-3 py-2 transition-all duration-300 ease-in-out",
                isCompleted
                  ? "bg-emerald-600/20 border border-emerald-500/30"
                  : "bg-neutral-700/30 border border-neutral-600/30",
                isCurrent && "bg-emerald-600/30 border-emerald-500/50",
              )}
              key={`${step.name}-${stepIdx}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full w-6 h-6 text-xs font-medium transition-all duration-300",
                    isCompleted && "bg-emerald-600 text-white",
                    isCurrent &&
                      !isCompleted &&
                      "bg-emerald-600/50 text-emerald-200 border border-emerald-500/50",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-neutral-600 text-neutral-300",
                  )}
                >
                  {isCompleted ? (
                    <IconCheck className="w-3 h-3" />
                  ) : (
                    stepIdx + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium transition-all duration-300",
                    isCompleted && "text-emerald-400",
                    isCurrent && !isCompleted && "text-emerald-300",
                    !isCompleted && !isCurrent && "text-neutral-400",
                  )}
                >
                  {step.name}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function useNumberCycler() {
  const [currentNumber, setCurrentNumber] = useState(1);
  const [dummy, setDummy] = useState(0);

  const increment = () => {
    setCurrentNumber((prevNumber) => {
      return prevNumber === 0 ? 1 : (prevNumber + 1) % 4;
    });
    setDummy((prev) => prev + 1);
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentNumber((prevNumber) => {
        return prevNumber === 0 ? 1 : (prevNumber + 1) % 4;
      });
    }, 6000); // Increased timing for better animations

    return () => {
      clearInterval(intervalId);
    };
  }, [dummy]);

  return {
    increment,
    currentNumber,
  };
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isSmall = window.matchMedia("(max-width: 768px)").matches;
    const isMobileDevice = Boolean(
      /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.exec(
        userAgent,
      ),
    );

    setIsMobile(isSmall || isMobileDevice);
  }, []);

  return isMobile;
}

// Demo Component
function Demo() {
  return (
    <SkiperCard
      title="DevX Cloud IDE"
      description="Experience the future of cloud development with our seamless workflow"
      components={{
        step1: Step1Component,
        step2: Step2Component,
        step3: Step3Component,
        step4: Step4Component,
      }}
    />
  );
}

export default Demo;
