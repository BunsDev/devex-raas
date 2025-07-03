"use client";

import Sandbox from "@/components/sandbox/index";
import { Button } from "@/components/ui/button";
import { useRunnerSocket } from "@/hooks/useSocket";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ReplPage() {
  const { slug } = useParams();

  return <Sandbox slug={slug as string} />;
}
