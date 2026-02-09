CREATE TABLE `student_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`professor_id` int NOT NULL,
	`like_type` varchar(20) NOT NULL DEFAULT 'like',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `student_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_likes_student_id_professor_id_unique` UNIQUE(`student_id`,`professor_id`)
);
--> statement-breakpoint
CREATE TABLE `student_swipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`professor_id` int NOT NULL,
	`action` varchar(20) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `student_swipes_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_swipes_student_id_professor_id_unique` UNIQUE(`student_id`,`professor_id`)
);
--> statement-breakpoint
ALTER TABLE `student_likes` ADD CONSTRAINT `student_likes_student_id_users_id_fk` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_likes` ADD CONSTRAINT `student_likes_professor_id_professors_id_fk` FOREIGN KEY (`professor_id`) REFERENCES `professors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_swipes` ADD CONSTRAINT `student_swipes_student_id_users_id_fk` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_swipes` ADD CONSTRAINT `student_swipes_professor_id_professors_id_fk` FOREIGN KEY (`professor_id`) REFERENCES `professors`(`id`) ON DELETE no action ON UPDATE no action;