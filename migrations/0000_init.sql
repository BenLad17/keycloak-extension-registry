CREATE TABLE `extension` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`code_source_type` text NOT NULL,
	`owner_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`readme` text,
	`last_synced_at` integer,
	`last_sync_error` text,
	`status` text DEFAULT 'active',
	`download_count` integer DEFAULT 0,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `extension_slug_unique` ON `extension` (`slug`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `extension` (`owner_id`);--> statement-breakpoint
CREATE TABLE `extension_version` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`extension_id` integer NOT NULL,
	`version` text NOT NULL,
	`keycloakVersion` text,
	`download_url` text NOT NULL,
	`download_size` integer NOT NULL,
	`release_notes` text,
	`deprecated` integer DEFAULT false,
	`download_count` integer DEFAULT 0,
	`published_at` integer NOT NULL,
	`digest` text NOT NULL,
	`provider_image_built` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`extension_id`) REFERENCES `extension`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `version_idx` ON `extension_version` (`extension_id`,`version`);--> statement-breakpoint
CREATE INDEX `extension_idx` ON `extension_version` (`extension_id`);--> statement-breakpoint
CREATE TABLE `extension_version_file` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`version_id` integer NOT NULL,
	`path` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`version_id`) REFERENCES `extension_version`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `file_version_idx` ON `extension_version_file` (`version_id`);--> statement-breakpoint
CREATE TABLE `github_artifact_source` (
	`extension_id` integer PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`repo` text NOT NULL,
	FOREIGN KEY (`extension_id`) REFERENCES `extension`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `github_code_source` (
	`extension_id` integer PRIMARY KEY NOT NULL,
	`repo_id` integer NOT NULL,
	`owner` text NOT NULL,
	`repo` text NOT NULL,
	FOREIGN KEY (`extension_id`) REFERENCES `extension`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_code_source_repo_id_unique` ON `github_code_source` (`repo_id`);--> statement-breakpoint
CREATE TABLE `maven_artifact_source` (
	`extension_id` integer PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`artifact_id` text NOT NULL,
	FOREIGN KEY (`extension_id`) REFERENCES `extension`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`github_id` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_github_id_unique` ON `user` (`github_id`);