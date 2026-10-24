// The web build's root HTML (static rendering): the page is dark before the bundle runs, so the first paint is
// the near-black the light grows out of, not a white flash; the browser's own chrome (the address bar on a
// phone, form controls) matches, and scrollbars are thin and quiet: a see-through grey thumb on no track, the same on
// the dark screens and the light ones, so the browser's grey track no longer runs down a dark page (Leo, Oct 24) but
// a long column still shows it scrolls, for pointer users who scroll by the bar (Cynthia, Oct 24). It is also an installable web app: the manifest and the icons in
// `public/` let an iPhone (which has no native build) or a laptop add Lumente to its home screen and open it full
// screen, with its own icon. Runs only in Node, when the pages are exported.
import { ScrollViewStyleReset, useServerDocumentContext } from "expo-router/html";
import type { PropsWithChildren } from "react";
import { base, brand, palette } from "../theme.ts";

/** Keyboard users see where they are: a 2 px ring in the screen's ink, 2 px off every button, only on a focus the
 * keyboard gave (`:focus-visible`, so a click leaves no ring). A Screen or a Sheet says which ink through
 * `data-light` (ui.tsx); the fields show focus on their own edge instead. */
const focusRing = `[role="button"]:focus-visible{outline:2px solid ${palette.night.onSurface};outline-offset:2px}[data-light="day"] [role="button"]:focus-visible{outline-color:${palette.day.onSurface}}`;

export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();
  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="theme-color" content={base.top} />
        <meta name="color-scheme" content="dark" />
        <meta name="application-name" content={brand.name} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* iPhone Safari reads these instead of the manifest: full screen, the app's name, a black status bar */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content={brand.name} />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `html,body{background-color:${base.bottom}}*{scrollbar-width:thin;scrollbar-color:rgba(140,140,150,.35) transparent}*::-webkit-scrollbar{width:8px;height:8px}*::-webkit-scrollbar-track{background:transparent}*::-webkit-scrollbar-thumb{background:rgba(140,140,150,.35);border-radius:8px}*::-webkit-scrollbar-thumb:hover{background:rgba(140,140,150,.6)}${focusRing}` }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
