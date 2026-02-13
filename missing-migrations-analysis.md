# Missing Database Tables for Epics 1-6

## Summary
Most tables for epics 1-6 are already implemented. Only **Epic 5** has some missing components for complete functionality.

## Missing Components

### Epic 5: Operational Workflow Tracking

#### 1. Order Status History/Audit Log Table
**Purpose**: Track all status changes with timestamps for SLA monitoring and audit trail

```sql
CREATE TABLE "order_status_history" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "order_id" uuid NOT NULL,
    "tenant_id" uuid NOT NULL,
    "previous_status" "public"."orders_status_enum",
    "new_status" "public"."orders_status_enum" NOT NULL,
    "changed_by_user_id" uuid,
    "changed_at" TIMESTAMP NOT NULL DEFAULT now(),
    "notes" text,
    CONSTRAINT "PK_order_status_history" PRIMARY KEY ("id"),
    CONSTRAINT "FK_order_status_history_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
);

-- RLS Policy
ALTER TABLE "order_status_history" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON order_status_history
USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_setting('app.current_role', true) = 'superadmin');

-- Index for performance
CREATE INDEX "IDX_order_status_history_order_id" ON "order_status_history" ("order_id");
CREATE INDEX "IDX_order_status_history_tenant_date" ON "order_status_history" ("tenant_id", "changed_at");
```

#### 2. Dashboard Metrics (Optional - can be computed views)
**Purpose**: Pre-computed metrics for dashboard performance

```sql
-- Option 1: Materialized View (refreshed periodically)
CREATE MATERIALIZED VIEW "daily_site_metrics" AS
SELECT 
    tenant_id,
    site_id,
    DATE(created_at) as metric_date,
    COUNT(*) as orders_count,
    SUM(total_price) as total_revenue,
    COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered_count,
    COUNT(CASE WHEN due_date < NOW() AND status NOT IN ('DELIVERED', 'CANCELLED') THEN 1 END) as overdue_count
FROM orders
GROUP BY tenant_id, site_id, DATE(created_at);

-- Option 2: Regular table with triggers (real-time updates)
CREATE TABLE "site_daily_metrics" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" uuid NOT NULL,
    "site_id" uuid NOT NULL,
    "metric_date" DATE NOT NULL,
    "orders_count" integer DEFAULT 0,
    "total_revenue" numeric(10,2) DEFAULT 0,
    "delivered_count" integer DEFAULT 0,
    "overdue_count" integer DEFAULT 0,
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_site_daily_metrics" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_site_daily_metrics" UNIQUE ("tenant_id", "site_id", "metric_date")
);
```

## Recommended Next Steps

1. **Create Order Status History Migration** - Essential for Epic 5 story 5.1 (Order Workflow Management)
2. **Dashboard Metrics** - Choose between materialized views (simpler) or real-time tables (more complex but faster)

## Migration Priority

### High Priority (Required for Epic 5)
- `order_status_history` table

### Medium Priority (Performance optimization)
- Dashboard metrics tables/views

### Low Priority (Already functional with existing tables)
- All other epics are fully covered by existing migrations

## Existing Tables Coverage

✅ **Epic 1**: tenants, users, sites (with RLS)
✅ **Epic 2**: clients (with search indexes)  
✅ **Epic 3**: article_types, service_definitions, service_prices
✅ **Epic 4**: orders, order_items (with status enum)
⚠️ **Epic 5**: orders (partial) - missing status history
✅ **Epic 6**: storage_slots, order_storage