ALTER TABLE `user_credits` ADD `credits` int DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_credits` ADD `last_reset_date` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `user_credits` DROP COLUMN `balance`;--> statement-breakpoint
ALTER TABLE `user_credits` DROP COLUMN `total_purchased`;--> statement-breakpoint
ALTER TABLE `user_credits` DROP COLUMN `stripe_customer_id`;