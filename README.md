# MySchool Manager

A comprehensive school administration system built with Next.js, TypeScript, and Tailwind CSS. MySchool Manager helps educational institutions manage groups, teachers, students, attendance, and payments in a clean, modern interface.

## Features

### 🎓 Group Management
- Create educational groups with unique IDs
- Assign teachers to groups
- Set recurring study days (Monday, Thursday, etc.)
- Configure total number of sessions
- Automatic session generation based on schedule

### 👨‍🏫 Teacher Management
- Add and manage teacher profiles
- Track teacher assignments across groups
- View teacher statistics and performance

### 👥 Student Management
- Add students to groups with individual pricing
- Track student information and contact details
- Manage student enrollment and group assignments

### 📅 Attendance Tracking
- Mark student attendance for each session
- Visual attendance interface with checkboxes
- Calculate attendance percentages
- Real-time attendance updates

### 💰 Payment Management
- Track payments per student
- Calculate total amounts due based on attendance
- Monitor payment history and balances
- Generate financial reports

### 🎨 Modern UI/UX
- Clean, card-based interface
- Orange (#f97316) and white color theme
- Responsive design for all devices
- Intuitive navigation and user experience

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand with persistence
- **UI Components**: Headless UI, Heroicons
- **Date Handling**: date-fns
- **Build Tool**: Turbopack

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mychool_manager/manager
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### 1. Getting Started
1. First, add teachers through the Teachers page
2. Create groups and assign teachers
3. Add students to groups with pricing information
4. Generate sessions for attendance tracking
5. Start managing attendance and payments

### 2. Group Creation
- Navigate to Groups page
- Click "Create Group"
- Fill in group details:
  - Group name
  - Select teacher
  - Set start date
  - Choose recurring days
  - Set total sessions
- Generate sessions automatically

### 3. Attendance Management
- Go to Attendance page
- Select a group
- Mark attendance for each student per session
- View attendance statistics and percentages

### 4. Payment Tracking
- Visit Payments page
- View student payment summaries
- Add payments for individual students
- Track balances and payment history

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── groups/            # Group management pages
│   ├── teachers/          # Teacher management
│   ├── attendance/        # Attendance tracking
│   ├── payments/          # Payment management
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── Navigation.tsx    # Main navigation
├── store/                # Zustand state management
│   └── index.ts          # Main store configuration
└── types/                # TypeScript type definitions
    └── index.ts          # Application types
```

## Key Features

### State Management
- Persistent state with Zustand
- Automatic data persistence in localStorage
- Real-time updates across all components

### Data Models
- **Group**: Contains students, sessions, teacher assignment
- **Teacher**: Basic profile and group assignments
- **Student**: Profile, pricing, and attendance data
- **Session**: Date and attendance records
- **Payment**: Financial transaction records

### Session Generation
- Automatic calculation based on start date and recurring days
- Continues until total session count is reached
- Handles multiple recurring days per week

### Financial Calculations
- Total due = attended sessions × price per session
- Balance = total due - total paid
- Real-time payment tracking and updates

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. Define types in `src/types/index.ts`
2. Add state management in `src/store/index.ts`
3. Create UI components in `src/components/`
4. Build pages in `src/app/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
