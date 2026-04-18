# Vital ID Platform

A secure, privacy-focused clinical hub for managing medical identities, collaborative diagnoses, and verified credentials in healthcare.

## Features

- **Medical ID Management**: Secure storage and access to patient medical profiles
- **Collaborative Diagnosis**: Real-time collaboration tools for healthcare professionals
- **Verified Credentials**: Blockchain-verified medical credentials and licenses
- **Role-Based Access**: Different access levels for patients, doctors, and administrators
- **Privacy Controls**: Granular privacy settings for sensitive medical data
- **Responsive Design**: Modern UI built with Tailwind CSS and Radix components

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **UI Components**: Radix UI primitives
- **Backend**: Supabase (Database, Auth, Storage)
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd vital-id-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```

4. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Configure authentication and database tables as needed
   - Update Row Level Security (RLS) policies for data access

## Running the Application

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication
│   └── globals.css       # Global styles
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard-specific components
│   └── ui/              # Base UI components
├── lib/                 # Utility libraries
│   ├── supabase/        # Supabase client and utilities
│   └── utils.ts         # General utilities
└── types/               # TypeScript type definitions
```

## Authentication

The app uses Supabase Auth for user authentication. Users can sign up, log in, and manage their sessions. Role-based access control is implemented to protect sensitive medical data.

## Data Privacy

This application handles sensitive medical information. Ensure compliance with HIPAA, GDPR, or relevant privacy regulations in your jurisdiction. All data access is logged and auditable.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please open an issue in the repository or contact the development team.
