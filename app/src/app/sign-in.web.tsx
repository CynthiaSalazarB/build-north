// Sign-in on the web build (#22): Clerk's prebuilt SignIn, with the methods set in the Clerk dashboard
// (email code only). The look comes with the brand kit (#14); iOS and Android use sign-in.tsx.
import { SignIn } from "@clerk/expo/web";
import { StyleSheet, View } from "react-native";
import { Screen } from "../components/ui.tsx";
import { space } from "../theme.ts";

export default function SignInScreen() {
  return (
    <Screen>
      <View style={styles.content}>
        <SignIn />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.xl },
});
