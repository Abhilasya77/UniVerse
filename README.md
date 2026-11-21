# 🌌 UniVerse

### Every university. One universe. Never miss what matters.

**UniVerse** is a personalized university campus platform designed to help students discover meaningful opportunities, manage academic responsibilities, connect with campus communities, and resolve everyday campus issues—all in one place.

Built for the **KHDA Hackathon** using Lovable.

## 🌐 Live Demo

[Explore UniVerse](https://id-preview--4b71730e-bbc1-430a-853d-7d1a047486f7.lovable.app/?__lovable_receipt=mat_14bhftr5b78v89y6k3paa115qe)

## 💡 The Problem

University students often miss valuable events, career opportunities, and important announcements because information is scattered across emails, social platforms, and university portals.

At the same time, universities lack clear visibility into student engagement and the effectiveness of campus activities.

## 🚀 Our Solution

UniVerse brings academic planning, career opportunities, campus events, and student services together in one personalized platform.

Instead of showing students everything, UniVerse helps them identify **what actually matters to them**.

## ✨ Key Features

### 🎯 Personalized Student Profiles
- Academic goals, skills, projects, and interests
- Internship and certification tracking
- Profile completeness indicator

### 📅 Smart Academic Calendar
- Exam and timetable management
- Upcoming exam countdowns
- Personalized academic planning

### 🧠 Exam Preparedness Tracker
- Track study progress and preparation levels
- Readiness indicators for upcoming examinations

### ⭐ Worth It for You Score
A personalized event relevance score based on:
- Career goal alignment
- Expected outcomes
- Organizer credibility
- Exam schedules
- Effort versus reward

### 🎪 Campus Events
- Discover events within your university
- Explore opportunities from other universities
- Filter opportunities by interests and relevance

### 📢 Campus Announcements
- Centralized university announcements
- Priority-based information discovery

### 🍽️ Mess Issues and Complaints
- Report campus service issues
- Monitor ticket progress
- View service trust indicators

### 🔎 Lost and Found
- Report missing or found items
- Browse campus listings
- Connect with other students

### 🤖 CampusIQ
- AI-powered campus assistance through Lovable's server-side AI Gateway

### 📊 University Dashboard
- Student engagement insights
- Event performance analytics
- Campus service metrics

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Framework:** TanStack Start
- **Development:** Lovable
- **Backend services:** Lovable Cloud and Supabase-related infrastructure
- **AI integration:** Lovable AI Gateway

## 💻 Running Locally

Clone the repository:

```bash
git clone https://github.com/Abhilasya77/UniVerse.git
```

Navigate to the project:

```bash
cd UniVerse
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Some features require separately configured cloud services and environment variables.

## 🧪 Demo and Implementation Notes

UniVerse includes a sample workspace demonstrating its intended functionality.

LinkedIn integration, email analysis, timetable extraction, and certain sample data are simulated in the hackathon demo.

The project also uses authentication and role-based authorization. Privileged roles must be assigned through trusted administration rather than through self-reported profile details.

## 🔐 Security and Privacy

- User accounts start with the student role.
- Sensitive information is managed through protected access policies.
- Private profiles, tickets, analyses, and messages have separate access rules.
- Self-entered university names do not constitute verified university membership.

## 🎯 Vision

To build a connected university ecosystem where students never miss meaningful opportunities and universities can better understand and improve campus experiences.

---

**UniVerse — Every university. One universe. Never miss what matters.**red university names as verified campus tenancy.
- CampusIQ uses Lovable's server-side AI Gateway. The sample workspace never sends content to an AI model.
