import { Mail } from 'lucide-react';
import LegalPageLayout from '../components/LegalPageLayout';

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout>
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-500 dark:text-slate-400">
          Scrubs To Be LLC &mdash; Effective Date: February 26, 2026
        </p>
      </div>

      {/* Document body */}
      <article className="text-[15px] sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 space-y-8">
        <p>Scrubs To Be LLC ("Company," "we," "our," or "us") is a Delaware limited liability company. We respect your privacy and are committed to protecting your personal information.</p>
        <p>This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and SaaS platform ("Service").</p>
        <p>By using the Service, you agree to the practices described below.</p>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Information We Collect</h2>

          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">A. Information You Provide</h3>
          <p className="mb-3">When creating an account, we collect:</p>
          <ul className="list-disc ml-6 space-y-1 mb-3">
            <li>Name</li>
            <li>Email address</li>
            <li>Profile photo (optional)</li>
            <li>Profile banner image (optional)</li>
          </ul>
          <p className="mb-5">We do not collect date of birth or medical information.</p>

          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">B. Subscription & Payment Information</h3>
          <p className="mb-5">Subscriptions are processed through Stripe. We do not store full credit card numbers. Stripe securely processes and stores payment details.</p>

          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">C. Automatically Collected Information</h3>
          <p className="mb-3">When you use the Service, we may collect:</p>
          <ul className="list-disc ml-6 space-y-1 mb-3">
            <li>IP address</li>
            <li>Browser type</li>
            <li>Device information</li>
            <li>Usage data</li>
            <li>Interaction data</li>
          </ul>
          <p>This data helps improve platform performance and user experience.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. How We Use Your Information</h2>
          <p className="mb-3">We use collected information to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Create and manage user accounts</li>
            <li>Provide AI-powered exam practice tools</li>
            <li>Process subscriptions and payments</li>
            <li>Send service-related notifications</li>
            <li>Send marketing communications</li>
            <li>Improve platform performance</li>
            <li>Maintain security and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Marketing Communications</h2>
          <p className="mb-3">By creating an account, users agree to receive service-related and marketing emails.</p>
          <p>Users may unsubscribe at any time using the link provided in email communications.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Data Sharing</h2>
          <p className="mb-3">We do not sell personal information.</p>
          <p className="mb-3">We may share information with:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Payment processors (Stripe)</li>
            <li>Hosting provider (Vercel)</li>
            <li>Email service providers</li>
            <li>Contractors assisting in platform operations</li>
            <li>Legal authorities if required by law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Data Retention</h2>
          <p className="mb-3">We retain personal information as long as necessary to:</p>
          <ul className="list-disc ml-6 space-y-1 mb-3">
            <li>Maintain user accounts</li>
            <li>Fulfill subscription obligations</li>
            <li>Comply with legal requirements</li>
            <li>Resolve disputes</li>
          </ul>
          <p>Users may request deletion of their account at any time.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Data Security</h2>
          <p className="mb-3">We implement reasonable technical and organizational safeguards to protect personal information.</p>
          <p>The Service is hosted on Vercel and secured via HTTPS encryption. However, no system is completely secure.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">7. User Rights (U.S. Residents)</h2>
          <p className="mb-3">Depending on your state of residence, including California, you may have the right to:</p>
          <ul className="list-disc ml-6 space-y-1 mb-3">
            <li>Request access to your personal information</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of personal information</li>
            <li>Request information about data sharing practices</li>
          </ul>
          <p>
            Requests may be submitted to:{' '}
            <a href="mailto:medkotha@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">medkotha@gmail.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">8. Age Restrictions</h2>
          <p>The Service is intended for individuals 18 years or older. We do not knowingly collect information from individuals under 18.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">9. Third-Party Links</h2>
          <p>The Service may contain links to third-party websites. We are not responsible for their privacy practices.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">10. Changes to This Policy</h2>
          <p className="mb-3">We may update this Privacy Policy periodically. Updates will be posted with a revised effective date.</p>
          <p>Continued use of the Service constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">11. Contact Information</h2>
          <p>
            Scrubs To Be LLC<br />
            Delaware, United States<br />
            Email:{' '}
            <a href="mailto:medkotha@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">medkotha@gmail.com</a>
          </p>
        </section>
      </article>

      {/* Contact CTA */}
      <div className="mt-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-800/50 p-6 sm:p-8 text-center">
        <Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Have privacy concerns?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Reach out and we'll get back to you as soon as possible.</p>
        <a
          href="mailto:medkotha@gmail.com"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <Mail className="w-4 h-4" />
          medkotha@gmail.com
        </a>
      </div>
    </LegalPageLayout>
  );
}
