# SproutCV

**AI-Powered Resume Optimization Platform**

Transform your resume with intelligent analysis and optimization. Get more interviews, land your dream job.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

## Features

- 🤖 **AI Resume Analysis** - Get intelligent feedback on your resume using advanced AI
- 📊 **ATS Optimization** - Ensure your resume passes Applicant Tracking Systems
- 🎯 **Job Matching** - Tailor your resume to specific job descriptions
- 💡 **Smart Suggestions** - Receive actionable recommendations to improve your resume
- 🔒 **Secure & Private** - Your data is encrypted and never shared

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: Google Gemini API
- **Payments**: Dodo Payments

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or bun
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/imlava/sproutcv.git
   cd sproutcv
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp env/.env.example env/.env
   ```
   Edit `env/.env` with your configuration:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## Project Structure

```
sproutcv/
├── src/                    # Main application source code
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API and business logic
│   ├── lib/                # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── integrations/       # Third-party integrations
├── public/                 # Static assets
├── supabase/               # Supabase configuration & Edge Functions
├── env/                    # Environment variables
├── docs/                   # Documentation
├── scripts/                # Deployment & utility scripts
├── database/scripts/       # SQL migrations
├── tests/                  # Test files & diagnostics
└── config/                 # Configuration examples
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables
5. Deploy

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | Yes |
| `VITE_HCAPTCHA_SITE_KEY` | hCaptcha site key | No |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: hello@sproutcv.app
- 🐛 Issues: [GitHub Issues](https://github.com/imlava/sproutcv/issues)

---

**SproutCV** - Grow your career, one resume at a time. 🌱
