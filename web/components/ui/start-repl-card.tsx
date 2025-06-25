import Link from "next/link";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

interface CardProps {
  link: string;
  replName: string;
}

export default function StartReplCard({ link, replName }: CardProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex h-screen w-full items-center justify-center ">
      <Card className="w-full max-w-md border-dashed border-2 rounded-none shadow-none bg-zinc-900">
        <CardHeader className="border-b border-dashed pb-4">
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5" />
            <span className="text-sm font-mono">
              Your {replName} Session Started
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-0 font-mono">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">$</span>
              <span>status</span>
            </div>
            <div className="space-y-1 pl-6">
              <p className="text-3xl font-bold">200</p>
              <p className="text-muted-foreground">Repl Session Started</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">$</span>
              <div className="flex items-center">
                <span>locate_page</span>
                <span className="ml-1 h-5 w-2 animate-pulse bg-foreground inline-block" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-6 border-t border-dashed mt-6">
          <Button
            variant="outline"
            className="w-full rounded-none border-dashed hover:bg-zinc-600"
            asChild
          >
            <Link href={link}>$ cd /{replName}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
