import { Mail } from 'lucide-react';
import LegalPageLayout from '../components/LegalPageLayout';

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout>
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Refund Policy
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-500 dark:text-slate-400">
          Scrubs To Be LLC &mdash; Effective Date: February 26, 2026
        </p>
      </div>

      {/* Document body */}
      <article className="text-[15px] sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Subscription Plans</h2>
          <p className="mb-3">Scrubs To Be LLC offers the following subscription plans:</p>
          <ul className="list-disc ml-6 space-y-1 mb-3">
            <li>Monthly Plan: $29.99 per month</li>
            <li>Annual Plan: $299.99 per year</li>
          </ul>
          <p>All subscriptions automatically renew at the end of each billing cycle unless cancelled prior to renewal.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Free Trial</h2>
          <p className="mb-3">We offer a 3-day free trial.</p>
          <ul className="list-disc ml-6 space-y-1 mb-3">
            <li>A valid payment method is required to start the trial.</li>
            <li>You will not be charged during the trial period.</li>
            <li>If you do not cancel before the trial ends, your subscription will automatically convert into a paid subscription and your payment method will be charged.</li>
          </ul>
          <p>By starting a free trial, you acknowledge and agree to automatic billing at the end of the trial period unless cancelled.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Cancellation Policy</h2>
          <p className="mb-3">Users may cancel their subscription at any time through their account dashboard. Cancellation:</p>
          <ul className="list-disc ml-6 space-y-1 mb-3">
            <li>Prevents future billing</li>
            <li>Does not retroactively refund prior charges</li>
            <li>Does not prorate unused time</li>
          </ul>
          <p>Access remains active until the end of the current billing period.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Refund Policy</h2>
          <p className="mb-3">All subscription payments are generally non-refundable. However, refunds may be issued under the following circumstances:</p>
          <ul className="list-disc ml-6 space-y-1 mb-3">
            <li>Billing errors</li>
            <li>Duplicate charges</li>
            <li>Technical failures preventing platform access</li>
          </ul>
          <p className="mb-3">
            Refund requests must be submitted to:{' '}
            <a href="mailto:medkotha@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">medkotha@gmail.com</a>
          </p>
          <p>Refund decisions are made on a case-by-case basis at the sole discretion of Scrubs To Be LLC.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. No Refund After Substantial Use</h2>
          <p>If a user has actively used the platform after billing (including accessing AI tools, flashcards, or exam content), refunds will generally not be issued. The Service is digital and accessible immediately upon payment.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Failure to Cancel Before Renewal</h2>
          <p className="mb-3">It is the user's responsibility to cancel prior to renewal. If a user forgets to cancel and is charged:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Refunds may be granted if requested promptly after billing</li>
            <li>Repeated refund requests after multiple billing cycles may be denied</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">7. Chargebacks & Disputes</h2>
          <p className="mb-3">If a chargeback is initiated through a payment provider:</p>
          <ul className="list-disc ml-6 space-y-1 mb-3">
            <li>We reserve the right to submit evidence to dispute the claim</li>
            <li>Accounts associated with disputed payments may be suspended</li>
            <li>Future access to the Service may be restricted</li>
          </ul>
          <p>Fraudulent chargebacks may result in permanent account termination.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">8. Acknowledgment</h2>
          <p className="mb-3">By purchasing a subscription, you acknowledge:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>You understand this is a recurring subscription</li>
            <li>You authorize automatic recurring billing</li>
            <li>You understand the refund policy outlined above</li>
          </ul>
        </section>
      </article>

      {/* Contact CTA */}
      <div className="mt-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-800/50 p-6 sm:p-8 text-center">
        <Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Have questions about refunds?</h3>
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
