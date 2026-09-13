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
  title: "Privacy Policy",
  description: `How ${APP_NAME} handles — and more importantly, does not handle — your data. The app is offline-first: your records never leave your device.`,
};

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy Policy"
      description="The short version: Kharcha is offline-first, so your financial records never leave your phone. This page explains exactly what that means — in plain language, not lawyer-speak."
    >
      <LastUpdated date="September 13, 2026" />

      <ArticleH2>1. Overview</ArticleH2>
      <ArticleP>
        {APP_NAME} (&ldquo;the app&rdquo;) is an offline-first personal finance tracker for
        Android. It is built so that all of your financial records — expenses,
        income, categories, budgets, and settings — are stored exclusively in a
        local database on your device. The app has no backend servers, no user
        accounts, and no cloud sync. Because there is no server, there is no
        place where your data could be collected, sold, or breached.
      </ArticleP>
      <ArticleP>
        This policy covers both the app itself and this website (the Kharcha
        landing page). Where the two differ, it is called out explicitly.
      </ArticleP>

      <ArticleH2>2. Data the app stores — and where</ArticleH2>
      <ArticleP>
        Everything you record in Kharcha (transactions, amounts, notes,
        categories, budget limits, recurring rules) is written to a database
        file inside the app&apos;s private storage on your phone. This data:
      </ArticleP>
      <ArticleUL>
        <ArticleLI>never leaves your device automatically;</ArticleLI>
        <ArticleLI>
          is not readable by other apps (Android private-storage sandboxing);
        </ArticleLI>
        <ArticleLI>
          can only leave your device when <em>you</em> explicitly export it
          (CSV or PDF) and choose a destination — a file, a share sheet, an
          email you write yourself;
        </ArticleLI>
        <ArticleLI>
          is removed when you uninstall the app or clear its data.
        </ArticleLI>
      </ArticleUL>

      <ArticleH2>3. Data we do not collect</ArticleH2>
      <ArticleP>
        To be unambiguous, the app and its developer do <strong>not</strong>{" "}
        collect, transmit, or store any of the following:
      </ArticleP>
      <ArticleUL>
        <ArticleLI>no personal information (name, email, phone number);</ArticleLI>
        <ArticleLI>no analytics, usage statistics, or crash telemetry;</ArticleLI>
        <ArticleLI>no advertising identifiers or ad SDKs;</ArticleLI>
        <ArticleLI>no location data;</ArticleLI>
        <ArticleLI>no contacts, photos, or files beyond what you pick yourself for import;</ArticleLI>
        <ArticleLI>no cookies or trackers inside the app.</ArticleLI>
      </ArticleUL>
      <ArticleP>
        Since there is no account system, we cannot associate any record with a
        person — even if we wanted to.
      </ArticleP>

      <ArticleH2>4. Permissions the app uses</ArticleH2>
      <ArticleP>
        Kharcha requests the minimum permissions Android requires for its
        features. Depending on your device and Android version, this may
        include storage access — used only when you import a CSV file or save
        or share an exported report. No permission is used to read unrelated
        files, and none of the accessed data is transmitted anywhere.
      </ArticleP>

      <ArticleH2>5. This website and the APK download</ArticleH2>
      <ArticleP>
        The Kharcha landing page does not use tracking cookies, advertising
        networks, or fingerprinting, and it does not build advertising
        profiles. The Android installation file (APK) is hosted on Google
        Drive so it can be downloaded reliably. When you download the APK, your
        connection is to Google&apos;s infrastructure, and Google&apos;s own terms and
        privacy policy apply to that interaction — Kharcha receives nothing
        from the download process. This website also links to the developer&apos;s
        external portfolio site; those external sites are governed by their own
        policies.
      </ArticleP>

      <ArticleH2>6. Anonymous website analytics</ArticleH2>
      <ArticleP>
        To understand how the landing page is used — and whether the download
        button is actually working for people — this website collects a small
        set of <strong>fully anonymous</strong> usage statistics. What that
        means in practice:
      </ArticleP>
      <ArticleUL>
        <ArticleLI>
          pages viewed and buttons clicked (for example, the APK download
          button), with timestamps;
        </ArticleLI>
        <ArticleLI>
          coarse device class (mobile / tablet / desktop), browser family and
          operating system family, derived from the standard user-agent string
          your browser already sends;
        </ArticleLI>
        <ArticleLI>
          the website that referred you, reduced to a bare domain (for example
          &ldquo;google.com&rdquo;) — never the full URL;
        </ArticleLI>
        <ArticleLI>
          an anonymous random identifier kept in your browser&apos;s local storage
          so repeat visits can be counted without identifying you. Clearing
          your browser data gives you a fresh identifier instantly.
        </ArticleLI>
      </ArticleUL>
      <ArticleP>
        What is <strong>never</strong> collected or stored: your name, email
        address, account details (the site has none), exact IP addresses (raw
        IPs are never persisted — they are only used momentarily, in hashed
        form, to rate-limit abuse), precise location, or anything you type.
        Browsers that send a &ldquo;Do Not Track&rdquo; signal are not measured at all.
        These statistics exist solely to keep the site useful and the download
        link healthy — they are never sold or shared.
      </ArticleP>

      <ArticleH2>7. Children&apos;s privacy</ArticleH2>
      <ArticleP>
        Kharcha does not knowingly collect any personal information from anyone,
        including children under 13 — the app has no mechanism to do so, since
        it collects nothing from anybody. If you are a parent or guardian with a
        question about this, contact us using the address below.
      </ArticleP>

      <ArticleH2>8. Security</ArticleH2>
      <ArticleP>
        Your data is protected primarily by not existing anywhere outside your
        device. We recommend using Android&apos;s built-in device encryption (on by
        default on modern phones) and an app lock or device lock if others share
        your phone. If you export reports, remember that a CSV or PDF copy is a
        normal file on your device or wherever you sent it — treat it with the
        same care as any financial document.
      </ArticleP>

      <ArticleH2>9. Changes to this policy</ArticleH2>
      <ArticleP>
        If the app&apos;s data practices ever change — for example, if an optional
        sync feature were ever introduced — this policy will be updated on this
        page with a new &ldquo;last updated&rdquo; date, and the change will be described
        before it takes effect. Given the app&apos;s offline-first architecture,
        material changes are not expected.
      </ArticleP>

      <ArticleH2>10. Contact</ArticleH2>
      <ArticleP>
        Questions about this policy, or a privacy concern to raise? Write to{" "}
        <a
          href={`mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent("Kharcha — privacy question")}`}
          className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800 dark:text-brand-300 dark:decoration-brand-700 dark:hover:text-brand-200"
        >
          {DEVELOPER_EMAIL}
        </a>{" "}
        and you will get a direct answer from the developer.
      </ArticleP>
    </PageShell>
  );
}
