# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## UniVerse workspace

- `/` is an interactive, clearly labeled sample workspace; `/welcome` is the public landing page.
- `/auth` handles public app accounts. Verified users from any university can join. The first visit to `/dashboard` opens the editable profile so a member can enter their university and academic information.
- Every account starts as a student. Assign `educator`, `organizer`, `provider`, or `admin` only through trusted Cloud administration in `user_roles`, after verifying the account. For service providers, add a matching `service_providers` department record. Never infer authorization from a profile or email string.
- Events, announcements, and Lost & Found currently use a shared authenticated campus directory. Private profiles, tickets, analyses, and messages have separate ownership and access policies. Do not treat self-entered university names as verified campus tenancy.
- CampusIQ uses Lovable's server-side AI Gateway. The sample workspace never sends content to an AI model.
