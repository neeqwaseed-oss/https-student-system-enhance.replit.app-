# مكتبة عين انجاز للخدمات الطلابية

## Project Overview
A modern Arabic RTL student management system for a computer training library. Rebuilt from a Flask/Python/SQLite original to a full-stack React/TypeScript/PostgreSQL application.

## Recent Updates (March 2026 — Latest)
- **Teacher Dashboard Complete Overhaul** (`TeacherDashboard.tsx`): Full portal with 7-section RTL sidebar (Dashboard/Students/Grades/Salary/Profile/Messages/Settings), animated glassmorphism header, Arabic/English language toggle, watermark background, copyright footer
- **Teacher Grade Entry**: Full COMPUTER APPS curriculum (MODULE-1 through MODULE-4 + Practice Exams + Exams/Quizzes/Assignments), numeric inputs (0-100) with progress bars, drag-and-drop/click image upload stored as base64 in `gradeImages`, collapsible sections with aggregate scores, save all grades button
- **Teacher Profile Management**: Background image upload, avatar upload, bio/phone/email/subject editing; credential change (username+password) with automatic admin notification via teacher messages
- **Teacher Messaging System**: Teacher can send messages to admin via POST /api/teacher/messages; view replies; admin views all at `/teacher-messages` page (GET/POST /api/admin/teacher-messages)
- **Admin Teacher Messages Page** (`/teacher-messages`): Full admin UI to view all teacher messages, see unread/replied stats, expand each message, reply inline
- **New API Routes**:
  - GET/POST `/api/teacher/grades/:internalId` — grade entry for own students only
  - PATCH `/api/teacher/profile` — update teacher profile
  - PATCH `/api/teacher/credentials` — change username/password + admin notification
  - GET `/api/teacher/my-students-full` — full student list for grade entry
  - GET/POST `/api/teacher/messages` — teacher-to-admin messaging
  - GET `/api/admin/teacher-messages` — admin views all messages
  - POST `/api/admin/teacher-messages/:id/reply` — admin replies
- **New Storage Methods**: `getTeacherMessages`, `getAllTeacherMessages`, `createTeacherMessage`, `replyToTeacherMessage`, `markMessageRead`, `getTeacherStudentsFull`, `updateTeacherProfile`
- **Sidebar**: Added "رسائل المدرسين" link under "إدارة المدرسين" → `/teacher-messages`
- **Print**: Teacher portal includes "طباعة القائمة" button generating branded student list with usernames/passwords

## Recent Updates (March 2026)
- **Smart Accounting System (FinancialReportPage)**: Complete redesign as a proper accounting dashboard with 6 KPI cards, 4 tabs (لوحة الرقابة/دفتر الأستاذ/الذمم المدينة/التسوية الشهرية), aging analysis, running-balance ledger, monthly cash flow, balance sheet. Smart audit detects: overpayments, duplicate payments, orphan payments, negative profit, zero-price students, low collection rate.
- **Smart Accounting (PaymentsPage)**: Accounting audit banner (shield icon) shows health status. Payment form: real-time overpayment warning (red/yellow) when amount > remaining, auto-suggest remaining amount button, duplicate payment detection. Payment table: color-coded rows with badges (مكرر/دفع زيادة/بدون طالب).
- **Professional Print Functions**: Added 4 new print functions in excel.ts: `printStudentGradesDoc`, `printGradesReport`, `printFinancialReport`, `printSalariesReport`
- **GradesPage**: Print button now generates professional A4 grades report for all students via `printGradesReport()`
- **StudentProfile**: "طباعة الدرجات" button generates individual student grades document; "طباعة الصفحة" calls `printStatement()` (account statement)
- **FinancialReportPage**: Print button generates professional A4 financial report with student-by-student breakdown
- **SalariesPage**: Print button generates professional A4 salaries report per teacher
- **New API**: `GET /api/grades` returns all grades (used by `printGradesReport` to fetch data)
- **كشف حساب المشترك**: زر "كشف الحساب" في StudentProfile يولد PDF احترافي A4 مع ترويسة المكتبة, بطاقات معلومات الطالب, جدول الدفعات, ملخص مالي كامل, أقسام التوقيعات والختم
- **WhatsApp Tab محسّن**: 5 قوالب رسائل جاهزة (ترحيب/تذكير دفعة/متابعة/تهنئة/تنبيه غياب), إرسال رسالة مخصصة, سجل رسائل الجلسة, تحويل رقم سعودي تلقائي
- **printStudentStatement()**: دالة جديدة في excel.ts لكشف حساب المشترك مع ترويسة احترافية
- **printReceiverStatement()**: دالة جديدة في excel.ts لكشف مدفوعات المستلم مع ترويسة احترافية
- **تحسين printTablePdf()**: تصميم احترافي موحد مع شعار المكتبة, رقم المستند, بطاقات المعلومات, جدول ملون, أقسام التوقيع والختم, التذييل
- **StudentsPage filters**: Filter panel with 4 dropdowns (الحالة, المدرس, الجهة, نوع الاشتراك), active filter counter badge, clear all filters button
- **Student form - Teacher**: Dropdown linked to real teachers from DB (معمر عثلان, اسامة عبده قاسم, عمران عقلان, يسرى الراجحي)
- **Student form - Institution**: Button-group selector (كلية ينبع / معهد ينبع / أخرى with custom text input)
- **Payment form - Sender**: Auto-fills with student name when student is selected
- **Excel export**: Upgraded to proper XLSX using xlsx library with colored headers, styled rows, column widths, RTL direction
- **PDF printing**: New printTablePdf() function with branded header, info grid cards, styled table, footer (used by PlatformDataPage + TeacherProfile)
- **Installment tab**: 6 filter cards (لم يدفع, دفعة واحدة, دفعتان, 3+ دفعات, سداد كامل, متبقي عليهم); table shows remaining amount with progress bar, payment status badge, teacher column
- **PaymentsPage**: Complete redesign with 5 tabs (جميع الدفعات, الأهلي, D360, أخرى, سجل التقسيط), fixed receivers (محمد بن عشق/الأهلي, أحمد عبدالعزيز/D360, أخرى with custom name), per-receiver stats cards, installment filter (0/1/2/3+ payments), print per-receiver statement, accountType column added
- **Students Auto-ID**: New student form auto-generates next sequential ID (highest+1) via GET /api/students/next-id
- **Real Data Import**: 113 real students imported from Excel; 4 real teachers (معمر عثلان, اسامة عبده قاسم, عمران عقلان, يسرى الراجحي); POST /api/admin/import-students endpoint added
- **New API Routes**: /api/students/next-id, /api/payments/stats/by-receiver, /api/payments/stats/student-counts, /api/admin/import-students
- **StudentProfile**: Complete redesign with 6-tab interface (المعلومات الأساسية, الدرجات, الحساب المالي, بيانات الدخول, سجل الواتساب, الملاحظات), action bar, stats bar, inline payment management, edit modal
- **StudentsPage**: Added card/table view toggle (LayoutGrid/List icons), table shows all student data in spreadsheet format
- **PlatformDataPage**: Added teacher name column + Excel/CSV export button  
- **TeacherProfile**: Added Excel/CSV export button for teacher's students
- **Back Navigation**: Added "رجوع" back buttons to PaymentsPage, TrashPage, SalariesPage, GradesPage
- **Excel Export**: `client/src/lib/excel.ts` utility with UTF-8 BOM for Arabic CSV download

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v3, shadcn/ui components
- **Backend**: Express.js, TypeScript (tsx runtime)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based authentication (express-session + connect-pg-simple)
- **State Management**: TanStack Query v5
- **Routing**: Wouter

## Architecture
- `server/index.ts` - Express server with session middleware, seeding, routes
- `server/routes.ts` - All REST API endpoints
- `server/storage.ts` - Data access layer (IStorage interface + DatabaseStorage implementation)
- `server/db.ts` - Drizzle database connection
- `server/setup.ts` - Vite dev server middleware setup
- `shared/schema.ts` - Drizzle ORM schema + Zod types
- `client/src/App.tsx` - Root component with auth context, routing
- `client/src/pages/` - All page components
- `client/src/components/` - UI components (shadcn + custom)

## Database Tables
1. **users** - System accounts (admin, teacher, staff roles)
2. **teachers** - Teacher profiles with salaries
3. **teacher_salaries** - Salary payment records
4. **students** - Subscriber/student records with subscriptions
5. **grades** - Multi-module computer course grades
6. **payments** - Payment records for subscriptions
7. **session** - Express session store (auto-created by connect-pg-simple)

## Key Features
- **Student Management**: Add/edit/delete students with subscription types, discounts, referrals
- **Grade Tracking**: Windows (2 models), Word (4), Excel (5), PowerPoint (4) + quizzes, assignments, midterm, final. Two view modes: card list and spreadsheet table
- **Payment Tracking**: Record and view payments. Two pages: `/payments` (log view) and `/payments-student` (student-centric with تسجيل دفعة per row)
- **Teacher Management**: Profiles + salary records per teacher
- **Salary Management**: `/salaries` - overview of all teachers' salaries with per-teacher management modal
- **Financial Report**: `/financial-report` - stats (revenue, expenses, profit, remaining), donut chart, bar chart by institution, student financial table
- **Institutions**: `/institutions` - students grouped by educational institution with financial stats per group
- **Backup Management**: `/backup` - export data to JSON/CSV, simulate backup creation
- **Technical Support**: `/support` - ticket management with reply functionality
- **Help Center**: `/help` - FAQ accordion and contact information
- **User Accounts**: Admin/teacher/staff roles with password management
- **Trash System**: Soft-delete with restore and permanent delete for students and teachers
- **RTL Arabic UI**: Full Arabic interface with Cairo/Tajawal fonts
- **Expandable Sidebar**: Collapsible sections: Dashboard, Accounts, Students (sub), Teachers (sub), Finance (sub), Institutions, Backup (sub), Support, Help

## Pages
- `/` - Dashboard with welcome card, stats, institution chart, quick shortcuts, recent data
- `/students` - Student list with filters and management
- `/students/:internalId` - Student profile
- `/grades` - Grade management (card view + spreadsheet view)
- `/payments` - Payment log/records
- `/payments-student` - Student-centric payment view with تسجيل دفعة per student
- `/teachers` - Teacher management
- `/salaries` - Teacher salary overview and management
- `/financial-report` - Financial report with charts
- `/institutions` - Students grouped by educational institution
- `/accounts` - User account management
- `/backup` - Data backup and export
- `/support` - Technical support tickets
- `/help` - Help and FAQ
- `/trash` - Deleted items (restore/permanent delete)

## Default Credentials
- Username: `admin`
- Password: `admin123`

## API Routes
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user
- `GET/POST /api/students` - Student CRUD
- `GET/PATCH/DELETE /api/students/:internalId` - Student operations
- `GET/POST /api/grades` - Grade CRUD
- `GET/PATCH /api/grades/:internalId` - Grade operations
- `GET/POST /api/payments` - Payment CRUD
- `DELETE /api/payments/:id` - Delete payment
- `GET/POST /api/teachers` - Teacher CRUD
- `PATCH/DELETE /api/teachers/:id` - Teacher operations
- `GET/POST /api/teacher-salaries` - Salary records
- `GET/POST/DELETE /api/users` - User management
- `PATCH /api/users/:id/password` - Change password
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/trash/students` - Deleted students
- `GET /api/trash/teachers` - Deleted teachers
- `POST /api/trash/students/:internalId/restore` - Restore student
- `DELETE /api/trash/students/:internalId/permanent` - Permanent delete
- `POST /api/trash/teachers/:id/restore` - Restore teacher
- `DELETE /api/trash/teachers/:id/permanent` - Permanent delete teacher

## Configuration
- Port: 5000
- Tailwind: v3 with custom CSS variables for theming
- PostCSS: uses `tailwindcss` plugin directly (v3)
- Vite: configured in `vite.config.mjs` with `allowedHosts: true`
- Sessions: PostgreSQL-backed with 30-day expiry

## User Preferences
- Full RTL Arabic interface
- Dark sidebar always-on
- Professional gradient design with blue primary color
- Arabic fonts: Cairo, Tajawal, IBM Plex Sans Arabic
