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
