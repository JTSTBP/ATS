# ATS Portal - Login System Guide

## Overview
The ATS Portal now includes a comprehensive authentication system with role-based access control.

## Features

### 1. Login Page (`/login`)
- **Email & Password Authentication**: Basic form validation with email format checking
- **Password Toggle**: Show/hide password functionality
- **Role Selection**: Dropdown to select designation (Recruiter, Manager, HR)
- **Responsive Design**: Beautiful gradient background with centered card layout
- **Animations**: Smooth Framer Motion animations on page load

### 2. Role-Based Access
- **Recruiter**: Access to full recruiter panel with Dashboard, Upload CV, Candidates, Reports, Leave Applications
- **Manager**: Placeholder panel showing upcoming features
- **HR**: Placeholder panel showing upcoming HR management tools

### 3. Protected Routes
- All routes are protected and require authentication
- Users are automatically redirected based on their role
- Unauthorized access attempts redirect to appropriate panels

### 4. Session Management
- User data stored in localStorage for persistence
- Session survives page refreshes
- Logout clears session and redirects to login

### 5. Navbar Integration
- Dynamic portal title based on user role
- User profile dropdown showing name, email, and designation
- Logout button in dropdown menu

## Routes

```
/login                          → Login page
/recruiter                      → Recruiter Dashboard
/recruiter/upload-cv            → Upload CV page
/recruiter/candidates           → My Candidates
/recruiter/reports              → Reports
/recruiter/leave-applications   → Leave Applications
/manager                        → Manager Panel (placeholder)
/hr                             → HR Panel (placeholder)
```

## Login Credentials (Mock)

The system uses mock authentication. Any valid email format with a password of 6+ characters will work.

**Example:**
- Email: `recruiter@company.com`
- Password: `password123`
- Designation: `Recruiter`

## Technical Implementation

### Components Created
- `src/context/AuthContext.tsx` - Authentication context provider
- `src/pages/Login.tsx` - Login page component
- `src/pages/ManagerPanel.tsx` - Manager placeholder panel
- `src/pages/HRPanel.tsx` - HR placeholder panel
- `src/components/ProtectedRoute.tsx` - Route protection wrapper

### Updated Components
- `src/App.tsx` - Updated routing structure
- `src/components/Navbar.tsx` - Added user info and logout
- `src/components/Sidebar.tsx` - Updated navigation paths

## Features Highlights

✅ Modern, professional login UI with Tailwind CSS
✅ Form validation with error messages
✅ Password visibility toggle
✅ Role-based routing and access control
✅ Session persistence with localStorage
✅ Smooth animations and transitions
✅ Fully responsive design (mobile, tablet, desktop)
✅ User profile dropdown in navbar
✅ Logout functionality
✅ Protected routes with automatic redirection

## Usage

1. Navigate to `/login` or the root URL
2. Enter any valid email and password (6+ characters)
3. Select your designation (Recruiter, Manager, or HR)
4. Click "Sign In"
5. You'll be redirected to your role-specific panel
6. Click your profile avatar in the navbar to logout

## Future Enhancements

- Real backend authentication with API integration
- Password reset functionality
- Remember me option
- Multi-factor authentication
- Complete Manager and HR panels
- User profile management
- Role permissions and access levels
