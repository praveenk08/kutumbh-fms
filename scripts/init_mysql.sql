CREATE DATABASE IF NOT EXISTS kutumbh_fms;
USE kutumbh_fms;

-- Families Table
CREATE TABLE IF NOT EXISTS families (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_token VARCHAR(50) NOT NULL UNIQUE,
  head_name VARCHAR(150) NOT NULL,
  guardian_name VARCHAR(150) NOT NULL,
  contact_number VARCHAR(15) NULL,
  state VARCHAR(100) DEFAULT 'Uttar Pradesh',
  district VARCHAR(100) DEFAULT 'Ballia',
  block VARCHAR(100) DEFAULT 'Dubahar',
  village VARCHAR(100) NOT NULL,
  habitation_name VARCHAR(150) NULL,
  ration_card_category ENUM('AAY', 'BPL', 'APL', 'NONE') DEFAULT 'NONE',
  annual_income DECIMAL(12, 2) DEFAULT 0.00,
  verification_status ENUM('PENDING', 'VERIFIED', 'FLAGGED_FOR_REVIEW', 'REJECTED') DEFAULT 'PENDING',
  verified_at DATETIME NULL,
  verified_by VARCHAR(100) NULL,
  total_members INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_village (village),
  INDEX idx_status (verification_status),
  INDEX idx_ration (ration_card_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Members Table
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  family_token VARCHAR(50) NOT NULL,
  member_ref_id VARCHAR(60) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
  dob DATE NULL,
  relationship_with_head VARCHAR(50) NOT NULL,
  marital_status VARCHAR(50) NULL,
  education VARCHAR(100) NULL,
  occupation VARCHAR(100) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  remarks TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  INDEX idx_family_token (family_token),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;