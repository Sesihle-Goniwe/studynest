# Study Nest (Study Partner Tool)

Study Nest is a platform designed to help university students find study partners, join study groups, schedule sessions, and track their study progress. It acts as a community forum/social media for students to improve their learning experience and collaborate efficiently.

---

## Features

- **Find Study Partners**
  - Match with other students based on shared modules or topics
  - View profiles of students in your course

- **Create Study Groups**
  - Create and join group sessions
  - Chat, share notes, and set group goals

- **Track Your Progress**
  - Log completed topics and sections
  - Track and visualize hours spent studying

- **Plan Sessions**
  - Schedule future study sessions with reminders

---

## UI Pages

- **Dashboard** – Summary information, upcoming events, new groups
- **User Profiles** – View and manage student profiles
- **Study Partner Search** – Find compatible study partners
- **Group Session Planner** – Create, join, and manage study sessions
- **Progress Tracker** – Track study progress with tables and charts
- **Chat Window** – Communicate with study groups in real-time

---

## API Modules

- **Partner Matching API**
  - CRUD operations for user preferences and profiles
  - Search functionality to find suitable study partners

- **Group Session API**
  - CRUD for groups, members, and scheduling

- **Progress API**
  - CRUD for topics, completion status, and hour tracking

- **Notifications API**
  - Manage reminders and updates for sessions

---

## Database Entities

- **User Profiles** – Student information, modules, and preferences
- **Study Groups** – Group details and members
- **Topics, Chapters, and Materials** – Learning materials and progress tracking
- **Notifications & Reminders** – Alerts for sessions and reminders

---

## Tech Stack

- **Frontend**: Angular
- **Backend**: NestJS
- **Database & Auth**: Supabase

---

## Installation
```
### Backend

cd backend
npm install
npm run start:dev

### Frontend

```bash
cd frontend
npm install
ng serve

