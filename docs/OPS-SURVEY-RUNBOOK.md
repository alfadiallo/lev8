# Survey Operations Runbook

## Quick Reference

| Action | Method |
|--------|--------|
| Manual reminder (one person) | POST `/api/surveys/{surveyId}/remind` with `{ respondent_id: "..." }` |
| Manual reminder (all pending) | POST `/api/surveys/{surveyId}/remind` with `{}` |
| Pause auto-reminders | PATCH `/api/surveys/{surveyId}` with `{ auto_remind: false }` |
| Close survey early | PATCH `/api/surveys/{surveyId}` with `{ status: "closed" }` |
| Re-open a closed survey | PATCH `/api/surveys/{surveyId}` with `{ status: "active" }` |
| Extend deadline | PATCH `/api/surveys/{surveyId}` with `{ deadline: "2026-03-15T23:59:59Z" }` |

## Environment Variables (Production)

| Variable | Required | Default |
|----------|----------|---------|
| `RESEND_API_KEY` | Yes (for real emails) | DEV MODE: logs to console |
| `CRON_SECRET` | Yes | Vercel auto-provisions |
| `SUPABASE_SERVICE_KEY` | Yes | — |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — |
| `EQPQIQ_BASE_URL` | No | `https://eqpqiq.com` |
| `PULSECHECK_FROM_EMAIL` | No | `EQ·PQ·IQ <noreply@eqpqiq.com>` |

## Cron Job

- **Route:** `/api/cron/survey-reminders`
- **Schedule:** Daily at 14:00 UTC (9 AM EST)
- **Config:** `vercel.json` → `crons`
- **Auth:** `Authorization: Bearer $CRON_SECRET` (fails closed if not set)

### Cron Behavior

1. Fetches all surveys where `status = 'active'` AND `auto_remind = true`
2. Skips surveys past their deadline
3. For each survey, finds respondents where:
   - Status is `pending` or `started`
   - `reminder_count < max_reminders`
   - `last_reminded_at` is older than `remind_every_days` (or null)
4. Sends reminder email, updates `reminder_count` and `last_reminded_at`
5. Retries transient failures up to 2 times with exponential backoff

### Monitoring

Check Vercel Function logs for `[cron-reminders]` prefix:
- `[cron-reminders] {...}` — successful run summary (JSON)
- `[cron-reminders] ALERT: N email(s) failed` — partial failure
- `[cron-reminders] FATAL:` — unrecoverable error
- `[cron-reminders] Unauthorized` — CRON_SECRET mismatch

## Survey Lifecycle

```
draft → active → closed → archived
         ↑         |
         └---------┘ (re-open)
```

- Surveys auto-activate when first distributed (if status was `draft`)
- The `auto_close_expired_surveys()` DB function closes surveys past deadline
- Closed surveys reject new submissions (410 Gone)

## Respondent Status

```
pending → started → completed
```

- `pending`: Token created, email sent, not yet opened
- `started`: Respondent opened the form (auto-set on first GET)
- `completed`: All required ratings submitted

## Emergency Procedures

### Stop All Reminders Immediately

```bash
# Disable auto-remind on all active surveys
curl -X PATCH https://eqpqiq.com/api/surveys/{SURVEY_ID} \
  -H "Content-Type: application/json" \
  -d '{"auto_remind": false}'
```

Or disable the cron in `vercel.json` and redeploy.

### Resend a Specific Invitation

```bash
# Remind a specific respondent
curl -X POST https://eqpqiq.com/api/surveys/{SURVEY_ID}/remind \
  -H "Content-Type: application/json" \
  -d '{"respondent_id": "RESPONDENT_UUID"}'
```

### Check Campaign Health

Query the `survey_completion_summary` view for aggregate stats:
- `total_respondents`, `completed_count`, `pending_count`
- Per-group breakdowns: `self_total/completed`, `core_faculty_total/completed`, `teaching_faculty_total/completed`

Query `campaign_respondent_detail` for per-person drill-down:
- `status`, `reminder_count`, `last_reminded_at`
- `total_assigned`, `completed_assigned`, `required_assigned`

## Test Accounts

| Role | Email | Purpose |
|------|-------|---------|
| PD (admin) | `findme@alfadiallo.com` | Campaign management |
| Core Faculty | `alfaomardiallo@gmail.com` | Test core faculty survey flow |
| Teaching Faculty | `hello@sofloem.com` | Test teaching faculty roster flow |
| Resident | `alfa@virtualsim.ai` | Test self-assessment flow |

## Required Migrations

Run in order:
1. `20260216000001_survey_system.sql` — surveys, respondents, assignments, views
2. `20260219000001_survey_campaign_enhancements.sql` — rater_type, guidance_min, enhanced views
3. `20260219000002_evaluation_frameworks.sql` — frameworks, pillars, attributes, framework_ratings
4. `20260219000005_demo_program_class_2026.sql` — demo data
5. `20260219000006_create_test_respondent_accounts.sql` — QA test accounts
