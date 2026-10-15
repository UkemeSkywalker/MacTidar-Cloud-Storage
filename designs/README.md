# Design exports (Google Stitch)

Each folder holds a `screen.png` and/or `code.html` exported from Stitch. Prompts live in [`docs/stitch-prompts.md`](../docs/stitch-prompts.md); the design system is [`DESIGN.md`](../DESIGN.md) / `airy_collaborative_workspace/DESIGN.md`.

## Use these for the public platform (Part 2)

| Prompt | Folder |
|---|---|
| **Homepage (Batch 11)** | `homepage_with_visible_footer_mactidar_cloud` |
| Pricing | `pricing_mactidar_cloud` (code only) |
| Terms / Privacy | `terms_of_service_mactidar_cloud` |
| Sign up | `sign_up_mactidar_cloud` (code only) |
| Verify email | `verify_your_email_mactidar_cloud` |
| Onboarding | `onboarding_step_1_workspace_choice_mactidar_cloud`, `onboarding_step_2_create_workspace_mactidar_cloud` |
| Accept workspace invite | `accept_workspace_invite_mactidar_cloud` |
| Workspaces | `workspace_switcher_open_mactidar_cloud`, `workspace_settings_general_mactidar_cloud`, `workspace_settings_sharing_mactidar_cloud`, `personal_account_sharing_settings_mactidar_cloud`, `storage_full_dialog_mactidar_cloud` |
| Outside sharing | `share_dialog_people_external_sharing_mactidar_cloud`, `share_dialog_blocked_states_mactidar_cloud`, `turn_on_sharing_confirmation_mactidar_cloud`, `guest_access_verification_mactidar_cloud`, `guest_view_q4_campaign_folder_mactidar_cloud` |
| Platform admin | `platform_overview_mactidar_cloud_admin`, `workspaces_mactidar_cloud_admin`, `workspace_detail_designcorp_mactidar_cloud_admin`, `abuse_reports_queue_mactidar_cloud_admin`, `report_content_dialog_mactidar_cloud` |
| People photos | the `*photograph*` / `*portrait*` folders |

## Do not build from these

- `landing_page_creator_hero_photo_variant`, `landing_page_multi_touchpoint_human_elements`, `landing_page_team_photography_variant` — from the older Batch 6 prompt; they contain claims that aren't true for MacTidar Cloud (ISO-27001, zero-knowledge, end-to-end encryption, "thousands of" users, CAD previews).
- `homepage_mactidar_cloud`, `landing_page_mactidar_cloud` — failed Stitch exports (placeholder only).

Images in the `code.html` files load from Google-hosted URLs that can expire; copy them into the app when building a screen.
