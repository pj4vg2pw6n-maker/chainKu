import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy — ChainKu",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-sans text-2xl font-semibold text-[#111111] mb-10">
        Privacy policy
      </h1>

      <div className="space-y-8 text-sm text-gray-ui leading-relaxed">
        <section>
          <h2 className="font-sans font-semibold text-[#111111] mb-2">
            What we store
          </h2>
          <p className="mb-3">
            ChainKu does not collect personal data, accounts, or email
            addresses. The only identifier used is an anonymous UUID generated
            in your browser and stored in{" "}
            <code className="text-xs bg-gray-50 border border-gray-border px-1 py-0.5 rounded">
              localStorage
            </code>
            . It is sent to our backend only when you submit a haiku, a
            proposal, or a choice, where it is used to (a) recognise you as the
            initiator of haiku you started, (b) enforce &ldquo;one proposal per
            user per line&rdquo;, and (c) apply rate limits. It is never shared
            with third parties.
          </p>
          <p>
            Your UUID is <strong>never publicly visible</strong>. For haiku
            you initiate, it is stored on the haiku document as the initiator
            identifier (used only by the server to authorise your choices); for
            proposals you submit, it is stored in a private subcollection that
            no client can read and is deleted once the proposal window closes.
            When a proposal is accepted into the final haiku, only its text is
            kept — the proposer&apos;s UUID is not. Accepted contributions
            therefore cannot be linked back to you, or to each other, by anyone
            reading the site.
          </p>
        </section>

        <section>
          <h2 className="font-sans font-semibold text-[#111111] mb-2">
            Browser storage
          </h2>
          <p className="mb-3">
            Two values are stored in your browser&apos;s{" "}
            <code className="text-xs bg-gray-50 border border-gray-border px-1 py-0.5 rounded">
              localStorage
            </code>
            . No cookies are used.
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <code className="text-xs bg-gray-50 border border-gray-border px-1 py-0.5 rounded">
                chainku.uuid
              </code>{" "}
              — your anonymous identifier. Clearing browser data resets this
              and your authorship history.
            </li>
            <li>
              <code className="text-xs bg-gray-50 border border-gray-border px-1 py-0.5 rounded">
                chainku.onboardingDismissed
              </code>{" "}
              — whether you have dismissed the welcome message.
            </li>
            <li>
              <code className="text-xs bg-gray-50 border border-gray-border px-1 py-0.5 rounded">
                chainku.syllableCounterEnabled
              </code>{" "}
              — your syllable counter preference (on or off).
            </li>
            <li>
              <code className="text-xs bg-gray-50 border border-gray-border px-1 py-0.5 rounded">
                chainku.proposals
              </code>{" "}
              — a local record of which haiku lines you have proposed, used to
              show you the correct status on the detail page.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-sans font-semibold text-[#111111] mb-2">
            Rate limiting
          </h2>
          <p>
            To prevent abuse, your IP address is used for rate limiting. IP
            addresses are not stored beyond the duration of the rate-limit
            window (one hour) and are deleted automatically after expiry.
          </p>
        </section>

        <section>
          <h2 className="font-sans font-semibold text-[#111111] mb-2">
            CAPTCHA (Cloudflare Turnstile)
          </h2>
          <p className="mb-3">
            Form submissions are protected by Cloudflare Turnstile, a
            privacy-friendly CAPTCHA. ChainKu uses the invisible variant: no
            challenge or checkbox is shown, and the check runs in the
            background to verify that submissions come from a real browser
            rather than a bot. Turnstile does not use cross-site tracking
            cookies or device fingerprinting.
          </p>
          <p>
            To make this assessment, Turnstile processes a limited set of
            signals from your browser, including your IP address, request
            headers, and minor interaction data. Cloudflare acts as a data
            processor on our behalf for this purpose. See Cloudflare&apos;s{" "}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-light transition-colors duration-150 underline underline-offset-2"
            >
              privacy policy
            </a>{" "}
            and the{" "}
            <a
              href="https://www.cloudflare.com/turnstile-privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-light transition-colors duration-150 underline underline-offset-2"
            >
              Turnstile privacy addendum
            </a>{" "}
            for full details.
          </p>
        </section>

        <section>
          <h2 className="font-sans font-semibold text-[#111111] mb-2">
            Third-party services and data processors
          </h2>
          <p className="mb-3">
            ChainKu does not use analytics, advertising, or social tracking of
            any kind. The following third-party services are used as data
            processors:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Cloudflare Turnstile</strong> — a privacy-friendly CAPTCHA
              used on form submissions. Cloudflare&apos;s{" "}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-light transition-colors duration-150 underline underline-offset-2"
              >
                privacy policy
              </a>{" "}
              governs their service.
            </li>
            <li>
              <strong>Firebase / Google Cloud</strong> — the application backend
              (Firestore database, Cloud Functions, Hosting) is operated by
              Google Ireland Limited (EEA) / Google LLC (US). Content you submit
              (haiku lines) is stored in Firestore. Google&apos;s{" "}
              <a
                href="https://firebase.google.com/support/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-light transition-colors duration-150 underline underline-offset-2"
              >
                Firebase privacy information
              </a>{" "}
              applies.
            </li>
            <li>
              <strong>Google reCAPTCHA Enterprise</strong> — used by Firebase
              App Check to verify that requests originate from the genuine web
              app. No challenge is shown to users. Google&apos;s{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-light transition-colors duration-150 underline underline-offset-2"
              >
                privacy policy
              </a>{" "}
              applies.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-sans font-semibold text-[#111111] mb-2">
            Contact
          </h2>
          <p>
            For privacy-related questions, contact us at{" "}
            <a
              href="mailto:privacy@chainku.app"
              className="text-accent hover:text-accent-light transition-colors duration-150 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              privacy@chainku.app
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
