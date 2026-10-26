# Elvora Zero-Trust Firestore Security Specification

## 1. Data Invariants & Master Source of Truth

1. **Global Default-Deny**: Every path outside explicitly declared collections in `firebase-blueprint.json` is unconditionally denied (`allow read, write: if false`).
2. **Verified Identity Gate**: Every mutating operation (`create`, `update`, `delete`) requires an authenticated Firebase session with `request.auth.token.email_verified == true`. Unverified email claims (even matching `bravinbrown8@gmail.com`) are rejected.
3. **Catalog & AI Feed Integrity**: Only the verified Store Administrator (`isAdmin()`) can create, update, or delete `/products/{productId}` (supporting `Combos`, `Audio`, `Wearables`, `Power`, `Computing`), `/ownerSettings/{settingId}`, and `/aiPosts/{postId}`. Every field enforces exact `maxLength`, `minLength`, and `pattern` constraints from `firebase-blueprint.json`.
4. **Split-Collection PII Isolation & Master Gate**:
   - `/orders/{orderId}` contains strictly non-PII fulfillment tracking data (`orderCode`, `status`, `totalUsd`, `oemOrderRef`, `logoImprint`).
   - Customer PII (`customerName`, `customerPhone`, `deliveryAddress`, `ownerPayoutPhone`) is isolated in `/orders/{orderId}/private/{detailId}` (`detailId == 'shipping'`).
   - Reading `/orders/{orderId}/private/{detailId}` enforces the Master Gate via `get(/databases/$(database)/documents/orders/$(orderId)).data.buyerId == request.auth.uid` (or `isAdmin()`), with `list` permanently disabled.
   - `/inquiries/{inquiryId}` contains customer Contact Us PII (`contactInfo`), so `get` and `list` strictly restrict reads to `existing().senderUid == request.auth.uid` or the verified administrator (never blanket `isSignedIn()`).
   - `/reviews/{reviewId}` stores strictly non-PII public buyer reviews (`authorName`, `rating` 1..5, `comment`) with `authorUid == request.auth.uid` verified on `create`, relational `exists(/products/$(incoming().productId))` check, and immutable once posted.
   - `/customerProfiles/{userId}` stores strictly non-PII customer preferences (`uid`, `displayName`, `countryName`, `currencyCode`) while isolating PII (`email`, `phone`, `defaultAddress`) inside `/customerProfiles/{userId}/private/{detailId}` (`detailId == 'contact'`), guarded by the Master Gate `get(/databases/$(database)/documents/customerProfiles/$(userId)).data.uid == request.auth.uid` and `list: if false`.
5. **Batch Atomicity Guarantee**: Creating `/orders/{orderId}` requires `existsAfter` on `/orders/{orderId}/private/shipping`, and creating `/customerProfiles/{userId}` requires `existsAfter` on `/customerProfiles/{userId}/private/contact` (and vice versa via `getAfter`).
6. **Temporal & Terminal State Locking**: All `createdAt` / `updatedAt` fields must equal `request.time` on write, `createdAt` and ownership fields are immutable on `update`, and orders in terminal `delivered` state or inquiries in terminal `resolved` state cannot be modified by non-admins.
7. **Zero-Cost List Enforcement**: Every `allow list` rule evaluates `resource.data` (`existing()`) directly and contains zero `get()` or `exists()` calls.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Field Injection on Product Create**: Verified admin sends valid `Product` payload plus undocumented field `"isFeaturedHack": true` -> `PERMISSION_DENIED` (`hasOnly` check).
2. **Unverified Admin Email Spoof**: Attacker authenticates with `email: "bravinbrown8@gmail.com"` and `email_verified: false` to update `/ownerSettings/config` -> `PERMISSION_DENIED` (`email_verified == true` check).
3. **Cross-User PII Leak (PII Blanket Test)**: Verified user `uid_attacker` calls `get` on `/orders/ord_101/private/shipping` or `/inquiries/inq_1` owned by `uid_victim` -> `PERMISSION_DENIED` (Master Gate + `buyerId`/`senderUid` check).
4. **Orphaned Order Without Atomic PII Subdoc**: Verified buyer creates `/orders/ord_102` without simultaneously writing `/orders/ord_102/private/shipping` in the same batch -> `PERMISSION_DENIED` (`existsAfter` check).
5. **Buyer Identity Spoofing on Order/Review Create**: Verified user `uid_attacker` creates `/orders/ord_103` or `/reviews/rev_9` setting `"buyerId"` / `"authorUid"` to `"uid_victim"` -> `PERMISSION_DENIED`.
6. **Denial-of-Wallet Oversized Document ID**: Verified buyer creates order with a 200-character or malformed ID -> `PERMISSION_DENIED` (`isValidId` regex + `<= 128` size cap).
7. **Value Poisoning on Update**: Verified admin updates `stockRemaining` on `/products/prod_1` with a string `"unlimited"` instead of a bounded integer -> `PERMISSION_DENIED` (`isValidProduct` wraps `allow update`).
8. **Client Timestamp Forgery**: Verified buyer creates `/orders/ord_105` with backdated `createdAt` (`request.time - 1h`) -> `PERMISSION_DENIED` (`incoming().createdAt == request.time`).
9. **Terminal State Reversal**: Verified buyer attempts to update `/orders/ord_106` when `existing().status == "delivered"` -> `PERMISSION_DENIED` (Terminal State Lock).
10. **Immutable Ownership Mutation**: Verified admin attempts to mutate `createdAt` or `ownerEmail` during a product price update -> `PERMISSION_DENIED` (`incoming().createdAt == existing().createdAt` & `affectedKeys().hasOnly`).
11. **Self-Assigned Admin Escalation**: Verified user attempts `create` on `/admins/uid_attacker` -> `PERMISSION_DENIED` (`/admins` write locked `if false`).
12. **Unscoped List Scraping on Orders or Inquiries**: Verified user attempts unfiltered `list` across `/orders` or `/inquiries` returning another customer's record -> `PERMISSION_DENIED` (`existing().buyerId == request.auth.uid` / `existing().senderUid == request.auth.uid`).

## 3. Red Team Conflict Audit Summary

- **Identity Spoofing**: Blocked across all collections (`buyerId == request.auth.uid`, `ownerUid == request.auth.uid`, `createdBy == request.auth.uid`, `authorUid == request.auth.uid`, `senderUid == request.auth.uid`).
- **State Shortcutting & Terminal Locking**: Orders enforce explicit enum states and lock once `status == 'delivered'`; inquiries start at `status == 'open'` and only verified admins can transition to `resolved`.
- **Resource & Value Poisoning**: Every collection's `allow create` and `allow update` begins with `isValidId(...)` and `isValid[Entity](incoming())`, enforcing strict `hasOnly`, string `.size()`, regex `.matches()`, and numeric bounds before any `get()`/`exists()` call.
