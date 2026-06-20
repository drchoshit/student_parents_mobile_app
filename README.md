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
