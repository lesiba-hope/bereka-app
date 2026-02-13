# Developer Setup Guide

> **Quick Start**: If you're an experienced developer, jump to [Quick Setup](#quick-setup). For detailed, platform-specific instructions, continue reading.

## Table of Contents

- [Prerequisites](#prerequisites)
  - [Windows](#windows-prerequisites)
  - [macOS](#macos-prerequisites)
  - [Linux](#linux-prerequisites)
- [Quick Setup](#quick-setup)
- [Detailed Setup Steps](#detailed-setup-steps)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository
- **Supabase CLI**: For local development and database management
- **LNbits Account**: For Lightning Network payments (self-hosted or cloud)

### Windows Prerequisites

#### Option 1: Windows with WSL2 (Recommended)

WSL2 provides a full Linux environment and is the recommended approach for development on Windows.

1. **Install WSL2**:
   ```powershell
   # Run in PowerShell as Administrator
   wsl --install
   ```
   Restart your computer after installation.

2. **Install Ubuntu** (or your preferred Linux distribution):
   ```powershell
   wsl --install -d Ubuntu
   ```

3. **Follow the Linux setup instructions** below from within your WSL2 terminal.

#### Option 2: Windows Native

1. **Install Node.js**:
   - Download the Windows installer from [nodejs.org](https://nodejs.org/)
   - Run the installer and follow the setup wizard
   - Verify installation:
     ```cmd
     node --version
     npm --version
     ```

2. **Install Git**:
   - Download from [git-scm.com](https://git-scm.com/download/win)
   - Run the installer (use default settings)
   - Verify installation:
     ```cmd
     git --version
     ```

3. **Install Supabase CLI**:
   
   Using npm (recommended):
   ```cmd
   npm install -g supabase
   ```
   
   Or using Scoop:
   ```cmd
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```
   
   Verify installation:
   ```cmd
   supabase --version
   ```

4. **Install Docker Desktop** (required for Supabase local development):
   - Download from [docker.com](https://www.docker.com/products/docker-desktop/)
   - Run the installer
   - Start Docker Desktop and ensure it's running

### macOS Prerequisites

1. **Install Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js**:
   ```bash
   brew install node
   ```
   
   Verify installation:
   ```bash
   node --version
   npm --version
   ```

3. **Install Git** (usually comes pre-installed on macOS):
   ```bash
   git --version
   ```
   
   If not installed:
   ```bash
   brew install git
   ```

4. **Install Supabase CLI**:
   ```bash
   brew install supabase/tap/supabase
   ```
   
   Verify installation:
   ```bash
   supabase --version
   ```

5. **Install Docker Desktop** (required for Supabase local development):
   ```bash
   brew install --cask docker
   ```
   
   Start Docker Desktop from Applications and ensure it's running.

### Linux Prerequisites

#### Ubuntu/Debian

1. **Update package lists**:
   ```bash
   sudo apt update
   ```

2. **Install Node.js** (using NodeSource):
   ```bash
   # Install Node.js 20 LTS
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
   
   Verify installation:
   ```bash
   node --version
   npm --version
   ```

3. **Install Git**:
   ```bash
   sudo apt install git
   ```

4. **Install Supabase CLI**:
   ```bash
   # Using npm (recommended)
   sudo npm install -g supabase
   ```
   
   Or download the binary:
   ```bash
   curl -fsSL https://github.com/supabase/cli/releases/download/v1.142.2/supabase_1.142.2_linux_amd64.deb -o supabase.deb
   sudo dpkg -i supabase.deb
   rm supabase.deb
   ```
   
   Verify installation:
   ```bash
   supabase --version
   ```

5. **Install Docker**:
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Add your user to the docker group (to run Docker without sudo)
   sudo usermod -aG docker $USER
   
   # Log out and back in for changes to take effect, or run:
   newgrp docker
   ```
   
   Verify installation:
   ```bash
   docker --version
   ```

#### Fedora/RHEL/CentOS

1. **Install Node.js**:
   ```bash
   sudo dnf install nodejs
   ```
   
   Verify installation:
   ```bash
   node --version
   npm --version
   ```

2. **Install Git**:
   ```bash
   sudo dnf install git
   ```

3. **Install Supabase CLI**:
   ```bash
   sudo npm install -g supabase
   ```

4. **Install Docker**:
   ```bash
   sudo dnf install docker
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker $USER
   newgrp docker
   ```

#### Arch Linux

1. **Install Node.js**:
   ```bash
   sudo pacman -S nodejs npm
   ```

2. **Install Git**:
   ```bash
   sudo pacman -S git
   ```

3. **Install Supabase CLI**:
   ```bash
   sudo npm install -g supabase
   ```

4. **Install Docker**:
   ```bash
   sudo pacman -S docker
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker $USER
   newgrp docker
   ```

---

## Quick Setup

For experienced developers familiar with the tech stack:

```bash
# 1. Clone the repository
git clone <repo-url>
cd bereka-app

# 2. Install dependencies
npm install --prefix apps/web

# 3. Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your Supabase credentials

# 4. Start Supabase (Docker must be running)
supabase start
supabase db reset

# 5. Configure Edge Function secrets
supabase secrets set LNBITS_URL=https://your-lnbits.com
supabase secrets set LNBITS_ADMIN_KEY=your-admin-key
supabase secrets set LNBITS_WEBHOOK_SECRET=your-random-secret

# 6. Run the application (in separate terminals)
# Terminal 1:
supabase functions serve

# Terminal 2:
npm run dev

# Visit http://localhost:3000
```

---

## Detailed Setup Steps

### Step 1: Clone the Repository

```bash
# Clone the repository (replace with actual repo URL)
git clone <repo-url>
cd bereka-app
```

### Step 2: Install Dependencies

The project uses npm workspaces with the frontend located in `apps/web`.

```bash
# Install frontend dependencies
npm install --prefix apps/web
```

**Expected output**: You should see npm installing packages without errors.

### Step 3: Environment Configuration

#### 3.1 Get Supabase Credentials

You have two options:

**Option A: Use Local Supabase (Recommended for development)**

If using local Supabase, you'll get your credentials after running `supabase start` in Step 4.

**Option B: Use Supabase Cloud**

1. Go to [supabase.com](https://supabase.com/)
2. Create a new project or use an existing one
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJh...`)

#### 3.2 Configure Frontend Environment

```bash
# Copy the example environment file
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **⚠️ IMPORTANT**: The variable name MUST be `NEXT_PUBLIC_SUPABASE_ANON_KEY`, not `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` or any other variation.

**If using local Supabase**, you'll get these values from running `supabase start` (see Step 4).

### Step 4: Start Supabase

Make sure **Docker is running** before proceeding.

#### 4.1 Start Supabase Services

```bash
supabase start
```

This will:
- Start PostgreSQL, Auth, Storage, and other Supabase services in Docker
- Display connection details including:
  - API URL (use this for `NEXT_PUBLIC_SUPABASE_URL`)
  - Anon key (use this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - Studio URL (database management interface)

**Example output**:
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 4.2 Update Environment Variables (Local Supabase Only)

If you're using local Supabase, update `apps/web/.env.local` with the values from the output:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-output>
```

#### 4.3 Initialize the Database

```bash
supabase db reset
```

This command:
- Applies all database migrations
- Seeds the database with:
  - Platform system account
  - Job categories
  - Other initial data

**Expected output**: You should see migration files being applied successfully.

### Step 5: Configure LNbits

You need an LNbits instance to handle Lightning Network payments.

#### Option A: Use a Cloud LNbits Instance

1. Sign up at [lnbits.com](https://lnbits.com/) or use another hosted provider
2. Get your Admin API key from the User Manager extension
3. Note your LNbits URL

#### Option B: Self-Host LNbits (Advanced)

Follow the [LNbits installation guide](https://github.com/lnbits/lnbits).

#### 5.1 Set LNbits Secrets

Configure Edge Function secrets for LNbits:

```bash
# Required: LNbits connection
supabase secrets set LNBITS_URL=https://your-lnbits-instance.com
supabase secrets set LNBITS_ADMIN_KEY=your-admin-api-key

# Recommended: Webhook verification secret (use a random string)
supabase secrets set LNBITS_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

> **Note**: On Windows without OpenSSL, generate a random 64-character hex string and use that for the webhook secret.

### Step 6: Configure Email (Optional)

Email notifications are optional. If not configured, notifications will be logged to the console.

```bash
# Optional: Email configuration
supabase secrets set RESEND_API_KEY=your-resend-api-key
```

To get a Resend API key:
1. Sign up at [resend.com](https://resend.com/)
2. Create an API key
3. Set the secret as shown above

### Step 7: Verify Secrets

List all configured secrets:

```bash
supabase secrets list
```

You should see:
- `LNBITS_URL`
- `LNBITS_ADMIN_KEY`
- `LNBITS_WEBHOOK_SECRET`
- `RESEND_API_KEY` (if configured)

---

## Running the Application

You need **two terminal windows** to run the full application.

### Terminal 1: Edge Functions

Start the Supabase Edge Functions (Deno runtime):

```bash
supabase functions serve
```

**Expected output**:
```
Serving functions on http://localhost:54321/functions/v1/
```

The Edge Functions will be available at `http://localhost:54321/functions/v1/<function-name>`.

### Terminal 2: Next.js Frontend

Start the Next.js development server:

```bash
npm run dev
```

**Expected output**:
```
▲ Next.js 16.1.6 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.x.x:3000

✓ Ready in 1.2s
```

### Access the Application

Open your browser and navigate to:

**http://localhost:3000**

You should see the Bereka homepage.

### Access Supabase Studio

For database management and debugging:

**http://localhost:54323**

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" or dependency errors

**Solution**: Reinstall dependencies

```bash
# Remove node_modules and package-lock.json
rm -rf apps/web/node_modules apps/web/package-lock.json

# Reinstall
npm install --prefix apps/web
```

#### 2. "Docker is not running"

**Solution**: Start Docker Desktop (Windows/macOS) or the Docker daemon (Linux)

**Windows/macOS**:
- Open Docker Desktop application
- Wait for it to fully start (status should be green)

**Linux**:
```bash
sudo systemctl start docker
```

#### 3. Port already in use

**Solution**: Stop the conflicting service or change ports

```bash
# Check what's using port 3000
# macOS/Linux:
lsof -i :3000

# Windows (PowerShell):
netstat -ano | findstr :3000

# Kill the process or change Next.js port
PORT=3001 npm run dev
```

#### 4. "NEXT_PUBLIC_SUPABASE_ANON_KEY is undefined"

**Solution**: Check your `.env.local` file

1. Ensure the file exists: `apps/web/.env.local`
2. Verify the variable name is exactly: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Restart the development server after making changes

#### 5. Supabase CLI not found

**Solution**: Install or add to PATH

```bash
# Install globally with npm
npm install -g supabase

# Or check if already installed but not in PATH
which supabase  # macOS/Linux
where supabase  # Windows
```

#### 6. Edge Functions failing to start

**Solution**: Check Supabase services are running

```bash
# Check status
supabase status

# Restart if needed
supabase stop
supabase start
```

#### 7. Database migration errors

**Solution**: Reset the database

```bash
supabase db reset --force
```

> **⚠️ Warning**: This will delete all data in your local database.

### Platform-Specific Issues

#### Windows

- **Line ending issues**: Configure Git to handle line endings
  ```bash
  git config --global core.autocrlf true
  ```

- **Path length issues**: Enable long paths
  ```powershell
  # Run as Administrator
  New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
  ```

#### macOS

- **Permission denied errors**: Use `sudo` or fix npm permissions
  ```bash
  # Option 1: Use sudo (not recommended)
  sudo npm install -g supabase
  
  # Option 2: Fix npm permissions (recommended)
  mkdir ~/.npm-global
  npm config set prefix '~/.npm-global'
  echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
  source ~/.zshrc
  ```

#### Linux

- **Docker permission denied**: Add user to docker group
  ```bash
  sudo usermod -aG docker $USER
  newgrp docker
  ```

### Getting Help

If you encounter issues not covered here:

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more detailed troubleshooting
2. Review [API.md](API.md) for API-specific issues
3. Check Supabase logs: `supabase logs`
4. Check Edge Function logs in Terminal 1
5. Check Next.js logs in Terminal 2
6. Open an issue on GitHub with:
   - Your OS and version
   - Node.js version (`node --version`)
   - Supabase CLI version (`supabase --version`)
   - Full error message
   - Steps to reproduce

---

## Next Steps

### Test Your Setup

1. **Create an account**:
   - Go to http://localhost:3000/signup
   - Register a new user
   - Verify you can log in

2. **Check Supabase Studio**:
   - Go to http://localhost:54323
   - Navigate to **Table Editor** → **profiles**
   - Verify your new user profile was created

3. **Test wallet creation**:
   - After signup, check that your LNbits wallet was created
   - Go to **Dashboard** → **Wallet**
   - Generate a test invoice

### Development Workflow

```bash
# Run from project root

# Start local Supabase
npm run supabase:start

# Reset database (apply migrations + seed data)
npm run supabase:reset

# Serve Edge Functions
npm run supabase:functions

# Start frontend (in another terminal)
npm run dev

# Stop Supabase when done
npm run supabase:stop
```

### Learn the Codebase

- **Frontend**: `apps/web/app/` - Next.js App Router pages
- **Components**: `apps/web/components/ui/` - Shadcn UI components
- **Database**: `supabase/migrations/` - Database schema
- **Edge Functions**: `supabase/functions/` - Serverless functions
- **Documentation**: 
  - [README.md](README.md) - Project overview
  - [API.md](API.md) - API reference
  - [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

### Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally
4. Run linter: `npm run lint`
5. Commit and push
6. Open a pull request

---

## Useful Commands

### Project Commands (from root)

```bash
npm run dev                  # Start Next.js dev server
npm run build               # Build for production
npm run lint                # Run ESLint
npm run install:web         # Install web dependencies
```

### Supabase Commands

```bash
supabase start              # Start local Supabase
supabase stop               # Stop local Supabase
supabase status             # Check service status
supabase db reset           # Reset database (migrations + seed)
supabase db push            # Push migrations to remote
supabase functions serve    # Serve Edge Functions locally
supabase functions deploy   # Deploy Edge Functions
supabase secrets list       # List Edge Function secrets
supabase secrets set KEY=VAL # Set Edge Function secret
supabase logs               # View Supabase logs
```

### Docker Commands

```bash
docker ps                   # List running containers
docker stop $(docker ps -q) # Stop all containers
docker system prune         # Clean up Docker resources
```

---

## Additional Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Supabase Documentation**: https://supabase.com/docs
- **LNbits Documentation**: https://github.com/lnbits/lnbits
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Shadcn UI**: https://ui.shadcn.com/

---

**Happy coding! ⚡**
