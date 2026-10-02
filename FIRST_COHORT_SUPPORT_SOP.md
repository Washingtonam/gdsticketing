# First Cohort Support SOP

## Purpose
This SOP is for the first cohort of GDS Ticketing Academy students. It outlines how the team should respond to new enrollments, payment issues, access approval, and onboarding questions.

## 1. Enrolment flow
- Student visits the public course catalog and selects a course.
- Student registers or logs in.
- Student completes checkout through Paystack.
- Enrollment appears in the system as `pending_payment` until Paystack confirms the payment.
- After confirmation, the record changes to `paid_pending_approval`.

## 2. Admin review actions
- Open the admin payment review page.
- Confirm the student payment appears under `paid_pending_approval`.
- Check the course title, amount, and student email.
- If valid, click `Approve access`.
- After approval, the enrollment status becomes `approved` and the student can open the course portal.

## 3. Support response to payment issues
When the student reports a payment problem:
1. Confirm whether the student is logged in and whether the checkout was initiated.
2. Check the payment review screen for the payment reference.
3. If Paystack status is pending, tell the student to wait a few minutes and refresh the dashboard.
4. If the payment failed, ask the student to retry the checkout and confirm the correct course.
5. If the payment was successful but access is still pending, escalate to admin review.

## 4. Support response to access questions
When the student reports that access is not active:
- confirm whether the enrollment status is still `paid_pending_approval`
- ask the student to wait for admin approval
- tell the student to check the dashboard and email for approval updates
- if access remains blocked after approval, verify the student role and course enrollment record

## 5. Onboarding guidance
After approval, the student should:
- log in to the dashboard
- open the approved course
- start with the first lesson
- complete the quiz and module tasks
- contact support if the course remains blocked

## 6. Required team response times
- Payment review: same day
- Approval response: within 1 business day
- Student support response: within 24 hours for non-urgent issues

## 7. Escalation path
- Payment discrepancies: escalate to admin owner
- Access blocker after approval: escalate to owner/admin review
- Repeated checkout issues: escalate to support + platform owner
