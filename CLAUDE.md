# Tablenow Frontend - Mémoire Projet

## Context
Projet **Tablenow Frontend** - Application frontend avec accès à Supabase pour la base de données.

## Configuration Supabase MCP
- **Date**: 2026-06-02
- **Branch**: `claude/env-secrets-access-0mJTQ`
- **Status**: ✅ Configuré

### MCP Supabase Setup
- Fichier `.mcp.json` créé : définit le serveur MCP Supabase via npx
- Fichier `.claude/settings.json` créé : active le MCP Supabase et tous les serveurs du projet
- **Avantage** : Accès direct aux secrets et données Supabase sans passer par des variables .env

### Outils Disponibles
Une fois configuré, tu peux utiliser les outils MCP Supabase pour :
- Accéder à la base de données Tablenow
- Récupérer/gérer les secrets
- Exécuter des migrations

## Prochaines Étapes
- Tester les outils Supabase MCP en action
- Intégrer l'accès aux secrets dans l'app si nécessaire
- Documenter les credentials utilisables

## Notes
- Les fichiers `.mcp.json` et `.claude/settings.json` sont en `.gitignore` (à vérifier)
- Le MCP est créé par Anthropic (@anthropic-ai/mcp-server-supabase)
