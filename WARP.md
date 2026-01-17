# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

- Install dependencies:
  - `npm install`
- Run the development server (auto-restarts on file changes via `nodemon`):
  - `npm start`
- Run the server once without `nodemon` (e.g. for quick manual checks):
  - `node index.js`
- Tests and linting:
  - There are currently **no** npm scripts configured for tests or linting in `package.json`.
  - `npm test` will fail unless test tooling is added.
  - When a test runner is introduced, update this file with the standard test command and how to run a single test.

The server listens on port `3000` and expects a local MongoDB instance at `mongodb://localhost:27017/Publishly` (see `connect.js` and `index.js`).

## Architecture overview

### Entry point and server setup

- `index.js` is the main entry point.
  - Connects to MongoDB using `connectToMongoDB` from `connect.js` against `mongodb://localhost:27017/Publishly`.
  - Configures Express:
    - View engine: EJS (`app.set('view engine', 'ejs')`).
    - Views directory: `./views`.
    - Middleware stack:
      - `express.urlencoded` and `express.json` for body parsing.
      - `cookie-parser` to read cookies.
      - `checkAuthByCookie('token')` from `middleware/auth.js` to attach the authenticated user (if any) to `req.user` on every request.
      - `express.static('./public')` to serve static assets (including uploaded images).
  - Mounts route modules:
    - `/` → `routes/staticRoutes.js`
    - `/user` → `routes/user.js`
    - `/blog` → `routes/blog.js`
  - Starts the HTTP server on port `3000`.

### Data layer (Mongoose models)

- `model/user.js`
  - Defines the `User` schema with fields: `fullName`, `email` (unique), `salt`, `password`, `profileImg`, and `role` (`USER`/`ADMIN`).
  - Uses a `pre('save')` hook to hash the password using Node's `crypto` module and a per-user random salt before persisting.
  - Exposes a static method `matchPasswordAndGenerateToken(email, password)` that:
    - Looks up the user by email.
    - Re-hashes the provided password with the stored salt.
    - Throws if the user is missing or the password does not match.
    - On success, creates and returns a JWT via `createTokenForUser` from `utils/authUtil.js`.
- `model/blog.js`
  - Defines a `Blog` schema with: `title`, `body`, `coverImgURL`, and `createdBy`.
  - `createdBy` is a `ref: 'user'` and is used with `.populate('createdBy', 'fullName')` in queries to render author names in the UI.
  - Timestamps are enabled and used on the home page to sort and display recent posts.

### Authentication and authorization flow

- JWT utilities: `utils/authUtil.js`
  - `createTokenForUser(user)` builds a JWT payload from the user (`_id`, `fullName` as `name`, `profileImg` as `profileImgURL`, and `role`) and signs it with a repository-local secret.
  - `validateToken(token)` verifies a JWT and returns the decoded payload.
- Cookie-based auth middleware: `middleware/auth.js`
  - `checkAuthByCookie(cookieName)` returns middleware that:
    - Reads `req.cookies[cookieName]` (configured with `cookieName = 'token'` in `index.js`).
    - If present, verifies the token with `validateToken` and assigns the decoded payload to `req.user`.
    - If missing or invalid, leaves `req.user` unset and continues.
  - This middleware is applied globally, so all subsequent handlers may rely on `req.user` being set for authenticated users.
- Route-level protection: `middleware/requireAuth.js`
  - `requireAuth` ensures `req.user` exists and otherwise responds with HTTP 401 and a plain-text message.
  - It is used on the blog creation POST route to require sign-in for publishing.
- User routes: `routes/user.js`
  - `POST /user/signup`
    - Creates a new `User` using fields from the form (`fullName`, `email`, `password`).
    - On validation errors, re-renders the signup page with an `error` message.
  - `POST /user/signin`
    - Uses `User.matchPasswordAndGenerateToken` to authenticate.
    - On success, sets a `token` cookie with the JWT and redirects to `/`.
    - On failure, re-renders the signin page with an `error` message.
- Views and `locals.user`
  - `views/partials/nav.ejs` and several pages check `locals.user` to determine whether to show authenticated-only navigation (e.g., "Add Blog", user dropdown, logout) versus sign-in/up links.
  - Because `checkAuthByCookie` runs before route handlers, all EJS templates can safely inspect `locals.user`.

### HTTP routing and views

- Static/landing pages: `routes/staticRoutes.js`
  - `GET /`
    - Loads the six most recent `Blog` entries (sorted by `createdAt` descending) with `createdBy.fullName` populated.
    - Renders `views/home.ejs` with `user` and `blogs`.
  - `GET /signin` and `GET /signUp`
    - Render the signin and signup pages respectively.
  - `GET /logout`
    - Clears the `token` cookie and redirects to `/`.
  - `GET /blog/createBlog`
    - Fetches all blogs and renders `views/blog.ejs` (the blog creation form) with `user` and `blogs`.
  - `GET /blog/:id`
    - Finds a single `Blog` by ID and renders `views/viewBlog.ejs` with `user` and `blog`.
- Blog routes: `routes/blog.js`
  - Uses `multer` with a disk storage engine to handle `coverImgURL` uploads.
    - Files are stored under `./public/uploads` and referenced by filename.
  - `GET /blog/`
    - Fetches all blogs, populates `createdBy.fullName`, and renders `views/card.ejs` to show cards for each blog.
  - `POST /blog/`
    - Protected by `requireAuth`; requires an authenticated `req.user`.
    - Accepts `title`, `body`, and `coverImgURL` (file upload).
    - Validates that all fields are present; otherwise returns HTTP 400.
    - Creates a new `Blog` with `createdBy` set to `req.user._id` and redirects back to `/blog` (avoids duplicate submissions on refresh).

### Templating and front-end structure

- Layout and partials:
  - All major views (`home.ejs`, `blog.ejs`, `card.ejs`, `viewBlog.ejs`, `signUp.ejs`, `signin.ejs`) include:
    - `views/partials/head.ejs` for Bootstrap CSS and meta tags.
    - `views/partials/nav.ejs` for the navigation bar and displaying `locals.user`/`locals.error`.
    - `views/partials/scripts.ejs` for Bootstrap JavaScript.
- Views:
  - `views/home.ejs`
    - Landing page with a hero section, feature cards, and a "Latest Stories" grid using the recent `blogs` list.
  - `views/blog.ejs`
    - Blog creation form with client-side validation and UI enhancements for file selection and character counting.
  - `views/card.ejs`
    - Grid of blog cards with cover image, title, and links to view or delete (delete endpoint is not yet implemented server-side).
  - `views/viewBlog.ejs`
    - Detail view for a single blog post, including a hero banner, scroll progress bar, optional dark theme toggle, and a Markdown-rendered body using the `marked` CDN.
  - `views/signUp.ejs` and `views/signin.ejs`
    - Auth pages with client-side validation and password strength indicator (signup only).

### Static assets and uploads

- Express serves `./public` as static assets.
- Blog cover images uploaded via `multer` are saved into `public/uploads` and referenced by filename in the `Blog` documents.
- The UI uses these images in `home.ejs` and `card.ejs` via the `/uploads/<filename>` path.

### How to extend the application

- Adding a new page backed by a template:
  - Create a new EJS view in `views/` (reusing partials as needed).
  - Add a new route in an existing router under `routes/` or create a new router module and mount it in `index.js`.
- Adding new authenticated features:
  - Reuse the existing auth flow:
    - Ensure the route runs after `checkAuthByCookie('token')`.
    - Apply `requireAuth` to any routes that must be restricted to signed-in users.
  - Use `req.user` in handlers and templates to customize behavior per user.
