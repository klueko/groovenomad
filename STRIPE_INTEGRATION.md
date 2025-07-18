# Intégration Stripe pour la signature des devis

## Vue d'ensemble

Cette intégration permet aux utilisateurs de signer et payer leurs devis directement dans l'application FestiFun en utilisant Stripe.

## Fonctionnalités

### 1. Extraction automatique du prix

- Le prix est automatiquement extrait du HTML du devis
- Support de plusieurs formats de prix dans le HTML
- Conversion en centimes pour Stripe

### 2. Paiement sécurisé

- Utilisation de Stripe PaymentIntent
- Interface de paiement native iOS/Android
- Gestion des erreurs de paiement

### 3. Confirmation automatique

- Mise à jour automatique du statut dans Airtable
- Enregistrement du PaymentIntent ID
- Date de signature automatique

## Architecture

### Fichiers créés/modifiés

#### `lib/stripe-utils.ts`

- Fonction d'extraction du prix du HTML du devis
- Création de PaymentIntent Stripe
- Confirmation des paiements

#### `app/api/sign-quote-with-payment+api.ts`

- Nouvelle API pour gérer la signature avec paiement
- Extraction du prix et création du PaymentIntent
- Confirmation du paiement et mise à jour Airtable

#### `app/mes-billets.tsx`

- Intégration de StripeProvider
- Nouveaux boutons de paiement
- Gestion des états de paiement

#### `types/env.d.ts`

- Types pour les variables d'environnement Stripe

## Flux de paiement

1. **Affichage du devis** : L'utilisateur consulte son devis dans l'app
2. **Extraction du prix** : Le prix est automatiquement extrait du HTML
3. **Création du PaymentIntent** : L'API crée un PaymentIntent Stripe
4. **Interface de paiement** : Stripe présente l'interface de paiement
5. **Confirmation** : Le paiement est confirmé et le statut mis à jour

## Extraction du prix

La fonction `extractTotalPriceFromHTML` supporte plusieurs formats :

- `Total TTC :703.8€`
- `Total TTC : 703.8€`
- Prix dans le tableau HTML
- Dernier prix trouvé dans le tableau

## Gestion des erreurs

- Erreur d'extraction du prix
- Erreur de création du PaymentIntent
- Erreur de paiement
- Erreur de confirmation

## Sécurité

- Utilisation des clés de test Stripe
- Validation côté serveur
- Métadonnées pour traçabilité
- Gestion des erreurs complète

## Tests

Le système a été testé avec :

- Extraction du prix de 703.8€ depuis le HTML du devis
- Création de PaymentIntent
- Interface de paiement Stripe

## Prochaines étapes

1. **Webhooks Stripe** : Pour les notifications de paiement
2. **Mode production** : Passage aux clés de production
3. **Gestion des remboursements** : Interface admin
4. **Rapports de paiement** : Intégration avec Airtable
