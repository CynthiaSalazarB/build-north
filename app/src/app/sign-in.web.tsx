// Sign-in on the web build (#22), which is also its landing page: Clerk's prebuilt SignIn inside the landing
// (components/landing.tsx). Its "Sign up" link goes to sign-up.web.tsx on this site (`signUpUrl` in _layout.tsx),
// never to Clerk's hosted pages. The methods come from the Clerk dashboard. Android uses sign-in.tsx.
import { SignIn } from "@clerk/expo/web";
import { AuthSwitch, HEADLINE, HOW, Landing, useClerkAppearance } from "../components/landing.tsx";
import { brand, pageMetadata } from "../theme.ts";

/** The web page's title, description and card, in the static HTML, so a shared link previews well. */
export function generateMetadata() {
  return pageMetadata(`${brand.name}: ${HEADLINE.toLowerCase().replace(/\.$/, "")}`, HOW);
}

export default function SignInScreen() {
  return (
    <Landing
      form={
        <>
          <AuthSwitch mode="sign-in" />
          <SignIn routing="hash" appearance={useClerkAppearance()} />
        </>
      }
    />
  );
}
