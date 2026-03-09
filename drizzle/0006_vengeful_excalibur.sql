ALTER TABLE `participants`
  ADD COLUMN IF NOT EXISTS `caixinhaId` int NOT NULL DEFAULT 0 AFTER `id`;
--> statement-breakpoint
ALTER TABLE `participants`
  ADD INDEX IF NOT EXISTS `idx_participants_caixinha` (`caixinhaId`);
--> statement-breakpoint
ALTER TABLE `monthlyPayments`
  MODIFY COLUMN `month` varchar(7) NOT NULL;
--> statement-breakpoint
ALTER TABLE `monthlyPayments`
  MODIFY COLUMN `paid` boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE `monthlyPayments`
  ADD INDEX IF NOT EXISTS `uq_payment_participant_month_year` (`participantId`, `month`, `year`);
--> statement-breakpoint
ALTER TABLE `transactions`
  MODIFY COLUMN `month` varchar(7);
--> statement-breakpoint
ALTER TABLE `transactions`
  ADD COLUMN IF NOT EXISTS `balanceBefore` decimal(10,2) NOT NULL DEFAULT 0 AFTER `amount`;
--> statement-breakpoint
ALTER TABLE `transactions`
  ADD COLUMN IF NOT EXISTS `balanceAfter` decimal(10,2) NOT NULL DEFAULT 0 AFTER `balanceBefore`;
--> statement-breakpoint
ALTER TABLE `transactions`
  ADD COLUMN IF NOT EXISTS `idempotencyKey` varchar(36) AFTER `description`;
--> statement-breakpoint
ALTER TABLE `transactions`
  ADD INDEX IF NOT EXISTS `idx_transactions_participant` (`participantId`);
--> statement-breakpoint
ALTER TABLE `transactions`
  ADD INDEX IF NOT EXISTS `idx_transactions_period` (`participantId`, `month`, `year`);
--> statement-breakpoint
ALTER TABLE `monthlySummary`
  MODIFY COLUMN `month` varchar(7) NOT NULL;
--> statement-breakpoint
ALTER TABLE `monthlySummary`
  ADD COLUMN IF NOT EXISTS `caixinhaId` int NOT NULL DEFAULT 0 AFTER `id`;
--> statement-breakpoint
ALTER TABLE `monthlySummary`
  ADD INDEX IF NOT EXISTS `uq_summary_caixinha_month_year` (`caixinhaId`, `month`, `year`);
--> statement-breakpoint
ALTER TABLE `auditLog`
  MODIFY COLUMN `month` varchar(7);
--> statement-breakpoint
ALTER TABLE `auditLog`
  ADD INDEX IF NOT EXISTS `idx_audit_participant` (`participantId`);
--> statement-breakpoint
ALTER TABLE `auditLog`
  ADD INDEX IF NOT EXISTS `idx_audit_created` (`createdAt`);