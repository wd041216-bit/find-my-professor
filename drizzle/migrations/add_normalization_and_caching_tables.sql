-- Migration: Add normalization and caching tables for AI-driven university/major identification
-- Date: 2026-02-04

-- 1. University normalization table
CREATE TABLE IF NOT EXISTS `university_normalization` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `raw_input` VARCHAR(255) NOT NULL UNIQUE,
  `normalized_name` VARCHAR(255) NOT NULL,
  `university_id` INT,
  `identified_by_llm` BOOLEAN DEFAULT TRUE,
  `llm_model` VARCHAR(50),
  `llm_confidence` DECIMAL(3, 2),
  `llm_reasoning` TEXT,
  `aliases` TEXT, -- JSON array
  `country` VARCHAR(100),
  `region` VARCHAR(100),
  `usage_count` INT DEFAULT 1,
  `last_used_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_normalized_name` (`normalized_name`),
  INDEX `idx_university_id` (`university_id`),
  INDEX `idx_llm_confidence` (`llm_confidence`),
  INDEX `idx_usage_count` (`usage_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Major normalization table
CREATE TABLE IF NOT EXISTS `major_normalization` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `raw_input` VARCHAR(255) NOT NULL UNIQUE,
  `normalized_name` VARCHAR(255) NOT NULL,
  `major_category` VARCHAR(100),
  `major_field` VARCHAR(100),
  `identified_by_llm` BOOLEAN DEFAULT TRUE,
  `llm_model` VARCHAR(50),
  `llm_confidence` DECIMAL(3, 2),
  `llm_reasoning` TEXT,
  `aliases` TEXT, -- JSON array
  `related_majors` TEXT, -- JSON array
  `usage_count` INT DEFAULT 1,
  `last_used_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_normalized_name` (`normalized_name`),
  INDEX `idx_major_field` (`major_field`),
  INDEX `idx_llm_confidence` (`llm_confidence`),
  INDEX `idx_usage_count` (`usage_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. User input history table
CREATE TABLE IF NOT EXISTS `user_input_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `input_type` ENUM('university', 'major', 'skill', 'interest') NOT NULL,
  `raw_input` VARCHAR(255) NOT NULL,
  `normalized_id` INT,
  `normalized_value` VARCHAR(255),
  `llm_confidence` DECIMAL(3, 2),
  `was_corrected` BOOLEAN DEFAULT FALSE,
  `user_feedback` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_input_type` (`input_type`),
  INDEX `idx_normalized_id` (`normalized_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. University-major mapping table
CREATE TABLE IF NOT EXISTS `university_major_mapping` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `university_id` INT NOT NULL,
  `major_id` INT NOT NULL,
  `is_available` BOOLEAN DEFAULT TRUE,
  `ranking` INT,
  `project_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_university_major` (`university_id`, `major_id`),
  INDEX `idx_university_id` (`university_id`),
  INDEX `idx_major_id` (`major_id`),
  INDEX `idx_is_available` (`is_available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. University-major cache table (for on-demand scraping)
CREATE TABLE IF NOT EXISTS `university_major_cache` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `university_id` INT NOT NULL,
  `major_name` VARCHAR(255) NOT NULL,
  `academic_level` ENUM('high_school', 'undergraduate', 'graduate') NOT NULL,
  `cached_project_count` INT DEFAULT 0,
  `cached_lab_count` INT DEFAULT 0,
  `cached_professor_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `cached_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP DEFAULT (DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY)),
  `cache_status` ENUM('pending', 'scraping', 'completed', 'failed') DEFAULT 'pending',
  `last_error_message` TEXT,
  `request_count` INT DEFAULT 0,
  `last_requested_at` TIMESTAMP,
  UNIQUE KEY `unique_cache` (`university_id`, `major_name`, `academic_level`),
  INDEX `idx_expires_at` (`expires_at`),
  INDEX `idx_cache_status` (`cache_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Scraping tasks table
CREATE TABLE IF NOT EXISTS `scraping_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `university_id` INT NOT NULL,
  `major_name` VARCHAR(255) NOT NULL,
  `academic_level` ENUM('high_school', 'undergraduate', 'graduate'),
  `status` ENUM('queued', 'running', 'completed', 'failed') DEFAULT 'queued',
  `priority` INT DEFAULT 0,
  `started_at` TIMESTAMP NULL,
  `completed_at` TIMESTAMP NULL,
  `error_message` TEXT,
  `projects_scraped` INT DEFAULT 0,
  `labs_scraped` INT DEFAULT 0,
  `professors_scraped` INT DEFAULT 0,
  `requested_by_user_id` INT,
  `requested_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_university_major` (`university_id`, `major_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Scraped projects table
CREATE TABLE IF NOT EXISTS `scraped_projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `source_url` VARCHAR(500),
  `source_type` ENUM('university_website', 'lab_website', 'research_database') DEFAULT 'university_website',
  `university_id` INT NOT NULL,
  `professor_id` INT,
  `lab_name` VARCHAR(255),
  `project_title` VARCHAR(500) NOT NULL,
  `project_description` TEXT,
  `major_name` VARCHAR(255),
  `research_areas` TEXT, -- JSON array
  `requirements` TEXT, -- JSON array
  `is_active` BOOLEAN DEFAULT TRUE,
  `scraping_task_id` INT,
  `scraped_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP DEFAULT (DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY)),
  INDEX `idx_university_major` (`university_id`, `major_name`),
  INDEX `idx_expires_at` (`expires_at`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add new columns to student_profiles table for normalized IDs
ALTER TABLE `student_profiles` 
  ADD COLUMN `current_university_id` INT AFTER `current_university`,
  ADD COLUMN `current_major_id` INT AFTER `current_major`,
  ADD COLUMN `target_university_ids` TEXT AFTER `target_universities`, -- JSON array of IDs
  ADD COLUMN `target_major_ids` TEXT AFTER `target_majors`; -- JSON array of IDs

-- Add indexes for the new columns
ALTER TABLE `student_profiles`
  ADD INDEX `idx_current_university_id` (`current_university_id`),
  ADD INDEX `idx_current_major_id` (`current_major_id`);

-- Add aliases column to universities table
ALTER TABLE `universities`
  ADD COLUMN `aliases` TEXT AFTER `name`, -- JSON array
  ADD COLUMN `region` VARCHAR(100) AFTER `country`;
