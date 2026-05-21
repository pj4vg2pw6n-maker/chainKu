import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeAll, afterAll } from "vitest";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rules = readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8");

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-chainku",
    firestore: { rules, host: "127.0.0.1", port: 8080 },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

// ── haikus collection ─────────────────────────────────────────────────────────

describe("haikus/{id}", () => {
  it("allows unauthenticated document read", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, "haikus", "test-id")));
  });

  it("allows unauthenticated collection read", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDocs(collection(db, "haikus")));
  });

  it("denies unauthenticated write (setDoc)", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "haikus", "test-id"), { test: true }));
  });

  it("denies unauthenticated write (addDoc)", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(addDoc(collection(db, "haikus"), { test: true }));
  });
});

// ── proposals subcollection ───────────────────────────────────────────────────

describe("haikus/{id}/proposals/{pid}", () => {
  it("denies unauthenticated read", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      getDoc(doc(db, "haikus", "test-id", "proposals", "prop-1"))
    );
  });

  it("denies unauthenticated write", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(db, "haikus", "test-id", "proposals", "prop-1"), {
        text: "old pond",
      })
    );
  });
});

// ── config/global ─────────────────────────────────────────────────────────────

describe("config/global", () => {
  it("allows unauthenticated read", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, "config", "global")));
  });

  it("denies unauthenticated write", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(db, "config", "global"), { proposalWindowHours: 48 })
    );
  });
});

// ── rate_limits ───────────────────────────────────────────────────────────────

describe("rate_limits/{key}", () => {
  it("denies unauthenticated read", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "rate_limits", "some-key")));
  });

  it("denies unauthenticated write", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(db, "rate_limits", "some-key"), { count: 1 })
    );
  });
});

// ── arbitrary unknown collection ──────────────────────────────────────────────

describe("unknown collection", () => {
  it("denies unauthenticated read", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDocs(collection(db, "arbitrary")));
  });

  it("denies unauthenticated write", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(addDoc(collection(db, "arbitrary"), { test: true }));
  });
});
