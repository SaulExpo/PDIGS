# Pet Management App

A comprehensive Angular application for managing pets, built with Angular 17, Firebase, Bootstrap, FullCalendar, and Google Maps.

## Features

- **User Authentication**: Login and register with Firebase Auth
- **Pet Management**: CRUD operations for pet profiles with modal details
- **Diets**: Manage diets for each pet
- **Diary**: Agenda-like entries for pets with modal views
- **Calendar**: FullCalendar integration showing diary events
- **Map**: Google Maps display of user location area
- **Responsive UI**: Bootstrap-based green theme interface

## Configuration (Environment Variables)

This project uses a local `.env` file to store sensitive keys (Firebase + Google Maps). The build scripts generate a runtime config file (`src/assets/env.js`) from `.env`.

### Setup

1. Copy `.env.example` to `.env`.
2. Fill in your Firebase and Google Maps keys in `.env`.
3. Run:

```bash
npm run generate-env
```

4. Start the app:

```bash
npm start
```

> The `.env` file is ignored by Git (see `.gitignore`). Only `.env.example` is committed.

## Development

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`.

## Build

Run `ng build --configuration=production` to build the project. The build artifacts will be stored in the `dist/` directory.

## Technologies Used

- Angular 17 (Standalone components)
- Firebase (Auth, Firestore)
- Bootstrap 5
- FullCalendar
- Google Maps API
- FontAwesome icons