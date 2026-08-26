# Security Policy

## Overview

REDGRID is a blood coordination platform designed to connect donors, hospitals, blood banks, and administrators for emergency blood coordination and inventory management.

Because REDGRID handles user accounts, organizational information, authentication data, and emergency blood requirements, security and responsible data handling are important parts of the system.

## Data Handling

REDGRID may process the following categories of information:

- User account information
- Hospital and blood bank organization details
- Contact information
- Blood group and availability information
- Blood inventory information
- Emergency blood requirements
- Hospital and blood bank accreditation information
- License/document information submitted for verification

Sensitive configuration values such as database credentials, JWT secrets, and API keys are stored using environment variables and are not intended to be committed to the public repository.

## Authentication and Authorization

REDGRID uses authenticated sessions and role-based access control.

The system supports different roles including:

- User / Donor
- Hospital
- Blood Bank
- REDGRID Administrator

Access to protected resources is controlled according to the authenticated user's role.

Institutional actions such as official emergency broadcasting and administrative functions are restricted to authorized roles.

## Password Security

User passwords are not stored as plain text.

Passwords are securely hashed before being stored in the database.

Authentication tokens are used to maintain authenticated sessions and access protected API resources.

## API Security

The backend validates authenticated requests before allowing access to protected resources.

Server-side authorization checks are used for sensitive operations instead of relying only on frontend restrictions.

Emergency alert creation verifies the authenticated user's role and associated organization before creating an official emergency alert.

## Database Security

REDGRID uses PostgreSQL through Prisma ORM.

Database credentials are stored through environment variables and are not included directly in source code.

Database relationships and foreign-key constraints are used to maintain data integrity.

## Environment Variables

The following types of secrets must not be committed to the repository:

- Database connection strings
- JWT secrets
- Gemini API keys
- Other private API credentials

## Deployment Security

The REDGRID frontend is deployed through Vercel and the backend is deployed through Render.

Production communication uses HTTPS.

Production environment variables are configured through the deployment platforms rather than being stored in the public repository.

## Reporting a Security Issue

If you discover a security vulnerability in REDGRID, please do not publicly disclose sensitive details through GitHub issues.

Please contact the project maintainers privately with:

- A description of the issue
- Steps to reproduce it
- Potential impact
- Any relevant screenshots or logs

We will review reported issues and take appropriate action.

## Responsible Disclosure

Security vulnerabilities should be reported responsibly so that they can be investigated and addressed before public disclosure.

## Security Limitations

REDGRID is a student hackathon project and should not be considered a certified medical, clinical, or HIPAA-compliant system.

The application is intended as a technology demonstration and prototype for emergency blood coordination.
