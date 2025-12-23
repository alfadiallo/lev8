# Setup Changelog

## January 2025 - Complete Setup & MED-001 Integration

### ✅ Database Setup
- Created complete database schema
- Enabled Row Level Security (RLS)
- Seeded initial data (health systems, programs, modules)
- Configured global vignette support

### ✅ MED-001 Vignette
- Imported MED-001 as global vignette
- Fixed category to match UI (`medical-error-disclosure`)
- Verified visibility in Difficult Conversations module

### ✅ User Management
- Fixed user registration to include `institution_id`
- Added logout functionality
- Fixed role display in settings
- Created educator user creation script

### ✅ Bug Fixes
- Fixed infinite loop in logout
- Fixed role fetching in AuthContext
- Fixed vignette category matching
- Fixed registration to handle missing programs gracefully

### ✅ Code Cleanup
- Removed temporary fix scripts
- Consolidated check scripts
- Removed duplicate import scripts
- Created comprehensive documentation

## Key Design Decisions

### Global Vignettes
- Vignettes with `institution_id = NULL` are available to all users
- Allows shared educational content across institutions
- Reduces duplication and maintenance overhead

### Role System
- Roles: `resident`, `faculty`, `program_director`, `super_admin`
- Role-based module access
- Role displayed in user profile

### Registration Flow
- Creates auth user
- Creates user profile with `institution_id`
- Creates resident record with `program_id` and `class_id`
- Handles missing data gracefully




