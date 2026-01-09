ALTER TABLE `pets` ADD `mp` int DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `pets` ADD `maxMp` int DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `pets` ADD `imageUrl` varchar(255);--> statement-breakpoint
ALTER TABLE `skills` ADD `mpCost` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `skills` ADD `mpRestore` int DEFAULT 0 NOT NULL;