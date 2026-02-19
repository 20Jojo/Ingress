# Stage 11.5 Smoke Checklist

Use this after `docker compose up -d`, backend `dotnet run`, and frontend `npm run dev`.

1. Open `http://localhost:3000` and confirm top nav appears on every page.
2. Open `http://localhost:3000/ping` and click `Ping API`.
3. Open `http://localhost:3000/auth`, login, and confirm toast + token status update.
4. Open `http://localhost:3000/orgs`, create an org, and confirm success toast.
5. Open org detail and verify members list loads without duplicate key warnings.
6. Open `/orgs/{orgId}/invite`, create invite, and confirm token shown + toast.
7. Open `/orgs/{orgId}/projects`, create project, then open tasks.
8. In tasks page, create task, change status, assign user, and confirm success toasts.
9. Resize to mobile width and verify member/task action areas wrap instead of overflowing.
10. Confirm browser console has no hydration/style/key warnings.
