import type { Metadata } from "next";
import {
  ArticleH2,
  ArticleLI,
  ArticleP,
  ArticleUL,
  LastUpdated,
  PageShell,
} from "@/components/landing/PageShell";
import { APP_NAME, DEVELOPER_EMAIL } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The plain-language terms for using the ${APP_NAME} app and website — a free, offline-first expense tracker for Android.`,
};

export default function TermsPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms of Service"
      description="These terms cover your use of the Kharcha app and this website. They are written to be readable — no hidden clauses, nothing you wouldn't expect."
    >
      <LastUpdated date="September 13, 2026" />

      <ArticleH2>1. Acceptance of these terms</ArticleH2>
      <ArticleP>
        By downloading, installing, or using {APP_NAME} (&ldquo;the app&rdquo;), or by
        browsing this website, you agree to these Terms of Service. If you do
        not agree with any part of them, please do not use the app. These terms
        may be updated occasionally; the current version is always published on
        this page with its &ldquo;last updated&rdquo; date, and continued use after a
        change means you accept the updated terms.
      </ArticleP>

      <ArticleH2>2. What the service is</ArticleH2>
      <ArticleP>
        Kharcha is a free, offline-first personal finance tracker for Android.
        It lets you record expenses and income, organize them with categories
        and budgets, review your history, and export reports. The app works
        entirely on your device and does not provide cloud storage, backups, or
        any account-based service. This website provides information about the
        app and a download link.
      </ArticleP>

      <ArticleH2>3. License to use</ArticleH2>
      <ArticleP>
        The app is provided for your personal, non-commercial use. You may
        install it on your own devices and keep using it free of charge. You may
        not: resell, rent, or redistribute the app for a fee; reverse-engineer,
        decompile, or modify it (except where such restriction is not enforceable
        under applicable law); or present it as your own product. You keep full
        ownership of the data you record — the app only ever stores it for you,
        locally.
      </ArticleP>

      <ArticleH2>4. Acceptable use</ArticleH2>
      <ArticleUL>
        <ArticleLI>Use the app to track your own finances — that is what it is for.</ArticleLI>
        <ArticleLI>
          Do not attempt to use the website or download link to distribute
          malware or to attack any infrastructure.
        </ArticleLI>
        <ArticleLI>
          Do not contact the developer with unlawful, abusive, or spam content.
        </ArticleLI>
      </ArticleUL>

      <ArticleH2>5. Your records and financial data</ArticleH2>
      <ArticleP>
        All records in Kharcha are entered and maintained by you on your device.
        The app is a record-keeping and awareness tool — it is{" "}
        <strong>not financial advice</strong>, not a bookkeeping service, and not a
        substitute for professional accounting or tax guidance. Because your
        data exists only on your device, you are responsible for keeping backups
        of anything that matters to you: use the CSV export regularly, and again
        before uninstalling, resetting, or changing phones. Uninstalling the app
        deletes its local database, and lost data cannot be recovered by the
        developer — there is no copy on any server, by design.
      </ArticleP>

      <ArticleH2>6. Intellectual property</ArticleH2>
      <ArticleP>
        The {APP_NAME} name, app icon, website design, and the app&apos;s source code
        are the property of the developer and are protected by copyright. The
        Kharcha trademark and branding may not be used to promote other products
        or services without permission. Brand-green color values and generic UI
        patterns are, of course, not claimed.
      </ArticleP>

      <ArticleH2>7. Third-party services</ArticleH2>
      <ArticleP>
        The APK download is hosted on GitHub, and this website links to the
        developer&apos;s external portfolio site. Those third-party services are
        governed by their own terms and policies, and the developer is not
        responsible for their content or availability. The app itself performs
        no third-party network calls — it is fully functional in airplane mode.
      </ArticleP>

      <ArticleH2>8. Warranties and liability</ArticleH2>
      <ArticleP>
        The app is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of
        any kind, express or implied — including fitness for a particular
        purpose. While the developer works hard to keep Kharcha correct and
        reliable, no software is bug-free: always verify critical figures before
        relying on them for financial decisions. To the maximum extent permitted
        by law, the developer is not liable for any loss of data (including
        records you did not back up), lost profits, or other indirect or
        consequential damages arising from your use of or inability to use the
        app or website.
      </ArticleP>

      <ArticleH2>9. Changes to the app and these terms</ArticleH2>
      <ArticleP>
        The app may be updated over time with new features, fixes, or
        adjustments. Significant, breaking changes to these terms will be
        reflected in the &ldquo;last updated&rdquo; date above. You can stop using the app
        at any time — simply uninstall it; since there is no account, there is
        nothing to cancel and nothing to delete on any server.
      </ArticleP>

      <ArticleH2>10. Contact</ArticleH2>
      <ArticleP>
        Questions about these terms? Write to{" "}
        <a
          href={`mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent("Kharcha — terms question")}`}
          className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800 dark:text-brand-300 dark:decoration-brand-700 dark:hover:text-brand-200"
        >
          {DEVELOPER_EMAIL}
        </a>
        .
      </ArticleP>
    </PageShell>
  );
}
