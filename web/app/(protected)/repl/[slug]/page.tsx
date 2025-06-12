"use client";

import Sandbox from "@/components/sandbox";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ReplPage() {
  const { slug } = useParams();

  // using ->
  // file-tree component from magicui.design
  // resizable component from shadcn-ui
  //
  return <Sandbox />;

  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center gap-8">
      <Link href={"/"} className="p-2 rounded-lg border">
        {"< Home"}
      </Link>
      <div>Slug is {slug}</div>
    </div>
  );
}
