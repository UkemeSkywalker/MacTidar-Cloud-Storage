---
name: Airy Collaborative Workspace
colors:
  surface: '#FFFFFF'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#585f67'
  on-secondary: '#ffffff'
  secondary-container: '#dce3ec'
  on-secondary-container: '#5e656d'
  tertiary: '#006329'
  on-tertiary: '#ffffff'
  tertiary-container: '#007f36'
  on-tertiary-container: '#c7ffca'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dce3ec'
  secondary-fixed-dim: '#c0c7d0'
  on-secondary-fixed: '#151c23'
  on-secondary-fixed-variant: '#40484f'
  tertiary-fixed: '#7ffc97'
  tertiary-fixed-dim: '#62df7d'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005320'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
  canvas: '#F7F8FA'
  border: '#E5E7EB'
  text-primary: '#111827'
  text-secondary: '#6B7280'
  warning: '#D97706'
  danger: '#DC2626'
  overlay-dark: rgba(17, 24, 39, 0.95)
  file-folder: '#2563EB'
  file-pdf: '#DC2626'
  file-image: '#9333EA'
  file-video: '#EC4899'
  file-doc: '#4F46E5'
  file-sheet: '#16A34A'
  file-archive: '#6B7280'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

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