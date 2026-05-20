import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — ChainKu",
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-sans text-2xl font-semibold text-[#111111] mb-6">
        Contact
      </h1>
      <p className="text-sm text-gray-ui leading-relaxed">
        Questions, feedback, or bug reports? Reach us at{" "}
        <a
          href="mailto:hello@chainku.app"
          className="text-accent hover:text-accent-light transition-colors duration-150 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          hello@chainku.app
        </a>
        .
      </p>
    </div>
  );
}
