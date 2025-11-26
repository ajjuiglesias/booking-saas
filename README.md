# BookingSaaS - Multi-Tenant Appointment Scheduling Platform

A complete, production-ready booking and scheduling platform for service-based small businesses built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## 🚀 Features

### For Business Owners
- **Multi-step Onboarding**: Easy setup wizard for business info, services, and availability
- **Custom Booking Page**: Unique URL for each business (`/book/your-business`)
- **Dashboard**: Overview of today's appointments, weekly calendar, and key metrics
- **Service Management**: Create, edit, and manage services with pricing and duration
- **Calendar View**: Visual calendar showing all bookings with color coding
- **Customer Database**: Track customer history, notes, and booking patterns
- **Availability Management**: Set weekly hours, buffer times, and block specific dates
- **Email Notifications**: Automatic booking confirmations and reminders
- **Analytics & Reports**: Track bookings, revenue, and popular services

### For Customers
- **Easy Booking**: Simple 3-step booking process
- **Real-time Availability**: See available time slots instantly
- **Email Confirmations**: Receive booking details and calendar invites
- **Cancellation**: Easy cancellation with optional rescheduling

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Email**: Resend / NodeMailer
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud)
- (Optional) Email service account (Resend, SendGrid, etc.)

## 🏁 Getting Started

### 1. Clone and Install

```bash
cd booking-saas
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/booking_saas"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (Optional)
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
```

**Generate a secure NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed with sample data
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
booking-saas/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── signup/       # Business registration
│   │   ├── bookings/     # Booking CRUD
│   │   └── ...
│   ├── dashboard/        # Protected admin pages
│   ├── book/[slug]/      # Public booking pages
│   ├── login/            # Login page
│   ├── signup/           # Multi-step signup
│   └── page.tsx          # Landing page
├── components/
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # NextAuth config
│   ├── helpers.ts        # Utility functions
│   └── datetime.ts       # Date/time utilities
├── prisma/
│   └── schema.prisma     # Database schema
└── types/                # TypeScript definitions
```

## 🗄️ Database Schema

The platform uses 8 main models:

- **Business**: Multi-tenant business accounts
- **Service**: Services offered by businesses
- **Availability**: Weekly availability schedules
- **BlockedDate**: Specific dates/times blocked
- **Customer**: Customer records per business
- **Booking**: Appointment bookings
- **Staff**: Team members (optional)
- **StaffService**: Staff-service relationships

See `prisma/schema.prisma` for full schema details.

## 🔐 Authentication

Uses NextAuth.js with credentials provider:
- Secure password hashing with bcrypt
- JWT session strategy
- Protected routes with middleware
- Business-specific authentication

## 🎨 Customization

### Branding
- Business logo upload
- Custom primary color
- Personalized booking messages

### Booking Settings
- Minimum notice hours (e.g., 2 hours advance)
- Maximum advance booking days (e.g., 30 days)
- Buffer time between appointments
- Cancellation policy (flexible, moderate, strict)

### Timezone Support
- Business timezone configuration
- Automatic timezone conversion for bookings
- Display times in customer's local timezone

## 📧 Email Notifications

Configure email service in `.env`:

```env
RESEND_API_KEY="your_api_key"
EMAIL_FROM="bookings@yourdomain.com"
```

Emails sent:
- Booking confirmation (customer)
- New booking notification (business)
- 24-hour reminder (customer)
- Cancellation confirmation (both)

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

Vercel will automatically:
- Build the Next.js app
- Run Prisma generate
- Deploy to production

### Database Options

- **Vercel Postgres**: Integrated with Vercel
- **Supabase**: Free tier available
- **Neon**: Serverless PostgreSQL
- **Railway**: Easy PostgreSQL hosting

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linter
npm run lint

# Build for production
npm run build
```

## 📝 API Routes

### Public Routes
- `POST /api/signup` - Business registration
- `GET /api/timeslots` - Available time slots
- `POST /api/bookings` - Create booking (public)

### Protected Routes (require authentication)
- `GET /api/bookings` - List bookings
- `PATCH /api/bookings/[id]` - Update booking
- `DELETE /api/bookings/[id]` - Cancel booking
- `GET /api/services` - List services
- `POST /api/services` - Create service
- `GET /api/customers` - List customers

## 🔒 Security

- Password hashing with bcrypt (12 rounds)
- JWT-based authentication
- CSRF protection
- SQL injection prevention (Prisma)
- Environment variable validation
- Input sanitization

## 🎯 Roadmap

- [ ] SMS notifications (Twilio)
- [ ] Payment processing (Stripe)
- [ ] Multi-staff scheduling
- [ ] Recurring appointments
- [ ] Waitlist management
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Custom email templates
- [ ] Webhook integrations
- [ ] API for third-party apps

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 💬 Support

For issues or questions:
- Open a GitHub issue
- Check existing documentation
- Review the implementation plan

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [shadcn/ui](https://ui.shadcn.com/)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ for service-based businesses**
