-- ==============================================================================
-- DATABASE SCHEMA: Packaged Commodity Legal Metrology Compliance & Inspection System
-- Department: Ministry of Consumer Affairs, Food & Public Distribution (DoCA)
-- Engine: MySQL 8.0+ / MariaDB
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `legal_metrology` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `legal_metrology`;

-- 1. USERS TABLE (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('Admin', 'Inspector', 'Manufacturer', 'Seller', 'Consumer') NOT NULL DEFAULT 'Consumer',
    `phone` VARCHAR(20) NULL,
    `organization` VARCHAR(200) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_email` (`email`),
    INDEX `idx_user_role` (`role`)
) ENGINE=InnoDB;

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `standard_units` VARCHAR(100) DEFAULT 'g,kg,ml,l,N,U',
    INDEX `idx_cat_name` (`name`)
) ENGINE=InnoDB;

-- 3. PRODUCTS TABLE (Principal Display Panel Declarations)
CREATE TABLE IF NOT EXISTS `products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `product_name` VARCHAR(200) NOT NULL,
    `brand` VARCHAR(100) NULL,
    `category_id` INT NULL,
    `manufacturer_id` INT NULL,
    `manufacturer_name` VARCHAR(200) NULL,
    `manufacturer_address` TEXT NULL,
    `packer_name` VARCHAR(200) NULL,
    `importer_name` VARCHAR(200) NULL,
    `country_of_origin` VARCHAR(100) DEFAULT 'India',
    `batch_number` VARCHAR(100) NULL,
    `manufacturing_date` VARCHAR(50) NULL,
    `expiry_date` VARCHAR(50) NULL,
    `net_quantity` FLOAT NOT NULL DEFAULT 0.0,
    `unit` VARCHAR(20) NOT NULL DEFAULT 'g',
    `mrp` FLOAT NOT NULL DEFAULT 0.0,
    `mrp_declaration_text` VARCHAR(255) NULL,
    `unit_sale_price` VARCHAR(100) NULL,
    `customer_care_email` VARCHAR(150) NULL,
    `customer_care_phone` VARCHAR(50) NULL,
    `customer_care_address` TEXT NULL,
    `pdp_dimensions` VARCHAR(100) NULL,
    `image_path` VARCHAR(255) NULL,
    `label_image_path` VARCHAR(255) NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_prod_cat` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_prod_user` FOREIGN KEY (`manufacturer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_prod_name` (`product_name`),
    INDEX `idx_prod_brand` (`brand`)
) ENGINE=InnoDB;

-- 4. COMPLIANCE RULES TABLE (Configurable Dynamic Rule Engine)
CREATE TABLE IF NOT EXISTS `compliance_rules` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rule_code` VARCHAR(50) NOT NULL UNIQUE,
    `rule_name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(100) DEFAULT 'General Packaging',
    `field_to_check` VARCHAR(100) NOT NULL,
    `condition` VARCHAR(50) NOT NULL,
    `expected_value` TEXT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'HIGH',
    `weight` INT DEFAULT 10,
    `legal_reference` VARCHAR(150) NULL,
    `explanation` TEXT NULL,
    `recommended_action` TEXT NULL,
    `active` BOOLEAN DEFAULT TRUE,
    `effective_from` DATE NULL,
    `effective_to` DATE NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_rule_code` (`rule_code`),
    INDEX `idx_rule_active` (`active`)
) ENGINE=InnoDB;

-- 5. COMPLIANCE CHECKS TABLE
CREATE TABLE IF NOT EXISTS `compliance_checks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT NULL,
    `checked_by` INT NULL,
    `score` FLOAT NOT NULL DEFAULT 0.0,
    `status` ENUM('COMPLIANT', 'NON-COMPLIANT', 'NEEDS MANUAL REVIEW') NOT NULL,
    `passed_count` INT DEFAULT 0,
    `failed_count` INT DEFAULT 0,
    `warning_count` INT DEFAULT 0,
    `summary` TEXT NULL,
    `checked_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_check_prod` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_check_user` FOREIGN KEY (`checked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. COMPLIANCE RESULTS BREAKDOWN TABLE
CREATE TABLE IF NOT EXISTS `compliance_results` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `check_id` INT NOT NULL,
    `rule_id` INT NULL,
    `rule_code` VARCHAR(50) NOT NULL,
    `rule_name` VARCHAR(200) NULL,
    `legal_reference` VARCHAR(150) NULL,
    `result` ENUM('PASSED', 'FAILED', 'WARNING') NOT NULL,
    `severity` VARCHAR(20) DEFAULT 'HIGH',
    `actual_value` TEXT NULL,
    `expected_value` TEXT NULL,
    `explanation` TEXT NULL,
    `recommended_action` TEXT NULL,
    CONSTRAINT `fk_res_check` FOREIGN KEY (`check_id`) REFERENCES `compliance_checks` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_res_rule` FOREIGN KEY (`rule_id`) REFERENCES `compliance_rules` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 7. INSPECTIONS TABLE
CREATE TABLE IF NOT EXISTS `inspections` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `inspection_number` VARCHAR(100) NOT NULL UNIQUE,
    `product_id` INT NULL,
    `inspector_id` INT NOT NULL,
    `inspection_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `location` VARCHAR(255) NULL,
    `store_name` VARCHAR(200) NULL,
    `status` ENUM('PENDING', 'COMPLIANT', 'VIOLATION_FOUND', 'NOTICE_ISSUED', 'SEIZURE_RECOMMENDED') DEFAULT 'PENDING',
    `remarks` TEXT NULL,
    `evidence_image_path` VARCHAR(255) NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_insp_prod` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_insp_user` FOREIGN KEY (`inspector_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    INDEX `idx_insp_num` (`inspection_number`)
) ENGINE=InnoDB;

-- 8. VIOLATIONS TABLE (Section 36 Compoundable Offences)
CREATE TABLE IF NOT EXISTS `violations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `inspection_id` INT NOT NULL,
    `rule_id` INT NULL,
    `rule_code` VARCHAR(50) NULL,
    `description` TEXT NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'HIGH',
    `evidence` VARCHAR(255) NULL,
    `penalty_clause` VARCHAR(100) DEFAULT 'Section 36(1), Legal Metrology Act, 2009',
    `status` VARCHAR(50) DEFAULT 'OPEN',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_viol_insp` FOREIGN KEY (`inspection_id`) REFERENCES `inspections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. REPORTS TABLE
CREATE TABLE IF NOT EXISTS `reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `inspection_id` INT NOT NULL UNIQUE,
    `report_number` VARCHAR(100) NOT NULL UNIQUE,
    `report_path` VARCHAR(255) NOT NULL,
    `generated_by` INT NOT NULL,
    `generated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_rep_insp` FOREIGN KEY (`inspection_id`) REFERENCES `inspections` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rep_user` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 10. CONSUMER COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS `complaints` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `product_id` INT NULL,
    `complainant_name` VARCHAR(150) NOT NULL,
    `complainant_contact` VARCHAR(100) NULL,
    `product_name` VARCHAR(200) NOT NULL,
    `store_details` TEXT NULL,
    `complaint_type` VARCHAR(100) DEFAULT 'Overcharging (Above MRP)',
    `description` TEXT NOT NULL,
    `image_path` VARCHAR(255) NULL,
    `status` ENUM('SUBMITTED', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED') DEFAULT 'SUBMITTED',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_comp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_comp_prod` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 11. IMMUTABLE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `user_email` VARCHAR(150) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity` VARCHAR(100) NOT NULL,
    `entity_id` VARCHAR(100) NULL,
    `ip_address` VARCHAR(50) NULL,
    `details` TEXT NULL,
    `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_user` (`user_email`)
) ENGINE=InnoDB;
