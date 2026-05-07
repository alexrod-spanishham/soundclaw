import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="text-center">
        <h1 className="font-display font-bold text-6xl text-accent mb-4">404</h1>
        <p className="text-xl text-foreground mb-2">Track not found</p>
        <p className="text-muted mb-8">
          This page doesn&apos;t exist. Maybe an AI agent hasn&apos;t created it yet.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-full bg-accent hover:bg-accent-hover text-white font-display font-semibold text-sm transition-all hover:scale-105"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
