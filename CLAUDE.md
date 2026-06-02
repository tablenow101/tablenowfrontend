# Tablenow Frontend - Mémoire Projet

## Context
Projet **Tablenow Frontend** - Application frontend avec accès à Supabase pour la base de données et Vercel pour le déploiement.

---

## 🔧 Configuration & Infrastructure

### Supabase MCP Integration (2026-06-02)
- **Branch**: `claude/env-secrets-access-0mJTQ`
- **Status**: ✅ Configuré
- Fichier `.mcp.json` : serveur MCP Supabase via npx
- Fichier `.claude/settings.json` : activation du MCP
- **Avantage** : Accès direct aux secrets et données Supabase

### Frontend Stack
- TypeScript
- Vercel deployment avec configuration sécurisée
- gstack for testing/documentation

### Backend & Database
- Supabase avec Vercel architecture
- Email verification system
- Login/authentication flow (à debugger)

---

## 📋 Tâches Complétées/En Cours

### UI/UX
- ✅ Redesign TableNow UI frontend-first (30 avr) → **FAIT**
- ✅ Redesign UI to match mockups (3 mai) → **FAIT**
- ⏳ Review Supabase Vercel architecture (9 mai)

### Backend & Infrastructure  
- ✅ Audit and clean up TableNow backend production environment (28 avr) → **FAIT**
- ✅ Remove legacy routes from TableNow backend (14 mai) → **FAIT**
- ⏳ Fix insecure proxy in vercel.json configuration (27 avr)
- ⏳ Grant GitHub access for code review (24 avr)

### Bug Fixes & Critical Issues
- ⏳ Fix TypeScript build errors in main branch (28 avr)
- ✅ Fix missing verification email on registration (28 avr) → **FAIT**
- ✅ Fix critical security vulnerability in environment (8 mai) → **FAIT**
- ⏳ Debug login issue across frontend and backend (4 mai)

### Features & Setup
- ✅ Add email verification and onboarding pages (7 mai) → **FAIT**
- ✅ Install gstack and update documentation (6 mai) → **FAIT**
- ⏳ General coding session (9 mai)

### Maintenance
- ⏳ Check repo status and resume cleanup work (27 avr)
- ⏳ Review TableNow project history and current state (20 avr)
- ⏳ Core check and result analysis for TableNow (13 mai)

---

## 🚨 Priorités Actuelles
1. **TypeScript build errors** - Bloquer le déploiement
2. **Login debug** - Frontend/backend authentication issue
3. **Proxy security** - vercel.json configuration

## 📌 Notes Importantes
- Doublons supprimés (email verification mentionnée 2x)
- Tâches obsolètes enlevées (historical reviews)
- Architecture : Frontend (Vercel) + Backend (Supabase) + Tests (gstack)
