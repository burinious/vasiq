# VASIQ Launch Checklist

## 1. Environment

- Confirm `.env` has working Firebase, Cloudinary, and Klipy values.
- Confirm Firebase Email/Password and Google sign-in are enabled.
- Confirm the authorized domain includes your live Hosting domain.
- Confirm `buriniousie@gmail.com` is the intended admin email in Firestore rules.

## 2. Deployments

- Build the app: `npm.cmd run build`
- Deploy Firestore rules: `firebase.cmd deploy --only firestore:rules --project varsiq-beec0`
- Deploy Hosting: `firebase.cmd deploy --only hosting --project varsiq-beec0`

## 3. Smoke Tests

- Sign in with email/password.
- Sign in with Google.
- Edit profile, refresh, and confirm the changes remain.
- Create a post, like it, comment, reply, and share it.
- Join a group and send a group message.
- Send a direct message and confirm the status changes out of `sending`.
- Report a post/comment/reply and confirm it appears in `/admin`.
- Check mobile navigation, onboarding, help/support, privacy policy, and terms.

## 4. Final Review

- Check `/feed`, `/groups`, `/chat`, `/profile`, `/help`, and `/admin`.
- Confirm no native browser prompt is still used for report or share flows.
- Confirm the mobile bottom bar stays fixed and the menu sheet contains profile/help/theme.
- Confirm the announcement bar and top shell stay fixed without feed content bleeding behind them.

## 5. Live Links

- Hosting: `https://varsiq-beec0.web.app`
- GitHub: `https://github.com/burinious/vasiq`
