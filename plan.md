You are my senior full-stack integration engineer.

I already have:
- a frontend project structured in folders/components/pages
- a FastAPI backend with some existing routes
- Supabase as the auth provider and database

Your task is to merge and reorganize the FastAPI backend routing so it matches the frontend structure and feature flow as closely as possible.

MAIN GOAL
Analyze my frontend folder structure first, understand each feature/module/screen, then refactor or create FastAPI routes so the backend API is organized according to the frontend modules.

IMPORTANT CONTEXT
- Frontend is the source of feature structure
- Backend should support the frontend cleanly
- Supabase is used for:
  - authentication
  - database storage
- FastAPI should act as the middleware/orchestration layer
- Do not move business logic to frontend
- Do not bypass Supabase auth/security patterns

WHAT I WANT YOU TO DO

1. Inspect the frontend folder structure carefully
Identify feature modules from folders/files such as:
- auth
- dashboard
- doctor dashboard
- patient dashboard
- medical form
- notes analyzer
- pattern detector
- patient medical id
- collaborative forum
- credentials table
- sidebar/page header/shared UI if relevant

2. Inspect the current FastAPI backend structure
Check existing backend folders/files such as:
- app.py
- routes/
- analyze.py
- cases.py
- patterns.py
- utils/
- llm.py
and any other backend modules

3. Map frontend modules to backend route groups
Create or refactor backend routes so they align with frontend features.

Example philosophy:
- frontend feature/module should have a matching backend router or service group
- endpoints should be feature-based and action-based
- avoid random disconnected route naming

For example, if frontend has:
- dashboard/pattern-detector.tsx
then backend should likely expose something like:
- /api/patterns/detect
- /api/patterns/history
- /api/patterns/{id}

If frontend has:
- dashboard/notes-analyzer.tsx
then backend should likely expose:
- /api/notes/analyze
- /api/notes/history

If frontend has:
- dashboard/medical-id-form.tsx
then backend should likely expose:
- /api/patient/id
- /api/patient/profile
or similar clean structure

4. Reorganize backend into clean route modules
Refactor the backend into a scalable FastAPI structure like:

backend/
  app/
    main.py
    api/
      routes/
        auth.py
        dashboard.py
        patients.py
        doctors.py
        patterns.py
        notes.py
        forum.py
        cases.py
    core/
    services/
    schemas/
    db/
    integrations/
      supabase.py
    utils/

If full migration is too big, do a practical hackathon-friendly structure while keeping it clean.

5. Supabase integration requirements
Use Supabase properly for:
- verifying the logged-in user from JWT/session token
- fetching authenticated user info
- reading/writing data
- respecting role-based access where possible

Authentication rules:
- frontend sends auth token
- FastAPI validates/authenticates using Supabase context or token verification flow
- backend should know current user
- use current user to scope data access

6. Route design rules
Design routes around frontend actions/features, not raw DB table names.

Good:
- /api/me
- /api/dashboard/summary
- /api/patterns/detect
- /api/notes/analyze
- /api/patient/full-profile/{id}
- /api/forum/posts

Bad:
- /get_data
- /fetch_table
- /records_all

7. Preserve working functionality
Do not break already working frontend-backend integrations unless necessary.
If renaming routes, also update the frontend calls/import usage accordingly.

8. Output expectations
I want you to:
- inspect current frontend folders and backend files
- propose the best route mapping
- implement the route merge/refactor
- update imports and wiring
- keep code clean and minimal
- clearly mark assumptions
- keep hackathon speed in mind

DELIVERABLES
Please provide:

1. A frontend-to-backend route mapping table
Format like:
- frontend module/file → backend route(s) → backend service responsibility

2. A recommended backend folder structure

3. Refactored FastAPI router code

4. Updated main FastAPI app wiring
- include_router usage
- prefixes
- tags

5. Supabase auth integration layer
- show how current user is resolved
- show how protected routes work

6. Any frontend API call updates needed so frontend matches backend routes

7. A short summary of what changed and why

SPECIAL INSTRUCTIONS
- First inspect the existing repo structure before generating code
- Reuse existing backend logic where possible
- Do not rewrite everything from scratch unless necessary
- Keep naming consistent with frontend modules
- Prefer clean modular routers
- Use Pydantic models where useful
- Keep code demo-ready and easy to explain

ARCHITECTURE INTENT
Frontend = UI and feature structure
FastAPI = routing, orchestration, feature logic
Supabase = auth + database

FINAL GOAL
By the end, the backend routing should feel like a natural mirror of the frontend product structure, so each frontend feature has a clean corresponding FastAPI API module.

Now inspect my existing project structure and start by:
1. listing the frontend feature modules you detect
2. listing the existing backend routes/modules
3. proposing the best merged route structure
4. then implementing it step by step