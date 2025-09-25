CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('new', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('employee', 'admin');--> statement-breakpoint
CREATE TABLE "admin_backups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64),
	"created_at" timestamp DEFAULT now(),
	"size" integer,
	"file_path" varchar(256)
);
--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"gst_number" varchar(32),
	"tax_rate" integer,
	"bank_account" varchar(128),
	"payment_terms" varchar(64),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(100),
	"phone" varchar(20),
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer,
	"date" timestamp DEFAULT now(),
	"volume" numeric,
	"status" varchar(20) DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE "field_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitNumber" varchar(50) NOT NULL,
	"leadId" uuid NOT NULL,
	"plannedDate" timestamp NOT NULL,
	"plannedStartTime" timestamp,
	"plannedEndTime" timestamp,
	"assignedTo" uuid NOT NULL,
	"visitAddress" varchar(255) NOT NULL,
	"visitCity" varchar(100),
	"visitState" varchar(100),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"preVisitNotes" text,
	"purpose" varchar(100),
	"travelExpense" numeric(12, 2),
	"status" varchar(20) DEFAULT 'Scheduled',
	CONSTRAINT "field_visits_visitNumber_unique" UNIQUE("visitNumber")
);
--> statement-breakpoint
CREATE TABLE "inbound_quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" uuid,
	"quotation_number" varchar(50) NOT NULL,
	"quotation_date" timestamp NOT NULL,
	"valid_until" timestamp,
	"subject" text,
	"total_amount" numeric NOT NULL,
	"status" varchar(20) DEFAULT 'received' NOT NULL,
	"notes" text,
	"attachment_path" text,
	"attachment_name" text,
	"sender_type" varchar(20) DEFAULT 'vendor' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"invoice_number" varchar(50),
	"total_amount" numeric,
	"status" varchar(20),
	"issued_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"companyName" text,
	"email" text,
	"phone" text,
	"alternatePhone" text,
	"address" text,
	"city" text,
	"state" text,
	"zipCode" text,
	"country" text DEFAULT 'India',
	"source" text DEFAULT 'other',
	"sourceDetails" text,
	"referredBy" text,
	"requirementDescription" text,
	"estimatedBudget" numeric,
	"assignedTo" text,
	"status" text DEFAULT 'new',
	"priority" text DEFAULT 'medium',
	"createdAt" timestamp DEFAULT now(),
	"followUpDate" timestamp
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"leave_type" varchar(50) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "logistics_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"checkInTime" timestamp,
	"checkOutTime" timestamp,
	"checkInLocation" text,
	"checkOutLocation" text,
	"checkInLatitude" numeric(10, 7)
);
--> statement-breakpoint
CREATE TABLE "logistics_leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"leave_type" varchar(50) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"reason" text,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "logistics_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consignmentNumber" text NOT NULL,
	"source" text NOT NULL,
	"destination" text NOT NULL,
	"clientId" uuid,
	"vendorId" uuid,
	"dispatchDate" timestamp,
	"expectedDeliveryDate" timestamp,
	"deliveredAt" timestamp,
	"closedAt" timestamp,
	"currentStatus" text DEFAULT 'created' NOT NULL,
	"notes" text,
	"weight" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "logistics_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assignedTo" uuid NOT NULL,
	"assignedBy" uuid NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"dueDate" timestamp,
	"startedDate" timestamp,
	"completedDate" timestamp,
	"shipmentId" uuid,
	"estimatedHours" numeric(5, 2)
);
--> statement-breakpoint
CREATE TABLE "marketingAttendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"checkInTime" timestamp,
	"checkOutTime" timestamp,
	"checkInLocation" text,
	"checkOutLocation" text,
	"checkInLatitude" numeric(10, 7)
);
--> statement-breakpoint
CREATE TABLE "marketing_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"priority" varchar(20) DEFAULT 'medium',
	"assigned_to" integer,
	"created_at" timestamp DEFAULT now(),
	"due_date" timestamp,
	"completed_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "outbound_quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"quotationNumber" text NOT NULL,
	"customerId" integer,
	"userId" uuid NOT NULL,
	"status" text,
	"quotationDate" timestamp NOT NULL,
	"validUntil" timestamp,
	"jobCardNumber" text,
	"partNumber" text,
	"subtotalAmount" numeric NOT NULL,
	"taxamount" numeric,
	"discountamount" numeric,
	"totalamount" numeric NOT NULL,
	"paymentterms" text,
	"deliveryterms" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"sku" varchar(50),
	"stock" integer DEFAULT 0,
	"price" numeric,
	"supplier_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"contact_email" varchar(100),
	"contact_phone" varchar(20),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"assignedTo" integer NOT NULL,
	"assignedBy" integer NOT NULL,
	"status" "task_status" DEFAULT 'new' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"dueDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" DEFAULT 'employee' NOT NULL,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"department" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_communications" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer,
	"message" text,
	"communication_date" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_vendor_id_suppliers_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_visits" ADD CONSTRAINT "field_visits_leadId_leads_id_fk" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_visits" ADD CONSTRAINT "field_visits_assignedTo_users_id_fk" FOREIGN KEY ("assignedTo") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbound_quotations" ADD CONSTRAINT "inbound_quotations_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedTo_users_id_fk" FOREIGN KEY ("assignedTo") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_leave_requests" ADD CONSTRAINT "logistics_leave_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketingAttendance" ADD CONSTRAINT "marketingAttendance_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_tasks" ADD CONSTRAINT "marketing_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_quotations" ADD CONSTRAINT "outbound_quotations_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedTo_users_id_fk" FOREIGN KEY ("assignedTo") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedBy_users_id_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_communications" ADD CONSTRAINT "vendor_communications_vendor_id_suppliers_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;