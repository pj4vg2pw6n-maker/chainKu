"use client";
import Link from "next/link";
import { Tabs } from "@/components/ui/Tabs";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { HaikuLines } from "@/components/HaikuLines";
import { CountdownLabel } from "@/components/CountdownLabel";
import { Card } from "@/components/ui/Card";
import { useInProgressHaiku, useArchivedHaiku } from "@/hooks/useHaikuList";
import { Haiku, HaikuStatus } from "@chainku/shared";

function statusLabel(status: HaikuStatus): string {
  switch (status) {
    case "awaiting_line_2":
      return "Awaiting line 2";
    case "awaiting_choice_2":
      return "Choosing line 2";
    case "awaiting_line_3":
      return "Awaiting line 3";
    case "awaiting_choice_3":
      return "Choosing line 3";
    default:
      return "";
  }
}

function CardSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div className="rounded-card border border-gray-border bg-white p-5 animate-pulse">
      <div className={`flex flex-col gap-2 mb-${large ? "4" : "3"}`}>
        <div className={`h-${large ? "7" : "4"} bg-gray-100 rounded w-3/4`} />
        <div className={`h-${large ? "7" : "4"} bg-gray-100 rounded w-1/2`} />
        <div className={`h-${large ? "7" : "4"} bg-gray-100 rounded w-2/3`} />
      </div>
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  );
}

function InProgressCard({ haiku }: { haiku: Haiku }) {
  return (
    <Link
      href={`/haiku/${haiku.id}`}
      className="block rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Card className="p-5 hover:border-gray-ui transition-colors duration-150">
        <HaikuLines
          line1={haiku.line1.text}
          line2={haiku.line2?.text ?? null}
          line3={haiku.line3?.text ?? null}
        />
        <p className="mt-3 text-xs text-gray-muted font-sans">
          {statusLabel(haiku.status)} ·{" "}
          <CountdownLabel deadline={haiku.currentDeadline} />
        </p>
      </Card>
    </Link>
  );
}

function ArchiveCard({ haiku }: { haiku: Haiku }) {
  const completedDate = haiku.completedAt
    ? haiku.completedAt.toDate().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={`/haiku/${haiku.id}`}
      className="block rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Card className="p-6 hover:border-gray-ui transition-colors duration-150">
        <HaikuLines
          line1={haiku.line1.text}
          line2={haiku.line2?.text ?? null}
          line3={haiku.line3?.text ?? null}
          size="large"
        />
        {completedDate && (
          <p className="mt-4 text-xs text-gray-muted font-sans">
            {completedDate}
          </p>
        )}
      </Card>
    </Link>
  );
}

function InProgressList() {
  const { data, isLoading, error } = useInProgressHaiku();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-6">
        {[0, 1, 2].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-10 text-sm text-center text-red-600">
        Failed to load. Please refresh.
      </p>
    );
  }

  if (!data?.length) {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-lg text-gray-muted mb-5">
          No haiku in progress yet.
        </p>
        <Link
          href="/create"
          className="text-sm font-medium font-sans text-accent hover:text-accent-light transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          Start the first one →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-6">
      {data.map((haiku) => (
        <InProgressCard key={haiku.id} haiku={haiku} />
      ))}
    </div>
  );
}

function ArchiveList() {
  const { data, isLoading, error } = useArchivedHaiku();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-6">
        {[0, 1].map((i) => (
          <CardSkeleton key={i} large />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-10 text-sm text-center text-red-600">
        Failed to load. Please refresh.
      </p>
    );
  }

  if (!data?.length) {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-lg text-gray-muted">
          No completed haiku yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-6">
      {data.map((haiku) => (
        <ArchiveCard key={haiku.id} haiku={haiku} />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
      <Tabs
        tabs={[
          {
            id: "in-progress",
            label: "In progress",
            content: <InProgressList />,
          },
          { id: "archive", label: "Archive", content: <ArchiveList /> },
        ]}
      />
      <FloatingActionButton href="/create" label="Start a new haiku" />
    </div>
  );
}
