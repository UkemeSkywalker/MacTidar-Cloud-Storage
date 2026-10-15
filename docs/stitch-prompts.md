# MacTidar Cloud — Google Stitch Prompts

21 screens (15 pages + 6 dialogs), split into batches of up to 5 because Stitch generates at most 5 screens per prompt.

## How to use
1. Create a Stitch project and import [`DESIGN.md`](../DESIGN.md) as the design system.
2. Copy one **batch** below (everything inside its code block) and paste it as a single prompt.
3. If a batch comes out cramped or skips a screen, regenerate that screen alone using its section from the batch.
4. Link the screens on the canvas once all batches are done.

---

## Batch 1 — Sign-in & public links (5 screens)
```
Using the MacTidar Cloud design system, generate these 5 screens:

SCREEN 1 — Sign in. Split layout: left half is a soft blue gradient panel with the MacTidar logo, tagline "Your team's files, safely in one place", and a subtle illustration of folders and cloud. Right half is a centered card with "Welcome back", email field, password field with show/hide toggle, "Forgot password?" link, full-width blue "Sign in" button, and small text "Access is by invitation only. Ask your admin for an invite." Show an inline error under the password field: "Incorrect email or password".

SCREEN 2 — Accept invitation. Centered card on light grey. MacTidar logo and the message "Ukeme invited you to join the MacTidar team". Invited email shown read-only. Fields: Full name, Create password, Confirm password. Live password rules checklist (8+ characters, uppercase, number, symbol) with green checkmarks for met rules. Full-width blue "Create account" button. Footer link "Already have an account? Sign in".

SCREEN 3 — Reset password. Two cards side by side. Card 1 "Reset your password": email field, "Send reset code" button, "Back to sign in" link. Card 2 "Enter your code": six separate boxes for a 6-digit code, new password and confirm password fields, "Resend code (0:45)" link, "Reset password" button.

SCREEN 4 — Public shared link (no sidebar, not signed in). Minimal header: MacTidar logo left, "Sign in" link right. "Ada Okon shared a folder with you", folder name "Q4 Campaign Assets", "18 files · 1.4 GB", expiry note "Link expires on 30 Oct 2026". Primary blue "Download all (.zip)" button. Grid of file cards with thumbnails, names, sizes and a per-file download icon. Small footer "Powered by MacTidar Cloud".

SCREEN 5 — Public link locked / expired. Two centered cards side by side on light grey, each with the MacTidar logo. Card 1 "This link is password protected": lock icon, "Enter the password to view 'Q4 Campaign Assets'", password field, "Unlock" button, error "Incorrect password". Card 2 "This link has expired": broken-link illustration, "This shared link is no longer available. Ask the person who shared it for a new link.", secondary button "Go to MacTidar".
```

---

## Batch 2 — Core file browsing (5 screens)
```
Using the MacTidar Cloud design system and its app shell (left sidebar + top bar), generate these 5 screens:

SCREEN 1 — My Files (main screen), "My Files" active in sidebar. Breadcrumb "My Files > Projects > Q4 Campaign". Toolbar: "Upload" and "New folder" buttons, sort dropdown "Name", grid/list toggle. List view table with columns Name (file-type icon), Owner (avatar), Last modified, Size, and a sharing indicator (people icon = shared, link icon = public link). 4 folders (Designs, Contracts, Videos, Invoices) and 8 files (brand-guide.pdf, hero-banner.png, demo-video.mp4, budget.xlsx, notes.docx, logo-pack.zip, etc.). One row hovered with quick actions (share, download, star, ⋯). One row selected with a checkbox and a contextual bar "1 selected · Share · Download · Move · Rename · Delete". Subtle hint "Drop files anywhere to upload".

SCREEN 2 — Shared with me, active in sidebar. Filter chips: All, Folders, Files, plus a "Shared by" dropdown. Table columns: Name, Shared by (avatar + name), Date shared, Your access (badge "Editor" blue or "Viewer" grey), Size. 6 items shared by Ada Okon and Tunde Bello.

SCREEN 3 — Recent, active in sidebar. Top row of 4 large thumbnail cards for the most recent files. Below, rows grouped under "Today", "Yesterday", "Earlier this week": file icon, name, grey location ("in Projects / Q4 Campaign"), activity ("You uploaded", "Ada edited", "You opened"), and time.

SCREEN 4 — Starred, active in sidebar. Grid of 8 cards with thumbnail previews (images show the image, PDFs show first page, folders show a large blue folder icon), name, filled yellow star in the corner, last-modified date.

SCREEN 5 — Trash, active in sidebar. Info banner "Items in trash are permanently deleted after 30 days." with a red outline "Empty trash" button. Table columns: Name, Original location, Deleted by, Date deleted, Days left ("27 days"; under 3 days shown in red). Row actions "Restore" and "Delete forever". 5 items, one selected with bulk bar "Restore · Delete forever".
```

---

## Batch 3 — Search, preview, settings & admin (5 screens)
```
Using the MacTidar Cloud design system and its app shell (left sidebar + top bar), generate these 5 screens:

SCREEN 1 — Search results. Top search bar contains "invoice" with a clear (x) button. Header "Results for 'invoice'". Filter chips: Type (PDF, Images, Video, Docs, Folders), Owner (Anyone, Me, Teammates), Modified (Any time, Last 7 days, Last 30 days). 7 results with the matching word highlighted, file icon, location path, owner avatar, modified date, size.

SCREEN 2 — File preview (full-screen overlay, no app shell) on a dark charcoal background. Top bar: back arrow, file name "hero-banner.png", and Share, Download, Star, ⋯ and close X buttons. Center: large image with left/right arrows for previous/next file. Right white details panel: thumbnail, type, size "4.2 MB", dimensions, owner, location, created and modified dates, "Who has access" avatars, public link indicator. Bottom center: zoom controls (−, 100%, +) and "1 of 12".

SCREEN 3 — Account settings. Sub-tabs: Profile, Security, Notifications. Profile card: avatar with "Change photo", Full name, Email (read-only with lock icon), "Save changes". Security card: Change password (current, new, confirm) and "Sign out of all devices" outline button. Notifications card with toggles "When someone shares with me" and "When someone uploads to my shared folders".

SCREEN 4 — Admin › Members, "Members" active under the sidebar's Admin section. Header "Team members (3)" with blue "Invite member" button. Table: Member (avatar, name, email), Role (Admin / Member dropdown badge), Status (Active green, Invited amber), Storage used (small bar + "2.1 GB"), Last active, ⋯ menu (Change role, Resend invite, Deactivate). 3 active members and 1 pending invite.

SCREEN 5 — Admin › Storage, "Storage" active under Admin. Large donut chart card "6.2 GB of 15 GB used (41%)" with an "Increase limit" button. 3 stat cards: Total files 1,284, Public links active 7, Uploads this month 212. "Usage by member" horizontal bar chart (3 members) and "Usage by file type" breakdown (Videos, Images, Documents, Archives, Other). "Storage limit" settings card: limit field "15 GB", max upload size "5 GB", toggle "Alert admins at 80% usage".
```

---

## Batch 4 — File dialogs (5 screens)
```
Using the MacTidar Cloud design system, generate these 5 screens. Each is a dialog or panel shown over the dimmed "My Files" screen with the app shell.

SCREEN 1 — Share dialog "Share 'Q4 Campaign'" with two tabs, shown as two dialogs side by side. Teammates tab: input "Add teammates by name or email" with an autocomplete suggestion, permission dropdown (Viewer / Editor), "People with access" list (You – Owner, Ada Okon – Editor, Tunde Bello – Viewer, each with a remove option), note "Access applies to everything inside this folder." Public link tab: toggle "Public link is ON", link field with "Copy link" button, "Allow downloads" toggle, "Require password" toggle with password field, "Expires" selector (Never / 1 day / 7 days / 30 days / Custom), red "Disable link" text button. Footer "Done".

SCREEN 2 — Upload panel docked bottom-right. Header "Uploading 4 of 6 items" with collapse and close icons and an overall progress bar. Rows: one complete (green check), one uploading "68% · 12 MB/s · 20s left", one queued, one failed (red, "Network error", "Retry" link), one rejected ("Exceeds storage limit"). Inset showing the drag-and-drop overlay: dashed blue border, cloud upload icon, "Drop files to upload to Q4 Campaign".

SCREEN 3 — Two small dialogs side by side. "New folder": input with "Untitled folder" pre-selected, "Cancel" and blue "Create". "Rename": input "brand-guide.pdf" with only "brand-guide" highlighted, error "A file with this name already exists", "Cancel" and "Rename".

SCREEN 4 — "Move 3 items" folder picker dialog. Tabs "My Files" / "Shared with me" (only folders where you're an Editor). Breadcrumb "My Files > Projects" with back arrow, "Search folders" field, scrollable folder list with chevrons; the current location is disabled and labelled "Current location". Footer: "New folder" text button left, "Cancel" and blue "Move here" right.

SCREEN 5 — Two confirmation dialogs side by side. "Move to trash?": "3 items will be moved to trash. You can restore them within 30 days.", "Cancel" and red "Move to trash". "Delete forever?": warning icon, "'demo-video.mp4' will be permanently deleted. This can't be undone.", note "Teammates with access will also lose it.", "Cancel" and solid red "Delete forever".
```

---

## Batch 5 — Admin dialog (1 screen)
```
Using the MacTidar Cloud design system, generate this screen:

SCREEN 1 — "Invite a teammate" dialog over the dimmed Admin › Members page. Email address field that accepts multiple emails as removable chips. Role selector as two option cards: "Member – can upload, organise and share files" and "Admin – also manages members and storage". Optional personal message textarea. Info note "They'll receive an email with a link to set their password. Invites expire in 7 days." Footer "Cancel" and blue "Send invite". Success toast at the bottom: "Invite sent to tunde@mactidar.com".
```

---

# Part 2 — Public platform (workspaces, sign-up, landing page)

New screens for opening MacTidar Cloud to everyone: anyone can sign up for a free personal account (3 GB) and create or join company workspaces. A person can belong to several workspaces and switch between them. Sharing outside a workspace is **off by default** and has two layers: a company admin must allow it for the workspace, then each member must turn it on for themselves. Personal accounts can't share until they turn sharing on. Billing comes later, so plans are shown as "Free" with "Team plans coming soon".

Use the same design system (`DESIGN.md`) and app shell as Part 1. In the app shell, the area above the "+ New" button now holds a **workspace switcher**: a pill with the workspace logo/initials, name, and plan (e.g. "MacTidar · Company workspace") and a chevron.

Sample data for these screens: user Ukeme (admin@mactidar.com); workspaces "Ukeme's Personal" (personal, 3 GB free) and "MacTidar" (company); an outside user "Sarah Jenkins" (sarah@designcorp.com).

---

## Batch 6 — Marketing & legal (3 screens)
```
Using the MacTidar Cloud design system, generate these 3 public website screens (no app shell; a marketing header and footer instead):

SCREEN 1 — Landing page for MacTidar Cloud at cloud.mactidar.com, desktop 1440px, long scrolling page.
- Sticky header: MacTidar logo left; links "Features", "Pricing", "Security", "FAQ"; right side "Sign in" text link and a blue pill "Get started free" button.
- Hero: headline "Your files, safely in one place" with subline "Cloud storage for you and your team. Upload, organise and share files — with your teammates or anyone, on your terms." Primary button "Get started free — 3 GB included", secondary button "Sign in". Small trust line under the buttons: "No credit card required · Data stored in Africa (Cape Town) · Encrypted with AES-256". On the right, a large product screenshot of the My Files screen in a soft browser frame, with floating cards: an upload progress card ("brand-guide.pdf · Completed") and a share card ("Shared with Ada Okon · Editor").
- Logo/trust strip: "Built on Amazon Web Services" with subtle grey icons for security, encryption, backups.
- Features grid (6 cards with Material icons): "Drag-and-drop uploads" (large files, resumable), "Preview anything" (images, video, PDF, audio), "Share with your team" (Viewer/Editor, folder permissions), "Secure public links" (password, expiry, download control), "Workspaces" (personal + company, switch in one click), "Download folders as .zip".
- "How it works" in 3 numbered steps: Create your free account → Upload or drag in your files → Share with teammates or send a secure link.
- Split section "For companies": left text about company workspaces (invite your team, roles, central storage limit, admin controls over outside sharing); right a mockup of the Members page.
- Security section with 4 icon points: encrypted at rest and in transit, private by default, sharing outside your company is off until an admin allows it, password-protected expiring links.
- Pricing teaser: two cards side by side — "Free" (0, 3 GB storage, personal workspace, public links, preview & zip downloads; button "Get started free") and "Team" (badge "Coming soon", more storage, company workspace, admin controls; button "Join the waitlist", outlined).
- FAQ accordion with 5 questions (one expanded): "Is it really free?", "Where are my files stored?", "Can people without an account see files I share?", "Can I use it for my company?", "How do I delete my account?".
- Final call-to-action band in soft blue gradient: "Start storing your files today" + "Get started free" button.
- Footer: logo and short description, columns "Product" (Features, Pricing, Security), "Company" (About, Contact), "Legal" (Terms of Service, Privacy Policy, Report abuse); copyright "© 2026 MacTidar".

SCREEN 2 — Pricing page. Same header/footer as the landing page. Title "Simple pricing" and subtitle "Start free. Paid team plans are on the way." Two plan cards: "Free" (₦0 / month, highlighted as "Current offer", 3 GB storage, 1 personal workspace, join unlimited company workspaces, public links with password & expiry, max 5 GB per file, button "Get started free") and "Team" (greyed price "—", badge "Coming soon", feature list: more storage per workspace, company admin controls, priority support; outlined button "Notify me" with an email input). Below: a feature comparison table (Storage, Workspaces, Public links, Sharing outside your workspace, Admin controls, Support) with check and dash icons. Small FAQ row: "When will paid plans launch?", "What happens if I reach 3 GB?".

SCREEN 3 — Legal document page (Terms of Service), reusable for the Privacy Policy. Same header/footer. Left sticky table of contents with section links (1. Acceptance, 2. Your account, 3. Your content, 4. Acceptable use, 5. Sharing, 6. Storage limits, 7. Termination, 8. Contact) with the current section highlighted. Right: readable document column (max 720px) with title "Terms of Service", "Last updated 15 October 2026", headings and paragraphs, a highlighted callout box "You own your files. We only access them to run the service or when required by law." Bottom: "Questions? Contact admin@mactidar.com".
```

---

## Batch 7 — Sign-up & onboarding (5 screens)
```
Using the MacTidar Cloud design system, generate these 5 screens (no app shell):

SCREEN 1 — Sign up page, matching the existing Sign in page layout (split screen: left soft blue gradient brand panel with logo, headline "Your team's files, safely in one place" and the folder illustration; right white panel). Right panel: "Create your account" heading, subtitle "Free forever · 3 GB of storage". Fields: Full name, Work or personal email, Password with show/hide and a live checklist (8+ characters, uppercase, lowercase, number, symbol) in green when met. Checkbox "I agree to the Terms of Service and Privacy Policy" with links. Full-width blue pill "Create account" button. Divider "or", outlined button "Continue with Google". Footer text "Already have an account? Sign in". Show one validation example: "An account with this email already exists. Sign in instead."

SCREEN 2 — Verify your email. Centered card on a light grey canvas with logo. Mail-check icon in a soft blue circle, heading "Check your inbox", text "We sent a 6-digit code to ukeme@example.com". Six separate code boxes (first four filled), "Verify email" blue button, "Didn't get it? Resend code (0:42)" and "Use a different email" links. Small note "The code expires in 10 minutes."

SCREEN 3 — Onboarding step "How will you use MacTidar Cloud?". Centered layout with a progress indicator "Step 1 of 2". Two large selectable option cards side by side: "For myself" (person icon, "A personal workspace with 3 GB free. Perfect for your own files.") and "With my company" (building icon, "Create a company workspace and invite your team. You'll also keep a personal workspace."), the second card selected with a blue ring. A third, smaller option below: "I was invited to a company workspace" with text "Check your email for the invite, or paste the invite link". Blue "Continue" button.

SCREEN 4 — Onboarding step "Create your company workspace" ("Step 2 of 2"). Form card: workspace logo upload circle ("Upload logo", optional), "Company name" field ("MacTidar"), "Workspace URL" preview chip ("cloud.mactidar.com/w/mactidar"), "Company size" segmented control (1–10, 11–50, 51–200, 200+), and an "Invite teammates (optional)" email chip input with two chips. Info note: "Sharing outside your company is turned off by default. You can change this in Workspace settings." Buttons "Back" and blue "Create workspace". Right side: a live preview of the sidebar showing the new workspace in the switcher.

SCREEN 5 — Accept a workspace invite as an existing user (signed in). Centered card: two overlapping avatars (inviter and company logo), heading "Ada Okon invited you to join MacTidar", subtitle "Company workspace · 12 members". A role badge "You'll join as Member". A list of what joining means: "You'll see files shared with you in MacTidar", "Your personal files stay private in your personal workspace", "You can switch workspaces any time from the sidebar". Buttons "Decline" (outlined) and blue "Join MacTidar". Small text "Signed in as ukeme@example.com · Not you? Switch account".
```

---

## Batch 8 — Workspaces (5 screens)
```
Using the MacTidar Cloud design system and its app shell, generate these 5 screens:

SCREEN 1 — Workspace switcher open. The My Files screen with the switcher at the top of the sidebar expanded into a dropdown panel: header "Your workspaces"; rows with logo/initials, name, type and role — "Ukeme's Personal · Personal · 1.2 GB of 3 GB" and "MacTidar · Company · Admin" (active, with a check mark), "Designcorp · Company · Member". Each row shows a small storage bar. Footer actions: "+ Create company workspace" and "Workspace settings". The sidebar storage meter reflects the active workspace.

SCREEN 2 — Workspace settings › General (company workspace, admin view). Page title "Workspace settings" with sub-navigation tabs: General, Members, Sharing, Storage, Danger zone. General tab: logo with "Change logo", Workspace name, Workspace URL (read-only with copy button), Plan card ("Free · 3 GB" with badge "Team plans coming soon"), Owner ("Ukeme", with "Transfer ownership" text button), and "Save changes" button.

SCREEN 3 — Workspace settings › Sharing (company admin view). Section "Sharing outside MacTidar" with a large toggle row: "Allow members to share outside this workspace" (currently ON) and description "When on, members can choose to share with people outside MacTidar. Each member must also turn it on for themselves." Below, settings that only apply when ON: "Who outside can receive shares" radio (Anyone with a MacTidar Cloud account / Anyone with an email address — they verify with a one-time code), "Allowed domains (optional)" chip input (designcorp.com), "Public links" toggle "Allow members to create public links" ON, "Maximum link expiry" select (30 days). A callout showing the two layers as a small diagram: Workspace setting → Member's own setting → Share. Audit card at the bottom: "3 members have outside sharing turned on" with a "View" link, and "5 items are shared outside the workspace".

SCREEN 4 — Personal account sharing settings (Account settings › Sharing tab, personal workspace). Status card "Sharing is off" with a lock illustration and text "Files in your personal workspace are private. Turn on sharing to share with other people or create public links." Big blue "Turn on sharing" button. Below, in a dimmed state, the options that become available: "Share with specific people by email" and "Create public links". A second variant in an inset showing it turned ON, with a toggle and a "Turn off sharing" text button and the note "Turning sharing off won't remove existing shares — manage them from each file."

SCREEN 5 — Storage full dialog over the dimmed My Files screen of a personal workspace. Icon of a full cloud in amber. Title "You've used your 3 GB of free storage". Storage bar at 100% (3.0 GB of 3 GB, red). Text "New uploads are paused. Free up space by deleting files or emptying the trash." Two quick actions as list rows with sizes: "Empty trash · frees 240 MB" and "Review largest files". A soft card "Need more space? Team plans are coming soon" with a "Notify me" button. Footer: "Close" and blue "Manage storage".
```

---

## Batch 9 — Sharing outside a workspace (5 screens)
```
Using the MacTidar Cloud design system, generate these 5 screens:

SCREEN 1 — Updated Share dialog (Teammates tab renamed "People") for a folder "Q4 Campaign" in the MacTidar company workspace, when the admin allows outside sharing and the member has turned it on. The add field accepts names or any email; autocomplete shows a teammate and an outside address "sarah@designcorp.com" labelled "Outside MacTidar" with an amber external icon. People list: owner, two teammates (Editor/Viewer), and "Sarah Jenkins · sarah@designcorp.com" with an amber "External" badge and a Viewer dropdown. Amber callout at the top of the list: "This folder is shared with 1 person outside MacTidar." Footer note: "External people verify their email before they can open shared items."

SCREEN 2 — Share dialog blocked states, shown as three small dialog variants side by side:
(a) Company workspace, admin has NOT allowed outside sharing: typing "sarah@designcorp.com" shows an inline message "Sharing outside MacTidar is turned off by your workspace admin" with a "Request access" link.
(b) Admin allows it but the member hasn't turned it on: inline card "Sharing outside MacTidar is off for you" with explanation and a toggle "Allow me to share with people outside MacTidar" plus "Learn more".
(c) Personal workspace with sharing off: the whole People tab replaced by a lock illustration, "Sharing is turned off for your personal workspace", and a blue "Turn on sharing" button.

SCREEN 3 — Turn on sharing confirmation dialog (personal account). Title "Turn on sharing?" with a share icon. Bullet list: "You'll be able to share files with specific people by email", "You can create public links with passwords and expiry dates", "Only items you choose are shared — everything else stays private". Checkbox "I understand that people I share with can download and keep copies of files". Buttons "Cancel" and blue "Turn on sharing".

SCREEN 4 — Guest access page for someone WITHOUT a MacTidar Cloud account who received a share by email (no app shell; minimal header with logo and "Sign in"). Centered card: sharer avatar, "Ukeme shared 'Q4 Campaign' with you", file/folder chip "Folder · 18 files · 1.4 GB". Step 1 visible: "Confirm it's you" with the email pre-filled and locked ("sarah@designcorp.com") and a blue "Send me a code" button. Step 2 shown as a second card next to it: six code boxes, "Verify and open". Below both: divider and a soft card "Want your own space? Create a free MacTidar Cloud account — 3 GB free" with "Create free account" link. Footer note: "Only sarah@designcorp.com can open this share. Don't forward this email."

SCREEN 5 — Guest view of the shared folder after verifying (no sidebar; minimal header showing "Viewing as sarah@designcorp.com · Guest" and "Create free account" button). Header card like the public shared-link page: "Q4 Campaign", "Shared by Ukeme from MacTidar", badges "Viewer access" and "Guest". Grid of file cards with thumbnails, per-file Preview and Download. A dismissible banner: "You're viewing as a guest. Your access lasts while Ukeme keeps this shared with you."
```

---

## Batch 10 — Platform admin & safety (5 screens)
```
Using the MacTidar Cloud design system, generate these 5 screens for the platform owner's admin console. Use the app shell, but replace the sidebar navigation with a "Platform" section: Overview, Workspaces, Users, Abuse reports, System; and a small "Platform admin" badge next to the logo.

SCREEN 1 — Platform overview dashboard. Title "Platform overview". Stat cards: Total users (1,284, +86 this week), Workspaces (1,402 — 1,180 personal / 222 company), Storage used (612 GB of S3, trend sparkline), Download traffic this month (1.8 TB, with estimated cost "~$270"), Open abuse reports (3, red). Charts: "Sign-ups per day" line chart (30 days), "Storage by workspace type" donut, "Top workspaces by download traffic" table (name, type, traffic, change). Alert banner at top: "Download traffic is 40% higher than last month."

SCREEN 2 — Workspaces list. Search, filters (Type: All/Personal/Company; Status: Active/Suspended; Plan: Free). Table columns: Workspace (logo + name + URL), Type, Owner, Members, Storage (bar + "1.2 GB of 3 GB"), Traffic (30 days), Outside sharing (On/Off badge), Created, Status (Active green / Suspended red), and a ⋯ menu (View, Suspend, Delete). 10 rows with realistic mixed data; one suspended row.

SCREEN 3 — Workspace detail (platform admin). Header with workspace logo, name "Designcorp", badges "Company", "Free", "Active", buttons "Suspend workspace" (red outline) and "Contact owner". Tabs: Overview, Members, Storage, Sharing, Activity. Overview tab: owner card, members count, storage and traffic cards, outside sharing status ("On · 2 domains allowed"), public links active (14), recent activity list (uploads, shares, link creations with timestamps), and an admin notes textarea.

SCREEN 4 — Abuse reports queue. Title "Abuse reports" with tabs Open (3), Reviewing (1), Resolved. Each report as a card row: reported item thumbnail + name ("free-movie-2026.mkv"), public link URL, reason badge (Copyright, Malware, Spam, Illegal content), reporter email or "Anonymous", reported date, workspace and owner. Actions per row: "Preview", "Disable link", "Delete file", "Suspend workspace", "Dismiss". One row expanded showing the reporter's message and a timeline (Reported → Link disabled automatically after 3 reports).

SCREEN 5 — "Report abuse" dialog on the public shared-link page (outside visitor view). Small link "Report abuse" in the page footer opens a dialog: title "Report this content", reason radio list (Copyright infringement, Malware or phishing, Spam, Illegal or harmful content, Something else), optional details textarea (0/500), optional email field "Your email (so we can follow up)", bot check placeholder area, buttons "Cancel" and red "Submit report". Show the success state in an inset: green check, "Thanks — our team will review this within 24 hours."
```

---

## Batch 11 — Homepage redesign (1 screen)

A dedicated prompt for the public homepage, replacing the Batch 6 "Screen 1" landing page. Generate it on its own (one screen per prompt) so Stitch can spend its full effort on it.

```
Using the MacTidar Cloud design system (Inter, primary blue #2563EB, canvas #F7F8FA, 8px radius on inputs, pill-shaped primary buttons, Material Symbols icons), design the public HOMEPAGE for MacTidar Cloud at cloud.mactidar.com. Desktop 1440px, long scrolling page, plus the mobile (390px) version of the hero beside it.

GOAL
Turn visitors into sign-ups. The page tells one story: "Your work, safely in one place — and easy to share with the people who need it." Primary action everywhere: "Get started free". Secondary action: "Sign in" (header only) and "Create a company workspace" (company sections only).

DESIGN PRINCIPLES (apply throughout)
- Human first: every major section includes real people — warm, natural, editorial-style photography of African professionals and creatives (Lagos, Nairobi, Accra, Cape Town settings), genuine moments (working, laughing with a colleague, presenting, on a phone in a café), never stiff stock poses. Consistent photo treatment: soft natural light, 24px rounded corners, subtle warm tone. Product UI cards float over or beside the photos so people and product appear together.
- Clear hierarchy: one H1, one headline per section (40px desktop / 28px mobile), short supporting line (max 2 lines, max-width 640px). Body copy is scannable — bullets of max 8 words, no paragraphs longer than 3 lines.
- Benefit-led copy, not jargon: say what the user gets ("Find any file in seconds"), never technical terms (no "multipart", "recursive inheritance", "egress").
- Varied rhythm: alternate backgrounds (white, canvas #F7F8FA, one deep navy #0B1B3F section, soft blue gradient banners) and alternate layouts (split image/text, zig-zag rows, full-width banners, compact grids) so no two adjacent sections look alike.
- Consistent actions: the primary CTA is always the same blue pill "Get started free" with a right arrow; secondary actions are text links with an arrow. Never two competing primary buttons side by side.
- Social proof near decisions: avatars and short quotes appear right before or beside each call to action.
- Generous whitespace: 120px vertical section padding on desktop, 72px on mobile; 8-point spacing grid.
- Accessibility: WCAG AA contrast on all text (including text over photos, using a gradient scrim), visible focus states, icons always paired with labels.
- Mobile: every split section stacks image-first or text-first logically; CTAs become full-width buttons; the sticky header shows only the logo, "Sign in" and a compact "Get started" button.

HONESTY RULES (important)
Only use these true claims: free 3 GB personal account, no credit card needed, files encrypted at rest (AES-256) and in transit (HTTPS), data stored in Africa (AWS Cape Town), private by default, sharing outside a company is off until an admin allows it, password-protected links that expire, deleted files recoverable for 30 days, preview images/video/audio/PDF/text in the browser, download folders as .zip, max 5 GB per file. Do NOT mention certifications (ISO, SOC 2), "zero-knowledge", "end-to-end encryption", user counts ("thousands of teams"), uptime percentages, CAD previews, tagging/colour-coding, or multi-region routing. Testimonials are clearly placeholder content: use the small label "Sample testimonial" in the design.

SECTIONS, IN ORDER

1. STICKY HEADER (white, 72px, subtle shadow on scroll)
MacTidar Cloud logo (blue cloud icon + "MacTidar Cloud"); nav: Features, For teams, Security, Pricing, FAQ; right: "Sign in" text link and blue pill "Get started free".

2. HERO (white with a very soft blue radial glow behind the visual)
Left (6 columns): small pill label "Free 3 GB · No credit card"; H1 (56px, bold) "Your work, safely in one place."; subline "Store, preview and share your files with your team — or anyone — on your terms."; blue pill "Get started free →" and text link "See how it works ↓"; under the buttons a social-proof row: a stack of 5 overlapping circular face photos + "Made for freelancers, creatives and growing teams across Africa".
Right (6 columns): a large photo of a young Nigerian woman in a bright creative studio, smiling at her laptop. Overlapping the photo edges: (a) an upload card "Brand Kit 2026.zip · Uploaded ✓" with a green progress bar, (b) a share card showing two small face avatars "Shared with Ada & Tunde · Editor", (c) a small link card "Link expires in 7 days · 🔒 Password". Cards have white backgrounds, 16px radius and soft shadows.

3. "WHO IT'S FOR" STRIP (canvas background)
Section headline "Built around the way you work". Three tall photo cards side by side, each with a person photo filling the top 60%, then a title, one line and a text link:
- "Freelancers & creatives" — photographer reviewing shots on a tablet — "Send clients beautiful, password-protected links."
- "Small businesses" — two shop owners with a laptop at a counter — "Keep invoices, contracts and photos organised."
- "Teams & agencies" — a team around a meeting table — "One shared space with the right access for everyone."

4. FEATURE STORY — THREE ZIG-ZAG ROWS (white)
Each row: photo with an overlapping UI card on one side, text on the other; sides alternate.
Row A "Everything in one place" — photo of a man at a co-working desk dragging files from his desktop; overlay: the My Files list with folders and a drag-and-drop highlight. Bullets: Drag and drop any file up to 5 GB · Folders that stay tidy · Preview photos, videos and PDFs instantly. Link "Explore your files →".
Row B "Share with your team, your way" — photo of two colleagues looking at one screen and smiling; overlay: Share dialog with three face avatars and Viewer/Editor badges. Bullets: Viewer or Editor access in one click · Share a folder, everything inside follows · Remove access any time. Link "How sharing works →".
Row C "Send to anyone, safely" — photo of a client receiving a link on her phone in a café; overlay: public link card with password field and "Expires 30 Oct" chip. Bullets: Password-protect any link · Set links to expire · Turn downloads on or off. Link "About secure links →".

5. CTA BANNER 1 — FULL-WIDTH IMAGE BANNER
Full-bleed (rounded 32px within the page container) photo of a small team celebrating around a laptop, with a left-to-right deep-blue gradient scrim. Left text in white: "Start with 3 GB free. Upgrade never required." + supporting line "Set up in under a minute — no credit card." White pill button "Get started free →". Right side: three small floating white stat chips over the photo: "Free 3 GB", "Data stored in Africa", "Encrypted at rest".

6. "AND THERE'S MORE" — COMPACT FEATURE GRID (canvas)
Headline "Small details that save you time". 6 compact tiles (icon in a soft-tinted circle, title, one line) in 3×2: Download folders as .zip · Find any file in seconds (search) · Star what matters · Recent files, one click away · Undo deletes for 30 days · Switch between personal and company workspaces. Tiles are lighter than cards (no heavy shadows), so this section feels quick to scan.

7. HOW IT WORKS (white)
Headline "Up and running in three steps". Horizontal timeline with a thin connecting line and numbered blue circles; under each step a small UI thumbnail (not just text): 1 "Create your free account" (sign-up form thumbnail) · 2 "Add your files" (drag-and-drop thumbnail) · 3 "Share or send a link" (share dialog thumbnail). Centered blue pill "Get started free →" below the steps.

8. FOR COMPANIES — SPLIT SECTION (canvas)
Left: photo of a founder presenting to her team in a glass meeting room, with an overlay of the Members list (face avatars, Admin/Member badges, storage bars). Right: label "For teams", headline "Bring your whole team", bullets with check icons: Invite your team in seconds · Admins and members, clearly separated · One storage pool for the company · Outside sharing stays off until you allow it. Primary pill "Create a company workspace →" and text link "Talk to us".

9. TESTIMONIALS (white)
Headline "People who keep their work here". Three quote cards in a row (one slightly raised to break the grid): circular photo, quote in 18px (max 2 sentences), name, role and city, and the small grey label "Sample testimonial". Examples: "I send every client delivery as a password link now. It looks professional and I sleep better." — Amaka O., Photographer, Lagos. "Our whole studio finally works from one folder." — Kwame A., Creative director, Accra. "Setting up the team took five minutes." — Wanjiru M., Operations lead, Nairobi.

10. SECURITY & PRIVACY — DARK SECTION (deep navy #0B1B3F, white text)
Left: headline "Private by default. Secure by design." and a short line "Your files are yours. We don't sell your data or use it for ads." Right: 2×2 grid of points with outline icons in light blue: Encrypted at rest and in transit · Stored in Africa (Cape Town) · Links with passwords and expiry · Admin control over outside sharing. A subtle illustration of a shield over a map pin on Africa. Text link "Read about security →" in light blue.

11. CTA BANNER 2 — TEAM INVITE BANNER
Soft blue gradient band (light, not dark) with a cluster of 6 smiling face avatars arranged in a loose circle on the right. Left: "Your team is one invite away." + "Create a company workspace and add your colleagues by email." Primary pill "Create a company workspace →" and text link "Or start with a personal account".

12. PRICING TEASER (canvas)
Headline "Simple pricing". Two cards: "Free" (highlighted with a blue ring and "Available now" badge, ₦0/month, 3 GB storage, personal workspace, secure links, previews and .zip downloads; pill "Get started free") and "Team" ("Coming soon" badge, muted, more storage and admin controls; outlined button "Notify me"). Link "See full pricing →".

13. FAQ (white, centered, max-width 760px)
Accordion with 6 questions, first open: "Is it really free?" (Yes — 3 GB, no card needed.) · "Where are my files stored?" (On Amazon Web Services in Cape Town, South Africa, encrypted at rest.) · "Can people without an account see what I share?" (Yes, through a secure link you control, or by verifying their email with a one-time code.) · "Can I use it for my company?" · "What happens if I delete something by mistake?" (It stays in Trash for 30 days.) · "How do I delete my account?". Below: "Still have questions? Contact us →".

14. FINAL CTA (white page, large rounded blue gradient card)
Split inside the card: left white text "Your files deserve a better home." + "Get started free — 3 GB included, no credit card." + white pill "Get started free →"; right a photo of a smiling young man with headphones working on a laptop, cut out or framed with rounded corners, overlapping the card edge for depth.

15. FOOTER (white, top border)
Logo and one-line description "Cloud storage for people and teams in Africa and beyond."; columns Product (Features, Pricing, Security), Company (About, Contact), Legal (Terms of Service, Privacy Policy, Report abuse); bottom row "© 2026 MacTidar" and small "Data stored in Cape Town" with a map-pin icon.
```
