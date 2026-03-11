# PlanIt Report AI

A productivity-focused web app for academy teachers and directors to manage students, enter weekly learning data, and generate AI-powered reports.

## Tech Stack
- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **Prisma** + **PostgreSQL**
- **OpenAI GPT-4o** for report generation
- **Zod** for validation

## Getting Started

### 1. Prerequisites
- [Node.js 18+](https://nodejs.org/)
- PostgreSQL database (local, [Neon](https://neon.tech), or [Supabase](https://supabase.com))
- OpenAI API key

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` and fill in:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/planit_report_ai"
OPENAI_API_KEY="sk-..."
```

### 4. Initialize Database
```bash
npx prisma migrate dev --name init
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
planit-report-ai/
├── app/
│   ├── (app)/                  # App shell with sidebar
│   │   ├── layout.tsx          # Sidebar layout wrapper
│   │   ├── page.tsx            # Redirects to /students
│   │   ├── students/           # Student management
│   │   │   ├── page.tsx        # Students list
│   │   │   ├── new/page.tsx    # Add student form
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Student detail
│   │   │       └── edit/page.tsx
│   │   └── reports/            # Reports
│   │       ├── page.tsx        # Report history
│   │       ├── new/page.tsx    # Generate report
│   │       └── [id]/page.tsx   # Report detail/edit
│   ├── api/
│   │   ├── students/           # Student CRUD
│   │   ├── weekly-data/        # Weekly data CRUD
│   │   └── reports/            # Report CRUD + generate
│   ├── login/page.tsx          # Auth placeholder
│   ├── globals.css
│   └── layout.tsx
├── components/
│   └── Sidebar.tsx
├── features/
│   ├── students/
│   │   ├── StudentForm.tsx     # Add/Edit form
│   │   └── StudentDetailClient.tsx
│   └── reports/
│       ├── GenerateReportClient.tsx   # 3-step generate UI
│       ├── ReportHistoryClient.tsx    # History table
│       └── ReportDetailClient.tsx     # Edit + copy + sent
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── openai.ts               # AI prompt functions
│   ├── validations.ts          # Zod schemas
│   └── api-response.ts         # Response helpers
├── prisma/
│   └── schema.prisma           # DB schema
└── .env.example
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:push` | Push schema without migration |

## Key Features

- **Student CRUD** — Add, edit, delete students with Korean + English names
- **Weekly Data** — Save and reuse weekly lesson notes per student
- **AI Reports** — Generate Korean parent reports or English teacher notes with one click
- **Report Editor** — Edit AI output inline before sending
- **Report History** — View, filter, copy, and manage all past reports
- **Sent Status** — Toggle sent/not-sent state per report
