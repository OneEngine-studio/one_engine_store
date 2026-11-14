# Google sign-in

"Continue with Google" is built and tested against a stand-in for Google. It has **not** been tried with a real
Google account, because that needs an OAuth client from your Google Cloud project. Until you add one, the button
is hidden and email sign-in is the only option.

## How it works

1. The launcher asks the Platform API whether Google is set up (`GET /v1/auth/providers`) and shows the button if so.
2. The Electron main process opens Google in the player's **own browser** (never inside the app) with an
   authorization-code request using PKCE (`S256`), a random `state` and `nonce`, and a redirect to
   `http://127.0.0.1:<random port>/callback`. A listener on that loopback port waits up to 3 minutes for the answer
   and then closes.
3. The code, the PKCE verifier, the nonce and the redirect address go to `POST /v1/auth/google`. The **API** redeems
   the code with Google (the client secret stays on the server) and verifies the ID token: Google's signature,
   issuer, audience, expiry and nonce.
4. The API signs the player in to a OneEngine account and returns the usual session. The tokens stay in the
   launcher's main process, exactly as with a password sign-in, so the session also survives restarts.

Accounts:

- First Google sign-in with an email that has no account creates a verified account (display name from Google,
  changeable in Settings). It has no password; "Forgot password?" lets the player add one later.
- An existing account with the same email is joined. If that account's email was never confirmed (someone may have
  registered the address without owning it), its password and sessions are wiped, because Google just proved who
  owns the mailbox.
- A Google account whose email is not verified is refused. Suspended accounts are refused.

## What you must do

1. Open <https://console.cloud.google.com/>, create or pick a project.
2. **APIs & Services > OAuth consent screen**: user type External, app name `OneEngine Store`, support email, your
   domain under authorized domains, and a link to a privacy policy. Scopes: `openid`, `email`, `profile` (none are
   sensitive). While the app is in *Testing*, only listed test users can sign in; click **Publish app** to open it
   to everyone.
3. **APIs & Services > Credentials > Create credentials > OAuth client ID**, application type **Desktop app**. No
   redirect address needs registering for a desktop client (loopback is allowed).
4. Put the two values on the API server (`.env.production`) and restart it:
   ```
   GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-...
   ```
   Both or neither: production refuses to start with only one.
5. Check `https://<your api>/v1/auth/providers`: it must show your client id under `google`.
6. On a real Windows PC, run the manual test below.

## Manual test (needs the hosted API and a real Google account)

1. Install the launcher, press **Sign in**, then **Continue with Google**. Your browser opens Google.
2. Choose an account. The browser shows "You are signed in"; the launcher closes the dialog and shows your name.
3. Close and reopen the launcher: you are still signed in (session restore).
4. Sign out, sign in with Google again: same account. Try **Cancel** while the browser is open, and closing the
   browser tab without finishing (the launcher gives up after 3 minutes).
5. Create a second account with an email and password, confirm it, sign out, then use Google with the same email:
   it joins the existing account.

## What is tested without Google

- API (`services/platform-api/test/accounts.test.ts`): provider discovery never leaks the secret, account creation and
  reuse, joining by email, the pre-registration takeover case, unverified Google email, failed exchange, suspended
  account, non-loopback redirects and malformed bodies.
- Launcher (`test/google.test.cjs`): PKCE challenge matches the verifier, wrong `state` ignored, wrong `Host` and path
  refused, cancel, timeout, port released.
- Main process, end to end against the API with a fake Google (`services/platform-api/scripts/fake-google-server.ts`):
  sign-in, token kept in main, same account on repeat, second account, cancel, refusal, untrusted sender.

Not tested: the real Google consent screen, the real token exchange and ID-token signature check
(`src/google.ts`).
