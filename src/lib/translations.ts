export type Language = 'en' | 'hi' | 'as';

export interface RegionalInfo {
  city: string;
  district: string;
  state: string;
  country: string;
  pinCodes: string;
  localGreeting: string;
  tagline: string;
}

export const REGIONAL_METADATA: Record<Language, RegionalInfo> = {
  en: {
    city: 'Guwahati',
    district: 'Kamrup Metropolitan',
    state: 'Assam',
    country: 'India',
    pinCodes: '781001 - 781039',
    localGreeting: 'Welcome to Guwahati!',
    tagline: 'Your fitness, our commitment.'
  },
  hi: {
    city: 'गुवाहाटी',
    district: 'कामरूप मेट्रोपॉलिटन',
    state: 'असम',
    country: 'भारत',
    pinCodes: '781001 - 781039',
    localGreeting: 'नमस्ते गुवाहाटी!',
    tagline: 'आपकी सेहत, हमारा संकल्प।'
  },
  as: {
    city: 'গুৱাহাটী',
    district: 'কামৰূপ মহানগৰ',
    state: 'অসম',
    country: 'ভাৰত',
    pinCodes: '৭৮১০০১ - ৭৮১০৩৯',
    localGreeting: 'নমস্কাৰ গুৱাহাটী!',
    tagline: 'আপোনাৰ স্বাস্থ্য, আমাৰ সংকল্প।'
  }
};

export const translations = {
  en: {
    // App header & layout
    app_title: 'Gym Addict 2.0',
    app_subtitle: 'Guwahati, Assam',
    local_badge: 'Guwahati Edition',
    nav_members: 'Members',
    nav_chase: 'Chase List',
    nav_stats: 'Stats',
    nav_trash: 'Trash',
    nav_activity: 'Activity',
    nav_settings: 'Settings',
    nav_logout: 'Log out',
    role_owner: 'Owner',
    role_subadmin: 'Trainer / Subadmin',
    role_member: 'Member',
    loading: 'Loading...',

    // Settings page
    settings_title: 'Settings',
    settings_subtitle: 'Configure gym operations, plans, and regional Guwahati preferences.',
    general_settings: 'General Settings',
    gym_name: 'Gym Name',
    grace_days: 'Grace Period (Days)',
    admission_fee: 'Global Admission Fee (₹)',
    general_group: 'General WhatsApp Group URL',
    trainer_group: 'Trainer WhatsApp Group URL',
    save_settings_btn: 'Save Settings',
    saved_alert: 'Settings saved successfully!',

    // Regional & WhatsApp section
    language_section_title: 'Regional & WhatsApp Reminders (Guwahati, Assam)',
    regional_whatsapp_title: 'Regional & WhatsApp Reminders (Guwahati, Assam)',
    regional_whatsapp_desc: 'WhatsApp reminder templates with authentic Guwahati local phrasing.',
    region_label: 'Region & Area',
    location_details: 'Guwahati, Kamrup Metro, Assam (India)',
    local_greeting_label: 'Local Greeting',
    tagline_label: 'Tagline / Motto',
    whatsapp_language_pref: 'Default WhatsApp Reminder Language',
    whatsapp_lang_desc: 'Messages generated in Chase List will use this language by default with Guwahati phrasing.',
    template_preview_title: 'WhatsApp Reminder Message Previews',
    due_soon_preview: 'Due Soon Reminder',
    due_today_preview: 'Due Today Reminder',
    overdue_preview: 'Overdue Reminder',

    // Manage Plans
    manage_plans: 'Manage Plans',
    plan_name: 'Plan Name',
    months: 'Months',
    price: 'Price (₹)',
    add_plan: 'Add Plan',
    no_plans_yet: 'No plans created yet.',

    // Subadmins
    subadmins_title: 'Sub-Admins / Trainers',
    subadmins_desc: 'Trainers and sub-administrators who can assist in gym management.',
    trainer_name_label: 'Trainer Name',
    trainer_email_label: 'Trainer Email',
    invite_btn: 'Invite',
    no_subadmins_yet: 'No sub-admins found.',

    // Admin Tools
    admin_tools: 'Admin Tools',
    activity_log_desc: 'View recent actions',
    trash_desc: 'Restore or delete members',

    // Members page
    members_title: 'Members',
    add_member: 'Add Member',
    search_placeholder: 'Search by name or phone...',
    filter_all: 'All',
    filter_paid: 'Paid',
    filter_due_soon: 'Due soon',
    filter_due: 'Due',
    filter_overdue: 'Overdue',
    filter_frozen: 'Frozen',
    filter_trainer_clients: 'Trainer clients',
    no_members_found: 'No members found.',
    edit: 'Edit',
    upgrade: 'Upgrade',
    delete_archive: 'Archive',
    status_active: 'Active',
    status_due_soon: 'Due Soon',
    status_due: 'Due Today',
    status_overdue: 'Overdue',
    status_frozen: 'Frozen',

    // Table headers & fields
    name: 'Name',
    phone: 'Phone',
    plan: 'Plan',
    status: 'Status',
    next_due: 'Next Due',
    actions: 'Actions',

    // Chase list
    chase_title: "Today's Chase List",
    chase_subtitle: 'Members who require WhatsApp reminders today in Guwahati.',
    chase_no_reminders: 'No reminders needed today. Great job!',
    due_date_label: 'Due',
    today: 'Today',
    days_late: 'days late',
    in_days: 'In {n} days',
    sent_badge: 'Sent',
    send_whatsapp: 'WhatsApp',
    quick_pay_upi: 'UPI',
    quick_pay_cash: 'Cash',
    reminder_lang_selector: 'Reminder Language',

    // Receipt page
    payment_receipt: 'PAYMENT RECEIPT',
    billed_to: 'Billed To:',
    receipt_no: 'Receipt No:',
    date_label: 'Date:',
    description_label: 'Description',
    amount_label: 'Amount',
    gym_membership: 'Gym Membership',
    trainer_fee_label: 'Personal Trainer Fee',
    total_label: 'Total:',
    paid_via: 'Paid via',
    thank_you: 'Thank you for choosing us in Guwahati!',
    computer_generated: 'This is a computer-generated receipt.',
    print_pdf: 'Print to PDF',

    // Member portal
    member_portal: 'Member Portal',
    personal_info: 'Personal Info',
    membership_plan: 'Membership Plan',
    next_due_date: 'Next Due Date',
    phone_number: 'Phone Number',
    personal_trainer: 'Personal Trainer',
    payment_receipts: 'Payment Receipts',
    whatsapp_community: 'WhatsApp Community',
    community_scan_hint: 'Scan this code to join our Guwahati gym community.',
    download_btn: 'Download',

    // Confirmation & common
    cancel: 'Cancel',
    confirm: 'Confirm'
  },

  hi: {
    // App header & layout
    app_title: 'जिम एडिक्ट 2.0',
    app_subtitle: 'गुवाहाटी, असम',
    local_badge: 'गुवाहाटी संस्करण',
    nav_members: 'सदस्य',
    nav_chase: 'चेज़ लिस्ट',
    nav_stats: 'आँकड़े',
    nav_trash: 'ट्रैश',
    nav_activity: 'गतिविधि',
    nav_settings: 'सेटिंग्स',
    nav_logout: 'लॉग आउट',
    role_owner: 'मालिक (Owner)',
    role_subadmin: 'ट्रेनर / सब-एडमिन',
    role_member: 'सदस्य',
    loading: 'लोड हो रहा है...',

    // Settings page
    settings_title: 'सेटिंग्स',
    settings_subtitle: 'जिम संचालन, प्लान और गुवाहाटी क्षेत्रीय सेटिंग्स कॉन्फ़िगर करें।',
    general_settings: 'सामान्य सेटिंग्स',
    gym_name: 'जिम का नाम',
    grace_days: 'ग्रेस पीरियड (दिन)',
    admission_fee: 'प्रवेश शुल्क (₹)',
    general_group: 'सामान्य व्हाट्सएप ग्रुप लिंक',
    trainer_group: 'ट्रेनर व्हाट्सएप ग्रुप लिंक',
    save_settings_btn: 'सेटिंग्स सुरक्षित करें',
    saved_alert: 'सेटिंग्स सफलतापूर्वक सुरक्षित कर ली गईं!',

    // Regional & WhatsApp section
    language_section_title: 'क्षेत्रीय और व्हाट्सएप रिमाइंडर (गुवाहाटी, असम)',
    regional_whatsapp_title: 'क्षेत्रीय और व्हाट्सएप रिमाइंडर (गुवाहाटी, असम)',
    regional_whatsapp_desc: 'गुवाहाटी की स्थानीय शैली के साथ व्हाट्सएप संदेश टेम्प्लेट।',
    region_label: 'क्षेत्र और स्थान',
    location_details: 'गुवाहाटी, कामरूप मेट्रोपॉलिटन, असम (भारत)',
    local_greeting_label: 'स्थानीय अभिवादन',
    tagline_label: 'आदर्श वाक्य / ध्येय',
    whatsapp_language_pref: 'व्हाट्सएप रिमाइंडर की डिफ़ॉल्ट भाषा',
    whatsapp_lang_desc: 'चेज़ लिस्ट में संदेश डिफ़ॉल्ट रूप से गुवाहाटी शैली में इस भाषा का उपयोग करेंगे।',
    template_preview_title: 'व्हाट्सएप रिमाइंडर संदेश पूर्वावलोकन',
    due_soon_preview: 'जल्द देय का रिमाइंडर',
    due_today_preview: 'आज देय का रिमाइंडर',
    overdue_preview: 'बकाया का रिमाइंडर',

    // Manage Plans
    manage_plans: 'प्लान प्रबंधन',
    plan_name: 'प्लान का नाम',
    months: 'महीने',
    price: 'कीमत (₹)',
    add_plan: 'प्लान जोड़ें',
    no_plans_yet: 'अभी तक कोई प्लान नहीं बनाया गया।',

    // Subadmins
    subadmins_title: 'सब-एडमिन / ट्रेनर',
    subadmins_desc: 'ट्रेनर और सब-एडमिन जो जिम प्रबंधन में सहायता कर सकते हैं।',
    trainer_name_label: 'ट्रेनर का नाम',
    trainer_email_label: 'ट्रेनर का ईमेल',
    invite_btn: 'आमंत्रित करें',
    no_subadmins_yet: 'कोई सब-एडमिन नहीं मिला।',

    // Admin Tools
    admin_tools: 'एडमिन टूल्स',
    activity_log_desc: 'हाल की गतिविधियां देखें',
    trash_desc: 'सदस्यों को पुनर्स्थापित या हटाएं',

    // Members page
    members_title: 'सदस्य सूची',
    add_member: 'नया सदस्य जोड़ें',
    search_placeholder: 'नाम या फ़ोन नंबर से खोजें...',
    filter_all: 'सभी',
    filter_paid: 'सक्रिय / भुगतान किया',
    filter_due_soon: 'जल्द देय',
    filter_due: 'आज देय',
    filter_overdue: 'बकाया',
    filter_frozen: 'फ्रीज',
    filter_trainer_clients: 'ट्रेनर के सदस्य',
    no_members_found: 'कोई सदस्य नहीं मिला।',
    edit: 'संपादित करें',
    upgrade: 'ट्रेनर बनाएं',
    delete_archive: 'आर्काइव',
    status_active: 'सक्रिय',
    status_due_soon: 'जल्द देय',
    status_due: 'आज देय',
    status_overdue: 'बकाया',
    status_frozen: 'फ्रीज',

    // Table headers & fields
    name: 'नाम',
    phone: 'फ़ोन',
    plan: 'प्लान',
    status: 'स्थिति',
    next_due: 'अगली देय तिथि',
    actions: 'कार्रवाई',

    // Chase list
    chase_title: 'आज की चेज़ लिस्ट',
    chase_subtitle: 'गुवाहाटी के सदस्य जिन्हें आज व्हाट्सएप पर फीस अनुस्मारक की आवश्यकता है।',
    chase_no_reminders: 'आज किसी रिमाइंडर की आवश्यकता नहीं है। बहुत बढ़िया!',
    due_date_label: 'देय',
    today: 'आज',
    days_late: 'दिन देरी',
    in_days: '{n} दिनों में',
    sent_badge: 'भेज दिया',
    send_whatsapp: 'व्हाट्सएप',
    quick_pay_upi: 'यूपीआई',
    quick_pay_cash: 'नकद',
    reminder_lang_selector: 'संदेश भाषा',

    // Receipt page
    payment_receipt: 'भुगतान रसीद',
    billed_to: 'बिल प्राप्तकर्ता:',
    receipt_no: 'रसीद संख्या:',
    date_label: 'दिनांक:',
    description_label: 'विवरण',
    amount_label: 'राशि',
    gym_membership: 'जिम सदस्यता',
    trainer_fee_label: 'पर्सनल ट्रेनर शुल्क',
    total_label: 'कुल योग:',
    paid_via: 'भुगतान माध्यम',
    thank_you: 'गुवाहाटी में हमारे साथ जुड़ने के लिए धन्यवाद!',
    computer_generated: 'यह एक कंप्यूटर जनित रसीद है।',
    print_pdf: 'प्रिंट / पीडीएफ',

    // Member portal
    member_portal: 'सदस्य पोर्टल',
    personal_info: 'व्यक्तिगत जानकारी',
    membership_plan: 'सदस्यता प्लान',
    next_due_date: 'अगली देय तिथि',
    phone_number: 'फ़ोन नंबर',
    personal_trainer: 'पर्सनल ट्रेनर',
    payment_receipts: 'भुगतान रसीदें',
    whatsapp_community: 'व्हाट्सएप कम्युनिटी',
    community_scan_hint: 'हमारे गुवाहाटी जिम ग्रुप में शामिल होने के लिए स्कैन करें।',
    download_btn: 'डाउनलोड',

    // Confirmation & common
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें'
  },

  as: {
    // App header & layout
    app_title: 'জিম এদিক্ট ২.০',
    app_subtitle: 'গুৱাহাটী, অসম',
    local_badge: 'গুৱাহাটী সংস্কৰণ',
    nav_members: 'সদস্যসকল',
    nav_chase: 'মাছুল সংগ্ৰহ',
    nav_stats: 'পৰিসংখ্যা',
    nav_trash: 'আৰ্কাইভ',
    nav_activity: 'কাৰ্যকলাপ',
    nav_settings: 'ছেটিংছ',
    nav_logout: 'লগ আউট',
    role_owner: 'মালিক (Owner)',
    role_subadmin: 'প্ৰশিক্ষক / চাব-এডমিন',
    role_member: 'সদস্য',
    loading: 'অপেক্ষা কৰক...',

    // Settings page
    settings_title: 'ছেটিংছ',
    settings_subtitle: 'জিমৰ কাৰ্যাৱলী, প্লেন আৰু গুৱাহাটীৰ আঞ্চলিক ছেটিংছ পৰিচালনা কৰক।',
    general_settings: 'সাধাৰণ ছেটিংছ',
    gym_name: 'জিমৰ নাম',
    grace_days: 'অতিৰিক্ত ৰেহাই দিন (Grace Days)',
    admission_fee: 'নামভৰ্তি মাছুল (₹)',
    general_group: 'সাধাৰণ হোৱাটছএপ গোটৰ লিংক',
    trainer_group: 'প্ৰশিক্ষক হোৱাটছএপ গোটৰ লিংক',
    save_settings_btn: 'ছেটিংছ সংৰক্ষণ কৰক',
    saved_alert: 'ছেটিংছ সফলতাৰে সংৰক্ষণ কৰা হ’ল!',

    // Regional & WhatsApp section
    language_section_title: 'আঞ্চলিক আৰু হোৱাটছএপ সোঁৱৰণী (গুৱাহাটী, অসম)',
    regional_whatsapp_title: 'আঞ্চলিক আৰু হোৱাটছএপ সোঁৱৰণী (গুৱাহাটী, অসম)',
    regional_whatsapp_desc: 'গুৱাহাটীৰ স্থানীয় সুবাসেৰে হোৱাটছএপ সোঁৱৰণী বাৰ্তাৰ আৰ্হি।',
    region_label: 'অঞ্চল আৰু স্থান',
    location_details: 'গুৱাহাটী, কামৰূপ মহানগৰ, অসম (ভাৰত)',
    local_greeting_label: 'স্থানীয় সম্ভাষণ',
    tagline_label: 'মূলমন্ত্ৰ / সংকল্প',
    whatsapp_language_pref: 'হোৱাটছএপ সোঁৱৰণীৰ মূল ভাষা',
    whatsapp_lang_desc: 'মাছুল সংগ্ৰহ তালিকাত এই ভাষাৰ আধাৰত গুৱাহাটীৰ স্থানীয় সুবাসেৰে হোৱাটছএপ বাৰ্তা প্ৰস্তুত হ’ব।',
    template_preview_title: 'হোৱাটছএপ সোঁৱৰণী বাৰ্তাৰ আৰ্হি',
    due_soon_preview: 'সোনকালে পৰিশোধৰ সোঁৱৰণী',
    due_today_preview: 'আজিৰ ভিতৰত পৰিশোধৰ সোঁৱৰণী',
    overdue_preview: 'বিলম্বিত পৰিশোধৰ সোঁৱৰণী',

    // Manage Plans
    manage_plans: 'প্লেনসমূহ পৰিচালনা কৰক',
    plan_name: 'প্লেনৰ নাম',
    months: 'মাহ',
    price: 'মূল্য (₹)',
    add_plan: 'নতুন প্লেন যোগ কৰক',
    no_plans_yet: 'এতিয়ালৈকে কোনো প্লেন সৃষ্টি কৰা হোৱা নাই।',

    // Subadmins
    subadmins_title: 'সহায়কাৰী প্ৰশিক্ষক / চাব-এডমিন',
    subadmins_desc: 'জিম পৰিচালনাত সহায় কৰা প্ৰশিক্ষক আৰু চাব-এডমিনসকল।',
    trainer_name_label: 'প্ৰশিক্ষকৰ নাম',
    trainer_email_label: 'প্ৰশিক্ষকৰ ইমেইল',
    invite_btn: 'আমন্ত্ৰণ জনাওক',
    no_subadmins_yet: 'কোনো সহায়কাৰী প্ৰশিক্ষক পোৱা নগ’ল।',

    // Admin Tools
    admin_tools: 'পৰিচালকৰ সঁজুলিসমূহ',
    activity_log_desc: 'শেহতীয়া কাৰ্যকলাপ চাওক',
    trash_desc: 'মচি পেলোৱা সদস্য পুনৰুদ্ধাৰ কৰক',

    // Members page
    members_title: 'সদস্যসকল',
    add_member: 'নতুন সদস্য যোগ কৰক',
    search_placeholder: 'নাম বা ফোন নম্বৰেৰে সন্ধান কৰক...',
    filter_all: 'সকলো',
    filter_paid: 'পৰিশোধিত / সক্ৰিয়',
    filter_due_soon: 'সোনকালে পৰিশোধ',
    filter_due: 'আজি পৰিশোধৰ দিন',
    filter_overdue: 'বিলম্বিত (বাকী)',
    filter_frozen: 'স্থগিত (Frozen)',
    filter_trainer_clients: 'প্ৰশিক্ষকৰ সদস্য',
    no_members_found: 'কোনো সদস্য পোৱা নগ’ল।',
    edit: 'সম্পাদনা',
    upgrade: 'প্ৰশিক্ষক কৰক',
    delete_archive: 'আৰ্কাইভলৈ পঠাওক',
    status_active: 'সক্ৰিয়',
    status_due_soon: 'সোনকালে পৰিশোধ',
    status_due: 'আজি পৰিশোধৰ দিন',
    status_overdue: 'বিলম্বিত',
    status_frozen: 'স্থগিত',

    // Table headers & fields
    name: 'নাম',
    phone: 'ফোন নম্বৰ',
    plan: 'প্লেন',
    status: 'স্থিতি',
    next_due: 'পৰৱৰ্তী তাৰিখ',
    actions: 'কাৰ্য',

    // Chase list
    chase_title: 'আজিৰ মাছুল সংগ্ৰহ তালিকা',
    chase_subtitle: 'গুৱাহাটীৰ সদস্যসকলক আজি হোৱাটছএপত মাছুলৰ সোঁৱৰণী প্ৰেৰণ কৰক।',
    chase_no_reminders: 'আজি কোনো সোঁৱৰণীৰ প্ৰয়োজন নাই। অতি উত্তম!',
    due_date_label: 'পৰিশোধৰ তাৰিখ',
    today: 'আজি',
    days_late: 'দিন পলম',
    in_days: '{n} দিনত',
    sent_badge: 'পঠিওৱা হ’ল',
    send_whatsapp: 'হোৱাটছএপ',
    quick_pay_upi: 'ইউপিআই',
    quick_pay_cash: 'নগদ',
    reminder_lang_selector: 'বাৰ্তাৰ ভাষা',

    // Receipt page
    payment_receipt: 'মাছুল পৰিশোধৰ ৰচিদ',
    billed_to: 'পৰিশোধকৰ্তা:',
    receipt_no: 'ৰচিদ নম্বৰ:',
    date_label: 'তাৰিখ:',
    description_label: 'বিৱৰণ',
    amount_label: 'টকাৰ পৰিমাণ',
    gym_membership: 'জিমৰ সদস্যতা',
    trainer_fee_label: 'ব্যক্তিগত প্ৰশিক্ষক মাছুল',
    total_label: 'মুঠ পৰিমাণ:',
    paid_via: 'পৰিশোধৰ মাধ্যম',
    thank_you: 'গুৱাহাটীত আমাৰ জিম বাছনি কৰাৰ বাবে আন্তৰিক ধন্যবাদ!',
    computer_generated: 'এইখন কম্পিউটাৰে প্ৰস্তুত কৰা বৈদ্যুতিন ৰচিদ।',
    print_pdf: 'প্ৰিণ্ট / পিডিএফলৈ',

    // Member portal
    member_portal: 'সদস্য পৰ্টেল',
    personal_info: 'ব্যক্তিগত তথ্য',
    membership_plan: 'সদস্যতা প্লেন',
    next_due_date: 'পৰৱৰ্তী পৰিশোধৰ তাৰিখ',
    phone_number: 'ফোন নম্বৰ',
    personal_trainer: 'ব্যক্তিগত প্ৰশিক্ষক',
    payment_receipts: 'মাছুলৰ ৰচিদসমূহ',
    whatsapp_community: 'হোৱাটছএপ কম্যুনিটি',
    community_scan_hint: 'আমাৰ গুৱাহাটী জিমৰ হোৱাটছএপ গোটত যোগ হ’বলৈ এই কিউ-আৰ কোডটো স্কেন কৰক।',
    download_btn: 'ডাউনলোড কৰক',

    // Confirmation & common
    cancel: 'বাতিল কৰক',
    confirm: 'নিশ্চিত কৰক'
  }
};

/**
 * Generates a localized WhatsApp reminder text with a warm Guwahati gym touch
 */
export function generateWhatsAppReminder(
  lang: Language,
  name: string,
  date: string,
  offset: number,
  gymName = 'Gym Addict 2.0'
): string {
  if (lang === 'as') {
    // Assamese with authentic Guwahati local phrasing
    if (offset < 0) {
      const days = Math.abs(offset);
      return `নমস্কাৰ ${name}, ${gymName} (গুৱাহাটী)ৰ পৰা সোঁৱৰণী: আপোনাৰ জিমৰ মাছুল অহা ${date} তাৰিখে (${days} দিনৰ পিছত) পৰিশোধ কৰিবলগীয়া। অনুগ্ৰহ কৰি সময়মতে পৰিশোধ কৰক। ধন্যবাদ!`;
    }
    if (offset === 0) {
      return `নমস্কাৰ ${name}, ${gymName} (গুৱাহাটী)ৰ পৰা সোঁৱৰণী: আপোনাৰ জিমৰ মাছুল আজি (${date}) পৰিশোধ কৰিবলগীয়া। অনুগ্ৰহ কৰি আজি পৰিশোধ সম্পূৰ্ণ কৰক। ধন্যবাদ!`;
    }
    return `নমস্কাৰ ${name}, ${gymName} (গুৱাহাটী)ৰ পৰা সোঁৱৰণী: আপোনাৰ জিমৰ মাছুল বিগত ${date} তাৰিখে পৰিশোধৰ দিন উকলি গৈছে (${offset} দিন পলম হৈছে)। অনুগ্ৰহ কৰি অতি সোনকালে পৰিশোধ কৰক। ধন্যবাদ!`;
  }

  if (lang === 'hi') {
    // Hindi with warm local touch
    if (offset < 0) {
      const days = Math.abs(offset);
      return `नमस्ते ${name} जी, ${gymName} (गुवाहाटी) से विनम्र अनुस्मारक: आपकी जिम फीस ${date} को (${days} दिनों में) देय है। कृपया समय पर भुगतान करें। धन्यवाद!`;
    }
    if (offset === 0) {
      return `नमस्ते ${name} जी, ${gymName} (गुवाहाटी) से विनम्र अनुस्मारक: आपकी जिम फीस आज (${date}) देय है। कृपया आज ही भुगतान पूर्ण करें। धन्यवाद!`;
    }
    return `नमस्ते ${name} जी, ${gymName} (गुवाहाटी) से अनुस्मारक: आपकी जिम फीस ${date} को देय थी (${offset} दिन लेट)। कृपया जल्द से जल्द भुगतान करें। धन्यवाद!`;
  }

  // English (Default) with Guwahati local reference
  if (offset < 0) {
    const days = Math.abs(offset);
    return `Hi ${name}, gentle reminder from ${gymName} (Guwahati): your gym fee is due on ${date} (in ${days} days). Stay fit!`;
  }
  if (offset === 0) {
    return `Hi ${name}, gentle reminder from ${gymName} (Guwahati): your gym fee is due TODAY (${date}). Please complete the renewal. Thank you!`;
  }
  return `Hi ${name}, reminder from ${gymName} (Guwahati): your gym fee was due on ${date} (${offset} days overdue). Please clear your pending dues at the earliest. Thank you!`;
}
