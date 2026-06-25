# ACC v1.0.1 — Store compliance checklist

References:
- [Chrome Web Store publish](https://developer.chrome.com/docs/webstore/publish?hl=de)
- [Firefox Extension Workshop](https://extensionworkshop.com/documentation/develop/)
- [Firefox Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/)

## Code / manifest (pre-upload)

- [x] MV3 valid manifest + ZIP/XPI build (`npm run build`)
- [x] All 20 provider host_permissions in chrome.json + firefox.json
- [x] Firefox `data_collection_permissions.required: ["none"]`
- [x] Chrome service_worker vs Firefox background.scripts (build.mjs)
- [x] Confirm dialog before irreversible delete
- [x] No affiliate injection; support links only in extension UI footer
- [x] Manifest description ≤132 chars (fixed in v1.0.1)
- [x] 32×32 and 96×96 icons present

## AMO listing text (copy when uploading)

**Summary:** Bulk-delete AI chat history on 20 platforms — one click, local only, no tracking.

**Permissions:** Host access to supported AI sites so ACC can call each site's delete API or UI on your command. No data sent to Sunny C. or third parties except optional GitHub bug reports you trigger.

**Privacy:** No data collection. Debug reports are redacted and only created when you copy/report a failure.

## CWS listing text

**Single purpose:** Delete user-initiated chat/conversation history on supported AI websites.

**Privacy tab:** Does not collect, store, or transmit user data. Operates only on pages you open. Optional redacted debug report for GitHub issues.

**Reviewer notes:** Log in to e.g. claude.ai → open ACC popup → confirm → deletes visible chats. Login required per site.

## Post-upload

- [ ] Firefox AMO v1.0.1 submitted
- [ ] Chrome CWS v1.0.1 submitted
- [ ] Edge v1.0.1 submitted (optional)
- [ ] GitHub Release v1.0.1 created
