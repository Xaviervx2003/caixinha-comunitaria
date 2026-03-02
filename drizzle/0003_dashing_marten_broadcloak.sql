CREATE TABLE `auditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`participantName` varchar(255) NOT NULL,
	`action` enum('payment_marked','payment_unmarked','amortization_added','participant_created','participant_deleted') NOT NULL,
	`month` varchar(20),
	`year` int,
	`amount` decimal(10,2),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLog_id` PRIMARY KEY(`id`)
);
