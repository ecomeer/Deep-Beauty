# Deep Beauty WhatsApp Web Sales Bot — Design

**Date:** 2026-07-17  
**Status:** Approved for planning  
**Target number:** `+96597515901`  
**Storefront:** `https://deepbeautykw.com`

## 1. Goal

Build a WhatsApp automation service for Deep Beauty that behaves like the existing Soapy workflow:

- The Deep Beauty number remains registered in the WhatsApp Business mobile app.
- The owner and staff can reply normally from the mobile app or linked WhatsApp Web devices.
- A Gemini-powered bot answers customers automatically when no human is handling the chat.
- The bot reads products, prices, stock, and order status from the Deep Beauty Supabase project.
- The bot recommends products, builds a cart, and sends a checkout link.
- The bot never creates, edits, cancels, or confirms an order by itself.
- Human messages pause the bot for that conversation to prevent duplicate or conflicting replies.

This design replaces the planned Twilio/Flex integration for this project.

## 2. Important constraint

The integration uses `whatsapp-web.js`, which automates a linked WhatsApp Web session. It is not the official Meta WhatsApp Business Platform API.

Consequences:

- It allows the same number to remain usable in the WhatsApp Business mobile app.
- It avoids Twilio/Flex subscription costs.
- It may require QR re-authentication after session loss.
- WhatsApp changes can temporarily break the integration.
- Meta may restrict the number if the account is used for spam, high-volume unsolicited messaging, or behavior that violates WhatsApp policies.

The service must therefore be limited to inbound support, transactional replies, customer-requested product recommendations, and low-volume supervisor alerts. Bulk campaigns and unsolicited broadcasts are out of scope.

## 3. Architecture

### 3.1 Existing application

The existing Next.js 16 storefront remains deployed on Vercel and continues to own:

- Product and checkout pages.
- Order creation and payment flows.
- Admin authentication.
- Supabase-backed product, stock, customer, and order data.

### 3.2 New persistent bot service

Add a separate Node.js 22 TypeScript service under:

`services/whatsapp-bot/`

The service runs continuously on a persistent Linux VPS using PM2. It must not run as a Vercel Function because WhatsApp Web requires a long-lived Chromium process and persistent session storage.

Recommended runtime characteristics:

- Ubuntu LTS.
- At least 2 GB RAM.
- Persistent disk for the WhatsApp session.
- HTTPS reverse proxy for protected operational endpoints.
- PM2 process supervision and automatic restart.

### 3.3 Main components

1. **WhatsApp session adapter**
   - `whatsapp-web.js` client.
   - Headless Chromium through Puppeteer.
   - Persistent `LocalAuth` directory on the VPS.
   - QR generation only when the session is not authenticated.
   - Automatic reconnect with bounded retry delays.

2. **Message orchestrator**
   - Normalizes incoming text and phone identifiers.
   - Ignores status broadcasts, groups, duplicate events, and unsupported system messages.
   - Checks whether the conversation is bot-active, human-paused, or escalated.
   - Calls Gemini only when automation is allowed.

3. **Gemini agent**
   - Detects Arabic or English and replies in the same language.
   - Uses Kuwaiti Arabic as the default Arabic tone.
   - Produces concise sales and support responses.
   - Calls narrowly scoped application tools instead of reading Supabase directly.
   - Must not invent prices, stock, ingredients, benefits, policies, discounts, or order data.

4. **Commerce tools**
   - Search active products.
   - Read product details, price, images, and current stock.
   - Recommend products from verified catalog fields.
   - Build a signed, expiring shared cart.
   - Verify and look up an order using phone number plus order number.

5. **Human takeover controller**
   - Detects outgoing human messages from the WhatsApp Business app or linked devices.
   - Distinguishes bot-sent messages from human-sent messages using recently recorded outbound WhatsApp message IDs.
   - Pauses the bot for that customer after any human reply.
   - Allows an authenticated admin action to resume the bot.

6. **Operations endpoints**
   - Health and connection status.
   - Protected QR display.
   - Pause/resume a conversation.
   - Reconnect or log out the WhatsApp session.
   - All operational routes require authentication and must never be publicly accessible without protection.

## 4. Conversation behavior

### 4.1 Language and tone

- Arabic messages receive Kuwaiti Arabic replies.
- English messages receive English replies.
- The bot stays in the customer's current language unless the customer clearly switches.
- Replies are short, natural, and sales-oriented without pressure or false claims.
- Health-related wording must remain cosmetic and informational; the bot must not diagnose or promise medical outcomes.

### 4.2 Sales flow

1. Understand the customer's need.
2. Ask one focused follow-up question when required.
3. Retrieve matching active, in-stock products from Supabase.
4. Present up to three relevant choices with verified prices.
5. Confirm quantities.
6. Create a shared cart record with a random token and expiration.
7. Send a checkout URL such as:

   `https://deepbeautykw.com/cart?share=<opaque-token>`

8. The storefront loads the shared cart, revalidates product availability and prices, and lets the customer complete checkout normally.

The shared cart is a convenience link, not an order. Final totals, discounts, shipping, stock, and payment validation remain controlled by the existing checkout API.

### 4.3 Order tracking flow

Before exposing order status, the bot requires:

- The customer's phone number, normalized to E.164 where possible.
- The exact order number.

The order lookup tool returns only the minimum necessary information:

- Order number.
- Current status.
- Payment status.
- Total.
- Last update time.

It must not disclose address, email, notes, or another customer's order data.

### 4.4 Human takeover

A conversation enters human mode when any of these occurs:

- A staff member sends a message manually from WhatsApp Business or a linked device.
- The customer explicitly asks for a human.
- The bot detects a complaint, return, exchange, failed payment, order modification request, angry customer, or low-confidence answer.
- An admin pauses the conversation.

Behavior:

- The customer receives one acknowledgment when automatic escalation occurs.
- The bot stops responding in that chat.
- A WhatsApp alert is sent to the supervisor at `+96598983566` with the customer's number, detected reason, and a short summary.
- Repeated customer messages while escalated do not trigger repeated supervisor alerts within a configurable cooldown.
- Human outbound messages extend the pause.
- The bot resumes only through the protected admin action or an explicitly configured timeout for non-sensitive conversations.
- Sensitive escalations remain paused until manually resumed.

### 4.5 Team usage

Two to five staff members may use the WhatsApp Business app and linked devices. Version 1 does not provide Twilio-style queues, reservations, or guaranteed department assignment.

The bot records an internal classification of `sales` or `support`, but staff coordination occurs through WhatsApp Business linked devices and labels. A dedicated multi-agent inbox can be designed later if operational volume requires it.

## 5. Data model

Add Supabase migrations for the following tables.

### `whatsapp_conversations`

- WhatsApp chat ID and normalized phone.
- Detected language.
- State: `bot_active`, `human_paused`, or `escalated`.
- Classification: `sales` or `support`.
- Pause reason and timestamps.
- Last inbound, bot outbound, and human outbound timestamps.
- Last supervisor alert timestamp.

### `whatsapp_messages`

- Conversation reference.
- WhatsApp message ID with a unique constraint for deduplication.
- Direction and sender type: customer, bot, or human.
- Text content or safe media metadata.
- Delivery timestamp and processing status.

### `whatsapp_shared_carts`

- Cryptographically random opaque token.
- Product IDs and quantities.
- Expiration timestamp.
- Redeemed/loaded timestamps for diagnostics.

### `whatsapp_bot_events`

- Structured operational events such as connection state, QR generated, reconnect attempt, escalation, Gemini failure, and message send failure.
- No secrets or full sensitive payloads.

Retention periods must be configurable. Message content should be retained only as long as necessary for support and debugging.

## 6. Tool boundaries

Gemini receives tools with explicit schemas and limited outputs:

- `search_products(query, category?, max_results?)`
- `get_product(product_id)`
- `create_shared_cart(items)`
- `lookup_order(phone, order_number)`
- `escalate_to_human(reason, summary, department)`

Gemini never receives:

- Supabase service-role credentials.
- Arbitrary SQL capability.
- Full customer lists.
- Payment credentials.
- Authority to modify orders, payments, stock, products, or customers.

## 7. Security

- Store Gemini and Supabase secrets only in VPS environment variables or a secret manager.
- Never commit `.wwebjs_auth`, QR images, session archives, cookies, or Chromium profiles.
- Protect operations endpoints with admin authentication and HTTPS.
- Add rate limits per chat and globally.
- Validate all tool inputs server-side.
- Escape and constrain catalog search inputs.
- Record message IDs to make processing idempotent.
- Exclude the supervisor conversation from normal bot automation to prevent alert loops.
- Do not process card details or ask customers to send payment credentials in WhatsApp.
- Limit media support in version 1; never execute or trust received files.

## 8. Reliability and failure handling

### WhatsApp disconnection

- PM2 restarts crashed processes.
- The client reconnects with exponential backoff and a maximum retry interval.
- If authentication is lost, the service enters `QR_REQUIRED` and alerts the supervisor once.
- The WhatsApp Business mobile app continues functioning independently while the linked web session is disconnected.

### Gemini failure

- Retry only safe transient failures with short bounded backoff.
- Do not send duplicate replies after an uncertain timeout.
- For repeated failure, send a short fallback message and escalate to the supervisor.

### Supabase failure

- Do not guess catalog or order information.
- Tell the customer that live information is temporarily unavailable.
- Escalate order-sensitive requests.

### Duplicate events

- Use the WhatsApp message ID unique constraint before processing.
- Record bot outbound IDs before or immediately after sending so that the human-takeover detector does not classify bot messages as manual replies.

## 9. Testing strategy

### Unit tests

- Phone normalization.
- Language selection.
- Conversation state transitions.
- Human-vs-bot outbound detection.
- Sensitive intent escalation rules.
- Shared-cart token generation and expiration.
- Order lookup authorization using phone plus order number.

### Integration tests

- Mock WhatsApp adapter, Gemini client, and Supabase tools.
- Verify one inbound message produces at most one outbound reply.
- Verify human outbound activity pauses automation.
- Verify sensitive requests generate one supervisor alert per cooldown window.
- Verify no product or order detail is returned when a tool fails.

### Controlled live test

Initial deployment uses an allowlist mode so the bot responds only to approved test numbers. Production activation requires:

- QR authenticated successfully.
- Product recommendations checked against live catalog data.
- Shared cart opens correctly and revalidates prices.
- Order lookup rejects mismatched phone/order combinations.
- Human reply pauses the bot.
- Supervisor escalation alert is delivered.
- Reconnect behavior is observed after a controlled restart.

## 10. Deployment and operations

- Run the bot service under PM2 with startup persistence.
- Use a dedicated Linux user with minimal filesystem permissions.
- Persist only the required WhatsApp authentication directory and encrypted backups.
- Use a reverse proxy and TLS for protected operations endpoints.
- Provide a health check used by uptime monitoring.
- Keep the service separate from the Vercel deployment lifecycle.
- Rollback consists of stopping the PM2 process and unlinking the WhatsApp Web device; the WhatsApp Business mobile app remains available.

## 11. Environment variables

Expected variables include:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `NEXT_PUBLIC_SUPABASE_URL` or a server-only equivalent
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEP_BEAUTY_SITE_URL=https://deepbeautykw.com`
- `WHATSAPP_SUPERVISOR_PHONE=96598983566`
- `WHATSAPP_AUTH_PATH`
- `WHATSAPP_BOT_ALLOWLIST_ONLY`
- `WHATSAPP_BOT_ALLOWLIST`
- `WHATSAPP_HUMAN_PAUSE_MINUTES`
- `WHATSAPP_ALERT_COOLDOWN_MINUTES`
- `OPERATIONS_AUTH_SECRET`

The implementation plan must verify existing environment-variable naming before adding duplicates.

## 12. Scope exclusions for version 1

- Twilio, Flex, TaskRouter, and Meta Cloud API.
- Bulk marketing broadcasts.
- Cold outreach or importing customer lists for automated messaging.
- Automatic order creation, editing, cancellation, refund, or payment handling.
- Full multi-agent inbox or department queue UI.
- Voice calls, voice notes transcription, and image-based diagnosis.
- Medical claims or personalized medical advice.

## 13. Acceptance criteria

The feature is ready for controlled production when:

1. The number remains usable from WhatsApp Business on the phone.
2. The VPS reconnects to the linked session after a normal restart without a new QR.
3. The bot answers allowed inbound test chats in Arabic or English.
4. Prices and stock always match current Supabase data.
5. The bot creates a valid expiring shared-cart link but does not create an order.
6. Order tracking works only with a matching phone number and order number.
7. A manual staff reply immediately pauses bot responses for that conversation.
8. Sensitive requests stop automation and generate a supervisor alert.
9. Duplicate inbound events never generate duplicate customer replies.
10. Stopping the service does not prevent staff from using the WhatsApp Business mobile app.
