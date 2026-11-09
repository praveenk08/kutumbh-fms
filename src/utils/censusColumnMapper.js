/**
 * @file censusColumnMapper.js
 * @module Utils/CensusColumnMapper
 * @description Maps 34-column census spreadsheet rows (Hindi/English) to MySQL schema.
 */

const normalizeKey = (key) => key ? key.trim().toLowerCase().replace(/\s+/g, '_') : '';

/**
 * Normalizes a raw spreadsheet row into clean Family and Member payloads.
 */
const mapCensusRow = (row) => {
  // Key extraction helper supporting both Hindi and English header variants
  const get = (keys, defaultValue = null) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
        return String(row[k]).trim();
      }
    }
    return defaultValue;
  };

  const familyToken = get(['परिवार कोड', 'family_token', 'familyToken', 'Family Code']);
  const headName = get(['परिवार प्रमुख का नाम', 'head_name', 'headName', 'Head Name']);
  const memberName = get(['सदस्य का नाम', 'full_name', 'fullName', 'Member Name']) || headName;

  const familyData = {
    familyToken,
    registerPageNo: get(['रजिस्टर पृष्ठ क्र.', 'register_page_no', 'Register Page No']),
    headName,
    guardianName: get(['पिता/पति का नाम', 'guardian_name', 'guardianName', 'Guardian Name']),
    contactNumber: get(['मूल मोबाइल नंबर', 'mobile_original', 'contactNumber', 'Mobile Number']),
    habitation: {
      state: get(['राज्य', 'state'], 'उत्तर प्रदेश'),
      district: get(['जिला', 'district'], 'बलिया'),
      tehsil: get(['तहसील', 'tehsil'], 'बलिया'),
      block: get(['विकास खण्ड', 'block'], 'दुबहड़'),
      gramPanchayat: get(['ग्राम पंचायत', 'gram_panchayat'], 'रुस्तमपुर'),
      village: get(['ग्राम', 'village'], 'रुस्तमपुर'),
      tolaMohalla: get(['टोला / मोहल्ला / पुरवा', 'tola_mohalla', 'tolaMohalla']),
    },
    socialCategory: get(['सामाजिक वर्ग', 'social_category', 'Category'], 'ST'),
    subCaste: get(['उपजाति', 'sub_caste', 'Sub Caste'], 'गोंड'),
    rationCardCategory: get(['राशन कार्ड श्रेणी', 'ration_card_category'], 'NONE'),
    surveyDate: get(['सर्वे / अपडेट तिथि', 'survey_date', 'Survey Date']),
    updatedBy: get(['किसने अपडेट किया', 'updated_by', 'Updated By']),
  };

  const memberData = {
    fullName: memberName,
    relationshipWithHead: get(['मुखिया से संबंध', 'relationship_with_head', 'Relationship'], 'स्वयं'),
    guardianOrFatherName: get(['पिता/पति का नाम', 'guardian_or_father_name', 'Father Name']),
    gender: get(['लिंग', 'gender', 'Gender'], 'पुरुष'),
    dob: get(['जन्मतिथि', 'dob', 'DOB']),
    age: parseInt(get(['उम्र', 'age', 'Age']), 10) || null,
    ageGroup: get(['आयु वर्ग', 'age_group', 'Age Group']),
    literacyStatus: get(['साक्षरता', 'literacy_status', 'Literacy']),
    educationLevel: get(['शिक्षा स्तर', 'education_level', 'education', 'Education']),
    occupation: get(['व्यवसाय', 'occupation', 'Occupation']),
    serviceSector: get(['नौकरी / सेवा क्षेत्र', 'service_sector', 'Service Sector']),
    mobileMasked: get(['मोबाइल नंबर', 'mobile_masked', 'Masked Mobile']),
    mobileOriginal: get(['मूल मोबाइल नंबर', 'mobile_original']),
    aadharLastFour: get(['आधार (अंतिम 4 अंक)', 'aadhar_last_four', 'Aadhaar Last 4']),
    currentResidenceStatus: get(['वर्तमान निवास स्थिति', 'current_residence_status', 'Residence Status']),
    lifeEventFlag: get(['जीवन-घटना फ्लैग', 'life_event_flag'], 'सक्रिय'),
    specialWelfareCategory: get(['विशेष कल्याण श्रेणी', 'special_welfare_category']),
    documentsStatus: get(['आवश्यक दस्तावेज स्थिति', 'documents_status']),
    benefitsAvailed: get(['सरकारी योजना / पेंशन लाभ', 'benefits_availed', 'Benefits']),
    surnameSymmetryId: get(['मूल वंश / पिता मानक कोड', 'surname_symmetry_id']),
    uniqueDisplayTag: get(['समान नाम पहचान टैग', 'unique_display_tag']),
    remarks: get(['रिमार्क / विशेष विवरण', 'remarks', 'Remarks']),
  };

  return { familyData, memberData };
};

module.exports = { mapCensusRow };