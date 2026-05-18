import { FloatingActionButton } from "@/components/ui/FloatingActionButton";

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <p className="font-serif text-lg text-gray-muted text-center">
        The haiku feed lives here.
      </p>
      <FloatingActionButton href="/create" label="Start a new haiku" />
    </div>
  );
}
