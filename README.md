# Keycloak Extension Registry

A community-driven extension registry for Keycloak, similar to HACS for Home Assistant or npm for Node.js.

## Project Structure

```
keycloak-extension-registry/
├── src/                        # SvelteKit App (Frontend + API)
│   ├── lib/
│   │   ├── server/             # Server-only code
│   │   │   ├── db/             # Drizzle ORM (schema, queries)
│   │   │   ├── github.ts       # GitHub OAuth & API
│   │   │   └── session.ts      # JWT session management
│   │   └── shared/             # Shared types (used by API & Frontend)
│   │       └── types.ts        # Manifest types, categories
│   └── routes/
│       ├── api/                # REST API endpoints
│       │   ├── extensions/     # Extension CRUD
│       │   ├── auth/           # GitHub OAuth
│       │   └── webhooks/       # GitHub webhooks
│       ├── extensions/[slug]/  # Extension detail page
│       ├── dashboard/          # User dashboard
│       └── publish/            # Register extension
│
├── builder/                    # Docker Builder Image
│   ├── Dockerfile              # Multi-stage Keycloak build
│   ├── scripts/
│   │   └── extension-manager.sh
│   └── extensions.example.yaml
│
├── drizzle.config.ts           # Database config
├── wrangler.jsonc              # Cloudflare Workers config
└── package.json
```

## How It Works

### For Extension Users

1. **Create `extensions.yaml`**:
   ```yaml
   extensions:
     - name: keycloak-metrics-spi
       version: 5.0.0
     - name: custom-auth
       version: latest
   ```

2. **Build custom Keycloak image**:
   ```bash
   docker build -t my-keycloak ./builder
   ```

3. **Run**:
   ```bash
   docker run my-keycloak start --optimized
   ```

### For Extension Publishers

1. **Add `keycloak-extension.yaml`** to your repo:
   ```yaml
   name: my-extension
   description: My awesome extension
   
   build:
     type: github-release
     assetName: my-extension-{version}.jar
   
   keycloakCompatibility:
     min: 24.0.0
     max: 27.0.0
   ```

2. **Register** at the registry website
3. **Create GitHub releases** - automatically synced!

## Tech Stack

- **Frontend/API**: SvelteKit 5 + Cloudflare Pages
- **Database**: PostgreSQL + Cloudflare Hyperdrive
- **Storage**: Cloudflare R2 (JAR files)
- **Auth**: GitHub OAuth
- **ORM**: Drizzle

## Development

```bash
# Install dependencies
npm install

# Start database
npm run db:start

# Push schema to database
npm run db:push

# Start dev server
npm run dev
```

## Environment Variables

```env
# .env
DATABASE_URL=postgres://user:pass@localhost:5432/registry

# Cloudflare secrets (wrangler secret put)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=
JWT_SECRET=
```

## License

MIT
