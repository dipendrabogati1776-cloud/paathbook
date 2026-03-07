# Firebase Setup for Election Pages

## 1) Add Firebase Web App Config
1. Open Firebase Console -> Project Settings -> General.
2. Under "Your apps", create/select a Web app.
3. Copy SDK config values.
4. Paste them into `/assets/firebase-init.js` replacing all `REPLACE_ME`.

## 2) Enable Authentication
1. Firebase Console -> Authentication -> Sign-in method.
2. Enable `Email/Password`.
3. Go to Authentication -> Users and create admin users (email/password).

## 3) Firestore Database
1. Create Firestore in production mode.
2. Create or let app create this document:
   - Collection: `election_results`
   - Document: `current`

## 4) Security Rules (recommended)
Use these Firestore rules to allow public reads and only selected admin emails to write:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /election_results/current {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email in [
          "admin1@example.com",
          "admin2@example.com"
        ];
    }
  }
}
```

Replace admin emails with your real admin addresses.

## 5) URLs
- Public results: `/election`
- Admin update panel: `/admin`
<!-- make this card expandable currently I need to go all the way down to save all the time  -->