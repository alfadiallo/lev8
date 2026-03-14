# Email Templates

All survey-related emails are sent via Resend from **EQ·PQ·IQ \<noreply@eqpqiq.com\>**.

---

## 1. Survey Invitation (Initial Distribution)

**Source:** `app/api/surveys/[surveyId]/distribute/route.ts`
**Subject:** `{Self-Assessment | Resident Evaluation | Survey}: {Survey Title}`

### Body

> **EQ·PQ·IQ {Self-Assessment | Resident Evaluation}**
>
> Hi {Name},
>
> You've been invited to complete: **{Survey Title}**
>
> {Extra context — see table below}
>
> **Deadline:** {Wednesday, March 15, 2026} *(if set)*
>
> **\[Open Survey\]** *(green #40916C button → `/survey/{token}`)*
>
> This link is unique to you. You can save your progress and return at any time.

### Extra Context by Rater Type

| Rater Type | Message |
|---|---|
| **Self (resident)** | Please complete your self-assessment of your Emotional Quotient (EQ), Professionalism Quotient (PQ), and Intellectual Quotient (IQ). Thank you for taking the time to do this — it's extremely valuable! |
| **Core Faculty** | Please rate each resident in the class on their Emotional Quotient (EQ), Professionalism Quotient (PQ), and Intellectual Quotient (IQ). Thank you for taking the time to do this — it's extremely valuable! |
| **Teaching Faculty** | Please rate the residents you've worked with on their Emotional Quotient (EQ), Professionalism Quotient (PQ), and Intellectual Quotient (IQ). We recommend evaluating at least 3 residents you've worked with in the last 60 days. Thank you for taking the time to do this — it's extremely valuable! |

---

## 2. Manual Reminder

**Source:** `app/api/surveys/[surveyId]/remind/route.ts`
**Subject:** `Reminder: {Survey Title}`

### Body

> **Friendly Reminder**
>
> Hi {Name},
>
> This is a reminder to complete: **{Survey Title}**
>
> {Context message — see table below}
>
> **Deadline:** {Wednesday, March 15, 2026} *(red #dc2626, if set)*
>
> **\[Continue Survey\]** *(green #40916C button → `/survey/{token}`)*
>
> Your progress has been saved. Pick up right where you left off.

### Context by Survey Type & Status

| Survey Type | Respondent Status | Message |
|---|---|---|
| Educator Assessment | `started` | You have {N} resident(s) left to rate. |
| Educator Assessment | `pending` | You haven't started yet. It takes about 2-3 minutes per resident. |
| Self-Assessment | `started` | You've started your self-assessment but haven't finished. Your progress is saved. |
| Self-Assessment | `pending` | Please take a few minutes to complete your self-assessment. |
| Other | any | Please complete this survey at your earliest convenience. |

---

## 3. Automated Cron Reminder

**Source:** `app/api/cron/survey-reminders/route.ts`
**Schedule:** Mondays at 9 AM EST (via Vercel Cron)
**Subject:** `Reminder: {Survey Title}`

### Body

> **Reminder: EQ·PQ·IQ Evaluation**
>
> Hi {Name},
>
> This is a friendly reminder to complete your evaluation: **{Survey Title}**
>
> Your input is important for tracking resident development. The survey saves your progress automatically — you can pick up where you left off.
>
> **Deadline:** {Wednesday, March 15, 2026} *(red #dc2626, if set)*
>
> **\[Continue Survey\]** *(blue #2563eb button → `/survey/{token}`)*
>
> This link is unique to you. If you've already completed the survey, please disregard this message.

> **Note:** The cron reminder uses a blue button instead of green, and does not vary the message by rater type or respondent status.

---

## 4. Completion Notification (to Survey Creator)

**Source:** `lib/email/notifications.ts` → `notifySurveyCompletion()`
**Subject:** `[EQ·PQ·IQ] {Respondent Name} completed {Rater Type} — {X}/{Y} responses`

### Body

> **Survey Response Received**
> *{Survey Title}*
>
> **{Respondent Name}** just completed their **{Core Faculty | Teaching Faculty | Self-Assessment}** evaluation.
>
> **{X}** of **{Y}** — responses received ({pct}%) — {N remaining | All complete!}
>
> *(progress bar)*
>
> | Respondent | Status |
> |---|---|
> | Dr. Smith | **Completed** *(green)* |
> | Dr. Jones | **In Progress** *(amber)* |
> | Dr. Lee | Pending *(gray)* |
>
> **\[View Survey Details\]** *(green #40916C button)*
> **\[Send Reminders (N)\]** *(outlined green button, only shown when remaining > 0)*

---

## Non-Survey Emails

These emails are sent from the Elevate platform (lev8.ai), not EQ·PQ·IQ.

### Access Request → Admin Notification

**Source:** `lib/email/notifications.ts` → `notifyAdminOfNewRequest()`
**From:** Elevate \<noreply@lev8.ai\>
**To:** Admin
**Subject:** `[Elevate] New Access Request from {Full Name}`

> **New Access Request** — Someone wants to join Elevate
>
> - **Name:** {Full Name}
> - **Personal Email:** {email}
> - **Institutional Email:** {email, if provided}
> - **Requested Role:** {role}
> - **Reason:** {reason, if provided}
>
> **\[Review Request\]** *(purple #6366f1 button → `/admin/requests?id={id}`)*

---

### Access Request → User Confirmation

**Source:** `lib/email/notifications.ts` → `notifyUserRequestReceived()`
**From:** Elevate \<noreply@lev8.ai\>
**Subject:** `[Elevate] Access Request Received`

> **Request Received**
>
> ✅ Thank you, {First Name}!
>
> We've received your access request for Elevate. Our team will review your application and get back to you within 24 hours.

---

### Access Approved

**Source:** `lib/email/notifications.ts` → `notifyUserApproved()`
**From:** Elevate \<noreply@lev8.ai\>
**Subject:** `🎉 Welcome to Elevate - Your Account is Ready!`

> **🎉 Welcome to Elevate!**
>
> Your account is ready, {First Name}!
>
> Your access request has been approved. Click the button below to set your password and start using Elevate.
>
> **\[Set Your Password\]** *(purple #6366f1 button → password reset link)*

---

### Access Rejected

**Source:** `lib/email/notifications.ts` → `notifyUserRejected()`
**From:** Elevate \<noreply@lev8.ai\>
**Subject:** `[Elevate] Access Request Update`

> **Access Request Update**
>
> Hi {First Name},
>
> Thank you for your interest in Elevate. After reviewing your application, we're unable to approve access at this time.
>
> **Note:** {reason, if provided}
>
> If you believe this was a mistake or have questions, please reach out to us.

---

### Demo Visitor Notification (Pulse Check)

**Source:** `lib/email/notifications.ts` → `notifyDemoVisitor()`
**From:** EQ·PQ·IQ \<noreply@eqpqiq.com\>
**To:** Admin (DEMO_NOTIFICATION_EMAIL)
**Subject:** `[EQ·PQ·IQ] {🔄 Returning | 🆕 New} Demo Visitor{: email}`

> **📊 EQ·PQ·IQ Demo Access** — {timestamp}
>
> \[New Visitor / Returning Visitor badge\]
>
> - **Email:** {email, if provided}
> - **IP Address:** {ip}
> - **Visitor ID:** {id}

---

### EQ·PQ·IQ Website Visitor Notification

**Source:** `lib/email/notifications.ts` → `notifyEqpqiqVisitor()`
**From:** EQ·PQ·IQ \<noreply@eqpqiq.com\>
**To:** hello@eqpqiq.com
**Subject:** `EQPQIQ.com site visitor`

> **EQPQIQ.com Visitor** — {timestamp}
>
> \[New Visitor / Returning Visitor badge\]
>
> - **Email:** {email}
> - **Page Visited:** {Landing Page | Interview Assessment | Pulse Check}
> - **IP Address:** {ip}
> - **Total Visits:** {count, if returning}
> - **User Agent:** {ua}
> - **Visitor ID:** {id}

---

### Studio Creator Request

**Source:** `lib/email/notifications.ts` → `notifyStudioCreatorRequest()`
**From:** Elevate \<noreply@lev8.ai\>
**To:** findme@alfadiallo.com
**Subject:** `lev8 Studio creator access`

> **✨ New Studio Creator Request** — Someone wants to create content in Studio
>
> - **Display Name:** {name}
> - **Email:** {email}
> - **Affiliation:** {affiliation}
> - **Specialty:** {specialty, if provided}
> - **Bio:** {bio, if provided}
>
> Log in to the admin panel to approve or reject this request.
