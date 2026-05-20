import { FirebaseError } from "firebase/app";

export function getFriendlyError(error: unknown): string {
  if (error instanceof FirebaseError) {
    const code = error.code.replace("functions/", "");
    switch (code) {
      case "resource-exhausted":
        return "You've reached the rate limit. Please wait before trying again.";
      case "already-exists":
        return "You've already submitted a proposal for this line.";
      case "permission-denied":
        return "You don't have permission to do this.";
      case "not-found":
        return "This haiku was not found.";
      case "failed-precondition":
        return error.message || "This action is not available right now.";
      case "invalid-argument":
        return error.message || "Invalid input. Please check your entry.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  return "Something went wrong. Please try again.";
}
