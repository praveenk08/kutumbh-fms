-- Database Charset Configuration (हिंदी, अंग्रेजी एवं इमोजी सपोर्ट के लिए)
ALTER DATABASE kutumbh_fms CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 1. FAMILIES TABLE (परिवार / आवास स्तर का डेटा)
CREATE TABLE IF NOT EXISTS families (
    id INT AUTO_INCREMENT PRIMARY KEY,
    family_token VARCHAR(50) NOT NULL UNIQUE,       -- परिवार कोड (FAM-001 / BAL-2026-XXXX)
    register_page_no VARCHAR(50) NULL,             -- रजिस्टर पृष्ठ क्र.
    head_name VARCHAR(150) NOT NULL,               -- परिवार प्रमुख का नाम
    guardian_name VARCHAR(150) NULL,               -- अभिभावक का नाम
    contact_number VARCHAR(20) NULL,               -- संपर्क नंबर
    
    -- प्रशासनिक / भौगोलिक स्थान (Habitation)
    state VARCHAR(100) DEFAULT 'उत्तर प्रदेश',
    district VARCHAR(100) DEFAULT 'बलिया',
    tehsil VARCHAR(100) DEFAULT 'बलिया',
    block VARCHAR(100) DEFAULT 'दुबहड़',
    gram_panchayat VARCHAR(100) DEFAULT 'रुस्तमपुर',
    village VARCHAR(100) DEFAULT 'रुस्तमपुर',
    habitation_name VARCHAR(150) NULL,
    tola_mohalla VARCHAR(150) NULL,                -- टोला / मोहल्ला / पुरवा
    
    -- सामाजिक एवं आर्थिक प्रोफाइल
    social_category VARCHAR(50) DEFAULT 'ST',      -- सामाजिक वर्ग (ST/SC/OBC/GEN)
    sub_caste VARCHAR(100) DEFAULT 'गोंड',          -- उपजाति
    ration_card_category VARCHAR(50) DEFAULT 'NONE',
    annual_income DECIMAL(12, 2) DEFAULT 0.00,
    
    -- परिवार स्तर की स्थिति
    total_members INT DEFAULT 0,
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
    verified_by VARCHAR(100) NULL,
    verified_at TIMESTAMP NULL,
    
    -- सर्वे एवं ऑडिट मेटाडेटा
    survey_date VARCHAR(50) NULL,
    updated_by VARCHAR(150) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_family_token (family_token),
    INDEX idx_village_block (village, block),
    INDEX idx_head_name (head_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. MEMBERS TABLE (व्यक्तिगत सदस्य स्तर का डेटा)
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    family_id INT NOT NULL,
    family_token VARCHAR(50) NOT NULL,
    member_ref_id VARCHAR(70) NOT NULL UNIQUE,     -- FAM-001-M01
    
    -- व्यक्तिगत पहचान
    full_name VARCHAR(150) NOT NULL,               -- सदस्य का नाम
    relationship_with_head VARCHAR(100) NOT NULL,  -- मुखिया से संबंध
    guardian_or_father_name VARCHAR(150) NULL,     -- पिता/पति का नाम
    gender VARCHAR(20) NOT NULL,                   -- लिंग (पुरुष / महिला / अन्य / MALE / FEMALE)
    
    -- आयु एवं जन्म विवरण
    dob VARCHAR(50) NULL,                          -- जन्मतिथि
    age INT NULL,                                  -- उम्र
    age_group VARCHAR(50) NULL,                    -- आयु वर्ग
    
    -- शिक्षा एवं आजीविका
    literacy_status VARCHAR(100) NULL,             -- साक्षरता
    education_level VARCHAR(100) NULL,             -- शिक्षा स्तर
    education VARCHAR(100) NULL,                   -- backward compatibility alias
    occupation VARCHAR(150) NULL,                  -- व्यवसाय
    service_sector VARCHAR(150) NULL,              -- नौकरी / सेवा क्षेत्र
    
    -- संपर्क एवं पहचान
    mobile_masked VARCHAR(20) NULL,                -- मास्क किया हुआ मोबाइल
    mobile_original VARCHAR(20) NULL,              -- मूल मोबाइल (Admin only)
    aadhar_last_four VARCHAR(10) NULL,             -- आधार अंतिम 4 अंक
    
    -- सामाजिक कल्याण एवं जीवन घटना
    current_residence_status VARCHAR(100) NULL,    -- वर्तमान निवास स्थिति
    life_event_flag VARCHAR(50) DEFAULT 'सक्रिय',  -- जीवन-घटना फ्लैग
    special_welfare_category VARCHAR(150) NULL,    -- विशेष कल्याण श्रेणी
    documents_status VARCHAR(200) NULL,            -- आवश्यक दस्तावेज स्थिति
    benefits_availed TEXT NULL,                    -- सरकारी योजना / पेंशन लाभ
    
    -- वंशावली एवं लिंकिंग कोड
    surname_symmetry_id VARCHAR(100) NULL,         -- मूल वंश / पिता मानक कोड
    unique_display_tag VARCHAR(150) NULL,          -- समान नाम पहचान टैग
    
    -- स्थिति & रिमार्क
    is_active BOOLEAN DEFAULT TRUE,
    remarks TEXT NULL,
    
    -- भविष्य के किसी भी नए कॉलम को बिना एरर रखने के लिए
    additional_attributes JSON NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    INDEX idx_family_token (family_token),
    INDEX idx_member_ref (member_ref_id),
    INDEX idx_full_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;