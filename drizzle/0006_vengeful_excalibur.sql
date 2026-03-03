-- Apenas as alterações novas — tabelas já existentes não são recriadas

-- participants: adicionar caixinhaId
ALTER TABLE `participants`
  ADD COLUMN `caixinhaId` int NOT NULL AFTER `id`,
  ADD INDEX `idx_participants_caixinha` (`caixinhaId`),
  ADD CONSTRAINT `participants_caixinhaId_fk`
    FOREIGN KEY (`caixinhaId`) REFERENCES `caixinhaMetadata`(`id`) ON DELETE CASCADE;

-- monthlyPayments: mudar paid de int para boolean, adicionar FK e uniqueIndex
ALTER TABLE `monthlyPayments`
  MODIFY COLUMN `month` varchar(7) NOT NULL,
  MODIFY COLUMN `paid` boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT `monthlyPayments_participantId_fk`
    FOREIGN KEY (`participantId`) REFERENCES `participants`(`id`) ON DELETE CASCADE,
  ADD UNIQUE INDEX `uq_payment_participant_month_year` (`participantId`, `month`, `year`);

-- transactions: adicionar novas colunas e FK
ALTER TABLE `transactions`
  MODIFY COLUMN `month` varchar(7),
  ADD COLUMN `balanceBefore` decimal(10,2) NOT NULL AFTER `amount`,
  ADD COLUMN `balanceAfter` decimal(10,2) NOT NULL AFTER `balanceBefore`,
  ADD COLUMN `idempotencyKey` varchar(36) UNIQUE AFTER `description`,
  ADD CONSTRAINT `transactions_participantId_fk`
    FOREIGN KEY (`participantId`) REFERENCES `participants`(`id`) ON DELETE CASCADE,
  ADD INDEX `idx_transactions_participant` (`participantId`),
  ADD INDEX `idx_transactions_period` (`participantId`, `month`, `year`);

-- monthlySummary: adicionar caixinhaId
ALTER TABLE `monthlySummary`
  MODIFY COLUMN `month` varchar(7) NOT NULL,
  ADD COLUMN `caixinhaId` int NOT NULL AFTER `id`,
  ADD CONSTRAINT `monthlySummary_caixinhaId_fk`
    FOREIGN KEY (`caixinhaId`) REFERENCES `caixinhaMetadata`(`id`) ON DELETE CASCADE,
  ADD UNIQUE INDEX `uq_summary_caixinha_month_year` (`caixinhaId`, `month`, `year`);

-- auditLog: adicionar FK e índices
ALTER TABLE `auditLog`
  MODIFY COLUMN `month` varchar(7),
  ADD CONSTRAINT `auditLog_participantId_fk`
    FOREIGN KEY (`participantId`) REFERENCES `participants`(`id`) ON DELETE RESTRICT,
  ADD INDEX `idx_audit_participant` (`participantId`),
  ADD INDEX `idx_audit_created` (`createdAt`);