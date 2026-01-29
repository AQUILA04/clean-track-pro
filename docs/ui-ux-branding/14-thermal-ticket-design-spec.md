# Spécifications : Design du Ticket Thermique - CleanTrack Pro

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Le ticket thermique est un élément crucial de l'expérience client dans CleanTrack Pro. Il sert à la fois de reçu, de moyen d'identification pour le retrait et de support de communication de la marque. Ce document définit les spécifications précises pour la conception et l'impression de ce ticket sur une imprimante thermique 80mm.

---

## 1. Spécifications Techniques

| Paramètre | Valeur |
|---|---|
| **Largeur du papier** | 80mm (standard pour imprimantes thermiques) |
| **Largeur imprimable** | ~72mm (avec marges de sécurité de 4mm de chaque côté) |
| **Hauteur** | Variable selon le contenu (typiquement 150-250mm) |
| **Résolution** | 203 DPI (dots per inch) |
| **Format d'impression** | ESC/POS (standard pour imprimantes thermiques) |
| **Encodage** | UTF-8 pour supporter les caractères spéciaux |

---

## 2. Structure du Ticket

Le ticket est divisé en **trois sections principales** : En-tête (Header), Corps Central, et Pied de page (Footer).

```
┌──────────────────────────────────────┐
│         SECTION EN-TÊTE              │
│  (Logo + Infos Agence)               │
├──────────────────────────────────────┤
│                                      │
│       SECTION CORPS CENTRAL          │
│                                      │
│   ┌────────────────────────────┐    │
│   │                            │    │
│   │      QR CODE GÉANT         │    │
│   │        (Giant)             │    │
│   │                            │    │
│   └────────────────────────────┘    │
│                                      │
│      N° Commande: #XXXXX             │
│                                      │
│      Liste des Articles              │
│                                      │
├──────────────────────────────────────┤
│         SECTION PIED DE PAGE         │
│  (Date de retrait + Message)         │
└──────────────────────────────────────┘
```

---

## 3. Section En-tête (Header)

**Objectif :** Identifier l'agence et renforcer le branding.

| Élément | Spécification |
|---|---|
| **Logo de l'Agence** | Centré, largeur maximale 50mm. Si le logo n'est pas disponible, afficher le nom de l'agence en texte grand et gras. |
| **Nom de l'Agence** | Police : Sans-serif (ex: Arial), Taille : 18pt, Style : Gras, Alignement : Centré |
| **Adresse** | Adresse complète de l'agence, Taille : 10pt, Alignement : Centré |
| **Téléphone** | Numéro de téléphone de l'agence, Taille : 10pt, Alignement : Centré |
| **Séparateur** | Une ligne pointillée `- - - - - - - - - - - - - - - - - -` pour séparer l'en-tête du corps |

---

## 4. Section Corps Central

**Objectif :** Fournir le QR code d'identification et les détails de la commande.

### 4.1. QR Code Géant

| Élément | Spécification |
|---|---|
| **Taille** | 50mm × 50mm (le plus grand possible tout en restant dans la zone imprimable) |
| **Contenu** | L'identifiant unique de la commande (UUID) encodé dans le QR code |
| **Correction d'erreur** | Niveau H (High) - 30% de récupération en cas de dégradation |
| **Positionnement** | Centré horizontalement, avec un espace blanc de 10mm au-dessus et en dessous |

### 4.2. Numéro de Commande

| Élément | Spécification |
|---|---|
| **Format** | "N° Commande: #XXXXX" où XXXXX est un numéro séquentiel ou un code court |
| **Taille** | 14pt |
| **Style** | Gras |
| **Alignement** | Centré |
| **Position** | Directement sous le QR code, avec un espacement de 5mm |

### 4.3. Informations Client

| Élément | Spécification |
|---|---|
| **Nom du Client** | "Client: [Nom Complet]", Taille : 12pt, Style : Normal |
| **Téléphone** | "Tél: [Numéro]", Taille : 10pt |
| **Alignement** | Aligné à gauche |

### 4.4. Liste des Articles

| Élément | Spécification |
|---|---|
| **Format** | Tableau simple avec 3 colonnes : Article, Qté, Prix |
| **En-tête du Tableau** | "Article", "Qté", "Prix", Taille : 10pt, Style : Gras |
| **Lignes d'Articles** | Chaque article sur une ligne, Taille : 10pt, Style : Normal |
| **Exemple** | `Chemise Homme     2    10.00 €` |
| **Séparateur** | Une ligne pointillée après la liste des articles |

### 4.5. Totaux

| Élément | Spécification |
|---|---|
| **Sous-total** | "Sous-total: XX.XX €", Aligné à droite |
| **Mode Express** | Si activé, afficher "Mode Express: +XX.XX €" avec une icône ⚡ |
| **Total** | "TOTAL: XX.XX €", Taille : 14pt, Style : Gras, Aligné à droite |

---

## 5. Section Pied de Page (Footer)

**Objectif :** Communiquer la date de retrait et un message de service.

| Élément | Spécification |
|---|---|
| **Séparateur** | Une ligne pointillée pour séparer le corps du pied de page |
| **Date de Retrait Promise** | "Prêt le: [Date et Heure]", Taille : 12pt, Style : Gras, Alignement : Centré |
| **Message de Service** | "Merci de votre confiance !", Taille : 10pt, Alignement : Centré |
| **Instructions de Retrait** | "Présentez ce ticket lors du retrait", Taille : 9pt, Alignement : Centré |
| **Espace Final** | 10mm d'espace blanc en bas pour faciliter la découpe |

---

## 6. Exemple Visuel du Ticket

```
════════════════════════════════════════
         [LOGO CLEANTRACK PRO]
     
         Pressing Express Paris 15
    123 Rue de la Convention, 75015 Paris
           Tél: 01 23 45 67 89

- - - - - - - - - - - - - - - - - - - -

           ┌─────────────────┐
           │                 │
           │   ███████████   │
           │   ███████████   │
           │   ███████████   │
           │   ███████████   │
           │   ███████████   │
           │                 │
           └─────────────────┘
           
         N° Commande: #A3F89

Client: Jean Dupont
Tél: +33 6 12 34 56 78

- - - - - - - - - - - - - - - - - - - -

Article              Qté      Prix
──────────────────────────────────────
Chemise Homme         2      10.00 €
Pantalon              1       8.00 €
Veste                 1      15.00 €

- - - - - - - - - - - - - - - - - - - -

                  Sous-total:  33.00 €
           ⚡ Mode Express:  +16.50 €
                  ──────────────────
                  TOTAL:       49.50 €

════════════════════════════════════════

       Prêt le: 30/01/2026 à 18h00

       Merci de votre confiance !
    Présentez ce ticket lors du retrait

════════════════════════════════════════
```

---

## 7. Considérations d'Implémentation

### 7.1. Bibliothèques Recommandées

Pour l'implémentation du système d'impression, les bibliothèques suivantes sont recommandées :

- **Node.js :** `node-thermal-printer` ou `escpos` pour la génération de commandes ESC/POS
- **QR Code :** `qrcode` pour la génération du QR code en image
- **Print Proxy :** Un service Node.js local qui reçoit les données de commande via HTTP et les envoie à l'imprimante thermique

### 7.2. Flux d'Impression

1. L'interface web (US-07) envoie les données de la commande à l'API backend
2. Le backend génère le contenu du ticket (texte + QR code)
3. Le backend envoie les données au Print Proxy local via HTTP
4. Le Print Proxy convertit les données en commandes ESC/POS
5. Le Print Proxy envoie les commandes à l'imprimante thermique via USB ou réseau

### 7.3. Gestion des Erreurs

- Si l'imprimante n'est pas disponible, afficher un message d'erreur clair à l'opérateur
- Permettre de réimprimer un ticket depuis la page de détails de la commande (UT-02)
- Logger toutes les tentatives d'impression pour le débogage

---

## 8. Étiquettes Articles (Optionnel)

En plus du ticket principal, des petites étiquettes peuvent être imprimées pour chaque article de la commande.

| Élément | Spécification |
|---|---|
| **Taille** | 40mm × 30mm |
| **Contenu** | QR code (20mm × 20mm) + N° Commande + Type d'article |
| **Utilisation** | Attachées directement aux articles pour faciliter le tri et le rangement |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*
