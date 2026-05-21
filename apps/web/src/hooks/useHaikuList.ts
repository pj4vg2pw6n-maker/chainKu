"use client";
import { useQuery } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Haiku } from "@chainku/shared";

const IN_PROGRESS_STATUSES = [
  "awaiting_line_2",
  "awaiting_choice_2",
  "awaiting_line_3",
  "awaiting_choice_3",
] as const;

// Cap reads per fetch so an unbounded archive cannot drive Firestore cost on
// every page load (and cannot be amplified by hostile direct-SDK calls).
const LIST_LIMIT = 50;

export function useInProgressHaiku() {
  return useQuery({
    queryKey: ["haiku-list", "in-progress"],
    queryFn: async () => {
      const q = query(
        collection(db, "haikus"),
        where("status", "in", [...IN_PROGRESS_STATUSES]),
        orderBy("updatedAt", "desc"),
        limit(LIST_LIMIT)
      );
      const snap = await getDocs(q);
      const haiku = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Haiku)
      );
      // Safety sort in case Firestore returns per-bucket order for `in` queries.
      return haiku.sort(
        (a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis()
      );
    },
    staleTime: 60_000,
  });
}

export function useArchivedHaiku() {
  return useQuery({
    queryKey: ["haiku-list", "archive"],
    queryFn: async () => {
      const q = query(
        collection(db, "haikus"),
        where("status", "==", "completed"),
        orderBy("completedAt", "desc"),
        limit(LIST_LIMIT)
      );
      const snap = await getDocs(q);
      return snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Haiku)
      );
    },
    staleTime: 60_000,
  });
}
