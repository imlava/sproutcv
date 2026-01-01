<div align="center">
  <img src="public/logo.png" alt="SproutCV Logo" width="120" />
  <h1>🌱 SproutCV</h1>
  <p><strong>AI-Powered Resume Optimization Platform</strong></p>
  <p>An enterprise-grade resume optimization platform leveraging Google Gemini AI to help job seekers land interviews faster</p>

  ![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript)
  ![Supabase](https://img.shields.io/badge/Supabase-Edge_Functions-3ECF8E?style=flat-square&logo=supabase)
  ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss)
  ![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

  [Live Demo](https://sproutcv.app) • [Documentation](docs/) • [Report Bug](https://github.com/imlava/sproutcv/issues) • [Request Feature](https://github.com/imlava/sproutcv/issues)
</div>

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Key Technical Achievements](#-key-technical-achievements)
- [Core Features](#-core-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Email Automation System](#-email-automation-system)
- [Admin Dashboard & Support System](#-admin-dashboard--support-system)
- [Security Implementation](#-security-implementation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🏗 Architecture Overview

SproutCV demonstrates **production-ready full-stack architecture** with emphasis on:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   React 18  │  │  TypeScript │  │ Tailwind +  │  │  Real-time State    │ │
│  │   + Vite    │  │   Strict    │  │  shadcn/ui  │  │  Management         │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼───────────────────┼────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API & BUSINESS LOGIC                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    80+ Supabase Edge Functions                         │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │  │
│  │  │   Gemini    │ │   Payment   │ │    Email    │ │     Admin       │  │  │
│  │  │  Analyzer   │ │  Processor  │ │ Automation  │ │    Functions    │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA & SERVICES                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  PostgreSQL │  │   Google    │  │    Dodo     │  │     Resend          │ │
│  │  + RLS      │  │   Gemini    │  │  Payments   │  │  Email Service      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏆 Key Technical Achievements

### 1. **Self-Healing Email Verification System**
Designed and implemented a **zero-intervention email verification system** that:
- Automatically creates user profiles on signup with database triggers
- Implements retry logic with exponential backoff
- Auto-verifies users after 24 hours if email delivery fails
- Self-heals broken user states every 5 minutes via cron automation
- Processes edge cases like orphaned auth users

### 2. **Enterprise-Grade Admin Dashboard**
Built a comprehensive admin system featuring:
- **Enhanced Message Center** with threaded conversations
- **User Management** with activity tracking and role-based access
- **Payment Management** with refund processing
- **Referral System** tracking and analytics
- **System Health Monitoring** dashboard

### 3. **AI-Powered Resume Analysis Engine**
Integrated Google Gemini API for intelligent resume analysis:
- Multi-dimensional scoring (ATS, keywords, skills alignment)
- Interactive insights with actionable recommendations
- Cover letter generation with personalization
- Competitive market positioning analysis

### 4. **Robust Payment Architecture**
Implemented secure payment flow with:
- Webhook-based transaction verification
- Credit system with audit logging
- Automatic email notifications for all payment events
- Dispute and refund handling workflows

---

## ✨ Core Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| 🧠 **AI Resume Analysis** | Comprehensive resume scoring against job descriptions | Google Gemini 1.5 Flash + Custom prompts |
| 📊 **ATS Optimization** | Ensure resumes pass Applicant Tracking Systems | Pattern matching + keyword extraction |
| 💬 **Real-time Feedback** | Instant suggestions during resume editing | Edge Functions + WebSocket |
| 📧 **Email Automation** | Fully automated verification and notifications | Resend API + Cron automation |
| 💳 **Credit System** | Pay-as-you-go with audit trail | PostgreSQL triggers + RLS |
| 🎫 **Support Tickets** | Threaded conversations with email notifications | Custom message center |
| 👥 **User Management** | Complete admin controls with activity logs | Role-based access control |
| 🔐 **Security** | Multi-layer protection | hCaptcha + RLS + 2FA ready |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **React 18** | UI Framework | Concurrent rendering, Suspense support |
| **TypeScript 5.5** | Type Safety | Strict mode for reliability |
| **Vite** | Build Tool | Lightning-fast HMR, optimized builds |
| **Tailwind CSS** | Styling | Utility-first, rapid development |
| **shadcn/ui** | Components | Accessible, customizable primitives |
| **TanStack Query** | Data Fetching | Caching, optimistic updates |

### Backend
| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **Supabase** | BaaS Platform | Auth, Database, Edge Functions |
| **PostgreSQL** | Database | ACID compliance, RLS support |
| **Edge Functions** | Serverless API | Deno runtime, global distribution |
| **Google Gemini** | AI Engine | State-of-the-art LLM |
| **Resend** | Email Service | Developer-friendly API |
| **Dodo Payments** | Payment Processing | Modern checkout experience |

### DevOps & Security
| Technology | Purpose |
|------------|---------|
| **GitHub Actions** | CI/CD automation |
| **hCaptcha** | Bot protection |
| **Row Level Security** | Data isolation |
| **Pre-commit Hooks** | Secret detection |

---

## 📁 Project Structure

```
sproutcv/
├── 📂 src/
│   ├── 📂 components/
│   │   ├── 📂 admin/           # Admin dashboard components
│   │   │   ├── AdminDashboard.tsx         # Main admin panel
│   │   │   ├── EnhancedMessageCenter.tsx  # Support ticket system
│   │   │   ├── EnhancedUserManagement.tsx # User CRUD operations
│   │   │   └── MasterAdminDashboard.tsx   # Super admin features
│   │   ├── 📂 analysis/        # Resume analysis components
│   │   │   ├── UnifiedResumeAnalyzer.tsx  # Main analyzer flow
│   │   │   └── InteractiveResumeAnalyzer.tsx
│   │   ├── 📂 auth/            # Authentication components
│   │   ├── 📂 payments/        # Payment UI components
│   │   └── 📂 ui/              # shadcn/ui components
│   ├── 📂 contexts/            # React Context providers
│   │   └── AuthContext.tsx     # Authentication state
│   ├── 📂 hooks/               # Custom React hooks
│   ├── 📂 services/            # Business logic services
│   │   └── validation/         # Input validation
│   ├── 📂 integrations/        # Third-party integrations
│   │   └── supabase/           # Supabase client & types
│   └── 📂 pages/               # Route components
│
├── 📂 supabase/
│   └── 📂 functions/           # 80+ Edge Functions
│       ├── gemini-resume-analyzer/    # AI analysis engine
│       ├── robust-email-verification/ # Self-healing verification
│       ├── auto-verify-processor/     # Cron-based automation
│       ├── admin-message-reply/       # Support system
│       ├── payment-notification/      # Payment emails
│       ├── dodo-webhook/              # Payment webhooks
│       └── ...
│
├── 📂 docs/                    # Documentation
│   ├── ROBUST_EMAIL_VERIFICATION_SYSTEM.md
│   ├── COMPREHENSIVE_PAYMENT_SYSTEM.md
│   └── ...
│
├── 📂 scripts/                 # Automation scripts
│   └── setup-automation.sh     # Email system setup
│
├── 📂 database/                # Database scripts
│   └── scripts/                # Migration scripts
│
└── 📂 env/                     # Environment configuration
    └── .env.example            # Template
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Supabase account ([supabase.com](https://supabase.com))
- Google Cloud account with Gemini API enabled
- Dodo Payments account (for payment features)
- Resend account (for email features)

### Installation

```bash
# Clone the repository
git clone https://github.com/imlava/sproutcv.git
cd sproutcv

# Install dependencies
npm install
# or
bun install

# Set up environment
cp env/.env.example env/.env.local

# Configure your environment variables (see below)
```

### Environment Configuration

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI
GEMINI_API_KEY=your_gemini_api_key

# Payments (Edge Functions)
DODO_API_KEY=your_dodo_api_key
DODO_WEBHOOK_SECRET=your_webhook_secret

# Email (Edge Functions)
RESEND_API_KEY=your_resend_api_key

# Security
HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

---

## 📧 Email Automation System

### Architecture

The email system is designed for **100% autonomous operation** with zero manual intervention required.

```
┌─────────────────────────────────────────────────────────────────┐
│                     EMAIL AUTOMATION FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │  User    │───▶│  Database        │───▶│  Edge Function   │   │
│  │  Signup  │    │  Trigger         │    │  (Verification)  │   │
│  └──────────┘    └──────────────────┘    └────────┬─────────┘   │
│                                                   │             │
│                        ┌──────────────────────────┘             │
│                        ▼                                        │
│              ┌─────────────────────┐                            │
│              │   Email Delivery    │                            │
│              │   Attempt           │                            │
│              └──────────┬──────────┘                            │
│                         │                                       │
│           ┌─────────────┴─────────────┐                         │
│           ▼                           ▼                         │
│  ┌────────────────┐         ┌────────────────┐                  │
│  │  ✅ Success    │         │  ❌ Failed     │                  │
│  │  Mark Verified │         │  Queue Retry   │                  │
│  └────────────────┘         └───────┬────────┘                  │
│                                     │                           │
│                                     ▼                           │
│                    ┌────────────────────────────┐               │
│                    │  Auto-Processor (Cron)     │               │
│                    │  • Retry with backoff      │               │
│                    │  • Auto-verify after 24h   │               │
│                    │  • Heal broken states      │               │
│                    └────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| **Robust Verification** | `supabase/functions/robust-email-verification/` | Main verification logic with fallbacks |
| **Auto Processor** | `supabase/functions/auto-verify-processor/` | Cron-based healing and retry |
| **Setup Script** | `scripts/setup-automation.sh` | One-command automation setup |

### Features

- ✅ **Automatic profile creation** with welcome credits
- ✅ **Exponential backoff** for failed deliveries
- ✅ **Self-healing** for broken user states
- ✅ **Auto-verification** after 24-hour timeout
- ✅ **Comprehensive logging** for debugging
- ✅ **Zero manual intervention** required

### Setup

```bash
# Make script executable
chmod +x scripts/setup-automation.sh

# Run complete setup
./scripts/setup-automation.sh

# Enable cron automation
./scripts/setup-automation.sh cron

# Check system status
./scripts/setup-automation.sh status
```

---

## 👨‍💼 Admin Dashboard & Support System

### Message Center Architecture

The admin support system implements a **threaded conversation model** with email integration.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPPORT SYSTEM ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────┐         ┌────────────────────────────────────────┐  │
│  │   User     │         │          Admin Dashboard               │  │
│  │  Contact   │         │  ┌──────────────────────────────────┐  │  │
│  │   Form     │────────▶│  │    Enhanced Message Center       │  │  │
│  └────────────┘         │  │  ┌────────────┬─────────────────┐│  │  │
│                         │  │  │ Inbox      │ Conversation    ││  │  │
│  ┌────────────┐         │  │  │            │                 ││  │  │
│  │  Contact   │◀────────│  │  │ • Unread   │ • Thread View   ││  │  │
│  │  Messages  │         │  │  │ • Read     │ • Reply History ││  │  │
│  │   Table    │         │  │  │ • Replied  │ • Quick Actions ││  │  │
│  └────────────┘         │  │  │ • Archived │                 ││  │  │
│        │                │  │  └────────────┴─────────────────┘│  │  │
│        │                │  └──────────────────────────────────┘  │  │
│        ▼                └────────────────────────────────────────┘  │
│  ┌────────────┐                           │                         │
│  │  Message   │◀──────────────────────────┘                         │
│  │  Replies   │                                                     │
│  │   Table    │──────────┐                                          │
│  └────────────┘          │                                          │
│                          ▼                                          │
│               ┌─────────────────────┐                               │
│               │  Edge Function      │                               │
│               │  admin-message-reply│                               │
│               └──────────┬──────────┘                               │
│                          │                                          │
│                          ▼                                          │
│               ┌─────────────────────┐                               │
│               │  Email Notification │                               │
│               │  to User (Resend)   │                               │
│               └─────────────────────┘                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Admin Features

| Module | Capabilities |
|--------|-------------|
| **User Management** | View/Edit profiles, Add credits, Suspend/Activate, Activity logs, Export data |
| **Message Center** | Threaded conversations, Email replies, Status tracking, Search & filter |
| **Payment Management** | Transaction history, Refund processing, Dispute handling |
| **Referral System** | Track referrals, Manage rewards, Analytics |
| **System Health** | Monitor functions, View logs, Check status |

### Database Schema (Support System)

```sql
-- Contact messages from users
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread', -- unread, read, replied, archived
  admin_notes TEXT,
  responded_by UUID REFERENCES profiles(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin replies with email tracking
CREATE TABLE message_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_message_id UUID REFERENCES contact_messages(id),
  admin_user_id UUID REFERENCES profiles(id),
  reply_content TEXT NOT NULL,
  is_email_sent BOOLEAN DEFAULT FALSE,
  email_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 Security Implementation

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: Client Protection                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • hCaptcha bot protection                               │   │
│  │  • Input sanitization                                    │   │
│  │  • XSS prevention                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Layer 2: Authentication                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • Supabase Auth with JWT                                │   │
│  │  • Email verification required                           │   │
│  │  • Failed login attempt tracking                         │   │
│  │  • Account lockout after threshold                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Layer 3: Authorization                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • Row Level Security (RLS) policies                     │   │
│  │  • Role-based access control                             │   │
│  │  • Resource-level permissions                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Layer 4: Data Protection                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • Environment variable encryption                       │   │
│  │  • No hardcoded secrets                                  │   │
│  │  • Pre-commit secret detection                           │   │
│  │  • Git history cleaned of credentials                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Security Features

- **Pre-commit Hooks**: Automatically scan for secrets before commits
- **RLS Policies**: Users can only access their own data
- **Service Role Isolation**: Admin functions use service role only server-side
- **Audit Logging**: Security events logged for monitoring

---

## 🚀 Deployment

### Production Checklist

- [ ] Configure all environment variables
- [ ] Deploy Supabase Edge Functions
- [ ] Set up payment webhooks
- [ ] Configure email domain (SPF/DKIM)
- [ ] Enable email automation cron
- [ ] Set up monitoring alerts
- [ ] Configure CDN caching
- [ ] Enable SSL/TLS

### Deployment Commands

```bash
# Build production bundle
npm run build

# Deploy to Vercel
vercel --prod

# Deploy Edge Functions
supabase functions deploy --all
```

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting PRs.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🔒 Security

For security concerns, please review our [Security Policy](SECURITY.md).

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/imlava">Lava</a></p>
  <p>
    <a href="https://sproutcv.app">🌐 Live App</a> •
    <a href="docs/">📚 Docs</a> •
    <a href="https://github.com/imlava/sproutcv/issues">🐛 Report Bug</a>
  </p>
  
  **SproutCV** - Grow your career, one resume at a time. 🌱
</div>

