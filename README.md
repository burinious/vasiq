# varsiq

varsiq is a React + Vite student community web app powered by Firebase and Cloudinary. It includes email/password authentication with verification, editable profiles, group communities, direct and group chat, and a social feed with likes and comments.

## Stack

- React + Vite
- React Router
- Firebase Auth + Firestore
- Cloudinary uploads
- Responsive CSS

## Setup

1. Run `npm install`
2. Copy `.env.example` to `.env` and fill in Firebase and Cloudinary values
3. Run `npm run dev`

## Launch Ops

- Full launch checklist: [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)

## Firebase Collections

- `users/{userId}`
- `groups/{groupId}`
- `groups/{groupId}/messages/{messageId}`
- `messages/{chatId}`
- `messages/{chatId}/messages/{messageId}`
- `posts/{postId}`
