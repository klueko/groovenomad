# 🗂️ Configuration Airtable pour GrooveNomad

## 📋 Étapes de configuration

### 1. **Obtenir ta Base ID**

1. Va sur [airtable.com/api](https://airtable.com/api)
2. Sélectionne ta base de données
3. La Base ID apparaît en haut (format: `appXXXXXXXXXXXXXX`)

### 2. **Configurer les variables d'environnement**

Créé un fichier `.env.local` à la racine du projet :

```env
AIRTABLE_BASE_ID=app123456789abcdef  # Ta vraie Base ID
AIRTABLE_API_KEY=patErQo21TvWpFzpk.704e1a85f2290a29b9d5bab0cbf7b469f7f0206127766e695bcbf2c804696537
```

### 3. **Vérifier le nom de la table**

Dans le fichier `app/api/create-booking-request+api.ts`, change :

```typescript
const AIRTABLE_TABLE_NAME = "Table 1"; // Remplace par le nom exact de ta table
```

### 4. **Structure de table attendue**

Ta table Airtable doit avoir ces colonnes :

- commande_id
- client_id
- festival_id
- nom_festival
- destination
- country
- genre_musical_prefere
- date_commande
- date_envoi_devis
- référence_devis\_\_
- status_reservation
- proposition_IA_personnalisée
- proposition_acceptée
- nb_festivaliers
- ville_residence_client
- type_transport
- Ville_départ
- Date_départ_transport
- type_hebergement
- Adresse_hébergement
- activités_supplémentaires
- nb_commandes_client
- date_festival_start
- date_festival_end
- atmosphere
- ticket_type
- currency
- contacts_mail
- contact_tel_client
- adresse_postale_client
- prix_ticket_HT
- prix_transport_HT
- prix_hebergement_TTC
- Montant_total_TTC

## 🔧 Test de l'API

Une fois configuré, l'API devrait fonctionner et créer des enregistrements dans ta base Airtable.

## ❌ Erreurs courantes

- **403 INVALID_PERMISSIONS** : Base ID incorrecte ou permissions manquantes
- **404 NOT_FOUND** : Nom de table incorrect
- **422 INVALID_REQUEST** : Colonnes manquantes dans la table
