import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <Link href={"/repl/base0"} className="underline">
        base0
      </Link>
    </div>
  );
}
