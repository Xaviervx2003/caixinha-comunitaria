CREATE TABLE `monthlyPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`month` varchar(20) NOT NULL,
	`year` int NOT NULL,
	`paid` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthlyPayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `participants` DROP COLUMN `monthlyFeePaid`;--> statement-breakpoint
ALTER TABLE `participants` DROP COLUMN `interestPaid`;