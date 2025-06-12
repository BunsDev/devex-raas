import { Play } from "lucide-react";
import { Button } from "../ui/button";

const Output = ({
  className,
  isVisible,
}: {
  className?: string;
  isVisible: boolean;
}) => (
  <div
    className={`bg-gray-50 border-t h-full ${className} ${!isVisible ? "hidden" : ""}`}
  >
    <div className="p-2 border-b bg-gray-100 flex items-center justify-between">
      <span className="text-gray-700 text-xs font-semibold">Output</span>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
        <Play className="h-3 w-3" />
      </Button>
    </div>
    <div className="p-3 font-mono text-xs">
      <div className="text-green-600">✓ Build successful</div>
      <div className="text-gray-600">Hello, Developer!</div>
      <div className="text-blue-600">Compilation completed in 1.2s</div>
    </div>
  </div>
);

export default Output;
