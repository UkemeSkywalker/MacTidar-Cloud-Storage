import { LegalPage } from "../LegalPage";

export const metadata = { title: "Privacy Policy · MacTidar Cloud" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="16 October 2026"
      pledge="We collect only what we need to run MacTidar Cloud. We don't sell your data, show you ads, or use your files to train AI."
      other={{ href: "/terms", label: "Read the Terms of Service" }}
      sections={[
        {
          id: "who",
          title: "Who we are",
          body: (
            <p>
              MacTidar Cloud is run by MacTidar. This policy explains what personal data we handle when you use cloud.mactidar.com and how. Contact:{" "}
              <a href="mailto:admin@mactidar.com">admin@mactidar.com</a>.
            </p>
          ),
        },
        {
          id: "collect",
          title: "What we collect",
          body: (
            <ul>
              <li>
                <strong>Account details:</strong> your name and email address. Your password is handled by Amazon Cognito — we never see or store it.
              </li>
              <li>
                <strong>Your files</strong> and their details: names, sizes, types, folders, and who they&apos;re shared with.
              </li>
              <li>
                <strong>Activity in the app:</strong> things like your recently opened files, starred items, when you last signed in, and which workspaces you belong to.
              </li>
              <li>
                <strong>Technical data:</strong> IP addresses and request logs kept by our hosting provider for security and troubleshooting.
              </li>
              <li>
                <strong>Cookies:</strong> only the ones needed to keep you signed in, remember your active workspace, and unlock password-protected links. No advertising or tracking cookies.
              </li>
            </ul>
          ),
        },
        {
          id: "use",
          title: "How we use it",
          body: (
            <>
              <p>To provide the service: storing and showing your files, sharing them as you choose, sending you account emails (verification codes, invites, share notifications, storage alerts), keeping accounts secure, and preventing abuse.</p>
              <p>We don&apos;t sell your data, use it for advertising, or use your files to train AI models.</p>
            </>
          ),
        },
        {
          id: "where",
          title: "Where your data is stored",
          body: (
            <p>
              Your files and account data are stored on Amazon Web Services in <strong>Cape Town, South Africa</strong>, encrypted at rest (AES-256) and sent over encrypted connections (HTTPS).
              The web app runs on Amazon Web Services in Ireland, which processes requests as you use the service.
            </p>
          ),
        },
        {
          id: "sharing",
          title: "Who can see your data",
          body: (
            <ul>
              <li>
                <strong>People you share with</strong> — teammates you add, and anyone with a public link you create.
              </li>
              <li>
                <strong>Workspace admins</strong> — in a company workspace, admins can see its members and how much storage each one uses. They don&apos;t automatically see files that
                aren&apos;t shared with them.
              </li>
              <li>
                <strong>Amazon Web Services</strong>, which hosts the service on our behalf.
              </li>
              <li>
                <strong>Authorities</strong>, only when the law requires it.
              </li>
            </ul>
          ),
        },
        {
          id: "retention",
          title: "How long we keep it",
          body: (
            <ul>
              <li>Files you delete stay in Trash for 30 days, then are permanently deleted.</li>
              <li>Earlier versions of overwritten or deleted files are kept for up to 30 days as a safety net.</li>
              <li>Recent-activity entries expire after 30 days; unused invites after 7 days.</li>
              <li>When you ask us to delete your account, we delete it and its files within 30 days.</li>
            </ul>
          ),
        },
        {
          id: "rights",
          title: "Your rights",
          body: (
            <>
              <p>
                You can access, correct, download or delete your personal data. You can update your name in Settings, download your files at any time, and ask us to delete your account
                by emailing <a href="mailto:admin@mactidar.com">admin@mactidar.com</a>.
              </p>
              <p>We handle personal data in line with the Nigeria Data Protection Act 2023 and other laws that apply to you.</p>
            </>
          ),
        },
        {
          id: "children",
          title: "Children",
          body: <p>MacTidar Cloud isn&apos;t for children under 16, and we don&apos;t knowingly collect their data.</p>,
        },
        {
          id: "changes",
          title: "Changes to this policy",
          body: <p>If we make significant changes, we&apos;ll tell you by email or in the app before they take effect.</p>,
        },
      ]}
    />
  );
}
