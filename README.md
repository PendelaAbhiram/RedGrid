# REDGRID

> Blood coordination when every second matters.

## Problem Statement

During Accidents or in an emergency situation patient or his relatives cannot receive the blood in time and hospitals can’t connect with other hospitals and blood banks immediately for blood bags. So, in RED GRID I am connecting all the donors and hospitals and blood banks at one place where user can donate blood if they are interested in nearby hospitals and call hospitals in an emergency situation. Hospitals/Blood banks can generate an emergency alert for patients and can manage their blood bags storage and Admin has to verify the new hospital and blood banks using their license and other information like address and their contacts and admin can resume the hospital/user/blood bank accounts or suspend.

## Solution

RED GRID will connect all three Donor and Hospital and Blood Bank together and they can contact each other for saving lives. Donor can go through the emergency alerts nearby their location, and they can donate blood and they can assist from DR.Clara an AI assistant to get 24/7 assistance about blood donation. Hospitals can broadcast the emergency alerts if they don't have enough blood bags and can contact the donors and blood banks at same time for better coordination to save the lives. Admin who validates the new hospital and blood banks using their government license and other organization information and admin can ban or suspend the hospital/donor/blood bank accounts if any unauthorized actions are done and admin manage all the things in RED GRID.

## Features

### Donor / User
- Create and manage donor profile
- View blood requirements and emergency alerts
- Find nearby blood donation opportunities
- Respond to emergency requirements
- Digital ID for donor verification

### Hospital
- Account Creation
- License and Organization information submission
- Manage blood inventory
- Broadcast Emergency alerts
- Monitor blood availability
- Coordinate with blood banks and donors

### Blood Bank
- Account registration
- License and information submission
- Manage blood bag inventory
- Track blood groups and availability
- Broadcast emergency requirements
- Coordinate blood supply

### Administrator
- Verify hospitals and blood banks
- Review license and registration details
- Approve/suspend/restore accounts
- Manage users and organizations
- Monitor emergency requirements
- Maintain platform-level control

## Technology Stack

### Frontend
- React
- Vite

### Backend
- Node.js
- Express
- Socket.IO
- Prisma

### Database
- PostgreSQL
- Neon

### Deployment
- Vercel
- Render


## Environment Variables

- NODE_ENV
- PORT
- DATABASE_URL
- JWT_SECRET
- JWT_EXPIRES_IN
- CORS_ORIGIN
- GEMINI_API_KEY
- DONOR_MATCH_RADIUS_KM


## Live Demo

https://red-grid-eta.vercel.app/

## Backend API

https://redgrid.onrender.com/

## Team

- | Name | GitHub | Role |
- |Sucharitha |sucharitha555|Frontend developer|
- |Abhiram | PendelaAbhiram |Backend developer |

## Third-Party Technologies

### Frontend

- React — Frontend UI library
- React DOM — React rendering for web applications
- Vite — Frontend development and build tool
- Tailwind CSS — Utility-first CSS framework
- Lucide React — Icon library
- Motion — Animation and interaction library

### Backend

- Node.js — JavaScript runtime
- Express.js — Backend web framework
- Socket.IO — Real-time, bidirectional communication
- JSON Web Token (JWT) — Authentication and session authorization
- bcryptjs — Password hashing
- Zod — Data validation

### Database

- PostgreSQL — Relational database
- Prisma — Database ORM and schema management
- Neon — Managed PostgreSQL database service
- node-postgres (pg) — PostgreSQL client for Node.js

### AI

- Google Gemini API — AI-powered functionality used by the Dr. Clara
  assistant

### Deployment

- Vercel — Frontend hosting and deployment
- Render — Backend hosting and deployment

### Development & Build Tools

- TypeScript — Static typing for JavaScript
- esbuild — Backend bundling and build optimization
- tsx — TypeScript execution during development

All third-party technologies remain subject to their respective licenses,
terms, and conditions. REDGRID does not claim ownership of third-party
software or services.

## Generative AI Disclosure

Generative AI tools were used during development for assistance with code
generation, debugging, documentation, problem solving, and UI/content
refinement. All generated or suggested content was reviewed, integrated,
tested, and adapted by the project team.

## License

This project is licensed under the MIT License.
