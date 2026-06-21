# Student Parents Mobile App

Mobile family view for Medical Roadmap.

## Run

```bash
npm install
npm run dev
```

## Studycat Sync

The app reads Studycat family reports from:

```env
VITE_STUDYCAT_API_BASE=https://medical-studycat.onrender.com/app-api
VITE_STUDYCAT_PARENT_TOKEN=
```

If the Studycat Render service has `APP_PARENT_TOKEN` set, put the same value in `VITE_STUDYCAT_PARENT_TOKEN`.

Use `?studentId=qtf258` or enter the Studycat student ID on the login screen to link a student.

## Operating Data Sync

The student, parent, and admin screens also read:

```env
VITE_MEDIPENALTY_API_BASE=https://medipenalty.kr/api
VITE_MENTORING_API_BASE=https://mentoring-api-6l1a.onrender.com
VITE_MENTORING_TOKEN=
```

- `medipenalty` is used for live cumulative penalty rows.
- `medical_suite` mentoring requires a bearer token. You can set `VITE_MENTORING_TOKEN` or store it in browser localStorage as `medical-study-mentor-token`.
- The attached Dadaikchan June 2026 lunchbox image is seeded as the default meal plan. Admin Excel upload replaces it in local storage.
- Admin attendance Excel/CSV upload is stored locally and matched by student ID or name.

## Admin

Login with:

- ID: `admin`
- Password: `admin1234`

For student push messages, set Studycat `APP_ADMIN_TOKEN=admin1234` or set this app's `VITE_STUDYCAT_ADMIN_TOKEN` to the same server token.
