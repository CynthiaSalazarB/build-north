# Testing notes for judges

How to try Lumente in five minutes, on the web or on an Android phone, without anyone from the team.

## 1. Open it

- **Web:** https://lumente.expo.app, on a laptop or a phone browser. From 1,000 px wide the app lays out
  as a website: the words on the left, the map on the right.
- **Android:** install the `preview` APK from the link in the [README](../README.md#try-it). Android asks
  once to allow installs from the browser. The app updates itself over the air on its second launch after
  an update ships (Expo EAS Update), so open it twice if a card says a new version is ready.
- **iPhone:** there is no iOS build. Use the web link.

## 2. Sign in

Sign-in is Clerk's. Two ways:

- **Google**, one tap, on the web.
- **Email code.** Any address works. To skip real email, use a Clerk test address: anything ending in
  `+clerk_test@example.com` (for example `judge+clerk_test@example.com`) and the code `424242`. No
  email is sent. Sign-up asks for no password.

Sign-in creates your own account with no data in it. Nothing is shared between accounts.

## 3. A session

1. **Pick a concept.** Start opens on a line of code your agent might have written. Tap a concept (API, JWT,
   CORS...) or type your own. "Add your notes" takes pasted text the tutor can draw on; anything that looks
   like a key or a password stops at the phone.
2. **Guess** how many of the 8 points you will prove. The light on the screen previews the guess.
3. **Build the map,** one part at a time: the bigger group, what it isn't, what it needs, its types. The
   firefly asks; you answer in your own words, typed or spoken (the mic beside the field; the words land in
   the field and still need Send). Any defensible answer passes. Tap the firefly for Help: the first Help on a
   part caps it at 1 point, the third shows the answer for 0.
4. **The result:** your score next to your guess, the gap as a number and one sentence, and what to do next.
   The light on the screen is your score; it fills at 8.

Every concept starts at level 2 for a new account. Levels rise with unassisted answers; at level 5 the roles
flip: you build the whole map alone and ask the fact desk for facts. **"Test myself"** on Start runs that
mode on any concept at once (the testers' pre-test and post-test). It changes no levels.

## 4. What is stored, and how to delete it

"Your data" at the top of Start says what is kept (your sessions and your level on each part) and where
your words go (Claude, through our server; the key never reaches the app). **Delete my data** removes every
session and level for your account and signs you out. The tutor is an AI: it asks, and it never hands you the
answer.

## 5. Demo mode

Open the web build with no API configured (a local run with no `app/.env`, or the `polish` alias during
review) and it replays a session recorded live with Claude, one Turn per action, whatever you type. The
start screen says "Demo mode: a recorded session, no API". Demo Day shows the live app; the replay is the
fallback, and it is called a replay when shown.

## 6. If something breaks

- A turn takes up to 8 seconds; the firefly says "checking" meanwhile, and "taking longer than usual" after
  10. The API runs on a Render Starter instance, so there is no cold start.
- "Can't reach the server": the API at https://build-north-api.onrender.com/health should answer
  `{"ok":true}`. If it doesn't, the team's phones are on.
- The microphone on the web needs Chrome or Safari (the browser's own speech recognition); Firefox has none,
  so the mic button isn't shown there.
