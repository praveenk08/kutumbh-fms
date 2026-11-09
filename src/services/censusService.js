const xlsx = require('xlsx');

class CensusService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Buffer parse logic: Target specific tab 'जनगणना_डेटा'
   */
  parseBuffer(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
    const targetTab = 'जनगणना_डेटा';

    // Target tab check karein, agar na mile to default pehli sheet
    const sheetName = workbook.SheetNames.includes(targetTab)
      ? targetTab
      : workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error(`शीट '${targetTab}' उपलब्ध नहीं है।`);
    }

    return xlsx.utils.sheet_to_json(worksheet, { defval: null });
  }

  /**
   * Transactional Bulk Import (34 Columns Mapping)
   */
  async importCensusBuffer(buffer, originalname) {
    const rows = this.parseBuffer(buffer);
    if (!rows.length) {
      throw new Error('फ़ाइल में कोई वैध रिकॉर्ड नहीं मिला।');
    }

    const mappedRecords = rows.map((r) => [
      r['क्रम सं.'] || null,
      r['रजिस्टर पृष्ठ क्र.'] || null,
      r['परिवार कोड'] || '',
      r['ग्राम'] || '',
      r['ग्राम पंचायत'] || '',
      r['विकास खण्ड'] || '',
      r['तहसील'] || '',
      r['जिला'] || '',
      r['परिवार प्रमुख का नाम'] || '',
      r['सदस्य का नाम'] || '',
      r['मुखिया से संबंध'] || '',
      r['पिता/पति का नाम'] || null,
      r['लिंग'] || 'पुरुष',
      r['सामाजिक वर्ग'] || 'ST',
      r['उपजाति'] || null,
      r['उम्र'] ? parseInt(r['उम्र'], 10) : null,
      r['आयु वर्ग'] || null,
      r['व्यवसाय'] || null,
      r['साक्षरता'] || null,
      r['मोबाइल नंबर'] || null,
      r['वर्तमान निवास स्थिति'] || null,
      r['जीवन-घटना फ्लैग (+1/-1)'] || '🟢 सक्रिय',
      r['किसने अपडेट किया (Updated By)'] || null,
      r['जन्मतिथि (DOB - DD/MM/YYYY)'] || null,
      r['शिक्षा स्तर (Education Level)'] || null,
      r['नौकरी / सेवा क्षेत्र (Service Sector)'] || null,
      r['विशेष कल्याण श्रेणी (PwD / विधवा / 60+ वृद्ध)'] || null,
      r['आवश्यक दस्तावेज स्थिति (Documents)'] || null,
      r['सरकारी योजना / पेंशन लाभ (Benefits)'] || null,
      r['🔒 आधार (अंतिम 4 अंक)'] || null,
      r['मूल वंश / पिता मानक कोड (Surname Symmetry ID)'] || null,
      r['समान नाम पहचान टैग (Unique Display Tag)'] || null,
      r['📅 सर्वे / अपडेट तिथि (DD/MM/YYYY कैलेंडर)'] || null,
      r['🔒 मूल मोबाइल नंबर (Admin Only)'] || null,
    ]);

    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      const chunkSize = 500;
      const query = `
        INSERT INTO census_records (
          serial_no, register_page_no, family_code, village, gram_panchayat,
          block, tehsil, district, head_name, member_name,
          relation_with_head, guardian_name, gender, social_category, sub_caste,
          age, age_group, occupation, literacy, masked_mobile,
          current_residence, life_event_flag, updated_by, dob, education_level,
          service_sector, special_welfare_category, document_status, govt_benefits,
          aadhaar_last_four, lineage_code, display_tag, survey_date, admin_mobile
        ) VALUES ?
      `;

      for (let i = 0; i < mappedRecords.length; i += chunkSize) {
        const batch = mappedRecords.slice(i, i + chunkSize);
        await conn.query(query, [batch]);
      }

      await conn.commit();
      return { totalRowsInFile: rows.length, insertedRows: mappedRecords.length };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Export to Buffer (Single Tab with UTF-8 BOM protection)
   */
  async exportCensusBuffer(format = 'xlsx') {
    const [rows] = await this.pool.query(
      `SELECT * FROM census_records ORDER BY serial_no ASC, id ASC`
    );

    const formattedData = rows.map((r) => ({
      'क्रम सं.': r.serial_no,
      'रजिस्टर पृष्ठ क्र.': r.register_page_no,
      'परिवार कोड': r.family_code,
      'ग्राम': r.village,
      'ग्राम पंचायत': r.gram_panchayat,
      'विकास खण्ड': r.block,
      'तहसील': r.tehsil,
      'जिला': r.district,
      'परिवार प्रमुख का नाम': r.head_name,
      'सदस्य का नाम': r.member_name,
      'मुखिया से संबंध': r.relation_with_head,
      'पिता/पति का नाम': r.guardian_name,
      'लिंग': r.gender,
      'सामाजिक वर्ग': r.social_category,
      'उपजाति': r.sub_caste,
      'उम्र': r.age,
      'आयु वर्ग': r.age_group,
      'व्यवसाय': r.occupation,
      'साक्षरता': r.literacy,
      'मोबाइल नंबर': r.masked_mobile,
      'वर्तमान निवास स्थिति': r.current_residence,
      'जीवन-घटना फ्लैग (+1/-1)': r.life_event_flag,
      'किसने अपडेट किया (Updated By)': r.updated_by,
      'जन्मतिथि (DOB - DD/MM/YYYY)': r.dob,
      'शिक्षा स्तर (Education Level)': r.education_level,
      'नौकरी / सेवा क्षेत्र (Service Sector)': r.service_sector,
      'विशेष कल्याण श्रेणी (PwD / विधवा / 60+ वृद्ध)': r.special_welfare_category,
      'आवश्यक दस्तावेज स्थिति (Documents)': r.document_status,
      'सरकारी योजना / पेंशन लाभ (Benefits)': r.govt_benefits,
      '🔒 आधार (अंतिम 4 अंक)': r.aadhaar_last_four,
      'मूल वंश / पिता मानक कोड (Surname Symmetry ID)': r.lineage_code,
      'समान नाम पहचान टैग (Unique Display Tag)': r.display_tag,
      '📅 सर्वे / अपडेट तिथि (DD/MM/YYYY कैलेंडर)': r.survey_date,
      '🔒 मूल मोबाइल नंबर (Admin Only)': r.admin_mobile,
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(formattedData);
    xlsx.utils.book_append_sheet(wb, ws, 'जनगणना_डेटा');

    if (format === 'csv') {
      const csvString = xlsx.utils.sheet_to_csv(ws);
      return Buffer.concat([Buffer.from('\ufeff', 'utf-8'), Buffer.from(csvString, 'utf-8')]);
    }

    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}

module.exports = CensusService;