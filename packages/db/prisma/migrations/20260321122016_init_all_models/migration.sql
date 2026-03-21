-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tenant";

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "country" TEXT,

    CONSTRAINT "vehicle_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_models" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year_start" INTEGER,
    "year_end" INTEGER,
    "body_type" TEXT,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "role_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."roles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "data" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."customers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'individual',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "tax_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."vehicles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "license_plate" TEXT NOT NULL,
    "brand_id" TEXT,
    "model_id" TEXT,
    "brand_name" TEXT,
    "model_name" TEXT,
    "year" INTEGER,
    "color" TEXT,
    "vin" TEXT,
    "current_km" INTEGER DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."customer_vehicles" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "until" TIMESTAMP(3),

    CONSTRAINT "customer_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."service_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."service_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "default_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estimated_duration" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."service_products" (
    "id" TEXT NOT NULL,
    "service_definition_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "default_quantity" DECIMAL(10,3) NOT NULL DEFAULT 1,

    CONSTRAINT "service_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."product_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."products" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'adet',
    "cost_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sale_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "current_stock" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "min_stock" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."price_history" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "cost_price" DECIMAL(12,2) NOT NULL,
    "sale_price" DECIMAL(12,2) NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."stock_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_cost" DECIMAL(12,2) NOT NULL,
    "supplier_id" TEXT,
    "invoice_no" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."stock_movements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "reason" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."work_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_no" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "technician_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "current_km" INTEGER,
    "notes" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."work_order_items" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "service_definition_id" TEXT,
    "product_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "work_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_no" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "account_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."invoice_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit_limit" DECIMAL(12,2),
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."customer_accounts" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "customer_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."account_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "balance_after" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."incomes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "invoice_id" TEXT,
    "payment_id" TEXT,
    "account_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."expenses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "supplier_id" TEXT,
    "account_id" TEXT,
    "receipt_url" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."cash_registers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "account_no" TEXT,
    "bank_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."cash_register_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "cash_register_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "balance_after" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_register_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."employees" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "tc_no" TEXT,
    "position" TEXT,
    "department" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "gross_salary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."payroll_params" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_params_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."payrolls" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "gross_salary" DECIMAL(12,2) NOT NULL,
    "sgk_employee" DECIMAL(12,2) NOT NULL,
    "sgk_employer" DECIMAL(12,2) NOT NULL,
    "provident_employee" DECIMAL(12,2) NOT NULL,
    "provident_employer" DECIMAL(12,2) NOT NULL,
    "income_tax" DECIMAL(12,2) NOT NULL,
    "net_salary" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recipient_id" TEXT,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "sent_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."notification_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."reminders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "work_order_id" TEXT,
    "customer_id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "reminder_date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "channel" TEXT NOT NULL,
    "message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."reminder_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "service_definition_id" TEXT,
    "name" TEXT NOT NULL,
    "days_after" INTEGER NOT NULL,
    "km_after" INTEGER,
    "channel" TEXT NOT NULL,
    "message_template" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."tenant_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_brands_name_key" ON "vehicle_brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_brand_id_name_key" ON "vehicle_models"("brand_id", "name");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "tenant"."users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "tenant"."users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "roles_tenant_id_idx" ON "tenant"."roles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenant_id_name_key" ON "tenant"."roles"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "tenant"."audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "tenant"."audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "tenant"."audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "customers_tenant_id_idx" ON "tenant"."customers"("tenant_id");

-- CreateIndex
CREATE INDEX "customers_tenant_id_phone_idx" ON "tenant"."customers"("tenant_id", "phone");

-- CreateIndex
CREATE INDEX "customers_tenant_id_name_idx" ON "tenant"."customers"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "vehicles_tenant_id_idx" ON "tenant"."vehicles"("tenant_id");

-- CreateIndex
CREATE INDEX "vehicles_tenant_id_license_plate_idx" ON "tenant"."vehicles"("tenant_id", "license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_tenant_id_license_plate_key" ON "tenant"."vehicles"("tenant_id", "license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "customer_vehicles_customer_id_vehicle_id_key" ON "tenant"."customer_vehicles"("customer_id", "vehicle_id");

-- CreateIndex
CREATE INDEX "service_categories_tenant_id_idx" ON "tenant"."service_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "service_definitions_tenant_id_idx" ON "tenant"."service_definitions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_products_service_definition_id_product_id_key" ON "tenant"."service_products"("service_definition_id", "product_id");

-- CreateIndex
CREATE INDEX "product_categories_tenant_id_idx" ON "tenant"."product_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "products_tenant_id_idx" ON "tenant"."products"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenant_id_sku_key" ON "tenant"."products"("tenant_id", "sku");

-- CreateIndex
CREATE INDEX "price_history_product_id_idx" ON "tenant"."price_history"("product_id");

-- CreateIndex
CREATE INDEX "stock_entries_tenant_id_idx" ON "tenant"."stock_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_entries_product_id_idx" ON "tenant"."stock_entries"("product_id");

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_idx" ON "tenant"."stock_movements"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_idx" ON "tenant"."stock_movements"("product_id");

-- CreateIndex
CREATE INDEX "stock_movements_reference_type_reference_id_idx" ON "tenant"."stock_movements"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "work_orders_tenant_id_idx" ON "tenant"."work_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "work_orders_tenant_id_status_idx" ON "tenant"."work_orders"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "work_orders_customer_id_idx" ON "tenant"."work_orders"("customer_id");

-- CreateIndex
CREATE INDEX "work_orders_vehicle_id_idx" ON "tenant"."work_orders"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_tenant_id_order_no_key" ON "tenant"."work_orders"("tenant_id", "order_no");

-- CreateIndex
CREATE INDEX "work_order_items_work_order_id_idx" ON "tenant"."work_order_items"("work_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_work_order_id_key" ON "tenant"."invoices"("work_order_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_idx" ON "tenant"."invoices"("tenant_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_status_idx" ON "tenant"."invoices"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "invoices_customer_id_idx" ON "tenant"."invoices"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenant_id_invoice_no_key" ON "tenant"."invoices"("tenant_id", "invoice_no");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "tenant"."invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_idx" ON "tenant"."payments"("tenant_id");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "tenant"."payments"("invoice_id");

-- CreateIndex
CREATE INDEX "accounts_tenant_id_idx" ON "tenant"."accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "accounts_tenant_id_type_idx" ON "tenant"."accounts"("tenant_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_tenant_id_code_key" ON "tenant"."accounts"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "customer_accounts_customer_id_account_id_key" ON "tenant"."customer_accounts"("customer_id", "account_id");

-- CreateIndex
CREATE INDEX "account_transactions_tenant_id_idx" ON "tenant"."account_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "account_transactions_account_id_idx" ON "tenant"."account_transactions"("account_id");

-- CreateIndex
CREATE INDEX "account_transactions_date_idx" ON "tenant"."account_transactions"("date");

-- CreateIndex
CREATE INDEX "incomes_tenant_id_idx" ON "tenant"."incomes"("tenant_id");

-- CreateIndex
CREATE INDEX "incomes_tenant_id_date_idx" ON "tenant"."incomes"("tenant_id", "date");

-- CreateIndex
CREATE INDEX "expenses_tenant_id_idx" ON "tenant"."expenses"("tenant_id");

-- CreateIndex
CREATE INDEX "expenses_tenant_id_date_idx" ON "tenant"."expenses"("tenant_id", "date");

-- CreateIndex
CREATE INDEX "expenses_tenant_id_category_idx" ON "tenant"."expenses"("tenant_id", "category");

-- CreateIndex
CREATE INDEX "cash_registers_tenant_id_idx" ON "tenant"."cash_registers"("tenant_id");

-- CreateIndex
CREATE INDEX "cash_register_transactions_tenant_id_idx" ON "tenant"."cash_register_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "cash_register_transactions_cash_register_id_idx" ON "tenant"."cash_register_transactions"("cash_register_id");

-- CreateIndex
CREATE INDEX "employees_tenant_id_idx" ON "tenant"."employees"("tenant_id");

-- CreateIndex
CREATE INDEX "payroll_params_tenant_id_idx" ON "tenant"."payroll_params"("tenant_id");

-- CreateIndex
CREATE INDEX "payroll_params_name_effective_from_idx" ON "tenant"."payroll_params"("name", "effective_from");

-- CreateIndex
CREATE INDEX "payrolls_tenant_id_idx" ON "tenant"."payrolls"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_tenant_id_employee_id_month_year_key" ON "tenant"."payrolls"("tenant_id", "employee_id", "month", "year");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_idx" ON "tenant"."notifications"("tenant_id");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_status_idx" ON "tenant"."notifications"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "notification_templates_tenant_id_idx" ON "tenant"."notification_templates"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_tenant_id_name_key" ON "tenant"."notification_templates"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "reminders_tenant_id_idx" ON "tenant"."reminders"("tenant_id");

-- CreateIndex
CREATE INDEX "reminders_tenant_id_status_reminder_date_idx" ON "tenant"."reminders"("tenant_id", "status", "reminder_date");

-- CreateIndex
CREATE INDEX "reminder_rules_tenant_id_idx" ON "tenant"."reminder_rules"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_tenant_id_key_key" ON "tenant"."tenant_settings"("tenant_id", "key");

-- AddForeignKey
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "vehicle_brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "tenant"."roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tenant"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."customer_vehicles" ADD CONSTRAINT "customer_vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tenant"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."customer_vehicles" ADD CONSTRAINT "customer_vehicles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "tenant"."vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."service_definitions" ADD CONSTRAINT "service_definitions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "tenant"."service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."service_products" ADD CONSTRAINT "service_products_service_definition_id_fkey" FOREIGN KEY ("service_definition_id") REFERENCES "tenant"."service_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."service_products" ADD CONSTRAINT "service_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tenant"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "tenant"."product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."price_history" ADD CONSTRAINT "price_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tenant"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."stock_entries" ADD CONSTRAINT "stock_entries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tenant"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tenant"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."work_orders" ADD CONSTRAINT "work_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tenant"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."work_orders" ADD CONSTRAINT "work_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "tenant"."vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."work_orders" ADD CONSTRAINT "work_orders_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "tenant"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."work_order_items" ADD CONSTRAINT "work_order_items_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "tenant"."work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."work_order_items" ADD CONSTRAINT "work_order_items_service_definition_id_fkey" FOREIGN KEY ("service_definition_id") REFERENCES "tenant"."service_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."work_order_items" ADD CONSTRAINT "work_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tenant"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."invoices" ADD CONSTRAINT "invoices_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "tenant"."work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tenant"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."invoices" ADD CONSTRAINT "invoices_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "tenant"."accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "tenant"."invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "tenant"."invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."customer_accounts" ADD CONSTRAINT "customer_accounts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tenant"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."customer_accounts" ADD CONSTRAINT "customer_accounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "tenant"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."account_transactions" ADD CONSTRAINT "account_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "tenant"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."expenses" ADD CONSTRAINT "expenses_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "tenant"."accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."cash_register_transactions" ADD CONSTRAINT "cash_register_transactions_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "tenant"."cash_registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."payrolls" ADD CONSTRAINT "payrolls_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "tenant"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."reminders" ADD CONSTRAINT "reminders_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "tenant"."work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."reminders" ADD CONSTRAINT "reminders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tenant"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."reminders" ADD CONSTRAINT "reminders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "tenant"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."reminder_rules" ADD CONSTRAINT "reminder_rules_service_definition_id_fkey" FOREIGN KEY ("service_definition_id") REFERENCES "tenant"."service_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
