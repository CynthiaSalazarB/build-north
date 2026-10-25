// Sign-up on the web build: Clerk's prebuilt SignUp inside the landing (components/landing.tsx), so a new learner
// never leaves lumente.expo.app. Before Oct 24 the "Sign up" link went to Clerk's hosted Account Portal, which has
// no way back to the site once the account exists (DECISIONS.md, 2026-10-24, "Sign-up stays on the site"). Once
// the account is made, Clerk sends the learner to "/" (`signUpFallbackRedirectUrl` in _layout.tsx), Start.
// Android's "Get started" opens Clerk's hosted sign-up instead (sign-in.tsx).
import { SignUp } from "@clerk/expo/web";
import { AuthSwitch, HEADLINE, HOW, Landing, useClerkAppearance } from "../components/landing.tsx";
import { usePageTitle } from "../components/ui.tsx";
import { brand, pageMetadata } from "../theme.ts";

const TITLE = `${brand.name}: join and ${HEADLINE.toLowerCase().replace(/\.$/, "")}`;

/** The web page's title, description and card, in the static HTML, so a shared link previews well. */
export function generateMetadata() {
  return pageMetadata(TITLE, HOW);
}

export default function SignUpScreen() {
  usePageTitle(TITLE);
  return (
    <Landing
      form={
        <>
          <AuthSwitch mode="sign-up" />
          <SignUp routing="hash" appearance={useClerkAppearance()} />
        </>
      }
    />
  );
}
