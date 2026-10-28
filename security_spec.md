# Security Specification & Test Protocol

## 1. Data Invariants
- Every user's ERP data is strictly partitioned by their authenticated Firebase UID (`request.auth.uid`).
- A user can only read, write, update, or delete data within `/users/{userId}/**` where `request.auth.uid == userId`.
- Unauthenticated requests are rejected on all collections with `PERMISSION_DENIED`.
- Cross-tenant data reads and writes are mathematically impossible because paths enforce `request.auth.uid == userId`.
- All writes require verified identity and cannot spoof owner IDs.

## 2. The "Dirty Dozen" Threat Payloads
1. **Unauthenticated Read**: Attempting to read `/users/userA/items` without an auth token -> DENIED.
2. **Unauthenticated Write**: Attempting to write a sale or purchase without an auth token -> DENIED.
3. **Cross-Tenant Read**: User B attempting to read User A's sales, ledger, or customers -> DENIED.
4. **Cross-Tenant Write**: User B attempting to create an item, payment, or purchase under User A's path -> DENIED.
5. **Cross-Tenant Update**: User B attempting to modify User A's factory balances -> DENIED.
6. **Cross-Tenant Delete**: User B attempting to delete User A's parties or customer records -> DENIED.
7. **Root Collection Injection**: Attempting to create documents in unmapped root collections -> DENIED by default-deny catchall.
8. **Malicious Path Traversal**: Attempting to escape the `/users/{userId}` structure -> DENIED.
9. **Junk Character ID Injection**: Injecting 100KB document IDs -> DENIED by path ID format validation.
10. **Spoofed User Context**: Setting `userId` in document payload different from path owner -> DENIED.
11. **Negative Amount Tampering**: Manipulating financial totals with non-numeric payloads -> Handled by schema validation.
12. **Tampering with System Connection Doc**: Writing to connection health check document -> READ-ONLY / DENIED.
