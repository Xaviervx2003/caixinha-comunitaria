CREATE TABLE `caixinhaMetadata` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL DEFAULT 'Minha Caixinha',
	`description` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `caixinhaMetadata_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `caixinhaShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`sharedWithUserId` int NOT NULL,
	`role` enum('viewer','editor','admin') NOT NULL DEFAULT 'viewer',
	`shareCode` varchar(32),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `caixinhaShares_id` PRIMARY KEY(`id`),
	CONSTRAINT `caixinhaShares_shareCode_unique` UNIQUE(`shareCode`)
);
--> statement-breakpoint
ALTER TABLE `caixinhaMetadata` ADD CONSTRAINT `caixinhaMetadata_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `caixinhaShares` ADD CONSTRAINT `caixinhaShares_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `caixinhaShares` ADD CONSTRAINT `caixinhaShares_sharedWithUserId_users_id_fk` FOREIGN KEY (`sharedWithUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;