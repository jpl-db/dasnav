# Development Workflow: Lovable + Databricks Backend

## 🎨 Two-Repo Strategy

### Repositories:
- **`uc-glimpse`** (https://github.com/jpl-db/uc-glimpse) → Lovable manages this
- **`dasnav`** (https://github.com/jpl-db/dasnav) → You manage this (integrated app)

### Why separate?
✅ Lovable can auto-commit without conflicts  
✅ Backend development stays clean  
✅ You control when to sync UI updates  
✅ No risk of overwriting each other's work  

---

## 📋 Step-by-Step Workflow

### Phase 1: UI Development in Lovable

1. **Open Lovable** and work on `uc-glimpse`
2. **Give Lovable the API spec**:
   - Copy/paste from `LOVABLE_API_SPEC.md`
   - Ask Lovable to create the API client and hooks
3. **Let Lovable auto-commit** to `uc-glimpse` repo
4. **Test the UI** using Lovable's preview

### Phase 2: Sync to dasnav

When you're ready to test with the real backend:

```bash
cd ~/code/dasnav
./import_lovable.sh https://github.com/jpl-db/uc-glimpse.git
```

This will:
- Pull latest from `uc-glimpse`
- Copy into `dasnav/frontend/`
- Keep your API integration files

### Phase 3: Test Full Stack

```bash
cd ~/code/dasnav
./run_local.sh
```

- Backend: http://localhost:8001
- Frontend: http://localhost:8080

### Phase 4: Deploy

```bash
git add frontend/
git commit -m "Update UI from Lovable"
git push
```

Then deploy via Databricks UI (linked to `dasnav` repo).

---

## 🔄 Quick Reference

| Task | Where to Work | Command |
|------|--------------|---------|
| Change UI/UX | Lovable (`uc-glimpse`) | Use Lovable's editor |
| Change Backend | Cursor (`dasnav/backend/`) | Edit files directly |
| Sync UI to Backend | Terminal | `./import_lovable.sh <url>` |
| Test Locally | Terminal | `./run_local.sh` |
| Deploy | Databricks UI | Click "Deploy" |

---

## ⚠️ Important Notes

### DO:
✅ Work on UI in Lovable  
✅ Give Lovable the API spec from `LOVABLE_API_SPEC.md`  
✅ Let Lovable commit to `uc-glimpse`  
✅ Use `import_lovable.sh` to sync  

### DON'T:
❌ Edit `dasnav/frontend/` directly for UI changes  
❌ Manually sync files (use the script)  
❌ Push `uc-glimpse` changes to `dasnav` manually  
❌ Let Lovable know about `dasnav` repo  

---

## 🆘 Troubleshooting

**Q: I made changes in Lovable, now what?**  
A: Run `./import_lovable.sh https://github.com/jpl-db/uc-glimpse.git` to pull them in.

**Q: I edited `dasnav/frontend/` directly, will I lose changes?**  
A: Yes, when you re-import from Lovable. Make UI changes in Lovable only.

**Q: Can I edit the API client code?**  
A: Yes! The integration files (`databricksApi.ts`, `useDatabricks.ts`) stay in `dasnav/frontend/` and won't be overwritten. But it's better to have Lovable generate them.

**Q: How do I tell Lovable what the backend looks like?**  
A: Copy the entire `LOVABLE_API_SPEC.md` file and paste it into Lovable as a prompt.

---

## 🎯 Best Practice

1. **Iterate in Lovable** until the UI looks good
2. **Give Lovable the API spec** early so it generates compatible code
3. **Import to dasnav** when you want to test with real data
4. **Deploy from dasnav** when ready for production

This keeps your workflow clean and prevents conflicts! 🚀
