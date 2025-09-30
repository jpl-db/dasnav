# Security Best Practices

This document outlines how credentials and secrets are managed in this Databricks App.

## ✅ Recommended Approach (What We Use)

### Local Development Authentication

**OAuth U2M (User-to-Machine)** - The recommended approach by Databricks:

1. **Setup**: Run `databricks auth login --profile pm-bootcamp`
2. **Credentials Storage**: Stored in `~/.databrickscfg` (NOT in this repo)
3. **Runtime**: App calls `cfg.authenticate()` to get temporary OAuth tokens
4. **Token Handling**: Tokens are extracted in-memory, never persisted to disk

### What's Safe to Commit

✅ **Safe to commit:**
- `.env.example` - Template with placeholder/public values
- `app.yaml` - Contains SQL Warehouse ID (public infrastructure ID)
- Profile names (e.g., "pm-bootcamp")
- Warehouse IDs (public infrastructure IDs, not secrets)

❌ **NEVER commit:**
- `.env` - Gitignored, may contain sensitive overrides
- `~/.databrickscfg` - Contains OAuth tokens
- Personal Access Tokens (PATs)
- API keys or passwords
- OAuth secrets or client IDs

### File Security Matrix

| File | Status | Contains | Risk Level |
|------|--------|----------|------------|
| `.env` | Gitignored ✅ | SQL Warehouse ID (public) | Low - but gitignored as best practice |
| `.env.example` | Committed ✅ | Template values only | None |
| `~/.databrickscfg` | Not in repo ✅ | OAuth tokens | High - properly secured |
| `app.py` | Committed ✅ | Code only, no secrets | None |
| `.gitignore` | Committed ✅ | Ignore rules | None |

## 🔒 How Authentication Works

### Local Development Flow

```
1. User runs: databricks auth login
   ↓
2. OAuth flow completes, token saved to ~/.databrickscfg
   ↓
3. App reads profile: Config(profile='pm-bootcamp')
   ↓
4. Gets token at runtime: cfg.authenticate()
   ↓
5. Extracts Bearer token from auth header
   ↓
6. Creates SQL connection with token
   ↓
7. Token expires after 1 hour, auto-refreshed by SDK
```

### Deployed App Flow

```
1. Databricks creates service principal for app
   ↓
2. App uses service principal credentials (managed by Databricks)
   ↓
3. Connects to SQL Warehouse using app's identity
   ↓
4. Queries run as the app service principal
```

## 🛡️ Security Guarantees

### What's Protected

1. **No Credentials in Code**: All authentication uses runtime SDK calls
2. **No Credentials in Git**: `.env` is gitignored, `.databrickscfg` never in repo
3. **Temporary Tokens**: OAuth tokens expire and auto-refresh
4. **Least Privilege**: Local dev uses your permissions, deployed app uses service principal
5. **Audit Trail**: All queries audited to your user (local) or service principal (deployed)

### What to Watch For

⚠️ **Never do this:**
```python
# BAD - Don't hardcode tokens
access_token = "dapi1234567890abcdef"

# BAD - Don't commit .env
git add .env
```

✅ **Do this instead:**
```python
# GOOD - Use SDK to get tokens at runtime
cfg = Config(profile='pm-bootcamp')
auth_dict = cfg.authenticate()
token = auth_dict.get('Authorization', '').replace('Bearer ', '')
```

## 📋 Pre-Commit Checklist

Before committing code, verify:

- [ ] `.env` is NOT in `git status`
- [ ] No tokens or secrets in code
- [ ] `.gitignore` includes `.env`
- [ ] Using SDK methods for authentication
- [ ] No `~/.databrickscfg` references in code

## 🔍 Verifying Security

Run these commands to check:

```bash
# Verify .env is gitignored
git status | grep -q ".env" && echo "⚠️  WARNING: .env in git!" || echo "✅ .env ignored"

# Check for accidental tokens in code
git grep -i "dapi\|token.*=" -- "*.py" && echo "⚠️  Possible token found!" || echo "✅ No tokens"

# Verify OAuth is being used
grep -r "Config(profile" . && echo "✅ Using OAuth profile"
```

## 📚 References

- [Databricks Apps Best Practices](https://docs.databricks.com/dev-tools/databricks-apps/best-practices.html)
- [Databricks CLI OAuth](https://docs.databricks.com/dev-tools/cli/authentication.html)
- [Databricks SDK Authentication](https://databricks-sdk-py.readthedocs.io/en/latest/authentication.html)
