# MacTidar Cloud — Design System

Team cloud file storage web app. Desktop-first (1440px), responsive down to mobile.

## Personality
Clean, modern, bright and airy. Similar in spirit to Google Drive and Dropbox, with its own identity. Generous whitespace, calm and trustworthy.

## Colors
| Token | Value | Use |
|---|---|---|
| background | #FFFFFF | Cards, panels, dialogs |
| canvas | #F7F8FA | App background |
| border | #E5E7EB | Dividers, input borders |
| text-primary | #111827 | Headings, body |
| text-secondary | #6B7280 | Metadata, hints |
| primary | #2563EB | Primary buttons, links, active nav, focus rings |
| primary-soft | #EFF6FF | Selected rows, active nav background |
| success | #16A34A | Completed, active status |
| warning | #D97706 | Pending, near-limit |
| danger | #DC2626 | Delete, errors |
| overlay-dark | #111827 at 95% | File preview background |

File type icon colors: folders blue, PDFs red, images purple, videos pink, docs indigo, spreadsheets green, archives grey.

## Typography
- Font: Inter
- Body 14px, metadata 12–13px, page titles 24px semibold, section titles 16px semibold

## Shape & elevation
- 8px corner radius on cards, inputs, dialogs; pill-shaped primary buttons
- Subtle shadows (cards: 0 1px 2px rgba(0,0,0,0.05); dialogs: 0 10px 30px rgba(0,0,0,0.12))

## Icons
Outline style (Lucide), 20px in navigation, 16px inline.

## App shell (all signed-in pages)
- **Left sidebar (260px):** logo "MacTidar", large "+ New" button, nav items (My Files, Shared with me, Recent, Starred, Trash), an "Admin" section (Members, Storage) visible to admins only, and a storage meter at the bottom ("6.2 GB of 15 GB used" with a progress bar).
- **Top bar:** wide search field, notifications bell, user avatar with dropdown (Settings, Sign out).

## Components
- Buttons: primary (solid blue pill), secondary (white with border), danger (solid red), text buttons
- Tables: 56px rows, hover highlight, checkbox selection, row quick actions on hover
- Badges: Editor (blue), Viewer (grey), Admin, Member, Active (green), Invited (amber)
- Toasts: bottom-center, dark background, white text
- Empty states: soft illustration, one-line message, optional action button

## Sample content
- Team members: Ukeme (Admin), Ada Okon, Tunde Bello
- Folders: Designs, Contracts, Videos, Invoices, Q4 Campaign
- Files: brand-guide.pdf, hero-banner.png, demo-video.mp4, budget.xlsx, notes.docx, logo-pack.zip
