# VASIQ Launch Week Execution

Ship date target: April 30, 2026

## Launch wedge

VASIQ launches as the live campus pulse, not as a generic student social network.

Use this sentence everywhere:

`VASIQ helps students catch urgent campus updates, useful groups, opportunities, and real student momentum in one place.`

## Non-negotiables before launch

- A new user sees relevant content in under 60 seconds.
- The feed feels useful before it feels social.
- Groups look intentional, not empty.
- The app shows clear campus identity and trust signals.
- Demo content is already live before launch traffic starts.
- Firebase, Hosting, and Vercel environment variables are verified before launch day.

## Product priorities for this week

### 1. Feed quality

- Push useful update types first:
  - `Academic`
  - `Urgent`
  - `Event`
  - `Opportunity`
  - `Hostel`
  - `Social`
- Prefer posts tied to real student action:
  - class changes
  - revision plans
  - deadlines
  - event drops
  - hostel notices
  - gigs and internships

### 2. First-session relevance

- New users should complete:
  - display name
  - department
  - level
  - residence or hostel
  - current status
- The first open should feel local:
  - "my department"
  - "my hostel"
  - "my campus opportunities"

### 3. Group usefulness

- Promote groups that match real campus behavior:
  - department spaces
  - study circles
  - hostel gist
  - career and opportunity rooms
  - builder communities
  - fellowship/community spaces
- Do not create filler groups.

### 4. Trust

- Email verification must work.
- Profile identity should be visible enough to build confidence.
- Reports must be reviewed quickly during launch week.
- Block and moderation tools must remain usable on mobile.

## Launch ops checklist

### 48 hours before launch

- Confirm `.env` locally contains real Firebase and Cloudinary values.
- Confirm Vercel environment variables exist for:
  - `Production`
  - `Preview`
- Confirm Firebase Auth:
  - Email/Password enabled
  - Google sign-in enabled if intended
  - authorized domains updated
- Build locally:
  - `npm.cmd run build`
- Deploy hosting and rules:
  - `firebase.cmd deploy --only firestore:rules --project varsiq-beec0`
  - `firebase.cmd deploy --only hosting --project varsiq-beec0`

### 24 hours before launch

- Seed demo accounts in batches.
- Run full launch seed data.
- Review the feed manually on mobile.
- Review group chat flows manually.
- Confirm report flow reaches admin.
- Confirm profile edits persist after refresh.

### Launch day

- Post 5 to 10 high-signal updates manually.
- Keep at least one admin active for moderation.
- Watch for:
  - empty states
  - broken auth
  - broken uploads
  - failed post writes
  - failed chat sends
  - confusing onboarding

## Content seeding rules

- No filler motivational posts.
- No obvious fake engagement bait.
- Seed content that students can act on immediately.
- Every seeded post should answer one of these:
  - What changed?
  - What should I do?
  - What should I join?
  - What opportunity is live?
  - What is happening today?

## First 100 users

- Focus on one campus only.
- Recruit visible student operators:
  - course reps
  - hostel connectors
  - fellowship/media leads
  - student builders
  - creators with campus reach
- Give them a reason to invite:
  - class updates
  - hostel notice visibility
  - event coordination
  - opportunity drops

## Metrics to watch

- Sign-up to first-post view time
- Sign-up to first-group join rate
- Sign-up to profile completion rate
- Day-1 return rate
- Day-7 return rate
- Shares per post
- Reports per 100 active users
- Percentage of users who interact with `Urgent`, `Academic`, and `Opportunity` posts

## What not to do this week

- Do not add broad new features unrelated to launch behavior.
- Do not redesign the whole app.
- Do not launch on multiple campuses at once.
- Do not optimize vanity metrics over repeat opens.
- Do not let the feed become random or low-trust.
