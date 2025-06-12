const Terminal = ({
  className,
  isVisible,
}: {
  className?: string;
  isVisible: boolean;
}) => (
  <div
    className={`bg-black text-white font-mono text-sm h-full ${className} ${!isVisible ? "hidden" : ""}`}
  >
    <div className="p-2 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
      <span className="text-gray-300 text-xs">Terminal</span>
    </div>
    <div className="p-3">
      <div className="text-green-400">$ npm run dev</div>
      <div className="text-gray-300">Starting development server...</div>
      <div className="text-green-400">✓ Ready on http://localhost:3000</div>
      <div className="text-blue-400 mt-2">$ █</div>
    </div>
  </div>
);

export default Terminal;
