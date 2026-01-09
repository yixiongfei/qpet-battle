CREATE TABLE `battleInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inviterId` int NOT NULL,
	`inviteeId` int NOT NULL,
	`status` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
	`battleId` varchar(255),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `battleInvites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playerStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isOnline` int NOT NULL DEFAULT 0,
	`currentStatus` enum('idle','matching','inBattle','offline') NOT NULL DEFAULT 'offline',
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playerStatus_id` PRIMARY KEY(`id`),
	CONSTRAINT `playerStatus_userId_unique` UNIQUE(`userId`)
);
