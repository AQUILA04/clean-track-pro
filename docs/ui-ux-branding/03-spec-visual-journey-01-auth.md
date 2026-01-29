# Spécifications Visuelles : Parcours 1 - Authentification

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document détaille les spécifications visuelles pour les écrans du parcours d'authentification (AUTH), commun à tous les rôles sur les plateformes web et mobile. L'objectif est de créer une expérience de connexion sécurisée, moderne et cohérente avec la marque CleanTrack Pro, en personnalisant l'interface Keycloak.

---

## Écran AUTH-01 : Page de Connexion

**Objectif :** Permettre à l'utilisateur de s'identifier de manière simple et rapide.

| Élément | Spécification Visuelle (Web & Mobile) |
|---|---|
| **Mise en Page** | Centrée verticalement et horizontalement. Sur mobile, le formulaire occupe la largeur de l'écran avec des marges. Sur le web, c'est une carte centrée sur un fond sobre. |
| **Arrière-plan** | Un dégradé subtil de `Bleu Ciel` (#F0F5FF) à `Blanc` (#FFFFFF) ou une image de fond professionnelle et épurée en rapport avec le pressing. |
| **Carte de Connexion** | Fond `Blanc`, `border-radius: 12px`, ombre marquée pour un effet flottant. `padding: 32px`. |
| **Logo** | Logo CleanTrack Pro proéminent en haut de la carte. |
| **Titre** | "Connexion" ou "Bienvenue", `Inter Bold`, 28px. |
| **Champs de Saisie** | Deux champs : "Adresse e-mail" et "Mot de passe". Conformes au Design System (bordure `Gris Clair`, focus `Bleu Confiance`). |
| **Bouton Principal** | "Se Connecter", pleine largeur, fond `Bleu Confiance`, texte `Blanc`. |
| **Liens Secondaires** | "Mot de passe oublié ?" et "Créer un compte" (pour les clients) sous le bouton principal. Texte en `Bleu Confiance`, `Inter Medium`. |

---

## Écran AUTH-02 : Mot de Passe Oublié

**Objectif :** Permettre à l'utilisateur de démarrer le processus de récupération de son mot de passe.

| Élément | Spécification Visuelle (Web & Mobile) |
|---|---|
| **Mise en Page** | Identique à AUTH-01 pour la cohérence. La carte contient un nouveau formulaire. |
| **Titre** | "Mot de passe oublié ?", `Inter Bold`, 28px. |
| **Texte d'Instruction** | "Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.", `Inter Regular`, 16px, `Gris Foncé`. |
| **Champ de Saisie** | Un seul champ : "Adresse e-mail". |
| **Bouton Principal** | "Envoyer le lien", pleine largeur, fond `Bleu Confiance`. |
| **Lien de Retour** | "Retour à la connexion", sous le bouton, en `Bleu Confiance`. |

---

## Écran AUTH-03 : Réinitialisation de Mot de Passe

**Objectif :** Permettre à l'utilisateur de définir un nouveau mot de passe sécurisé.

| Élément | Spécification Visuelle (Web & Mobile) |
|---|---|
| **Mise en Page** | Identique à AUTH-01. |
| **Titre** | "Réinitialiser le mot de passe", `Inter Bold`, 28px. |
| **Champs de Saisie** | Deux champs : "Nouveau mot de passe" et "Confirmer le mot de passe". Avec des exigences de sécurité visibles (ex: 8 caractères, une majuscule, etc.). |
| **Bouton Principal** | "Enregistrer le nouveau mot de passe", pleine largeur, fond `Bleu Confiance`. |

---

## Écran AUTH-04 : Changement de Mot de Passe (dans l'application)

**Objectif :** Permettre à un utilisateur connecté de changer son mot de passe.

| Élément | Spécification Visuelle (Web & Mobile) |
|---|---|
| **Mise en Page** | Intégré dans la section "Profil" ou "Paramètres" de l'application. Ce n'est pas un écran pleine page. C'est une section ou une modale. |
| **Titre de Section** | "Changer de mot de passe", `Inter Bold`, 22px. |
| **Champs de Saisie** | Trois champs : "Mot de passe actuel", "Nouveau mot de passe", "Confirmer le nouveau mot de passe". |
| **Bouton Principal** | "Enregistrer les modifications", fond `Bleu Confiance`. |

---

## Écran AUTH-05 : Erreur d'Authentification

**Objectif :** Informer l'utilisateur d'un problème de connexion de manière claire.

| Élément | Spécification Visuelle (Web & Mobile) |
|---|---|
| **Type** | Composant d'alerte (Toast ou Bannière). Pas un écran complet. |
| **Position** | Apparaît en haut de l'écran (bannière) ou en bas (toast). |
| **Style** | Fond `Rouge Erreur` (#EF4444), texte `Blanc`, icône d'erreur (cercle avec un 'X'). `border-radius: 8px`. |
| **Message** | Texte clair et concis, ex: "L'adresse e-mail ou le mot de passe est incorrect." |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*
