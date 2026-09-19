# tgo-sandesh: what is still open

## 1. Payment rail: BUILT (pass 1). Booking page: BUILT (pass 2)

Built and wired:

- `POST /api/razorpay/create-order`, with the buyer's IP, user agent, `_fbc`,
  `_fbp`, GA4 client id and first-touch campaign packed into the order notes
- `POST /api/razorpay/webhook`, HMAC verified, fires Meta `Purchase` and the
  GA4 server-side `purchase`. Purchase comes from here and nowhere else: UPI
  buyers complete inside their bank app and never return to the tab
- `GET /api/razorpay/order-status`, the confirmation poll that keeps the
  checkout's "wait up to 10 seconds" promise when Razorpay's own handler is
  slow or never fires
- `POST /api/meta/event` for ViewContent / AddToCart / InitiateCheckout.
  Purchase is excluded from its allow-list so the public endpoint cannot be
  used to forge a sale
- Meta Pixel, GA4 and Clarity base tags, all from env, all mounted in
  `layout.tsx`
- The checkout form submits, opens the Razorpay sheet and redirects to `/book`
- **`/book`, the booking page.** A Server Component
  (`src/app/book/page.tsx`) confirms the order with Razorpay before it renders
  anything, then `src/components/book/BookingPage.tsx` shows the calendar,
  fires GA4's browser-side `purchase` keyed on the payment id Razorpay itself
  reports, and never fires Meta's Purchase (the webhook owns that).

Still to do:

- **`NEXT_PUBLIC_BOOKING_CALENDAR_URL` is not set and the scheduling link has
  not been supplied.** Until it is, `/book` renders a clearly labelled
  stand-in at the calendar's exact height instead of a slot picker, so a paid
  buyer still cannot book a time. This is the last thing between the funnel
  and a live ad.
- Fill `.env.local` from `.env.example`, register the Razorpay webhook, and
  remove `META_CAPI_TEST_EVENT_CODE` before launch.
- The fulfilment hand-off IS built: `src/lib/pabbly.ts`, fired from the
  Razorpay webhook above the CAPI guard, so a missing Meta config cannot stop
  a paying buyer being recorded. It needs `PABBLY_WEBHOOK_URL` and a workflow
  at the other end. **Push one test payment through it before the first real
  sale and map every column in one sitting:** Pabbly builds its field map from
  the FIRST payload the trigger ever sees, and a column mapped later means
  re-running the trigger. Never remove a key once a step maps it; removing one
  does not error, it silently blanks a column.
- **Nothing fires when a slot is actually picked.** The calendar is a
  third-party iframe and the only honest signal it offers is a postMessage
  from the vendor's origin. Adding an event for it would mean inventing an
  event name, and this project ships standard events only, so it is a
  deliberate gap rather than an oversight. Show rate has to be read in the
  scheduler for now.
- **The calendar cannot prefill the buyer's name and email.** `bookingHref()`
  in `src/lib/funnel.ts` carries only the two ids. `/book` already reads
  `?name=` and `?email=` and passes them to Calendly, so this is a one-line
  change to `bookingHref` plus the two values at the call site whenever it is
  wanted. Until then every buyer retypes details they just gave the checkout,
  which is the commonest reason a paid slot never gets booked.
- The `razorpay` npm package in `package.json` is unused: both routes call the
  REST API over `fetch`. Safe to remove at the next dependency pass.

## 2. The guarantee contradiction (decide before launch)

The landing page puts **"100% MONEY-BACK GUARANTEE"** directly beside the ₹97
CTA, in the announcement bar, in the trust strip and under every button. The
Refund Policy says the ₹97 booking fee is **non-refundable**.

Both are true as written, because the guarantee covers the programme and not the
booking fee. But a buyer paying ₹97 reads that badge as covering the ₹97. That is
the kind of gap that produces chargebacks and fails a Razorpay review. The fix is
one line of microcopy next to the price, not a change to either document.

## 3. Copy still to write

- **The mechanism beat.** "Extreme or Nothing Protocol" is named nine times on
  the page and never explained as a method. It is the beat that earns the ₹97.
- **What the call actually contains.** The three lines on the checkout's order
  summary (`VALUE_BULLETS` in `src/components/checkout/CheckoutForm.tsx`) were
  written during the build, not supplied by Sandesh, and `/book` now repeats
  them verbatim as its "what your booking covers" section. They are the only
  description anywhere of what happens on the call, they appear on two pages,
  and they need his sign-off. They are duplicated in
  `src/components/book/BookingPage.tsx` (importing them would pull the whole
  checkout form module into the booking page's bundle), so EDIT BOTH.
- **The reassurance line under the calendar** reads "Your ₹97 is paid. There is
  nothing more to pay to attend this call." It follows from the fee being a
  one-time booking fee, but it is a commercial promise and it should be
  confirmed rather than assumed.
- **Finale headline** is currently a reprise of the guarantee line.
- **Names and a one-line result** under each before/after and each testimonial.
  **Partly answered for the films:** 4 of the 15 came with names (Nithin,
  Aseem, Anish, Vishwas) and those render as a caption on the card. The other
  11 run uncaptioned rather than with an invented name. Send the names and
  they appear on their own.

## 3a. The VSL, as built (2026-09-10)

`https://vimeo.com/1225511943`, id in `src/components/VSLFrame.tsx`. The player
is mounted DIRECTLY, same as the testimonials below and same as tgo-deepti.

Retired with the poster: the click-to-swap (so the component lost its state and
is a server component now, and the hero's focal object costs no JS), the custom
play disc and its ripple ping (both sat exactly where Vimeo draws its own play
button), and the `poster` prop.

It also retires the honesty problem the old version was built around: there is
no longer a decorative play affordance that might front nothing, because the
only play control on the stage is the real player's.

NOT lazy, deliberately: it is above the fold and is the beat the page hands off
to. The fifteen testimonial players are.

`.sdp-play` in globals.css now styles nothing. Left in place rather than
removed; it is the locked skin's component layer, not this build's to edit.

## 3b. Video testimonials, as built (2026-09-10)

15 Vimeo ids wired into `src/components/VideoTestimonials.tsx`, where the build
was scaffolded for 4.

**The players are mounted DIRECTLY**, matching how tgo-deepti was set up on
Atul's instruction: Vimeo draws its own thumbnail and its own play control, so
there are no poster frames to source. That retired three things:
- the **lightbox** the card used to open, so playback now happens in the rail;
- the **client island**, so the card is a server component and the row costs
  no JS at all;
- the `poster` prop and the inert placeholder branch.

Two consequences worth knowing:
- The rail now pauses on **focus-within** as well as hover. It only paused on
  hover before, which was fine for posters and wrong for focusable players: a
  keyboard user would have been operating a control sliding away from them.
- `repeat` dropped from 2 to 1. It existed because 4 cards could not fill a
  wide rail; 15 fill it alone, and each extra copy is 15 more players in the
  DOM. Even at 1 the seamless loop doubles the track, so 30 iframes exist.
  All are `loading="lazy"`.

**Unverified:** the 9:16 portrait ratio is still the scaffold's assumption and
the ids could not be checked against Vimeo from the build sandbox. If the films
are landscape it is one constant, `RATIO` in `VideoTestimonialCard.tsx`.

## 4. Legal pages

- **Refund Policy is Atul's copy, verbatim.** Two substitutions: the support
  email replaced `[INSERT SUPPORT EMAIL]`, and the date replaced
  "Last updated: x August 2026" (the day was a literal `x`, and August has
  passed).
- **Privacy Policy and Terms are DRAFTED, not supplied.** Written from what the
  funnel actually does and inventing no practice the site does not perform, but
  they need a read by whoever signs off legal for TRANSFORMMEBRO PVT LTD. Add
  anything the business uses that is not listed: a CRM, an email tool, a
  WhatsApp group, call recording.
- `effectiveDate` in `src/app/_legal/legal.ts` must match the day they go live.
- The registered name must match the PAN record character for character.

## 5. Assets

**The VSL film and 15 client video testimonials landed 2026-09-10 and are
LIVE.** Everything else is still a labelled reserved frame at final ratio.

| Qty | What | Ratio |
|---|---|---|
| ~~1~~ | ~~The VSL film + poster~~ **DONE: Vimeo 1225511943, player mounted directly** | 16:9 |
| ~~4~~ | ~~Client video testimonials~~ **DONE: 15 Vimeo ids wired** | 9:16 |
| 5 | Trust-strip faces | 1:1 |
| 13 | Creator / athlete portraits | 4:5 |
| 18 | 9 before/after **pairs** | 4:5 |
| 1 | Sandesh solo portrait | 4:5 |
| 6 | Story beats | 4:5 |
