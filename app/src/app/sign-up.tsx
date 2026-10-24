// On a phone there is no sign-up page of our own: sign-in.tsx's "Get started" opens Clerk's hosted sign-up. This
// route exists so the web's sign-up.web.tsx has a native twin (Expo Router wants every screen the root layout
// names on both platforms); a deep link to it just shows sign-in.
import { Redirect } from "expo-router";

export default function SignUpScreen() {
  return <Redirect href="/sign-in" />;
}
