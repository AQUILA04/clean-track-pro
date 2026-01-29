# Spécifications : Templates Keycloak Personnalisés - CleanTrack Pro

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Keycloak est la solution d'authentification et de gestion des identités de CleanTrack Pro. Pour offrir une expérience utilisateur cohérente et professionnelle, il est essentiel de personnaliser l'apparence des pages Keycloak (connexion, mot de passe oublié, réinitialisation, etc.) pour qu'elles reflètent l'identité visuelle de la marque CleanTrack Pro.

Ce document définit les spécifications pour créer un thème Keycloak personnalisé qui sera appliqué à tous les écrans d'authentification de la plateforme.

---

## 1. Architecture du Thème Keycloak

Keycloak utilise un système de thèmes basé sur des templates FreeMarker (`.ftl`), des fichiers CSS et des ressources statiques (images, fonts). Le thème personnalisé de CleanTrack Pro sera structuré comme suit :

```
keycloak/themes/cleantrack-pro/
├── login/
│   ├── resources/
│   │   ├── css/
│   │   │   └── styles.css
│   │   ├── img/
│   │   │   └── logo.png
│   │   └── fonts/
│   ├── theme.properties
│   ├── login.ftl
│   ├── login-reset-password.ftl
│   ├── login-update-password.ftl
│   └── error.ftl
└── account/
    └── (optionnel pour le portail de compte utilisateur)
```

---

## 2. Spécifications Visuelles Générales

### 2.1. Identité Visuelle

Le thème doit strictement respecter le design system de CleanTrack Pro défini dans le document `02-design-system-branding.md`.

| Élément | Spécification |
|---|---|
| **Logo** | Logo CleanTrack Pro affiché en haut de toutes les pages d'authentification. Dimensions : 200px de largeur maximale. |
| **Couleur Primaire** | `#1A5AD7` (Bleu Confiance) pour les boutons principaux et les liens. |
| **Couleur de Fond** | Dégradé subtil de `#F0F5FF` (Bleu Ciel) à `#FFFFFF` (Blanc). |
| **Police** | Inter (Google Fonts). Poids : Regular (400), Medium (500), SemiBold (600), Bold (700). |
| **Bordures** | `border-radius: 12px` pour les cartes de formulaire. |
| **Ombres** | Ombre portée pour les cartes : `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1)`. |

---

## 3. Pages à Personnaliser

### 3.1. Page de Connexion (`login.ftl`)

**Correspondance :** Écran AUTH-01

| Élément | Spécification CSS/HTML |
|---|---|
| **Conteneur Principal** | Centré verticalement et horizontalement. Largeur maximale : 450px. Fond blanc avec `border-radius: 12px` et ombre. |
| **Logo** | Affiché en haut du conteneur, centré. |
| **Titre** | "Connexion" ou "Bienvenue", `font-size: 28px`, `font-weight: 700`, `color: #1F2937`. |
| **Champs de Saisie** | Fond `#FFFFFF`, bordure `#D1D5DB`, `border-radius: 8px`, `padding: 12px 16px`. Au focus, bordure `#1A5AD7`. |
| **Bouton de Connexion** | Pleine largeur, `background-color: #1A5AD7`, `color: #FFFFFF`, `border-radius: 8px`, `padding: 14px`, `font-weight: 600`. Effet hover : `background-color: #1548B0`. |
| **Liens Secondaires** | "Mot de passe oublié ?" en `color: #1A5AD7`, `font-size: 14px`, `font-weight: 500`. Positionné sous le bouton. |

---

### 3.2. Page Mot de Passe Oublié (`login-reset-password.ftl`)

**Correspondance :** Écran AUTH-02

| Élément | Spécification CSS/HTML |
|---|---|
| **Mise en Page** | Identique à la page de connexion pour la cohérence. |
| **Titre** | "Mot de passe oublié ?", `font-size: 28px`, `font-weight: 700`. |
| **Texte d'Instruction** | "Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.", `font-size: 16px`, `color: #6B7280`, `margin-bottom: 24px`. |
| **Champ Email** | Identique aux champs de la page de connexion. |
| **Bouton Principal** | "Envoyer le lien", style identique au bouton de connexion. |
| **Lien de Retour** | "Retour à la connexion", `color: #1A5AD7`, positionné sous le bouton. |

---

### 3.3. Page Réinitialisation de Mot de Passe (`login-update-password.ftl`)

**Correspondance :** Écran AUTH-03

| Élément | Spécification CSS/HTML |
|---|---|
| **Titre** | "Réinitialiser le mot de passe", `font-size: 28px`, `font-weight: 700`. |
| **Champs de Saisie** | Deux champs : "Nouveau mot de passe" et "Confirmer le mot de passe". Style identique aux autres champs. |
| **Exigences de Sécurité** | Affichées sous les champs : "Minimum 8 caractères, une majuscule, un chiffre". `font-size: 14px`, `color: #6B7280`. |
| **Bouton Principal** | "Enregistrer le nouveau mot de passe", style identique au bouton de connexion. |

---

### 3.4. Page d'Erreur (`error.ftl`)

**Correspondance :** Écran AUTH-05

| Élément | Spécification CSS/HTML |
|---|---|
| **Type** | Bannière d'erreur affichée en haut de la page. |
| **Style** | `background-color: #EF4444`, `color: #FFFFFF`, `padding: 16px`, `border-radius: 8px`, `margin-bottom: 24px`. |
| **Icône** | Icône de cercle avec un 'X' (Heroicons) à gauche du message. |
| **Message** | Texte clair et concis, `font-size: 16px`, `font-weight: 500`. |

---

## 4. Fichier CSS Principal (`styles.css`)

Le fichier CSS doit contenir toutes les règles pour styliser les éléments des templates Keycloak. Voici la structure de base :

```css
/* Import de la police Inter depuis Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* Variables CSS pour les couleurs du Design System */
:root {
  --color-primary: #1A5AD7;
  --color-primary-hover: #1548B0;
  --color-secondary: #F0F5FF;
  --color-text: #1F2937;
  --color-text-light: #6B7280;
  --color-border: #D1D5DB;
  --color-error: #EF4444;
  --color-white: #FFFFFF;
}

/* Reset et styles de base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(180deg, var(--color-secondary) 0%, var(--color-white) 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* Conteneur principal de la carte de connexion */
.login-pf-page {
  max-width: 450px;
  width: 100%;
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

/* Logo */
.login-pf-page .login-pf-header img {
  max-width: 200px;
  display: block;
  margin: 0 auto 32px;
}

/* Titre */
.login-pf-page h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
  margin-bottom: 24px;
}

/* Champs de saisie */
.login-pf-page input[type="text"],
.login-pf-page input[type="email"],
.login-pf-page input[type="password"] {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  transition: border-color 0.2s;
}

.login-pf-page input[type="text"]:focus,
.login-pf-page input[type="email"]:focus,
.login-pf-page input[type="password"]:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Boutons principaux */
.login-pf-page button[type="submit"],
.login-pf-page .btn-primary {
  width: 100%;
  padding: 14px;
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-pf-page button[type="submit"]:hover,
.login-pf-page .btn-primary:hover {
  background-color: var(--color-primary-hover);
}

/* Liens secondaires */
.login-pf-page a {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.login-pf-page a:hover {
  text-decoration: underline;
}

/* Messages d'erreur */
.alert-error {
  background-color: var(--color-error);
  color: var(--color-white);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 16px;
  font-weight: 500;
}
```

---

## 5. Configuration du Thème (`theme.properties`)

Le fichier `theme.properties` définit les propriétés du thème :

```properties
parent=keycloak
import=common/keycloak

styles=css/styles.css
```

---

## 6. Intégration et Déploiement

### 6.1. Structure du Projet

Le thème personnalisé doit être placé dans le dossier approprié du projet :

```
backend/keycloak/themes/cleantrack-pro/
```

### 6.2. Configuration Docker

Le `docker-compose.yml` doit être configuré pour monter le dossier du thème dans le conteneur Keycloak :

```yaml
keycloak:
  image: quay.io/keycloak/keycloak:latest
  volumes:
    - ./backend/keycloak/themes/cleantrack-pro:/opt/keycloak/themes/cleantrack-pro
  environment:
    - KC_HOSTNAME=localhost
    - KC_HOSTNAME_STRICT=false
    - KEYCLOAK_ADMIN=admin
    - KEYCLOAK_ADMIN_PASSWORD=admin
```

### 6.3. Activation du Thème

Le thème doit être activé dans la configuration du Realm Keycloak :

1. Accéder à l'interface d'administration Keycloak
2. Naviguer vers le Realm concerné
3. Aller dans **Realm Settings** > **Themes**
4. Sélectionner `cleantrack-pro` pour le **Login Theme**
5. Sauvegarder les modifications

---

## 7. Responsive Design

Le thème doit être entièrement responsive pour fonctionner sur tous les appareils (desktop, tablette, mobile). Les règles CSS suivantes doivent être ajoutées :

```css
/* Responsive pour mobile */
@media (max-width: 768px) {
  .login-pf-page {
    padding: 24px;
    max-width: 100%;
  }

  .login-pf-page h1 {
    font-size: 22px;
  }

  .login-pf-page input[type="text"],
  .login-pf-page input[type="email"],
  .login-pf-page input[type="password"] {
    font-size: 15px;
  }

  .login-pf-page button[type="submit"],
  .login-pf-page .btn-primary {
    font-size: 15px;
    padding: 12px;
  }
}
```

---

## 8. Tests et Validation

### 8.1. Tests à Effectuer

- ✅ Vérifier l'affichage sur desktop (Chrome, Firefox, Safari)
- ✅ Vérifier l'affichage sur mobile (iOS Safari, Android Chrome)
- ✅ Tester tous les formulaires (connexion, mot de passe oublié, réinitialisation)
- ✅ Vérifier les messages d'erreur
- ✅ Tester les états hover et focus des éléments interactifs

### 8.2. Critères de Validation

- Le thème respecte à 100% le design system de CleanTrack Pro
- Tous les écrans d'authentification sont cohérents visuellement
- L'expérience utilisateur est fluide et professionnelle
- Le thème est responsive et fonctionne sur tous les appareils

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*
