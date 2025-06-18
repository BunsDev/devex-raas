"use client";
import React, { useState } from "react";

const MarioButton: React.FC = () => {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    setIsActive(!isActive);
  };

  return (
    <div className="relative block w-16 h-16 cursor-pointer">
      <button
        type="button"
        className={`
          w-full h-full border-2 border-stone-800 rounded
          bg-yellow-400 hover:bg-yellow-300
          ${isActive ? "bg-stone-800 hover:bg-stone-700" : ""}
          outline-2 outline-transparent outline-offset-2
          focus-visible:outline-stone-800 focus-visible:outline-dashed
          active:outline-stone-800 transition-colors duration-200
          dark:active:outline-yellow-400 dark:focus-visible:outline-yellow-400
        `}
        onClick={handleClick}
      />
      <span
        className={`
          absolute inset-[3px] pointer-events-none bg-yellow-400
          border-b-2 border-black/25 transition-transform duration-75
          before:content-[''] before:absolute before:inset-0
          before:bg-[radial-gradient(rgb(255,255,255,0.8)_20%,transparent_20%),radial-gradient(rgb(255,255,255,1)_20%,transparent_20%)]
          before:bg-[length:8px_8px] before:bg-[position:0_0,4px_4px]
          before:mix-blend-hard-light before:opacity-50 before:animate-dots
        `}
      />
      <span
        className={`
          absolute inset-0 pointer-events-none
          before:content-[''] before:absolute before:top-1 before:left-1
          before:w-[0.375rem] before:h-[0.375rem] before:bg-stone-800
          before:rounded-sm
          before:shadow-[3.125em_0_var(--stone-800),0_3.125em_var(--stone-800),3.125em_3.125em_var(--stone-800)]
        `}
      />
      <span
        className={`
          absolute inset-0 pointer-events-none
          transition-all duration-75
          ${isActive ? "shadow-[0.125em_0.125em_0_rgba(0,0,0,0.2)]" : "shadow-[0.25em_0.25em_0_rgba(0,0,0,0.2)]"}
          after:content-[''] after:absolute after:top-[0.875rem] after:left-4
          after:w-1 after:h-1 after:bg-stone-800 after:rounded-[0.0625px]
          after:shadow-[0.75em_2em_var(--stone-800),1em_2em_var(--stone-800),0.75em_1.75em_var(--stone-800),1em_1.75em_var(--stone-800),0.75em_1.25em_var(--stone-800),1em_1.25em_var(--stone-800),0.75em_1em_var(--stone-800),1em_1em_var(--stone-800),1em_0.75em_var(--stone-800),1.5em_0.75em_var(--stone-800),1.25em_0.75em_var(--stone-800),1.25em_-0.25em_var(--stone-800),1.5em_0em_var(--stone-800),1.25em_0.5em_var(--stone-800),1.5em_0.5em_var(--stone-800),1.25em_0.25em_var(--stone-800),1.5em_0.25em_var(--stone-800),1.25em_0_var(--stone-800),1em_-0.25em_var(--stone-800),0.75em_-0.25em_var(--stone-800),0.5em_-0.25em_var(--stone-800),0.25em_-0.25em_var(--stone-800),0.25em_0_var(--stone-800),0_0.25em_var(--stone-800),0_0.5em_var(--stone-800),0.25em_0.25em_var(--stone-800),0.25em_0.5em_var(--stone-800)]
        `}
      />
      <span
        className={`
          absolute bg-yellow-400 border-2 border-stone-800 rounded-xl
          pointer-events-none z-[-1] inset-x-6 inset-y-2
          shadow-[7px_0_0_0_var(--stone-800)]
          [box-shadow:7px_0_0_0_var(--stone-800),inset_0_2px_0_0_var(--yellow-300),inset_0_-2px_0_0_var(--yellow-500)]
          transition-all duration-0 ease-[cubic-bezier(0,0.5,0.4,1)]
          ${isActive ? "translate-y-[-200%] opacity-0 duration-200" : ""}
        `}
      />
      <style jsx>{`
        @keyframes dots {
          0% {
            background-position:
              0 0,
              4px 4px;
          }
          100% {
            background-position:
              8px 0,
              12px 4px;
          }
        }
        .animate-dots {
          animation: dots 0.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default MarioButton;
