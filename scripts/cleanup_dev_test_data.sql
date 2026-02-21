-- Removes accumulated Stage14/E2E test data from the dev database.
-- Safe to run multiple times.

BEGIN;

WITH target_users AS (
    SELECT u."Id" AS id, lower(u.email) AS email
    FROM users u
    WHERE lower(u.email) LIKE 'stage14-%@test.com'
       OR lower(u.email) LIKE 'owner-%@test.com'
       OR lower(u.email) LIKE 'member-%@test.com'
),
target_orgs AS (
    SELECT o."Id" AS id
    FROM organizations o
    WHERE o.name LIKE 'Stage14 %'
       OR o.name LIKE 'Org-%'
    UNION
    SELECT om.organization_id
    FROM org_members om
    WHERE om.user_id IN (SELECT id FROM target_users)
)
DELETE FROM tasks t
WHERE t.project_id IN (
    SELECT p."Id"
    FROM projects p
    WHERE p.organization_id IN (SELECT id FROM target_orgs)
);

WITH target_users AS (
    SELECT u."Id" AS id, lower(u.email) AS email
    FROM users u
    WHERE lower(u.email) LIKE 'stage14-%@test.com'
       OR lower(u.email) LIKE 'owner-%@test.com'
       OR lower(u.email) LIKE 'member-%@test.com'
),
target_orgs AS (
    SELECT o."Id" AS id
    FROM organizations o
    WHERE o.name LIKE 'Stage14 %'
       OR o.name LIKE 'Org-%'
    UNION
    SELECT om.organization_id
    FROM org_members om
    WHERE om.user_id IN (SELECT id FROM target_users)
)
DELETE FROM projects p
WHERE p.organization_id IN (SELECT id FROM target_orgs);

WITH target_users AS (
    SELECT u."Id" AS id, lower(u.email) AS email
    FROM users u
    WHERE lower(u.email) LIKE 'stage14-%@test.com'
       OR lower(u.email) LIKE 'owner-%@test.com'
       OR lower(u.email) LIKE 'member-%@test.com'
),
target_orgs AS (
    SELECT o."Id" AS id
    FROM organizations o
    WHERE o.name LIKE 'Stage14 %'
       OR o.name LIKE 'Org-%'
    UNION
    SELECT om.organization_id
    FROM org_members om
    WHERE om.user_id IN (SELECT id FROM target_users)
)
DELETE FROM org_invitations oi
WHERE oi.organization_id IN (SELECT id FROM target_orgs)
   OR lower(oi.email) IN (SELECT email FROM target_users);

WITH target_users AS (
    SELECT u."Id" AS id
    FROM users u
    WHERE lower(u.email) LIKE 'stage14-%@test.com'
       OR lower(u.email) LIKE 'owner-%@test.com'
       OR lower(u.email) LIKE 'member-%@test.com'
),
target_orgs AS (
    SELECT o."Id" AS id
    FROM organizations o
    WHERE o.name LIKE 'Stage14 %'
       OR o.name LIKE 'Org-%'
    UNION
    SELECT om.organization_id
    FROM org_members om
    WHERE om.user_id IN (SELECT id FROM target_users)
)
DELETE FROM org_member_audit a
WHERE a.organization_id IN (SELECT id FROM target_orgs)
   OR a.actor_user_id IN (SELECT id FROM target_users)
   OR a.target_user_id IN (SELECT id FROM target_users);

WITH target_users AS (
    SELECT u."Id" AS id
    FROM users u
    WHERE lower(u.email) LIKE 'stage14-%@test.com'
       OR lower(u.email) LIKE 'owner-%@test.com'
       OR lower(u.email) LIKE 'member-%@test.com'
),
target_orgs AS (
    SELECT o."Id" AS id
    FROM organizations o
    WHERE o.name LIKE 'Stage14 %'
       OR o.name LIKE 'Org-%'
    UNION
    SELECT om.organization_id
    FROM org_members om
    WHERE om.user_id IN (SELECT id FROM target_users)
)
DELETE FROM org_members om
WHERE om.organization_id IN (SELECT id FROM target_orgs)
   OR om.user_id IN (SELECT id FROM target_users);

WITH target_users AS (
    SELECT u."Id" AS id
    FROM users u
    WHERE lower(u.email) LIKE 'stage14-%@test.com'
       OR lower(u.email) LIKE 'owner-%@test.com'
       OR lower(u.email) LIKE 'member-%@test.com'
)
DELETE FROM refresh_tokens rt
WHERE rt.user_id IN (SELECT id FROM target_users);

WITH target_users AS (
    SELECT u."Id" AS id
    FROM users u
    WHERE lower(u.email) LIKE 'stage14-%@test.com'
       OR lower(u.email) LIKE 'owner-%@test.com'
       OR lower(u.email) LIKE 'member-%@test.com'
),
target_orgs AS (
    SELECT o."Id" AS id
    FROM organizations o
    WHERE o.name LIKE 'Stage14 %'
       OR o.name LIKE 'Org-%'
    UNION
    SELECT om.organization_id
    FROM org_members om
    WHERE om.user_id IN (SELECT id FROM target_users)
)
DELETE FROM organizations o
WHERE o."Id" IN (SELECT id FROM target_orgs);

DELETE FROM users u
WHERE lower(u.email) LIKE 'stage14-%@test.com'
   OR lower(u.email) LIKE 'owner-%@test.com'
   OR lower(u.email) LIKE 'member-%@test.com';

COMMIT;
