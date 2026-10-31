"use client";

import Script from "next/script";
import { useEffect } from "react";

import { captureAttribution } from "@/lib/attribution";
import { EXTERNAL_ID_KEY, captureFbclid, getOrCreateExternalId } from "@/lib/client-signals";
import { AM_KEY } from "@/lib/track";

/**
 * The Meta pixel base code and PageView.
 *
 * The funnel events (ViewContent, AddToCart, InitiateCheckout, Purchase,
 * Schedule) are fired from lib/track.ts, on the pixel AND the Conversions API
 * with one shared event id, so Meta deduplicates them.
 *
 * ADVANCED MATCHING: `init` is given the buyer's hashed email, phone, name,
 * city and country once the checkout has collected them (stored hashed by
 * `rememberPerson` in lib/track.ts), plus our external id. Every page after
 * the checkout is a full page load, so /book and /thank-you initialise with
 * them and their browser events match on more than `_fbp`.
 *
 * Renders nothing when the pixel id is absent, so a missing env var leaves no
 * broken script tag behind.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export default function MetaPixel() {
  /* Two captures, both on first landing, both on EVERY page rather than only
     the landing page: a retargeting ad or an email can drop someone straight
     onto /book, and that visit is the only one carrying the campaign.

     captureFbclid writes Meta's _fbc cookie from the url, exactly as the pixel
     would. captureAttribution stores the UTMs, the raw fbclid, the referrer
     and the landing url, which are gone from the url one click later.

     This runs ABOVE the PIXEL_ID guard below on purpose: attribution must not
     go dark just because a pixel id is unset. */
  useEffect(() => {
    captureFbclid();
    captureAttribution();
    /* Mint the external id on first landing, so the NEXT page's pixel init
       already carries it. */
    getOrCreateExternalId();
  }, []);

  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
var am={};try{am=JSON.parse(localStorage.getItem('${AM_KEY}')||'{}')||{};
var x=localStorage.getItem('${EXTERNAL_ID_KEY}');if(x)am.external_id=x;}catch(e){}
fbq('init','${PIXEL_ID}',am);fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
