# Architecture Technique - CleanTrack Pro

## 1. Stack Technique
* **Frontend :** Next.js 14 (App Router), Tailwind CSS.
* **Mobile :** React Native (Portail Client).
* **Backend :** NestJS (Architecture Modulaire).
* **Auth :** Keycloak (OIDC).
* **Database :** PostgreSQL avec **Row-Level Security (RLS)** pour isolation des Tenants.
* **Cache :** Redis (Sessions, Recherche Omnibox).
* **Impression :** Print Proxy local (Node.js) communiquant en ESC/POS.

## 2. Modèle de Données (Core Tables)
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  site_id UUID NOT NULL,
  client_id UUID NOT NULL,
  status VARCHAR(20), -- De CREATED à DELIVERED
  service_level VARCHAR(10), -- NORMAL, EXPRESS
  due_date TIMESTAMP NOT NULL,
  total_price DECIMAL(10,2)
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  label VARCHAR(100), -- ex: Chemise Homme
  service_type VARCHAR(20), -- LAVAGE, REPASSAGE
  quantity INT DEFAULT 1
);

CREATE TABLE shelf_slots (
  id UUID PRIMARY KEY,
  site_id UUID NOT NULL,
  label VARCHAR(20) NOT NULL,
  status VARCHAR(15) -- FREE, OCCUPIED
);

CREATE TABLE order_storage (
  order_id UUID REFERENCES orders(id),
  shelf_slot_id UUID REFERENCES shelf_slots(id),
  stored_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (order_id, shelf_slot_id)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID,
  action VARCHAR(50), -- CREATE, UPDATE, DELETE
  resource VARCHAR(50), -- Order, Client, etc.
  resource_id UUID,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY,
  name VARCHAR(50), -- Starter, Pro, Enterprise
  price DECIMAL(10,2),
  max_sites INT,
  features JSONB
);

CREATE TABLE tenant_subscriptions (
  tenant_id UUID PRIMARY KEY,
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR(20), -- ACTIVE, PAST_DUE
  current_period_end TIMESTAMP
);