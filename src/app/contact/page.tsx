import type { Metadata } from "next";
import {
  ArticleH2,
  ArticleLI,
  ArticleP,
  ArticleUL,
  PageShell,
} from "@/components/landing/PageShell";
import { DeveloperCard } from "@/components/landing/ContactMethods";
import { APP_NAME, DEVELOPER_EMAIL } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with the developer of ${APP_NAME} — feedback, bug reports, feature requests, or privacy questions.`,
};

const TOPICS = [
  {
    title: "Feedback & ideas",
    body: "Tell me what you like about Kharcha and what could be better. Honest feedback from everyday users drives almost every improvement the app gets.",
  },
  {
    title: "Bug reports",
    body: "Something not working? Describe what you did, what you expected, and what happened instead. If you can, mention your Android version and roughly when it started.",
  },
  {
    title: "Feature requests",
    body: "Missing something you need? Explain the problem you are trying to solve rather than just the feature — it helps me weigh it against the app's keep-it-simple philosophy.",
  },
  {
    title: "Privacy & data questions",
    body: "Kharcha stores everything on your device and sends nothing anywhere. If anything about that is unclear, ask — you will get a straight answer.",
  },
];

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Get in touch"
      description="Kharcha is built and maintained by one developer. Whether it is feedback, a bug, a feature idea, or a privacy question — every message is read and answered personally."
    >
      <DeveloperCard />

      <ArticleH2>What you can write about</ArticleH2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {TOPICS.map((topic) => (
          <div
            key={topic.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
              {topic.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {topic.body}
            </p>
          </div>
        ))}
      </div>

      <ArticleH2>Before you write</ArticleH2>
      <ArticleP>
        A few questions come up again and again, so here are quick answers that
        might save you the email. Kharcha has no accounts, no cloud sync, and no
        server — your records live only on your phone, so there is nothing I can
        look up or restore for you. If you change or lose your phone, use the
        app&apos;s CSV export to move your history over; that backup belongs to you,
        not to me.
      </ArticleP>
      <ArticleUL>
        <ArticleLI>
          Data recovery: impossible by design — nothing ever leaves your device,
          so keep a CSV export if the data matters to you.
        </ArticleLI>
        <ArticleLI>
          Feature requests: they are truly read, but the bar is &ldquo;does it keep the
          app simple?&rdquo; — clutter is a feature killer, not a feature.
        </ArticleLI>
        <ArticleLI>
          Business inquiries: mention Kharcha in the subject line so nothing gets
          lost in the inbox.
        </ArticleLI>
      </ArticleUL>

      <ArticleH2>Response time</ArticleH2>
      <ArticleP>
        Mail is usually answered within two to three days, and often faster.
        If you are reporting a crash, attaching a screenshot or the exact steps
        to reproduce it genuinely speeds things up — vague reports take the
        longest to chase down. You can always reach me directly at{" "}
        <a
          href={`mailto:${DEVELOPER_EMAIL}`}
          className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800 dark:text-brand-300 dark:decoration-brand-700 dark:hover:text-brand-200"
        >
          {DEVELOPER_EMAIL}
        </a>
        .
      </ArticleP>
    </PageShell>
  );
}
