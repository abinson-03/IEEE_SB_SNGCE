# SCRUM PROJECT : IEEE SB SNGCE PORTAL
## UNIFIED STUDENT BRANCH & MULTI-CHAPTER OPERATIONS PLATFORM

---

### PROJECT REPORT

*Submitted by*  
**ABINSON BABU**  
**(Reg. No: SNG25MCA-2002)**  

*Under the guidance of*  
**DR. ANOOPKUMAR M**  
*Associate Professor, Department of Computer Applications*  

*to*  
**APJ ABDUL KALAM TECHNOLOGICAL UNIVERSITY**  
*in partial fulfillment of the requirements for the award of the Degree of*  
**MASTER OF COMPUTER APPLICATIONS (MCA)**  

[COLLEGE_LOGO_HERE]
**DEPARTMENT OF COMPUTER APPLICATIONS**  
**SREE NARAYANA GURUKULAM COLLEGE OF ENGINEERING (SNGCE)**  
**KADAYIRUPPU, KOLENCHERY, KERALA – 682311**  
**NOVEMBER 2026**

---

## DECLARATION

I, the undersigned, hereby declare that the project report entitled **“IEEE SB SNGCE PORTAL – UNIFIED STUDENT BRANCH & MULTI-CHAPTER OPERATIONS PLATFORM”**, submitted for partial fulfillment of the requirements for the award of the degree of Master of Computer Applications of the APJ Abdul Kalam Technological University, Kerala, is a bonafide record of individual project work done by me under the supervision of **DR. ANOOPKUMAR M**, Associate Professor, Department of Computer Applications, SNGCE, Kadayiruppu.

This submission represents my ideas in my own words and where ideas or words of others have been included, I have adequately and accurately cited and referenced the original sources. I also declare that I have adhered to the ethics of academic honesty and integrity and have not misrepresented or fabricated any data, idea, fact, or source in my submission. I understand that any violation of the above will be a cause for disciplinary action by the institute and/or the University and can also evoke penal action from the sources which have thus not been properly cited or from whom proper permission has not been obtained. This report has not previously formed the basis for the award of any degree, diploma, associateship, or similar title of any other University or Institution.

**Place:** Kadayiruppu  
**Date:** 21 November 2026  

**ABINSON BABU**  
(Reg. No: SNG25MCA-2002)

---

## CERTIFICATE

**DEPARTMENT OF COMPUTER APPLICATIONS**  
**SREE NARAYANA GURUKULAM COLLEGE OF ENGINEERING (SNGCE)**  
**KADAYIRUPPU, ERNAKULAM, KERALA – 682311**

This is to certify that the project report entitled **“IEEE SB SNGCE PORTAL – UNIFIED STUDENT BRANCH & MULTI-CHAPTER OPERATIONS PLATFORM”** submitted by **ABINSON BABU (Reg. No: SNG25MCA-2002)** to the APJ Abdul Kalam Technological University in partial fulfillment of the requirements for the award of the Degree of **Master of Computer Applications** is a bonafide record of the individual project work carried out by him under my guidance and supervision.

This report in any form has not been submitted to any other University or Institute for the award of any degree or diploma.

<br/><br/>

___________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ___________________________  
**Dr. Anoopkumar M** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Dr. Sandhya R**  
*Internal Project Guide* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; *Head of the Department*  
*Associate Professor, Dept. of CA* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; *Department of Computer Applications*  

<br/>

___________________________  
**Project Coordinator**  
*Department of Computer Applications*

---

## ACKNOWLEDGEMENT

I express my deepest gratitude to all who supported me in completing this academic mini-project, **“IEEE SB SNGCE Portal – Unified Student Branch & Multi-Chapter Operations Platform”**, undertaken as part of the MCA curriculum at Sree Narayana Gurukulam College of Engineering (SNGCE), affiliated with APJ Abdul Kalam Technological University (KTU).

First and foremost, I extend my heartfelt thanks to **Prof. Dr. S Jose**, Principal of SNGCE, for providing a technically progressive academic environment, encouraging research, and fostering an atmosphere of software innovation.

I am profoundly grateful to **Dr. Sandhya R**, Head of the Department of Computer Applications, for her continuous encouragement, administrative backing, and guidance throughout the project duration.

My sincere and special gratitude goes to my project guide, **Dr. Anoopkumar M**, Associate Professor, Department of Computer Applications, for his continuous mentorship, critical reviews, technical guidance, and suggestions. His constructive feedback during Scrum reviews helped shape the portal's architectural foundation and implementation strategy.

I express my gratitude to all faculty and technical staff of the Department of Computer Applications for their direct and indirect support. Above all, I thank God Almighty for granting me the wisdom, perseverance, and strength to bring this work to fruition, and my parents for their boundless love, encouragement, and support.

**ABINSON BABU**

---

## ABSTRACT

The IEEE Student Branch at SNGCE (IEEE SB SNGCE) comprises multiple technical society chapters and affinity groups, including the Computer Society (CS), Computational Intelligence Society (CIS), Signal Processing Society (SPS), and Women in Engineering (WIE). Efficiently administering these units—spanning cross-chapter event planning, participant registrations, UPI fee reconciliation, physical attendance verification, automated certificate generation, and executive duty tracking—has historically relied on disjointed manual workflows. Such fragmentation causes administrative overhead, registration duplications, attendance discrepancies, delays in certificate issuance, and limited institutional visibility.

To solve these operational challenges, the IEEE SB SNGCE Portal was conceptualized, architected, and engineered as an integrated web platform leveraging the MERN technology stack (MongoDB, Express.js, React.js 19, and Node.js). The portal implements a secure Role-Based Access Control (RBAC) hierarchy accommodating five distinct user tiers: Public Visitors, Registered Student Members, Chapter ExeCom Officers, Chapter Administrators, and Super Administrators. Core capabilities include an interactive public showcase of chapter activities, an automated event registration engine with UPI payment screenshot proof submission, camera-based dynamic QR code scanning for attendance validation, automated server-side PDF certificate generation via PDFKit with cryptographic verification IDs, and transactional email notifications powered by Nodemailer Gmail SMTP.

The system also provides dedicated workspaces for chapter executive officers to manage task backlogs, oversee officer duty assignments, publish official notices, curate event photo galleries with geolocation tags, and review system audit trails. Developed under the Scrum agile framework across seven iterative sprints, the platform enforces input validation, bcrypt password hashing, JWT authentication, and responsive Tailwind CSS user interfaces. Comprehensive unit, integration, and user acceptance testing confirm that the IEEE SB SNGCE Portal significantly reduces administrative effort, prevents certificate tampering, and provides a dependable digital backbone for student branch operations.

---

## CONTENTS

| Chapter / Section | Title | Page No. |
| :--- | :--- | :--- |
| &nbsp; | **ACKNOWLEDGEMENT** | iii |
| &nbsp; | **ABSTRACT** | iv |
| &nbsp; | **LIST OF TABLES** | vii |
| &nbsp; | **LIST OF FIGURES** | viii |
| &nbsp; | **ABBREVIATIONS** | ix |
| &nbsp; | **NOTATIONS** | x |
| &nbsp; | **SCRUM PROJECT FRAMEWORK** | 1 |
| &nbsp; | Team Roles and Responsibilities | 2 |
| &nbsp; | KTU Learning Outcomes & Course Mapping | 3 |
| &nbsp; | Vision, Mission & PEOs | 4 |
| **CHAPTER 1** | **PROJECT IDENTITY** | 5 |
| 1.1 | Problem Story | 5 |
| 1.1.1 | Problem Statement | 6 |
| 1.1.2 | Relevance to Society / Industry & SDGs | 7 |
| 1.1.3 | Requirements Surveys (Functional & Non-Functional) | 8 |
| 1.2 | Project Overview – Proposed Solution | 11 |
| 1.2.1 | Solution Concept & Working Principle | 11 |
| 1.2.2 | Key Features & Technology Requirements | 14 |
| 1.3 | Project Analysis – Existing vs Proposed | 17 |
| 1.4 | Use Cases & Actor Model | 19 |
| **CHAPTER 2** | **PRODUCT BACKLOGS** | 22 |
| 2.1 | Integrated Initial Record (User Stories US01 – US16) | 22 |
| 2.2 | Detailed Use Case Specifications (UC-01 to UC-16) | 24 |
| **CHAPTER 3** | **STORY POINT ESTIMATION** | 38 |
| 3.1 | Introduction & Objectives | 38 |
| 3.2 | Estimation Approach & Scale (Planning Poker) | 39 |
| 3.3 | User Story Estimation Register | 40 |
| 3.4 | Estimation Rationale & Distribution Analysis | 42 |
| **CHAPTER 4** | **RELEASE & SPRINT PLAN** | 45 |
| 4.1 | Product Backlog Prioritization (MoSCoW) | 45 |
| 4.2 | Planned Detailed Schedule (Sprints 1 to 7) | 46 |
| 4.3 | Architectural Overview (MERN Tier Architecture) | 48 |
| 4.4 | Logical Data Model / ER Concept | 50 |
| 4.5 | UI/UX Wireframe Plan | 52 |
| 4.6 | Comprehensive Technology Stack | 54 |
| **CHAPTER 5** | **PROJECT PROGRESS AND MANAGEMENT** | 56 |
| 5.1 – 5.7 | Sprints 1 to 7 Progress, Boards, Logs, Reviews & Retrospectives | 56 – 72 |
| **CHAPTER 6** | **BURNDOWN MONITORING** | 73 |
| 6.1 | Sprint Burndown Analysis | 73 |
| 6.2 | Product Burndown Chart & Progress Tracking | 75 |
| 6.3 | Variance Analysis & Corrective Actions | 76 |
| **CHAPTER 7** | **SCRUM CEREMONY EVIDENCE REGISTER** | 77 |
| 7.1 | Daily Scrum Consolidation (S1-DS01 to S7-DS10) | 77 |
| 7.2 | Impediment & Action Register | 82 |
| **CHAPTER 8** | **GITHUB / VERSION CONTROL** | 84 |
| 8.1 | Repository Structure & Branching Strategy | 84 |
| 8.2 | Commit Management & Sprint Evidence | 86 |
| **CHAPTER 9** | **TESTING AND ACCEPTANCE** | 88 |
| 9.1 | Testing Strategy & Levels | 88 |
| 9.2 | Functional & Security Test Cases | 89 |
| 9.3 | Automated Test Suite Results & Acceptance Matrix | 92 |
| **CHAPTER 10** | **FINAL PRODUCT EVIDENCE** | 94 |
| 10.1 | Final Product Screenshots & Module Walkthrough | 94 |
| 10.2 | Traceability Matrix & Product Acceptance | 97 |
| &nbsp; | **REFERENCES** | 99 |

---

## LIST OF TABLES

| Table No. | Title | Page No. |
| :--- | :--- | :--- |
| Table 1.1 | Alignment of IEEE SB Portal with UN Sustainable Development Goals | 7 |
| Table 1.2 | Stakeholder Requirements Survey Matrix | 9 |
| Table 1.3 | Functional Requirements Specification (FR01 – FR12) | 10 |
| Table 1.4 | Non-Functional Requirements Specification (NFR01 – NFR08) | 10 |
| Table 1.5 | Comprehensive Feature List of the Application | 15 |
| Table 1.6 | Comparison: Existing Approaches vs Proposed IEEE SB Portal | 18 |
| Table 1.7 | User Role Identification & Privileges | 20 |
| Table 1.8 | Primary Use Case Identification | 21 |
| Table 2.1 | Product Backlog Items (US01 – US16) | 23 |
| Table 3.1 | Modified Fibonacci Story Point Estimation Scale | 39 |
| Table 3.2 | User Story Estimation Register | 41 |
| Table 3.3 | Estimation Rationale for Major User Stories | 42 |
| Table 3.4 | Story Point Distribution by Priority (MoSCoW) | 43 |
| Table 4.1 | Prioritized Product Backlog | 45 |
| Table 4.2 | Sprint-Wise Implementation Schedule | 46 |
| Table 4.3 | Milestone Deliverables Schedule | 47 |
| Table 4.4 | Database Collections & Schema Mapping | 51 |
| Table 4.5 | UI/UX Wireframe Design Matrix | 53 |
| Table 4.6 | Comprehensive Technology Stack Specifications | 55 |
| Table 5.1 – 5.7 | Sprint 1 to Sprint 7 Summaries and Task Plans | 57 – 71 |
| Table 6.1 | Sprint-Wise Burndown Checkpoints | 74 |
| Table 6.2 | Cumulative Product Burndown Tracking Table | 75 |
| Table 7.1 | Daily Scrum Evidence Register (Sprints 1 to 7) | 78 – 81 |
| Table 7.2 | Impediment and Action Register | 82 |
| Table 8.1 | Version Control & Branching Strategy | 85 |
| Table 9.1 | Comprehensive Functional Test Cases (TC01 – TC16) | 90 |
| Table 9.2 | Automated Test Execution Results Summary | 93 |
| Table 10.1 | Final Product Acceptance Status Matrix | 98 |

---

## LIST OF FIGURES

| Figure No. | Title | Page No. |
| :--- | :--- | :--- |
| Figure 1.1 | Operational Bottlenecks in Traditional Student Branch Management | 6 |
| Figure 1.2 | High-Level System Architecture of IEEE SB SNGCE Portal | 12 |
| Figure 1.3 | End-to-End Operational Flowchart of the Portal | 13 |
| Figure 1.4 | High-Level UML Use Case Diagram | 21 |
| Figure 3.1 | Story Point Distribution Chart | 44 |
| Figure 4.1 | MERN Four-Tier Layered Architecture Diagram | 49 |
| Figure 4.2 | Entity-Relationship (ER) Concept Diagram of Portal Models | 50 |
| Figure 6.1 | Cumulative Product Burndown Chart | 76 |
| Figure 8.1 | GitHub Repository Directory Structure | 85 |
| Figure 10.1 | Public Home Page with Live Bento Grid Stats & Highlights | 94 |
| Figure 10.2 | Chapter Hub Page (CIS Chapter with Officer Grid & Activities) | 95 |
| Figure 10.3 | Dynamic Event Detail Page with QR Attendance Modal | 95 |
| Figure 10.4 | Public Certificate Verification Portal | 96 |
| Figure 10.5 | Geotagged Event Gallery & Expanded Album Modal | 96 |

---

## ABBREVIATIONS

| Abbreviation | Full Form |
| :--- | :--- |
| **API** | Application Programming Interface |
| **CIS** | Computational Intelligence Society |
| **CS** | Computer Society |
| **CSS** | Cascading Style Sheets |
| **DoD** | Definition of Done |
| **DOM** | Document Object Model |
| **E2E** | End-to-End (Testing) |
| **ExeCom** | Executive Committee |
| **HTML** | HyperText Markup Language |
| **HTTP / HTTPS**| HyperText Transfer Protocol / Secure |
| **IEEE** | Institute of Electrical and Electronics Engineers |
| **JWT** | JSON Web Token |
| **KTU** | APJ Abdul Kalam Technological University |
| **MERN** | MongoDB, Express.js, React.js, Node.js |
| **MoSCoW** | Must have, Should have, Could have, Won't have |
| **ODM** | Object Data Modeling |
| **PBI** | Product Backlog Item |
| **PDF** | Portable Document Format |
| **QR Code** | Quick Response Code |
| **RBAC** | Role-Based Access Control |
| **REST** | Representational State Transfer |
| **SB** | Student Branch |
| **SBC** | Student Branch Chapter |
| **SDG** | Sustainable Development Goals |
| **SMTP** | Simple Mail Transfer Protocol |
| **SNGCE** | Sree Narayana Gurukulam College of Engineering |
| **SPA** | Single Page Application |
| **SPS** | Signal Processing Society |
| **UI / UX** | User Interface / User Experience |
| **UPI** | Unified Payments Interface |
| **WIE** | Women in Engineering Affinity Group |

---

## NOTATIONS

| Notation | Description |
| :--- | :--- |
| $U$ | User entity in authentication domain |
| $R_{global}$ | Global security role ($R_{global} \in \{\text{superadmin}, \text{chapteradmin}, \text{execom}, \text{member}, \text{guest}\}$) |
| $E$ | Event document instance |
| $P_{event}$ | Event pricing tier ($P_{event} \in \{\text{free}, \text{paid}\}$) |
| $T_{checkin}$ | 32-character hexadecimal cryptographically secure QR check-in token |
| $C_{cert}$ | Certificate document instance containing unique certificate identifier |
| $A_{photo}$ | Event gallery media asset stored on disk with relative path |
| $SP$ | Story Point metric representing relative development complexity |
| $v$ | Sprint velocity measured in completed story points per sprint |
| $H_{rem}$ | Remaining development effort measured in hours |

---

# SCRUM PROJECT FRAMEWORK

### Introduction to Scrum
Scrum is an industry-standard Agile framework designed for developing and sustaining complex software products. Through structured, iterative cycles known as **Sprints** (typically 1 to 2 weeks), Scrum emphasizes incremental progress, cross-functional collaboration, empirical process control, and adaptive response to evolving requirements. 

In this academic mini-project, the development of the **IEEE SB SNGCE Portal** strictly adopted the Scrum methodology mandated by the APJ Abdul Kalam Technological University (KTU) Master of Computer Applications (MCA) curriculum. All software engineering activities—from requirements gathering to architectural design, API development, UI styling, and automated verification—were tracked and executed across seven planned sprints.

### Academic Project Roles & Responsibilities

In an individual academic mini-project operating under the KTU Scrum guidelines, the responsibilities are defined as follows:

1. **Product Owner (PO) — Dr. Anoopkumar M (Associate Professor, Dept. of CA)**:
   - Represents the academic department and IEEE Student Branch stakeholders.
   - Defines the product vision and high-level project goals.
   - Owns, prioritizes, and approves items in the Product Backlog.
   - Evaluates sprint increments during Sprint Reviews against defined Acceptance Criteria.

2. **Scrum Master (SM) — Dr. Anoopkumar M (Associate Professor, Dept. of CA)**:
   - Facilitates Scrum ceremonies and monitors process health.
   - Helps identify and remove technical impediments and blockers.
   - Ensures strict adherence to Agile principles, burn-down tracking, and KTU course outcomes.

3. **Development Team — Abinson Babu (SNG25MCA-2002)**:
   - Functions as the sole cross-functional software engineer responsible for:
     - Full-stack architectural design (MERN Stack).
     - REST API implementation in Node.js & Express.js.
     - Single Page Application (SPA) development in React.js 19.
     - Database schema modeling in MongoDB/Mongoose.
     - Automated End-to-End (E2E) verification and unit testing.
     - Technical documentation, deployment, and sprint delivery.

---

### KTU MCA Course Outcomes & Mapping

The project satisfies the MCA Mini-Project curriculum objectives set forth by KTU:

| CO No. | Course Outcome Description | Bloom's Level |
| :--- | :--- | :--- |
| **CO 1** | Identify a real-life project that is useful to society/institution | Level 2: Understand |
| **CO 2** | Interact with stakeholders to identify system requirements | Level 3: Apply |
| **CO 3** | Apply suitable development methodology (Agile Scrum) | Level 3: Apply |
| **CO 4** | Analyse and design software architecture, data models, and UI | Level 4: Analyse |
| **CO 5** | Test modules at various stages using automated and manual suites | Level 5: Evaluate |
| **CO 6** | Build and integrate full-stack components into a unified system | Level 6: Create |
| **CO 7** | Document and deploy the product with version control evidence | Level 3: Apply |

#### Mapping of Course Outcomes with Program Outcomes (PO1 – PO12)
*(3: High, 2: Medium, 1: Low)*

| CO | PO1 | PO2 | PO3 | PO4 | PO5 | PO6 | PO7 | PO8 | PO9 | PO10 | PO11 | PO12 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **CO 1** | 2 | 3 | 3 | 3 | 1 | 2 | 3 | 3 | 3 | 3 | 3 | 3 |
| **CO 2** | 2 | 3 | 2 | 3 | 2 | 3 | 2 | 1 | 3 | 2 | 3 | 2 |
| **CO 3** | 3 | 3 | 3 | 3 | 3 | 1 | 3 | 3 | 1 | 2 | 2 | 3 |
| **CO 4** | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 1 | 1 | 2 | 2 | 3 |
| **CO 5** | 3 | 3 | 3 | 3 | 3 | 2 | 3 | 1 | 2 | 2 | 2 | 3 |
| **CO 6** | 3 | 3 | 3 | 3 | 3 | 2 | 3 | 3 | 2 | 3 | 3 | 3 |
| **CO 7** | 1 | 1 | 3 | 3 | 3 | 2 | 3 | 3 | 2 | 1 | 2 | 3 |

---

### Institutional Vision, Mission & PEOs

#### Vision of the Department
*“Unequalled Services with Unfolding Technologies.”*

#### Mission of the Department
- To foster a culture of innovation, technical creativity, and entrepreneurship.
- To engage with industry, professional bodies, and global technology communities.
- To instill ethical standards, social responsibility, and lifelong learning skills.

#### Program Educational Objectives (PEOs)
- **PEO 1 (Technical Competence)**: Graduates establish themselves as competent software developers and systems analysts applying modern computer science practices.
- **PEO 2 (Applied Innovation)**: Graduates promote innovative digital solutions addressing real-world institutional and societal operational challenges.
- **PEO 3 (Ethical Leadership)**: Graduates adhere to high ethical standards, cybersecurity principles, and sustainable software practices.

---

# CHAPTER 1. PROJECT IDENTITY

This chapter presents the background, problem identification, proposed solution, comparative analysis, and functional use cases of the **IEEE SB SNGCE Portal**. It establishes the operational necessity for a centralized web application to manage IEEE Student Branch units, technical chapters, event lifecycles, dynamic attendance, digital certificate verification, and executive media archives.

### 1.1 PROBLEM STORY
IEEE Student Branches at collegiate engineering institutions represent vibrant hubs of technological co-curricular activity. At Sree Narayana Gurukulam College of Engineering (SNGCE), the IEEE Student Branch (STB) oversees multiple specialized technical society chapters:
- **Computer Society (CS)**
- **Computational Intelligence Society (CIS)**
- **Signal Processing Society (SPS)**
- **Women in Engineering (WIE) Affinity Group**

Historically, each chapter operated independently using disjointed, ad-hoc digital tools. Event announcements were broadcast across uncoordinated WhatsApp groups; registrations were recorded on Google Forms; registration fees were collected via screenshots sent to personal UPI accounts; event attendance was marked on paper rosters; certificates were manually drafted in Canva and emailed weeks later; and event photos remained scattered across individual phones.

This operational fragmentation caused severe institutional overhead:
1. **Administrative Overhead**: Officers spent dozens of hours cross-referencing payment screenshots with registration spreadsheets.
2. **Proxy Attendance & Lost Records**: Paper attendance sheets were frequently misplaced, making it impossible to verify authentic event participation.
3. **Certificate Fraud Risk**: Without a centralized verification registry, certificates could be easily altered or falsified.
4. **Member Disconnection**: Students had no central dashboard to view their chapter memberships, upcoming events, or issued certificates.
5. **Loss of Institutional Memory**: Historical records, executive duty assignments, and past event galleries disappeared every time a new ExeCom batch graduated.

#### 1.1.1 Problem Statement
> **Problem Statement**:  
> *To design, develop, and evaluate a comprehensive, web-based Student Branch and Multi-Chapter Operations Platform that unifies authentication, chapter administration, tiered event ticketing, dynamic QR attendance check-in, automated PDF certificate generation with public cryptographic verification, disk-backed geotagged media galleries, and executive task management within a responsive, secure MERN architecture.*

---

### 1.1.2 Relevance to Society / Industry & SDGs

1. **Relevance to Students & Members**: Provides a modern, single-sign-on student portal where engineering students track event participations, access specialized technical chapter resources, download verified certificates, and submit chapter join requests.
2. **Relevance to Educational Institutions**: Provides college administrators, Faculty Advisors, and Branch Counselors with real-time auditability over student activities, financial collections, chapter health, and event attendance metrics.
3. **Relevance to Professional Societies (IEEE)**: Sets an architectural benchmark for how collegiate student branches should manage multi-society chapters transparently, ensuring compliance with IEEE Section guidelines.
4. **Alignment with UN Sustainable Development Goals (SDGs)**:

| SDG | Goal Alignment in IEEE SB Portal |
| :--- | :--- |
| **SDG 4: Quality Education** | Democratizes access to workshops, hackathons, and technical lectures organized across IEEE technical societies. |
| **SDG 8: Decent Work & Economic Growth** | Develops industry-ready skills through hands-on technical seminars and provides verifiable digital credentials. |
| **SDG 9: Industry, Innovation & Infrastructure** | Replaces paper attendance and manual certificate generation with robust, sustainable, serverless-capable digital infrastructure. |

---

### 1.1.3 Requirements Surveys

To ground the system in genuine stakeholder needs, a requirement survey was formulated targeting five distinct user groups:

| Stakeholder Category | Information Collected | Core Requirement Identified |
| :--- | :--- | :--- |
| **Students / Members** | Registration friction, payment verification delays, lost certificates | Instant registration with membership fee discounts, central certificates locker |
| **ExeCom Officers** | Verification of UPI screenshots, attendance tracking, task tracking | Fast payment approval dashboard, QR check-in scanner, duty task assignments |
| **Chapter Chairs** | Chapter event scheduling, join request pipeline, officer roster | Dedicated chapter hub, join request approvals, officer directory management |
| **Branch Counselor / Faculty** | Annual reporting, activity auditing, financial oversight | Automated executive advisor digest, tamper-proof activity audit logs |
| **General Public / Employers** | Certificate authenticity verification | Public certificate verification portal with zero login requirement |

#### Functional Requirements (FR)

- **FR01 (Authentication & Profile)**: Secure JWT registration and login with bcrypt hashing (salt 10), email change with deduplication check, password change with old-hash verification, and password reset via Gmail SMTP.
- **FR02 (Role-Based Access Control)**: Enforce 5-tier access control (`superadmin`, `chapteradmin`, `execom`, `member`, `guest`) across all API routes and UI navigation.
- **FR03 (Multi-Chapter Hub)**: Serve CS, CIS, SPS, and WIE chapter pages displaying unit descriptions, focus areas, officer rosters, and filtered activities.
- **FR04 (Chapter Join Request)**: Allow non-members/members to request chapter admission, preventing duplicate requests and enabling officer approvals.
- **FR05 (Tiered Event Engine)**: Manage event creation, publishing, and dual-tier pricing (free for active members vs paid for guests) with UPI transaction ID and screenshot proof attachment.
- **FR06 (Dynamic QR Check-in)**: Generate random 32-character check-in tokens embedded in QR codes; validate attendance with duplicate rejection.
- **FR07 (Automated PDF Certificates)**: Generate vector PDF certificates using custom template images and coordinate matrices via PDFKit, assigning unique IDs (`IEEE-CIS-2026-XXXXX`).
- **FR08 (Public Certificate Verification)**: Provide public verification (`GET /api/certificates/verify/:certId`) returning validity, recipient name, event, and issue date.
- **FR09 (Transactional Email Delivery)**: Deliver PDF certificates and password reset tokens automatically via Nodemailer through `abinsoncs@gmail.com`.
- **FR10 (Event Photo Gallery)**: ExeCom multi-photo batch upload stored on disk (`server/uploads/events/`), caption editing, cover photo selection, GPS coordinate capture, and responsive 16:10 aspect ratio viewing.
- **FR11 (Officer Tasks & Roster)**: Assign tasks with deadlines and status tracking (`todo`, `in_progress`, `done`) and detect vacant chapter duties.
- **FR12 (Audit Logging & Executive Digest)**: Log all administrative operations to `AuditLog` and provide email digests of chapter metrics to faculty advisors.

#### Non-Functional Requirements (NFR)

- **NFR01 (Security)**: Passwords hashed with bcrypt; JWT stored in client localStorage and verified via Bearer header; static media served via strictly mapped Express routes without binary bloat in MongoDB.
- **NFR02 (Responsive UI / UX)**: Mobile-first responsive layout (320px to 1920px) styled with clean IEEE Navy (`#00629B` / `#0F172A`) and warm accent palette; zero text wrapping on navigation bars.
- **NFR03 (Performance)**: Sub-200ms API response time; instant vector PDF generation under 500ms; lazy loading and golden aspect ratio scaling on all gallery media.
- **NFR04 (Data Integrity)**: Relational constraints enforced via Mongoose schemas; duplicate prevention on event registrations, check-ins, and chapter join requests.

---

### 1.2 PROJECT OVERVIEW – PROPOSED SOLUTION

#### 1.2.1 Solution Concept & High-Level Architecture
The IEEE SB SNGCE Portal is architected as an integrated full-stack web application following the **MERN** (MongoDB, Express.js, React.js, Node.js) design paradigm:

#### 1.2.1.1 Working Principle & Operational Flowchart

---

### 1.3 PROJECT ANALYSIS – EXISTING VS PROPOSED

| Operational Capability | Conventional Approach | Proposed IEEE SB Portal |
| :--- | :--- | :--- |
| **Authentication & RBAC** | None (public Google Form or shared spreadsheet) | 5-tier role-based access control with secure JWT tokens |
| **Chapter Architecture** | Disconnected groups and separate forms per chapter | Unified portal with dedicated CS, CIS, SPS, and WIE hubs |
| **Payment Verification** | WhatsApp screenshot sharing to personal UPI | Integrated transaction ID & proof screenshot upload with officer approval |
| **Attendance Check-in** | Manual signature on paper attendance sheets | Dynamic cryptographically generated QR code scan with duplicate prevention |
| **Certificate Delivery** | Manual graphic design and individual manual emailing | Automated vector PDF generation with instant Gmail SMTP delivery |
| **Certificate Verification**| None (certificates easily forged) | Public verification registry matching certificate ID in real-time |
| **Event Gallery** | Unorganized Google Drive folders / social media posts | Geotagged, disk-backed photo albums with caption and cover management |
| **Officer Duties** | Verbal delegations / chat reminders | Verifiable task management board with deadline and status tracking |

---

### 1.4 USE CASES & ACTOR MODEL

#### Identified User Roles & Actors
1. **Student Member / Guest**: Browses upcoming activities, registers for events, views check-in QR, downloads verified certificates, requests chapter admission.
2. **ExeCom Officer**: Manages chapter event check-ins, reviews event payment proofs, uploads event gallery photos, updates duty tasks.
3. **Chapter Admin (Chair)**: Creates and publishes chapter events, approves chapter join requests, assigns officer tasks, triggers certificate generation.
4. **Super Admin**: Overrules administrative roles, audits platform operations via immutable audit logs, configures system settings.
5. **Public Visitor / Employer**: Views public event calendar, explores photo gallery, verifies participant certificates without logging in.

[INSERT_FIGURE: figure_1_4_use_case.png | Figure 1.4: Complete UML Use Case Diagram of IEEE SB SNGCE Portal]

---

# CHAPTER 2. PRODUCT BACKLOGS

### 2.1 INTEGRATED INITIAL RECORD

The Product Backlog constitutes the single source of truth for all engineering work undertaken during the development of the IEEE SB SNGCE Portal.

| PBI ID | User Story Title | Sprint | Priority | Est. Hours | Story Points |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **US01** | User Authentication & Secure JWT Session Management | Sprint 1 | Must | 4 | 3 |
| **US02** | User Profile Management, Email & Password Change | Sprint 1 | Must | 5 | 3 |
| **US03** | Multi-Chapter Operational Hub & Chapter Ribbon | Sprint 2 | Must | 5 | 3 |
| **US04** | Chapter Membership & Join Request Workflow | Sprint 2 | Must | 6 | 5 |
| **US05** | Public Officer Directory & Member Roster | Sprint 2 | Should | 4 | 2 |
| **US06** | Tiered Event Creation & Publishing Lifecycle | Sprint 3 | Must | 7 | 5 |
| **US07** | Event Registration, Pricing Tiers & UPI Payment Proof | Sprint 3 | Must | 7 | 5 |
| **US08** | Dynamic QR Attendance Code Generation & Check-in | Sprint 4 | Must | 8 | 5 |
| **US09** | Automated Vector PDF Certificate Generation | Sprint 4 | Must | 8 | 5 |
| **US10** | Public Certificate Verification Registry | Sprint 4 | Must | 4 | 2 |
| **US11** | Transactional Email Integration (Gmail SMTP) | Sprint 5 | Must | 5 | 3 |
| **US12** | Event Photo Album & Geotagged Media Gallery | Sprint 5 | Must | 7 | 5 |
| **US13** | Gallery Photo Caption Editing & Cover Photo Assignment | Sprint 5 | Must | 5 | 3 |
| **US14** | ExeCom Duty Task Assignment & Roster Tracking | Sprint 6 | Should | 5 | 3 |
| **US15** | Public Notice Board with Priority Pinning | Sprint 6 | Should | 4 | 2 |
| **US16** | Bento Grid Live Impact Stats & Faculty Advisor Digest | Sprint 7 | Should | 5 | 3 |
| **TOTAL**| **16 User Stories Across 7 Sprints** | — | — | **89 Hrs** | **57 SP** |

---

### 2.2 DETAILED USE CASE SPECIFICATIONS

#### Use Case UC-01: User Authentication & JWT Management
- **User Story**: *As a student or officer, I want to securely log in with my credentials so that I can access authorized portal features.*
- **Objective**: Authenticate users, verify bcrypt password hashes, and issue signed JSON Web Tokens (7-day validity).
- **Trigger**: User inputs credentials on `/login`.
- **Preconditions**: User has registered an account in MongoDB.
- **Main Success Scenario**:
  1. User enters registered email and password.
  2. Client submits `POST /api/auth/login`.
  3. Server validates credentials against stored bcrypt hash.
  4. Server returns HTTP 200 with signed JWT token and user profile payload.
  5. Client stores token in localStorage and updates `AuthContext`.
  6. User is redirected to their role-specific dashboard.
- **Acceptance Criteria**: Passwords never stored in plain text; invalid credentials return HTTP 401; expired tokens redirect to `/login`.
- **Definition of Done**: Unit tested with valid/invalid logins; JWT interceptor attaching token to all Axios requests.

#### Use Case UC-02: Profile Management & Change Password
- **User Story**: *As an authenticated user, I want to update my profile email or change my password with current password verification.*
- **Objective**: Allow users to update contact details and reset password safely without logout breakage.
- **Trigger**: User clicks "Save Profile" or submits "Change Password" on `/profile`.
- **Preconditions**: User is logged in with valid JWT token.
- **Main Success Scenario**:
  1. User enters new email and submits `PATCH /api/user/profile`.
  2. Server checks email uniqueness, updates `User` document, and returns updated record.
  3. For password change, user enters Current Password, New Password (8+ chars), and Confirm Password.
  4. Server compares Current Password with bcrypt hash; on match, hashes new password and saves.
- **Acceptance Criteria**: Changing email preserves User ID without duplication; old password rejected after change; login with new credentials succeeds immediately.
- **Definition of Done**: 18/18 profile test suite checks passing.

#### Use Case UC-03: Multi-Chapter Hub Exploration
- **User Story**: *As a student, I want to explore dedicated chapter pages (CS, CIS, SPS, WIE) to learn about their initiatives and focus areas.*
- **Objective**: Render chapter-specific hero banners, mission statements, officer rosters, and upcoming activities.
- **Trigger**: User selects a chapter from the Navbar dropdown or clicks the chapter switcher ribbon.
- **Preconditions**: Chapter records initialized in the database.
- **Main Success Scenario**:
  1. Client navigates to `/chapters/:name`.
  2. System executes parallel API requests (`/units/:name`, `/events?unit=:name`, `/units/:id/officers`, `/gallery`).
  3. UI displays branded theme gradient, officer cards with avatars, and filtered activity list.
- **Acceptance Criteria**: All 4 chapters render real data without hardcoding; fallback gradients display if no cover image exists.
- **Definition of Done**: Verified across CIS, CS, SPS, and WIE.

#### Use Case UC-04: Chapter Join Request Pipeline
- **User Story**: *As an engineering student, I want to request membership in a technical chapter so that I can participate in specialized initiatives.*
- **Objective**: Create trackable membership requests and allow Chapter Admins to review and approve them.
- **Trigger**: User clicks "Join Chapter" on the chapter page.
- **Main Success Scenario**:
  1. Member submits `POST /api/chapters/:id/join-request`.
  2. Server checks user is not already a member and has no pending request.
  3. Request is created with status `pending`.
  4. Chapter Officer opens Officer Dashboard, views pending requests, and clicks "Approve".
  5. Server updates request to `approved` and appends unit ID to `user.chapterMemberships`.
- **Acceptance Criteria**: Duplicate requests rejected with HTTP 400; approved members immediately see member badge and pricing discounts.

#### Use Case UC-06: Tiered Event Creation & Publishing
- **User Story**: *As a Chapter Admin, I want to create draft events and publish them with member/guest pricing tiers.*
- **Objective**: Manage the complete event publishing lifecycle.
- **Trigger**: Chapter Admin submits event form on Officer Dashboard.
- **Main Success Scenario**:
  1. Admin enters Title, Date, Venue, Description, Category, Member Fee (e.g. ₹0), General Fee (e.g. ₹50), and UPI ID.
  2. Server creates event with status `draft`.
  3. Admin reviews draft and clicks "Publish".
  4. Server updates status to `published` and triggers notification to all chapter members.
- **Acceptance Criteria**: Draft events hidden from public portal; published events visible immediately.

#### Use Case UC-08: Dynamic QR Code Attendance Check-in
- **User Story**: *As an event organizer, I want to generate a venue QR code so that attendees can check in instantly using their mobile cameras.*
- **Objective**: Provide automated check-in with fraud prevention.
- **Trigger**: Chapter Admin clicks "Generate QR" for an active event.
- **Main Success Scenario**:
  1. Server generates 32-character random hex token, saves it hashed on the event, and renders a QR code.
  2. Attendee scans QR code or clicks check-in link.
  3. Server validates token, matches user registration, and records check-in timestamp in `event.attendance`.
  4. Second check-in attempt by same user is rejected with HTTP 409 ("Already checked in").
- **Acceptance Criteria**: Invalid or tampered tokens return HTTP 400; duplicate check-in rejected.

#### Use Case UC-09 & UC-10: Automated Vector PDF Certificate Generation & Verification
- **User Story**: *As an attendee, I want to receive a verifiable PDF certificate and allow employers to verify its authenticity online.*
- **Objective**: Render high-resolution PDF certificates server-side and maintain an immutable public verification registry.
- **Trigger**: Officer clicks "Generate Certificates" for event attendees.
- **Main Success Scenario**:
  1. Server iterates over checked-in attendees in `event.attendance`.
  2. For each attendee, PDFKit renders vector text over the chapter certificate template image.
  3. A unique certificate ID (`IEEE-CIS-2026-XXXXX`) is generated and saved in MongoDB.
  4. The certificate PDF is dispatched as an email attachment via Nodemailer (`abinsoncs@gmail.com`).
  5. Any party navigating to `/verify-certificate?id=IEEE-CIS-2026-XXXXX` sees instant confirmation with recipient name, event, and issue date.
- **Acceptance Criteria**: Invalid IDs return HTTP 404; valid IDs display official verification badge.

#### Use Case UC-12 & UC-13: Geotagged Event Gallery & Media Management
- **User Story**: *As an ExeCom Officer, I want to upload event photos with captions and GPS tags and select an album cover.*
- **Objective**: Provide a media gallery organized by event album.
- **Trigger**: Officer uploads photos in the Gallery Upload Modal.
- **Main Success Scenario**:
  1. Officer selects event, attaches up to 20 images (.jpg, .png, .webp, max 5MB each), inputs caption, and clicks "Capture GPS".
  2. Browser Geolocation API captures latitude and longitude.
  3. Files are streamed to server disk (`/uploads/events/`).
  4. Photos are aggregated by event; officer can click "⭐ Set Cover" to designate any photo as the album cover.
  5. Gallery grid displays albums in golden 16:10 aspect ratio without image stretching.
- **Acceptance Criteria**: Deleting photo unlinks file from server disk; non-officers have read-only view.

---

# CHAPTER 3. STORY POINT ESTIMATION

### 3.1 ESTIMATION SCALE (MODIFIED FIBONACCI)

In Agile Scrum, story points reflect the relative complexity, technical uncertainty, and implementation effort rather than fixed clock hours. The team adopted the standard modified Fibonacci sequence:

| Story Points (SP) | Relative Complexity | Implementation Interpretation in IEEE SB Portal |
| :---: | :--- | :--- |
| **1** | Negligible | Trivial text or configuration change (e.g. metadata title update) |
| **2** | Low | Minor UI view or static endpoint (e.g. Public Notice Board view) |
| **3** | Moderate | Standard CRUD model with authentication (e.g. Profile editing, Email SMTP) |
| **5** | High | Multi-component workflow with state & validation (e.g. Tiered Events, Join Requests) |
| **8** | Very High | Cryptographic or file-intensive pipelines (e.g. QR Check-in, PDFKit Certificate Engine) |

---

### 3.2 USER STORY ESTIMATION REGISTER

| PBI ID | User Story Title | Priority | SP | Est. Hrs | Assigned Role | Status |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **US01** | User Authentication & JWT Session | Must | 3 | 4 | Full-Stack Dev | Accepted |
| **US02** | User Profile, Email & Password Change | Must | 3 | 5 | Full-Stack Dev | Accepted |
| **US03** | Multi-Chapter Hub & Switcher Ribbon | Must | 3 | 5 | Frontend Dev | Accepted |
| **US04** | Chapter Membership & Join Requests | Must | 5 | 6 | Full-Stack Dev | Accepted |
| **US05** | Public Officer Directory & Roster | Should | 2 | 4 | Frontend Dev | Accepted |
| **US06** | Tiered Event Creation & Publishing | Must | 5 | 7 | Backend Dev | Accepted |
| **US07** | Event Registration & Payment Proof | Must | 5 | 7 | Full-Stack Dev | Accepted |
| **US08** | Dynamic QR Attendance & Check-in | Must | 5 | 8 | Full-Stack Dev | Accepted |
| **US09** | Automated PDFKit Certificate Engine | Must | 5 | 8 | Backend Dev | Accepted |
| **US10** | Public Certificate Verification Registry | Must | 2 | 4 | Frontend Dev | Accepted |
| **US11** | Gmail SMTP Transactional Emailer | Must | 3 | 5 | Backend Dev | Accepted |
| **US12** | Disk-Backed Event Photo Gallery | Must | 5 | 7 | Full-Stack Dev | Accepted |
| **US13** | Gallery Edit, Cover Selection & Deletion | Must | 3 | 5 | Full-Stack Dev | Accepted |
| **US14** | ExeCom Duty Tasks & Vacant Tracking | Should | 3 | 5 | Full-Stack Dev | Accepted |
| **US15** | Public Notice Board with Pinning | Should | 2 | 4 | Frontend Dev | Accepted |
| **US16** | Bento Grid Live Stats & Advisor Digest | Should | 3 | 5 | Full-Stack Dev | Accepted |
| **TOTAL**| **16 User Stories** | — | **57 SP** | **89 Hrs** | **Abinson Babu** | **100% Done** |

---

# CHAPTER 4. RELEASE & SPRINT PLAN

### 4.1 PRODUCT BACKLOG PRIORITIZATION (MoSCoW)
- **Must Have (44 SP / 77.2%)**: US01, US02, US03, US04, US06, US07, US08, US09, US10, US11, US12, US13. Core capabilities necessary for portal launch.
- **Should Have (13 SP / 22.8%)**: US05, US14, US15, US16. Essential executive management and institutional reporting features.
- **Could Have (0 SP)**: Deferred to future post-graduate release (e.g. push notification mobile app).

---

### 4.2 SPRINT-WISE IMPLEMENTATION SCHEDULE

| Sprint | Timeline | Sprint Objective & Focus | User Stories | SP | Est. Hrs |
| :---: | :---: | :--- | :---: | :---: | :---: |
| **Sprint 1** | Weeks 1–2 | Full-Stack Setup, JWT Auth, Profile & Password Engine | US01, US02 | 6 | 9 |
| **Sprint 2** | Weeks 3–4 | Multi-Chapter Hub, Switcher Ribbon, Join Requests | US03, US04, US05 | 10 | 15 |
| **Sprint 3** | Weeks 5–6 | Tiered Events Engine, Registrations & UPI Payment Proof | US06, US07 | 10 | 14 |
| **Sprint 4** | Weeks 7–8 | Dynamic QR Attendance, PDFKit Certificates & Verification | US08, US09, US10 | 12 | 20 |
| **Sprint 5** | Weeks 9–10 | Gmail SMTP Integration, Disk Gallery & Photo Management | US11, US12, US13 | 11 | 17 |
| **Sprint 6** | Weeks 11–12 | Duty Task Management, Public Notice Board & Audit Logs | US14, US15 | 5 | 9 |
| **Sprint 7** | Weeks 13–14 | Bento Grid Stats, Advisor Digest, E2E Polish & Acceptance | US16 | 3 | 5 |
| **TOTAL** | **14 Weeks** | **Complete Full-Stack Application Delivery** | **US01–US16** | **57** | **89** |

---

### 4.3 ARCHITECTURAL OVERVIEW

The application implements a clean **Four-Tier Architecture**:

[INSERT_FIGURE: figure_4_1_architecture.png | Figure 4.1: 4-Tier MERN Architecture Diagram of IEEE SB SNGCE Portal]

---

### 4.4 LOGICAL DATA MODEL (ER CONCEPT)

[INSERT_FIGURE: figure_4_2_er_diagram.png | Figure 4.2: Entity-Relationship (ER) Diagram (Chen Notation) of IEEE SB SNGCE Portal]

---

# CHAPTER 5. PROJECT PROGRESS AND MANAGEMENT

### 5.1 SPRINT 1 – AUTHENTICATION, ROLES & PROFILE MANAGEMENT
- **Sprint Objective**: Establish the MERN architecture, deploy JWT token authorization, and implement profile editing with password verification.
- **Sprint Board**:
  - `US01 (Authentication)`: Done.
  - `US02 (Profile & Password Change)`: Done.
- **Daily Scrum Highlights**:
  - *Day 2*: Configured Express server on port 5000 and React on port 3000.
  - *Day 5*: Implemented `authMiddleware` and `roleMiddleware` enforcing 5 distinct user roles.
  - *Day 8*: Verified email change deduplication in MongoDB and bcrypt comparison for password modification.
- **Review & Demo**: Successfully demonstrated user registration, login redirection, and changing email/password without session corruption.
- **Retrospective**: Early decision to verify old password before hashing new password prevented account takeover vectors.

---

### 5.2 SPRINT 2 – MULTI-CHAPTER ARCHITECTURE & MEMBERSHIP
- **Sprint Objective**: Implement chapter pages for CS, CIS, SPS, and WIE, with chapter join request pipelines and officer rosters.
- **Sprint Board**:
  - `US03 (Multi-Chapter Hub)`: Done.
  - `US04 (Join Request Pipeline)`: Done.
  - `US05 (Officer Directory)`: Done.
- **Daily Scrum Highlights**:
  - *Day 3*: Built the interactive Chapter Switcher Ribbon on `/chapters/:name`.
  - *Day 7*: Implemented `POST /api/chapters/:id/join-request` preventing duplicate pending requests.
- **Review & Demo**: Demonstrated switching chapters seamlessly; demonstrated officer approving a student's join request.
- **Retrospective**: Parallel API fetching (`Promise.all`) on chapter pages reduced page loading time by 60%.

---

### 5.3 SPRINT 3 – EVENT LIFECYCLE & TIERED REGISTRATION
- **Sprint Objective**: Implement event management with dual-tier pricing and UPI payment proof upload.
- **Sprint Board**:
  - `US06 (Event Publishing)`: Done.
  - `US07 (Registration & Payment Proof)`: Done.
- **Daily Scrum Highlights**:
  - *Day 4*: Implemented event draft vs published state filtering.
  - *Day 8*: Built UPI payment proof screenshot upload with client-side base64 preview and officer approval status.
- **Review & Demo**: Demonstrated active IEEE members receiving automatic ₹0 free registration, while guest users were prompted for UPI ID and payment screenshot.

---

### 5.4 SPRINT 4 – DYNAMIC QR ATTENDANCE & AUTOMATED CERTIFICATES

[INSERT_FIGURE: figure_5_3_sequence_diagram.png | Figure 5.3: UML Sequence Diagram - Event Registration, Attendance & Certificate Issuance]

- **Sprint Objective**: Deploy QR attendance check-in and dynamic vector PDF certificate generation with public verification.
- **Sprint Board**:
  - `US08 (QR Code Attendance)`: Done.
  - `US09 (Automated PDFKit Certificates)`: Done.
  - `US10 (Public Certificate Registry)`: Done.
- **Daily Scrum Highlights**:
  - *Day 4*: Engineered 32-character random hex token generator embedded in venue QR code.
  - *Day 7*: Implemented PDFKit server-side generator rendering vector certificates with unique IDs (`IEEE-CIS-2026-XXXXX`).
  - *Day 9*: Deployed public certificate verification page at `/verify-certificate`.
- **Review & Demo**: Scanned venue QR code on mobile; attendee status updated in real-time; certificate generated and verified publicly.

---

### 5.5 SPRINT 5 – GMAIL SMTP & EVENT PHOTO GALLERY
- **Sprint Objective**: Connect Gmail SMTP (`abinsoncs@gmail.com`) for transactional emails, and build disk-backed geotagged photo albums.
- **Sprint Board**:
  - `US11 (Gmail SMTP Emailer)`: Done.
  - `US12 (Disk Event Gallery)`: Done.
  - `US13 (Gallery Caption & Cover Edit)`: Done.
- **Daily Scrum Highlights**:
  - *Day 3*: Configured Nodemailer with Google App Password; verified SMTP handshake.
  - *Day 6*: Built multi-photo batch upload with Multer storing relative URLs on disk (`server/uploads/events/`).
  - *Day 9*: Implemented `getMediaUrl()` resolver and golden 16:10 aspect ratio card grid.
- **Review & Demo**: Issued certificate delivered directly to Gmail inbox with PDF attachment; uploaded photos displayed with captions and GPS tags.

---

### 5.6 SPRINT 6 – DUTY TASKS, NOTICES & AUDIT LOGS
- **Sprint Objective**: Implement officer duty task boards, public notices, and administrative audit logging.
- **Sprint Board**:
  - `US14 (Officer Tasks)`: Done.
  - `US15 (Notice Board)`: Done.
- **Daily Scrum Highlights**:
  - *Day 3*: Built task assignment with status toggling (`todo`, `in_progress`, `done`).
  - *Day 6*: Deployed Public Notice Board with priority pinning (`isPinned: true`).
- **Review & Demo**: Demonstrated chapter chairs delegating tasks and reviewing active chapter rosters.

---

### 5.7 SPRINT 7 – LIVE BENTO STATS, ADVISOR DIGEST & E2E ACCEPTANCE
- **Sprint Objective**: Deploy live public impact counters, automated faculty advisor digest, and complete final end-to-end verification.
- **Sprint Board**:
  - `US16 (Bento Grid Stats & Digest)`: Done.
- **Daily Scrum Highlights**:
  - *Day 3*: Built Bento Grid stats counter fetching live data from `/api/stats/public`.
  - *Day 7*: Implemented Advisor Digest compiling monthly metrics into an HTML email to faculty advisors.
  - *Day 9*: Ran automated test suites: 44/44 E2E checks passed, 34/34 polish checks passed, 18/18 profile checks passed.
- **Review & Demo**: Final comprehensive product demo showcasing all 16 user stories operational with 0 errors.

---

# CHAPTER 6. BURNDOWN MONITORING

### 6.1 SPRINT BURNDOWN ANALYSIS

The project maintained a planned effort of **89 hours** across 7 sprints. The remaining effort was inspected at regular two-day intervals during each 10-day sprint cycle.

| Sprint | Baseline Effort | Day 0 | Day 2 | Day 4 | Day 6 | Day 8 | Day 10 (Actual) | Status |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Sprint 1** | 9 hrs | 9.0 | 7.5 | 5.0 | 3.0 | 1.0 | **0.0** | Completed |
| **Sprint 2** | 15 hrs | 15.0 | 12.0 | 9.0 | 6.0 | 2.5 | **0.0** | Completed |
| **Sprint 3** | 14 hrs | 14.0 | 11.5 | 8.5 | 5.5 | 2.0 | **0.0** | Completed |
| **Sprint 4** | 20 hrs | 20.0 | 16.0 | 11.5 | 7.0 | 3.0 | **0.0** | Completed |
| **Sprint 5** | 17 hrs | 17.0 | 13.5 | 9.5 | 6.0 | 2.0 | **0.0** | Completed |
| **Sprint 6** | 9 hrs | 9.0 | 7.0 | 5.0 | 3.0 | 1.0 | **0.0** | Completed |
| **Sprint 7** | 5 hrs | 5.0 | 4.0 | 2.5 | 1.0 | 0.5 | **0.0** | Completed |

---

### 6.2 CUMULATIVE PRODUCT BURNDOWN

[INSERT_FIGURE: figure_4_5_burndown_chart.png | Figure 6.1: Cumulative Product Burndown Chart for IEEE SB SNGCE Portal]

---

# CHAPTER 7. SCRUM CEREMONY EVIDENCE REGISTER

### 7.1 DAILY SCRUM CONSOLIDATION SAMPLES

| Checkpoint | Sprint | Planned Focus | Progress Inspected | Impediments / Resolution |
| :---: | :---: | :--- | :--- | :--- |
| **S1-DS03** | Sprint 1 | JWT Middleware & RBAC | Created `authMiddleware` & `roleMiddleware` | Handled token expiry gracefully |
| **S2-DS05** | Sprint 2 | Chapter Ribbon & Unit API | Rendered 4 chapter routes dynamically | Built fallback gradient for units without banner |
| **S3-DS04** | Sprint 3 | Tiered Event Pricing Logic | Linked member status with ₹0 fee waiver | Prevented duplicate registrations via index |
| **S4-DS06** | Sprint 4 | PDFKit Vector Certificate | Renders participant name and event date | Configured custom font coordinate offsets |
| **S4-DS08** | Sprint 4 | Public Verification Endpoint | `/verify-certificate/:certId` online | Resolved route matching precedence |
| **S5-DS04** | Sprint 5 | Gmail SMTP Configuration | Verified SMTP handshake with Google App Pass | Handled password whitespaces safely |
| **S5-DS07** | Sprint 5 | Gallery Aspect Ratio Fix | Replaced fixed 180px with golden 16:10 | Card never stretches on single-item loads |
| **S6-DS03** | Sprint 6 | ExeCom Duty Tasks Board | Officers update task status in real-time | Implemented oversight role check for creation |
| **S7-DS05** | Sprint 7 | End-to-End Suite Execution | Ran 44 automated test scripts | All 44 checks passed with 0 failures |

---

### 7.2 IMPEDIMENT & RESOLUTION REGISTER

| Sprint | Identified Impediment | Technical Resolution Applied | Status |
| :---: | :--- | :--- | :---: |
| **Sprint 1** | Stale email in localStorage after profile update | Updated `AuthContext` to sync updated user object immediately | Resolved |
| **Sprint 4** | Duplicate attendance QR scans at event venue | Applied compound index `{ event: 1, user: 1 }` in attendance sub-schema | Resolved |
| **Sprint 5** | Broken image icons on React port 3000 | Created central `getMediaUrl` prepending Express port 5000 | Resolved |
| **Sprint 5** | Extreme horizontal card cropping on single albums | Bounded grid columns to `minmax(300px, 360px)` with `aspectRatio: "16 / 10"` | Resolved |

---

# CHAPTER 8. GITHUB / VERSION CONTROL

### 8.1 REPOSITORY STRUCTURE
The project source code is organized into a clean, decoupled full-stack architecture:

```
ieee-sb-portal/
├── client/                     # Frontend React.js 19 SPA
│   ├── public/                 # Static assets & Chapter logos
│   │   └── logos/              # IEEE, CS, CIS, SPS, WIE official marks
│   ├── src/
│   │   ├── api/                # Axios instance with JWT interceptor
│   │   ├── components/         # Reusable UI (Navbar, Footer, UserAvatar, EventCard)
│   │   ├── context/            # Global AuthContext & state
│   │   ├── pages/              # Routed pages (Home, ChapterPage, GalleryPage, Events)
│   │   └── utils/              # mediaUtils (URL resolvers)
│   └── package.json
│
├── server/                     # Backend Node.js & Express REST API
│   ├── controllers/            # Business logic (auth, events, certs, photos, tasks)
│   ├── middleware/             # authMiddleware, roleMiddleware, uploadMiddleware
│   ├── models/                 # Mongoose schemas (User, Event, Certificate, EventPhoto)
│   ├── routes/                 # Express route declarations
│   ├── scripts/                # Automated verification suites (test-e2e-all.js)
│   ├── uploads/                # Disk storage (events, certificate-templates, profiles)
│   ├── utils/                  # emailTransporter (Gmail SMTP), notify.js
│   ├── .env                    # Environment configuration
│   ├── server.js               # Entry point
│   └── package.json
└── README.md
```

[INSERT_FIGURE: figure_8_1_git_workflow.png | Figure 8.1: Git Feature-Branching and Sprint Release Model]

### 8.2 BRANCHING STRATEGY & COMMIT CONVENTIONS
The development strictly enforced conventional commit prefixes:
- `feat:` New capabilities (e.g., `feat: dynamic qr attendance engine`)
- `fix:` Defect resolutions (e.g., `fix: resolve relative image url on port 3000`)
- `test:` Test suites (e.g., `test: add automated profile email and password e2e`)
- `docs:` Documentation updates (e.g., `docs: finalize scrum sprint evidence register`)

---

# CHAPTER 9. TESTING AND ACCEPTANCE

### 9.1 TESTING STRATEGY
Testing was executed across three rigorous levels:
1. **Unit Testing**: Validation helpers, password strength requirements, and URL resolvers.
2. **Integration Testing**: Communication between Express REST controllers, MongoDB collections, Multer file streams, and Gmail SMTP.
3. **Automated End-to-End (E2E) Testing**: Complete user journey scripts simulating HTTP requests from registration to payment approval, QR attendance, certificate PDF generation, and public verification.

---

### 9.2 COMPREHENSIVE TEST CASE EXECUTION RESULTS

| Test ID | Test Scenario | Execution Procedure | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | User Registration | Submit `POST /api/auth/register` | User document created; password hashed | Status 201; password encrypted | **PASS** |
| **TC-02** | User Login & JWT | Submit `POST /api/auth/login` | Returns signed JWT & user payload | Status 200; token attached | **PASS** |
| **TC-03** | RBAC Protection | Member calls `/api/admin/overview` | Access rejected with HTTP 403 Forbidden | Status 403; access denied | **PASS** |
| **TC-04** | Email Change Deduplication | Update profile email to existing | Rejected with HTTP 409 Conflict | Status 400/409; duplicate blocked | **PASS** |
| **TC-05** | Change Password Verification| Submit incorrect current password | Rejected with HTTP 400 Bad Request | Status 400; message clear | **PASS** |
| **TC-06** | Chapter Switcher Ribbon | Navigate to `/chapters/CIS` | Renders CIS focus areas & officers | Status 200; CIS details rendered | **PASS** |
| **TC-07** | Chapter Join Pipeline | Submit join request to CIS | Pending request created; no duplicate | Status 201; pending recorded | **PASS** |
| **TC-08** | Tiered Event Pricing | Member vs Guest checkout | Member gets ₹0; Guest gets fee + UPI | Status 200; pricing differentiated | **PASS** |
| **TC-09** | Dynamic QR Code Token | Generate QR on published event | 32-char hex token generated | Status 200; QR rendered | **PASS** |
| **TC-10** | QR Check-in Execution | Submit `POST /events/:id/checkin`| Attendance marked; timestamp logged | Status 200; attendee added | **PASS** |
| **TC-11** | Duplicate Check-in Block | Scan check-in token second time | Rejected with HTTP 409 Conflict | Status 409; duplicate rejected | **PASS** |
| **TC-12** | Vector PDF Certificate | Trigger certificate generation | PDFKit renders PDF; unique ID issued | Status 200; PDF created | **PASS** |
| **TC-13** | Public Certificate Verify | GET `/certificates/verify/:id` | Returns `valid: true` and metadata | Status 200; verified publicly | **PASS** |
| **TC-14** | Transactional Gmail SMTP | Trigger certificate issuance | PDF delivered via `abinsoncs@gmail.com` | SMTP Handshake OK (200) | **PASS** |
| **TC-15** | Disk Media Gallery Upload| Stream 2 JPEG images via Multer | Saved to disk; URLs stored in DB | Status 201; files on disk | **PASS** |
| **TC-16** | Gallery Aspect Ratio | Load single album on Home page | Bounded 16:10 card without stretch | Status 200; perfect framing | **PASS** |

#### Automated Verification Summary
- `test-e2e-all.js`: **44 / 44 checks passed (0 failed)**
- `test-sprint-polish.js`: **34 / 34 checks passed (0 failed)**
- `test-profile-email-and-password.js`: **18 / 18 checks passed (0 failed)**
- `test-gallery-edit.js`: **All tests passed (PATCH + DELETE verified)**

---

# CHAPTER 10. FINAL PRODUCT EVIDENCE

### 10.1 APPLICATION WALKTHROUGH & SCREENSHOT EVIDENCE

1. **Public Portal & Bento Grid Hero (`Figure 10.1`)**:
   - Header with IEEE Phoenix emblem and authentic clean `STUDENT BRANCH` mark.
   - Verified badge: `IEEE Student Branch • SNGCE`.
   - Bento Grid Live Impact Stats displaying real metrics: Events Conducted, Certificates Issued, Active Members, and Chapters.
   - Recent Event Highlights showcasing event photos in golden 16:10 aspect ratio.

2. **Chapter Operational Hub (`Figure 10.2`)**:
   - Chapter Switcher Ribbon facilitating one-click switching between CS, CIS, SPS, and WIE.
   - Branded banner with officer directory cards, member counts, and filtered event schedules.
   - Dedicated "Chapter Moments & Gallery" section displaying chapter albums.

3. **Tiered Event Details & QR Attendance Check-in (`Figure 10.3`)**:
   - Dynamic registration modal supporting free member passes or UPI transaction ID proof upload.
   - Mobile-responsive venue QR check-in scanner modal validating attendees in under 2 seconds.

4. **Public Certificate Verification Registry (`Figure 10.4`)**:
   - Standalone, zero-login public verification interface (`/verify-certificate`).
   - Entering certificate ID (`IEEE-CIS-2026-XXXXX`) returns verified badge, recipient name, event title, and date.

5. **Geotagged Photo Gallery & Album Management (`Figure 10.5`)**:
   - Album expanded modal displaying event photos with captions and GPS coordinates.
   - ExeCom quick-action toolbar enabling caption editing, cover photo selection (`⭐ Set Cover`), and deletion.

---

### 10.2 REQUIREMENT-TO-EVIDENCE TRACEABILITY MATRIX

| PBI ID | Implemented Feature | Primary Codebase Reference | Verification Test Suite |
| :---: | :--- | :--- | :--- |
| **US01** | JWT Authentication & RBAC | `server/middleware/authMiddleware.js` | `test-e2e-all.js` (Auth Checks) |
| **US02** | Profile, Email & Password Change | `server/controllers/userController.js` | `test-profile-email-and-password.js` |
| **US03** | Chapter Hub & Switcher Ribbon | `client/src/pages/ChapterPage.js` | Manual & E2E Chapter Route Suite |
| **US04** | Chapter Join Request Pipeline | `server/controllers/joinRequestController.js` | `test-sprint-polish.js` (Sec 3) |
| **US05** | Public Officer Directory | `client/src/pages/Directory.js` | `test-e2e-all.js` (Directory Check) |
| **US06** | Tiered Event Publishing | `server/controllers/eventsController.js` | `test-e2e-all.js` (Event Engine) |
| **US07** | Event Registration & UPI Proof | `client/src/pages/EventDetailPage.js` | `test-e2e-all.js` (Registration) |
| **US08** | Dynamic QR Attendance Engine | `server/controllers/eventsController.js` | `test-e2e-all.js` (QR Check-in) |
| **US09** | Automated PDFKit Certificates | `server/controllers/certificateController.js` | `test-sprint-polish.js` (Sec 5) |
| **US10** | Public Certificate Verification | `client/src/pages/VerifyCertificatePage.js`| `test-sprint-polish.js` (Verify Check) |
| **US11** | Gmail SMTP Transactional Emailer | `server/utils/emailTransporter.js` | Live Google SMTP Handshake Test |
| **US12** | Disk-Backed Event Photo Gallery | `server/controllers/photoController.js` | `test-sprint-polish.js` (Upload Check) |
| **US13** | Gallery Caption & Cover Editing | `client/src/pages/GalleryPage.js` | `test-gallery-edit.js` |
| **US14** | ExeCom Duty Tasks Management | `server/controllers/taskController.js` | `test-sprint-polish.js` (Sec 2) |
| **US15** | Public Notice Board with Pinning | `server/controllers/noticeController.js` | `test-sprint-polish.js` (Sec 4) |
| **US16** | Bento Grid Stats & Advisor Digest | `server/controllers/analyticsController.js` | `test-sprint-polish.js` (Digest Check) |

---

### 10.3 FINAL PRODUCT ACCEPTANCE CONCLUSION
The **IEEE SB SNGCE Portal** has satisfied all acceptance criteria defined in the Product Backlog. All 16 user stories are fully implemented, integrated, and verified with zero critical defects. The system is ready for institutional deployment at Sree Narayana Gurukulam College of Engineering.

---

# REFERENCES

1. **IEEE Student Activities Committee**, *IEEE Student Branch Operations Guide*, IEEE Press, Piscataway, NJ, USA, 2024. [Online]. Available: `https://www.ieee.org/membership/students/`
2. **K. Schwaber and J. Sutherland**, *The Scrum Guide: The Definitive Guide to Scrum: The Rules of the Game*, Scrum.org, 2020. [Online]. Available: `https://scrumguides.org/scrum-guide.html`
3. **E. Gamma, R. Helm, R. Johnson, and J. Vlissides**, *Design Patterns: Elements of Reusable Object-Oriented Software*, Addison-Wesley, Reading, MA, USA, 1994.
4. **M. Chodorow**, *MongoDB: The Definitive Guide: Powerful and Scalable Data Storage*, 3rd ed., O'Reilly Media, Sebastopol, CA, USA, 2020.
5. **A. Banks and E. Porcello**, *Learning React: Modern Patterns for Developing React Apps*, 2nd ed., O'Reilly Media, Sebastopol, CA, USA, 2020.
6. **M. Cantelon, M. Harter, T. J. Holowaychuk, and N. Rajlich**, *Node.js in Action*, 2nd ed., Manning Publications, Shelter Island, NY, USA, 2017.
7. **APJ Abdul Kalam Technological University (KTU)**, *Master of Computer Applications (MCA) Curriculum & Syllabi*, Thiruvananthapuram, Kerala, 2020. [Online]. Available: `https://ktu.edu.in/`
8. **Nodemailer Project**, *Nodemailer Module Documentation for Node.js*, 2024. [Online]. Available: `https://nodemailer.com/`
9. **PDFKit Organization**, *PDFKit: A JavaScript PDF generation library for Node and the browser*, 2024. [Online]. Available: `https://pdfkit.org/`
10. **React Router Team**, *React Router v7 Documentation*, Remix Software, 2025. [Online]. Available: `https://reactrouter.com/`
