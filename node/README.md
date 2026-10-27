# Server configuration

The server reads its environment variables from `node/.env`. Set
`ACCESS_TOKEN_SECRET`, `DATABASE_URI`, and `PORT` as usual. Admin login also
requires `ADMIN_CODE_HASH`, which must contain a bcrypt hash of the admin code,
not the code itself. Generate the hash in a trusted environment with the
installed `bcrypt` package, then store only the resulting hash in `node/.env`.

Admin codes are checked by `POST /api/auth/admin/login`. Failed attempts are
limited per client address to five per 15-minute window. Successful admin
tokens expire after one hour. Existing MongoDB user records are not deleted or
changed by this login flow; old database `Admin` role values do not grant
administrative access. Signing in through the regular ID flow grants only the
`User` role and retains the account's existing balance and account type.
