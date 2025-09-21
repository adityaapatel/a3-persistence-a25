Assignment 3 - Persistence: Express + MongoDB + OAuth  
===  
Aditya Patel  

## Bucket Buddy
This is my updated web app called **Bucket Buddy**. It lets users log in with GitHub, create bucket list items, view them, mark them completed, or delete them. The site uses **Express** for the server, **MongoDB Atlas** for persistent storage, and **Bootstrap** for styling.  

Irt has three main pages:  
- **Login page** (login.html): sign in with GitHub.  
- **Home page** (index.html): form to add new items.  
- **All Items page** (results.tml): shows all your items, both active and completed, with actions.  

Every item is tied to he logged-in GitHub user, so users only see their own bucket list.  

---
## Technical Achievements

**Tech Achievement 1: Express server with MongoDB persistence**  
- I converted the old Node server into an **Express** server.  
- All items are stored in MongoDB Atlas instead of in-emory, so they survive restarts.  
- Each item has `title`, `category`, `priority`, `targetDate`, `addedAt`, and `completed`.  

**Tech Achievement 2: Full CRUD with login protection**  
- Create: Add items via the form on Home.  
- Read: Fetch and display items in tables on the Results page.  
- Update: Mark an item as compleed(moves into the completed table).  
- Delete: Remove an item permanently.  
- All routes are **protected** by login, so only authenticated users can use them.  

**Tech Achievement 3: GitHub OAuth login with Passport.js (extra 10 pts)**  
- Login is handled with **passport-github2**.  
- If the user is new, a record sis made automatically.  
- If the user is returning, their data loads.  
- Navbar updates dynamically to show “Login” or “Logout” depending on session state.  

**Tech Achievement 4: Sessions stored in Mongo**  
- Using `express-session` + `connect-mongo`.  
- This way sessions persist and usesrs stay logged in across refreshes.  

---

## Design / Evaluation Achievements

**Design Achievement 1: Bootstrap styling**  
- I used Bootstrap 5 for everything: navbar, forms, buttons, tables, and cards.  
- Minimal custom CSS, just enough for spacing.  
- Pages look consistent and responsive.  

**Design Achievement 2: Accessibility / W3C tips**  
- All form inputs have `<label>`s.  
- Headingss use proper hierarchy (`h1`, `h2`).  
- Buttons have real text (not just icons).  
- Colors come from Bootstrap, which pass contrast checks.  
- Naxvbar is keyboard-accessible.  
- Meta viewport and meta descriptions added.  

**Design Achievement 3: CRAP principles**  
- **Contrast**: Buttons are bold (primary, success, danger).  
- **Repetition**: Same navbar + fonts across all pages.  
- **Alignment**: Bootsstrap grid keeps forms and tables lined up.  
- **Proximity**: Labels are grouped tighdtly with their inputs.  

---

## Middleware Used
- **express.json()** → parse JSON bodies.  
- **express.static()** → serve static files.  
- **express-session** → session management.  
- **connect-mongo** → store sessiorns in MongoDB.  
- **passport** → auth middleware.  
- **passport-github2** → GitHub OAuth login.  
- **dotenv** → load `.env` secrets.  
- **ensureLoggedIn** (custom) → bl9ock routes if not logged in.  

---

## Lighthouse Scores
I tested in Chrome DevTools:  
- Performance: ~100  
- Best Practices: 95  
- Accessibility: 100  
- SEO: 90 
this passes the assignment requirement (90+ in all four).  

---

## Live Link
https://a3-adityapatel.onrender.com

## Instructions
1. Open the site → you’ll be redirected to the **login page**.  
2. Click “Sign in with GitHub.”  
3. On the Home page, add a new item (title, category, priority, target date).  
4. Go to the All Items page to see your list.  
5. Mark items completed or delete them.  
6. Use the navbar to log out when done.  

## .env Setup
To run locally, create a `.env` file with:  
MONGO_URI=your-mongo-uri
GITHUB_CLIENT_ID=xxxx
GITHUB_CLIENT_SECRET=xxxx
SESSION_SECRET=super-secret