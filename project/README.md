# MedKotha | Medical Study Platform

MedKotha is a premium medical study platform designed to help students master their curriculum through active recall and spaced repetition.

## Features

- **Question Bank (QBank):** Extensive database of medical questions with detailed explanations.
- **Flashcards:** Adaptive flashcard system for efficient memorization.
- **Performance Analytics:** Track your progress with detailed insights and statistics.
- **Leaderboard:** Compete with peers and stay motivated.
- **Subscription Management:** Seamless billing and plan management via Stripe.
- **Notifications:** Stay updated with study reminders and platform updates.

## Tech Stack

- **Frontend:** [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/), [GSAP](https://greensock.com/gsap/) (Animations)
- **State Management:** [Redux Toolkit](https://redux-toolkit.js.org/)
- **Backend/Database:** [Supabase](https://supabase.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd flashcardV2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run preview`: Previews the production build locally.
