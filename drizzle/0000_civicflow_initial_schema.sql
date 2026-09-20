CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`request_ref` text NOT NULL,
	`action` text NOT NULL,
	`actor` text DEFAULT 'admin' NOT NULL,
	`detail` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_created_at` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `service_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`priority` text NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`location` text NOT NULL,
	`description` text NOT NULL,
	`assigned_to` text,
	`admin_note` text,
	`resolution_note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`claimed_at` integer,
	`resolved_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_service_requests_public_id` ON `service_requests` (`public_id`);--> statement-breakpoint
CREATE INDEX `idx_service_requests_status_created_at` ON `service_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_service_requests_category` ON `service_requests` (`category`);--> statement-breakpoint
PRAGMA optimize;
