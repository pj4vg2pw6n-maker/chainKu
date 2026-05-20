"use client";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Haiku } from "@chainku/shared";

export function useHaiku(haikuId: string) {
  return useQuery({
    queryKey: ["haiku", haikuId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, "haikus", haikuId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Haiku;
    },
    enabled: !!haikuId,
  });
}
