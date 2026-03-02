CREATE TABLE `monthlySummary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`month` varchar(20) NOT NULL,
	`year` int NOT NULL,
	`totalFeesCollected` decimal(10,2) NOT NULL DEFAULT '0',
	`totalInterestCollected` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthlySummary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`totalLoan` decimal(10,2) NOT NULL DEFAULT '0',
	`currentDebt` decimal(10,2) NOT NULL DEFAULT '0',
	`monthlyFeePaid` int NOT NULL DEFAULT 0,
	`interestPaid` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`type` enum('loan','payment','amortization') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`month` varchar(20),
	`year` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
