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
          <p>
            ChainKu does not collect personal data, accounts, or email
            addresses. The only identifier used is an anonymous UUID generated
            in your browser and stored in{" "}
            <code className="text-xs bg-gray-50 border border-gray-border px-1 py-0.5 rounded">
              localStorage
            </code>
            . This UUID is used to track authorship of haiku lines and to
            enforce rate limits. It is never transmitted to third parties.
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
          <p>
            Form submissions are protected by Cloudflare Turnstile, a
            privacy-friendly CAPTCHA that does not use cross-site tracking
            cookies or device fingerprinting. Cloudflare&apos;s own privacy
            policy governs their service.
          </p>
        </section>

        <section>
          <h2 className="font-sans font-semibold text-[#111111] mb-2">
            Third-party services
          </h2>
          <p>
            ChainKu does not use analytics, advertising, or social tracking of
            any kind. The only third-party service is Cloudflare Turnstile.
          </p>
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
