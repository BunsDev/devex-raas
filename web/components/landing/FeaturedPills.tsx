import { Code, Globe, Shield } from "lucide-react";

export default function FeaturedPills() {
  return (
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
  );
}
