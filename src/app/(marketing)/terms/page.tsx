import { LegalPage } from "../LegalPage";

export const metadata = { title: "Terms of Service · MacTidar Cloud" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="16 October 2026"
      pledge="You own your files. We only access them to run the service or when the law requires it. We never sell your data or use it for advertising."
      other={{ href: "/privacy", label: "Read the Privacy Policy" }}
      sections={[
        {
          id: "acceptance",
          title: "Accepting these terms",
          body: (
            <>
              <p>
                These terms are an agreement between you and MacTidar (&ldquo;we&rdquo;, &ldquo;us&rdquo;) for your use of MacTidar Cloud at cloud.mactidar.com. By creating an account or using the
                service, you agree to them and to our <a href="/privacy">Privacy Policy</a>.
              </p>
              <p>If you use MacTidar Cloud for a company, you confirm that you&apos;re allowed to accept these terms on its behalf.</p>
            </>
          ),
        },
        {
          id: "account",
          title: "Your account",
          body: (
            <>
              <p>You must be at least 16 years old and give accurate details when you sign up. Keep your password private — you&apos;re responsible for activity on your account.</p>
              <p>
                Every account has a personal workspace. In a <strong>company workspace</strong>, the workspace&apos;s admins decide who can join, can change members&apos; roles, and can remove
                members. Files you add to a company workspace belong to that workspace.
              </p>
              <p>
                Tell us straight away at <a href="mailto:admin@mactidar.com">admin@mactidar.com</a> if you think someone else has accessed your account.
              </p>
            </>
          ),
        },
        {
          id: "content",
          title: "Your content",
          body: (
            <>
              <p>
                <strong>You keep all rights to the files you upload.</strong> You give us only the permission we need to run the service: storing your files, making copies for reliability,
                generating previews, and delivering them to you and the people you choose to share with.
              </p>
              <p>We don&apos;t sell your files, use them for advertising, or use them to train AI models.</p>
            </>
          ),
        },
        {
          id: "acceptable-use",
          title: "Acceptable use",
          body: (
            <>
              <p>Please don&apos;t use MacTidar Cloud to:</p>
              <ul>
                <li>store or share malware, phishing pages or anything designed to cause harm;</li>
                <li>share content you don&apos;t have the right to share, such as pirated films, music or software;</li>
                <li>store or share illegal content, including content that exploits children;</li>
                <li>harass people, send spam, or abuse public links to distribute content at scale;</li>
                <li>try to break into other accounts or workspaces, overload the service, or get around its limits.</li>
              </ul>
              <p>
                We may remove content or disable links that break these rules. You can report abuse at{" "}
                <a href="mailto:admin@mactidar.com?subject=Report%20abuse">admin@mactidar.com</a>.
              </p>
            </>
          ),
        },
        {
          id: "sharing",
          title: "Sharing and public links",
          body: (
            <>
              <p>
                You decide what to share. Anyone who has a public link can open what it points to, so use passwords and expiry dates for anything sensitive, and turn off downloads where
                you only want people to view. People you share with can keep copies of files they download.
              </p>
              <p>
                Personal workspaces start with sharing off. In company workspaces, sharing outside the company is off unless an admin allows it. You can disable a public link or remove
                someone&apos;s access at any time.
              </p>
            </>
          ),
        },
        {
          id: "storage",
          title: "Storage limits",
          body: (
            <>
              <p>
                Personal workspaces include <strong>3 GB free</strong>. Each workspace has its own storage limit, and single uploads are limited to 5 GB unless the workspace admin sets a
                lower limit. When a workspace is full, new uploads stop until space is freed — your existing files stay available.
              </p>
              <p>Deleted files stay in Trash for 30 days, and still count toward storage until they&apos;re permanently deleted.</p>
            </>
          ),
        },
        {
          id: "termination",
          title: "Suspension and closing your account",
          body: (
            <>
              <p>
                You can stop using MacTidar Cloud at any time and delete your account in Settings → Delete account. Your personal workspace and its files are deleted; files you keep in a
                company workspace are handed to another member of that workspace. Deleted data is removed from our systems, including backup copies, within 30 days.
              </p>
              <p>We may suspend or close accounts or workspaces that break these terms or put other people or the service at risk. Where reasonable, we&apos;ll tell you first.</p>
            </>
          ),
        },
        {
          id: "liability",
          title: "Our service and responsibility",
          body: (
            <>
              <p>
                We work hard to keep MacTidar Cloud available and your files safe, but the service is provided &ldquo;as is&rdquo; and we can&apos;t promise it will never be interrupted. Keep
                your own copies of files that matter to you.
              </p>
              <p>
                To the extent the law allows, we&apos;re not liable for indirect or consequential losses, and our total liability to you is limited to the amount you&apos;ve paid us in the
                past 12 months.
              </p>
            </>
          ),
        },
        {
          id: "changes",
          title: "Changes, law and contact",
          body: (
            <>
              <p>We may update these terms. If a change is significant, we&apos;ll let you know by email or in the app before it takes effect.</p>
              <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>
              <p>
                Questions about these terms: <a href="mailto:admin@mactidar.com">admin@mactidar.com</a>.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
