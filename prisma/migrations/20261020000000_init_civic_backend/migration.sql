-- ==============================================================================
-- PuneSetu (पुणे सेतू) — Initial Civic Relational Schema Migration
-- Version 4: Database & Backend Foundation
-- ==============================================================================

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'MUNICIPAL_OFFICER', 'ADMIN');
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');
CREATE TYPE "GrievanceCategory" AS ENUM ('ROADS_POTHOLES', 'SOLID_WASTE', 'WATER_SUPPLY', 'STREET_LIGHTING', 'SEWAGE_DRAINAGE', 'TRAFFIC_TRANSPORT', 'ENCROACHMENT', 'GARDENS_PARKS', 'HEALTH_SANITATION', 'OTHER');
CREATE TYPE "GrievancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');
CREATE TYPE "GrievanceStatus" AS ENUM ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'ESCALATED', 'SLA_BREACHED', 'REOPENED');
CREATE TYPE "EvidenceType" AS ENUM ('PHOTO', 'DOCUMENT', 'VIDEO');
CREATE TYPE "EscalationType" AS ENUM ('SLA_TIME_EXCEEDED', 'MANUAL_CITIZEN_ESCALATION', 'OFFICER_REASSIGNMENT', 'COMMISSIONER_DIRECTIVE');
CREATE TYPE "NotificationType" AS ENUM ('STATUS_CHANGE', 'ASSIGNED', 'COMMENT_ADDED', 'ESCALATED', 'RESOLUTION_VERIFIED');

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ward_number" INTEGER NOT NULL,
    "zone" TEXT NOT NULL,
    "office_address" TEXT,
    "contact_phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CITIZEN',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "department_id" TEXT,
    "ward_id" TEXT,
    "email_verified" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grievances" (
    "id" TEXT NOT NULL,
    "tracking_token" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "GrievanceCategory" NOT NULL,
    "priority" "GrievancePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "GrievanceStatus" NOT NULL DEFAULT 'SUBMITTED',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "landmark" TEXT,
    "location_description" TEXT,
    "citizen_id" TEXT NOT NULL,
    "department_id" TEXT,
    "ward_id" TEXT,
    "assigned_officer_id" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grievances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grievance_evidence" (
    "id" TEXT NOT NULL,
    "grievance_id" TEXT NOT NULL,
    "evidence_type" "EvidenceType" NOT NULL DEFAULT 'PHOTO',
    "storage_key" TEXT NOT NULL,
    "original_filename" TEXT,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "caption" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grievance_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grievance_status_history" (
    "id" TEXT NOT NULL,
    "grievance_id" TEXT NOT NULL,
    "previous_status" "GrievanceStatus" NOT NULL,
    "new_status" "GrievanceStatus" NOT NULL,
    "change_reason" TEXT,
    "notes" TEXT,
    "changed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grievance_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "grievance_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endorsements" (
    "id" TEXT NOT NULL,
    "grievance_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grievance_followers" (
    "id" TEXT NOT NULL,
    "grievance_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grievance_followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "satisfaction_feedback" (
    "id" TEXT NOT NULL,
    "grievance_id" TEXT NOT NULL,
    "citizen_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback_text" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "satisfaction_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "grievance_id" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_records" (
    "id" TEXT NOT NULL,
    "grievance_id" TEXT NOT NULL,
    "escalation_type" "EscalationType" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "escalated_by_id" TEXT,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "escalation_records_pkey" PRIMARY KEY ("id")
);

-- Indexes & Unique Constraints
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");
CREATE INDEX "departments_code_idx" ON "departments"("code");
CREATE INDEX "departments_active_idx" ON "departments"("active");

CREATE UNIQUE INDEX "wards_ward_number_key" ON "wards"("ward_number");
CREATE INDEX "wards_ward_number_idx" ON "wards"("ward_number");
CREATE INDEX "wards_active_idx" ON "wards"("active");

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_status_idx" ON "users"("status");

CREATE UNIQUE INDEX "grievances_tracking_token_key" ON "grievances"("tracking_token");
CREATE INDEX "grievances_tracking_token_idx" ON "grievances"("tracking_token");
CREATE INDEX "grievances_citizen_id_idx" ON "grievances"("citizen_id");
CREATE INDEX "grievances_department_id_idx" ON "grievances"("department_id");
CREATE INDEX "grievances_ward_id_idx" ON "grievances"("ward_id");
CREATE INDEX "grievances_status_idx" ON "grievances"("status");
CREATE INDEX "grievances_category_idx" ON "grievances"("category");
CREATE INDEX "grievances_priority_idx" ON "grievances"("priority");
CREATE INDEX "grievances_created_at_idx" ON "grievances"("created_at");

CREATE INDEX "grievance_evidence_grievance_id_idx" ON "grievance_evidence"("grievance_id");
CREATE INDEX "grievance_evidence_uploaded_by_id_idx" ON "grievance_evidence"("uploaded_by_id");

CREATE INDEX "grievance_status_history_grievance_id_idx" ON "grievance_status_history"("grievance_id");
CREATE INDEX "grievance_status_history_created_at_idx" ON "grievance_status_history"("created_at");

CREATE INDEX "comments_grievance_id_idx" ON "comments"("grievance_id");
CREATE INDEX "comments_author_id_idx" ON "comments"("author_id");
CREATE INDEX "comments_is_internal_idx" ON "comments"("is_internal");

CREATE UNIQUE INDEX "endorsements_grievance_id_user_id_key" ON "endorsements"("grievance_id", "user_id");
CREATE INDEX "endorsements_grievance_id_idx" ON "endorsements"("grievance_id");
CREATE INDEX "endorsements_user_id_idx" ON "endorsements"("user_id");

CREATE UNIQUE INDEX "grievance_followers_grievance_id_user_id_key" ON "grievance_followers"("grievance_id", "user_id");
CREATE INDEX "grievance_followers_grievance_id_idx" ON "grievance_followers"("grievance_id");
CREATE INDEX "grievance_followers_user_id_idx" ON "grievance_followers"("user_id");

CREATE UNIQUE INDEX "satisfaction_feedback_grievance_id_key" ON "satisfaction_feedback"("grievance_id");
CREATE INDEX "satisfaction_feedback_citizen_id_idx" ON "satisfaction_feedback"("citizen_id");

CREATE INDEX "notifications_recipient_id_idx" ON "notifications"("recipient_id");
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_target_type_idx" ON "audit_logs"("target_type");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

CREATE INDEX "escalation_records_grievance_id_idx" ON "escalation_records"("grievance_id");
CREATE INDEX "escalation_records_status_idx" ON "escalation_records"("status");

-- Foreign Keys
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "grievances" ADD CONSTRAINT "grievances_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_assigned_officer_id_fkey" FOREIGN KEY ("assigned_officer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "grievance_evidence" ADD CONSTRAINT "grievance_evidence_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grievance_evidence" ADD CONSTRAINT "grievance_evidence_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "grievance_status_history" ADD CONSTRAINT "grievance_status_history_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grievance_status_history" ADD CONSTRAINT "grievance_status_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "comments" ADD CONSTRAINT "comments_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "grievance_followers" ADD CONSTRAINT "grievance_followers_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grievance_followers" ADD CONSTRAINT "grievance_followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "satisfaction_feedback" ADD CONSTRAINT "satisfaction_feedback_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "satisfaction_feedback" ADD CONSTRAINT "satisfaction_feedback_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "escalation_records" ADD CONSTRAINT "escalation_records_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "escalation_records" ADD CONSTRAINT "escalation_records_escalated_by_id_fkey" FOREIGN KEY ("escalated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
