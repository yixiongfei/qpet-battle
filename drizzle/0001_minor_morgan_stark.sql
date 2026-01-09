CREATE TABLE `onlinePlayers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`petId` int NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`status` varchar(32) NOT NULL DEFAULT 'idle',
	`lastHeartbeat` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `onlinePlayers_id` PRIMARY KEY(`id`),
	CONSTRAINT `onlinePlayers_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `petSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`petId` int NOT NULL,
	`skillId` int NOT NULL,
	`learnedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `petSkills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`exp` int NOT NULL DEFAULT 0,
	`maxExp` int NOT NULL DEFAULT 100,
	`hp` int NOT NULL DEFAULT 100,
	`maxHp` int NOT NULL DEFAULT 100,
	`strength` int NOT NULL DEFAULT 10,
	`agility` int NOT NULL DEFAULT 5,
	`evolution` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playerStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalBattles` int NOT NULL DEFAULT 0,
	`totalWins` int NOT NULL DEFAULT 0,
	`currentWinStreak` int NOT NULL DEFAULT 0,
	`maxWinStreak` int NOT NULL DEFAULT 0,
	`totalGoldEarned` int NOT NULL DEFAULT 0,
	`totalExpEarned` int NOT NULL DEFAULT 0,
	`totalPotionsUsed` int NOT NULL DEFAULT 0,
	`weaponsCollected` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playerStats_id` PRIMARY KEY(`id`),
	CONSTRAINT `playerStats_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`description` text,
	`damage` int NOT NULL DEFAULT 0,
	`cooldown` int NOT NULL DEFAULT 0,
	`requiredLevel` int NOT NULL DEFAULT 1,
	`requiredEvolution` int NOT NULL DEFAULT 0,
	`icon` varchar(255) NOT NULL DEFAULT '⚔️',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skills_id` PRIMARY KEY(`id`)
);
