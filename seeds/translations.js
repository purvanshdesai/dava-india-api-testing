const translations = [
  {
    text: 'Welcome User',
    lookup_key: 'home_page_title',
    groups: 'HomePage',
    referenceType: 'Value',
    translations: {
      hi: { text: 'स्वागत है उपयोगकर्ता' },
      ta: { text: 'விரும்பி வரவேற்க' },
      te: { text: 'స్వాగతం వాడుకరి' },
      bn: { text: 'স্বাগতম ব্যবহারকারী' },
      mr: { text: 'स्वागत वापरकर्ता' },
      gu: { text: 'સ્વાગત વપરાશકર્તા' },
      pa: { text: 'ਸਵਾਗਤ ਵਰਤੋਂਕਾਰ' },
      kn: { text: 'ಬಳಕೆದಾರನಿಗೆ ಸ್ವಾಗತ' },
      ml: { text: 'ഉപയോക്താവിനെ സ്വാഗതം ചെയ്യുന്നു' }
    }
  },
  {
    text: 'Home',
    lookup_key: 'home_button',
    groups: 'HomePage',
    referenceType: 'Value',
    translations: {
      hi: { text: 'मुख्य पृष्ठ' },
      ta: { text: 'முகப்பு' },
      te: { text: 'హోమ్' },
      bn: { text: 'বাড়ি' },
      mr: { text: 'मुख्य पृष्ठ' },
      gu: { text: 'મુખ્ય પૃષ્ઠ' },
      pa: { text: 'ਹੋਮ' },
      kn: { text: 'ಮನೆ' },
      ml: { text: 'ഹോം' }
    }
  },
  {
    text: 'Order Medicine',
    lookup_key: 'home_order_medicine',
    groups: 'HomePage',
    referenceType: 'Value',
    translations: {
      en: { text: 'Order Medicine' },
      hi: { text: 'दवा ऑर्डर करें' },
      ta: { text: 'முகப்பு' },
      te: { text: 'హోమ్' },
      bn: { text: 'অর্ডার মেডিসিন' },
      mr: { text: 'मुख्य पृष्ठ' },
      gu: { text: 'મુખ્ય પૃષ્ઠ' },
      pa: { text: 'ਹੋਮ' },
      kn: { text: 'ಮನೆ' },
      ml: { text: 'ഹോം' }
    }
  },
  {
    text: 'No Prescription?',
    lookup_key: 'home_consult_doctor',
    groups: 'HomePage',
    referenceType: 'Value',
    translations: {
      en: { text: 'No Prescription?' },
      hi: { text: 'डॉक्टर से सलाह लें' },
      ta: { text: 'முகப்பு' },
      te: { text: 'హోమ్' },
      bn: { text: 'ডাক্তারের সাথে পরামর্শ করুন' },
      mr: { text: 'मुख्य पृष्ठ' },
      gu: { text: 'મુખ્ય પૃષ્ઠ' },
      pa: { text: 'ਹੋਮ' },
      kn: { text: 'ಮನೆ' },
      ml: { text: 'ഹോം' }
    }
  },
  {
    text: 'Previously Bought',
    lookup_key: 'home_previously_bought',
    groups: 'HomePage',
    referenceType: 'Value',
    translations: {
      en: { text: 'Previously Bought' },
      hi: { text: 'पहले खरीदा गया' },
      ta: { text: 'முகப்பு' },
      te: { text: 'హోమ్' },
      bn: { text: 'আগে কেনা' },
      mr: { text: 'मुख्य पृष्ठ' },
      gu: { text: 'મુખ્ય પૃષ્ઠ' },
      pa: { text: 'ਹੋਮ' },
      kn: { text: 'ಮನೆ' },
      ml: { text: 'ഹോം' }
    }
  },
  {
    text: 'Deals For You',
    lookup_key: 'home_deals_for_you',
    groups: 'HomePage',
    referenceType: 'Value',
    translations: {
      en: { text: 'Deals For You' },
      hi: { text: 'आपके लिए सौदे' },
      ta: { text: 'முகப்பு' },
      te: { text: 'హోమ్' },
      bn: { text: 'আপনার জন্য ডিল' },
      mr: { text: 'मुख्य पृष्ठ' },
      gu: { text: 'મુખ્ય પૃષ્ઠ' },
      pa: { text: 'ਹੋਮ' },
      kn: { text: 'ಮನೆ' },
      ml: { text: 'ഹോം' }
    }
  },
  {
    text: 'My Cart',
    lookup_key: 'cart_title',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Remove',
    lookup_key: 'remove',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Last Minute Buy',
    lookup_key: 'last_minute_buy',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Coupon Applied',
    lookup_key: 'coupon_applied',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Product',
    lookup_key: 'product_title',
    groups: 'HomePage',
    referenceType: 'Value',
    translations: {
      hi: { text: 'उत्पाद' },
      ta: { text: 'தயாரிப்பு' },
      te: { text: 'ఉత్పత్తి' },
      bn: { text: 'পণ্য' },
      mr: { text: 'उत्पादन' },
      gu: { text: 'ઉત્પાદન' },
      pa: { text: 'ਉਤਪਾਦ' },
      kn: { text: 'ಉತ್ಪನ್ನ' },
      ml: { text: 'ഉൽപ്പന്നം' }
    }
  },
  {
    text: 'Add more items',
    lookup_key: 'add_more_items',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अधिक वस्तुएं जोड़ें' },
      ta: { text: 'மேலும் உருப்படிகளைச் சேர்க்கவும்' },
      te: { text: 'మరిన్ని అంశాలను జోడించండి' },
      bn: { text: 'আরও আইটেম যোগ করুন' },
      mr: { text: 'आणखी वस्तू जोडा' },
      gu: { text: 'વધુ વસ્તુઓ ઉમેરો' },
      pa: { text: 'ਹੋਰ ਆਈਟਮ ਸ਼ਾਮਲ ਕਰੋ' },
      kn: { text: 'ಹೆಚ್ಚು ಐಟಂಗಳನ್ನು ಸೇರಿಸಿ' },
      ml: { text: 'കൂടുതൽ ഇനങ്ങൾ ചേർക്കുക' }
    }
  },
  {
    text: 'Apply coupon',
    lookup_key: 'apply_coupon',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कूपन लागू करें' },
      ta: { text: 'கூப்பன் பயன்படுத்தவும்' },
      te: { text: 'కూపన్ అప్లై చేయండి' },
      bn: { text: 'কুপন প্রয়োগ করুন' },
      mr: { text: 'कूपन लागू करा' },
      gu: { text: 'કૂપન લાગુ કરો' },
      pa: { text: 'ਕੂਪਨ ਲਾਗੂ ਕਰੋ' },
      kn: { text: 'ಕೂಪನ್ ಅನ್ನು ಅನ್ವಯಿಸಿ' },
      ml: { text: 'കൂപ്പണ്‍ പ്രയോഗിക്കുക' }
    }
  },
  {
    text: 'Apply promocode to get instant discounts',
    lookup_key: 'apply_promocode',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'त्वरित छूट के लिए प्रोमोकोड लागू करें' },
      ta: { text: 'உடனடி தள்ளுபடிக்காக ப்ரோமோகோடு பயன்படுத்தவும்' },
      te: { text: 'తక్షణ తగ్గింపులకు ప్రోమోకోడ్ అప్లై చేయండి' },
      bn: { text: 'তাৎক্ষণিক ছাড় পেতে প্রোমোকোড প্রয়োগ করুন' },
      mr: { text: 'तात्काळ सूट मिळविण्यासाठी प्रोमोकोड लागू करा' },
      gu: { text: 'તાત્કાલિક છૂટ માટે પ્રોમોકોડ લાગુ કરો' },
      pa: { text: 'ਤੁਰੰਤ ਛੂਟ ਪ੍ਰਾਪਤ ਕਰਨ ਲਈ ਪ੍ਰੋਮੋਕੋਡ ਲਾਗੂ ਕਰੋ' },
      kn: { text: 'ತಕ್ಷಣದ ರಿಯಾಯಿತಿಗೆ ಪ್ರೊಮೊಕೋಡ್ ಅನ್ನು ಅನ್ವಯಿಸಿ' },
      ml: { text: 'ഉടൻ ലഭിക്കുന്ന ഡിസ്‌ക്കൗണ്ട് ലഭിക്കാൻ പ്രൊമോ കോഡ് പ്രയോഗിക്കുക' }
    }
  },
  {
    text: 'Payment Summary',
    lookup_key: 'payment_summary',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'भुगतान सारांश' },
      ta: { text: 'கட்டண சுருக்கம்' },
      te: { text: 'చెల్లింపు సారాంశం' },
      bn: { text: 'পেমেন্টের সারাংশ' },
      mr: { text: 'देय सारांश' },
      gu: { text: 'ચુકવણી સારાંશ' },
      pa: { text: 'ਭੁਗਤਾਨ ਸਾਰांश' },
      kn: { text: 'ಪಾವತಿ ಸಾರಾಂಶ' },
      ml: { text: 'പെയ്മെന്റ് സാരാംശം' }
    }
  },
  {
    text: 'MRP Total',
    lookup_key: 'mrp_total',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'एमआरपी कुल' },
      ta: { text: 'எம்ஆர்பி மொத்தம்' },
      te: { text: 'ఎంఆర్ఫి మొత్తం' },
      bn: { text: 'এমআরপি মোট' },
      mr: { text: 'एमआरपी एकूण' },
      gu: { text: 'એમઆરપી કુલ' },
      pa: { text: 'ਐਮਆਰਪੀ ਕੁੱਲ' },
      kn: { text: 'ಎಂಪಿಆರ್‌ಪಿ ಒಟ್ಟು' },
      ml: { text: 'എം.ആര്‍.പി മൊത്തം' }
    }
  },
  {
    text: 'Additional Discount',
    lookup_key: 'additional_discount',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अतिरिक्त छूट' },
      ta: { text: 'கூடுதல் தள்ளுபடி' },
      te: { text: 'అదనపు తగ్గింపు' },
      bn: { text: 'অতিরিক্ত ছাড়' },
      mr: { text: 'अतिरिक्त सूट' },
      gu: { text: 'વધુ છૂટ' },
      pa: { text: 'ਵਾਧੂ ਛੂਟ' },
      kn: { text: 'ಹೆಚ್ಚುವರಿ ರಿಯಾಯಿತಿ' },
      ml: { text: 'അധിക കിഴിവ്' }
    }
  },
  {
    text: 'Shipping/Delivery Charges',
    lookup_key: 'shipping_charges',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'शिपिंग/डिलीवरी शुल्क' },
      ta: { text: 'அனுப்பும்/வழங்கும் கட்டணம்' },
      te: { text: 'షిప్పింగ్/డెలివరీ ఛార్జీలు' },
      bn: { text: 'শিপিং/ডেলিভারি চার্জ' },
      mr: { text: 'शिपिंग/वितरण शुल्क' },
      gu: { text: 'શિપિંગ/ડિલિવરી ચાર્જ' },
      pa: { text: 'ਸ਼ਿਪਿੰਗ/ਡਿਲਿਵਰੀ ਚਾਰਜ' },
      kn: { text: 'ಶಿಪ್ಪಿಂಗ್/ವಿತರಣಾ ಶುಲ್ಕ' },
      ml: { text: 'ഷിപ്പിംഗ്/ഡെലിവറി ചാർജുകൾ' }
    }
  },
  {
    text: 'Tax Amount',
    lookup_key: 'tax_amount',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कर राशि' },
      ta: { text: 'வரி தொகை' },
      te: { text: 'పన్ను మొత్తం' },
      bn: { text: 'ট্যাক্সের পরিমাণ' },
      mr: { text: 'कर रक्कम' },
      gu: { text: 'કર રકમ' },
      pa: { text: 'ਕਰ ਰਕਮ' },
      kn: { text: 'ತೆರಿಗೆ ಮೊತ್ತ' },
      ml: { text: 'നികുതി തുക' }
    }
  },
  {
    text: 'Total Savings',
    lookup_key: 'total_savings',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कुल बचत' },
      ta: { text: 'மொத்த சேமிப்பு' },
      te: { text: 'మొత్తం ఆదా' },
      bn: { text: 'মোট সঞ্চয়' },
      mr: { text: 'एकूण बचत' },
      gu: { text: 'કુલ બચત' },
      pa: { text: 'ਕੁੱਲ ਬਚਤ' },
      kn: { text: 'ಒಟ್ಟು ಉಳಿತಾಯ' },
      ml: { text: 'ആകെ സാമ്പത്തിക ലാഭം' }
    }
  },
  {
    text: 'Apply',
    lookup_key: 'apply_button',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'लागू करें' },
      ta: { text: 'பயன்படுத்த' },
      te: { text: 'అప్లై చేయండి' },
      bn: { text: 'প্রয়োগ করুন' },
      mr: { text: 'लागू करा' },
      gu: { text: 'લાગુ કરો' },
      pa: { text: 'ਲਾਗੂ ਕਰੋ' },
      kn: { text: 'ಅನ್ವಯಿಸಿ' },
      ml: { text: 'പ്രയോഗിക്കുക' }
    }
  },
  {
    text: 'Address',
    lookup_key: 'address_title',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'पता' },
      bn: { text: 'ঠিকানা' }
    }
  },
  {
    text: 'Payment',
    lookup_key: 'payment_title',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'भुगतान' },
      bn: { text: 'পেমেন্ট' }
    }
  },
  {
    text: 'Total Payable',
    lookup_key: 'total_payable',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कुल देय' },
      bn: { text: 'মোট পরিশোধযোগ্য' }
    }
  },
  {
    text: 'Continue',
    lookup_key: 'continue_button',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'जारी रखें' },
      bn: { text: 'চালিয়ে যান' }
    }
  },
  {
    text: 'Creating Payment',
    lookup_key: 'creating_payment',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'भुगतान बना रहे हैं' },
      bn: { text: 'পেমেন্ট তৈরি হচ্ছে' }
    }
  },
  {
    text: 'Confirm and Pay',
    lookup_key: 'confirm_and_pay',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'पुष्टि करें और भुगतान करें' },
      bn: { text: 'নিশ্চিত করুন এবং পরিশোধ করুন' }
    }
  },
  {
    text: 'Upload Prescription',
    lookup_key: 'upload_prescription',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'प्रिस्क्रिप्शन अपलोड करें' },
      bn: { text: 'প্রেসক্রিপশন আপলোড করুন' }
    }
  },
  {
    text: 'About Davaindia',
    lookup_key: 'about_davaindia',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'दवाइंडिया के बारे में' },
      bn: { text: 'দাবাআইন্ডিয়া সম্পর্কে' }
    }
  },
  {
    text: 'Our Products',
    lookup_key: 'our_products',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'हमारे उत्पाद' },
      bn: { text: 'আমাদের পণ্যসমূহ' }
    }
  },
  {
    text: 'Customer Speaks',
    lookup_key: 'customer_speaks',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'ग्राहक की प्रतिक्रिया' },
      bn: { text: 'গ্রাহকের মতামত' }
    }
  },
  {
    text: 'Career',
    lookup_key: 'career',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'करियर' },
      bn: { text: 'ক্যারিয়ার' }
    }
  },
  {
    text: 'Contact',
    lookup_key: 'contact',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'संपर्क करें' },
      bn: { text: 'যোগাযোগ করুন' }
    }
  },
  {
    text: 'Terms and Conditions',
    lookup_key: 'terms_and_conditions',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'नियम और शर्तें' },
      bn: { text: 'শর্তাবলী' }
    }
  },
  {
    text: 'Privacy Policy',
    lookup_key: 'privacy_policy',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'गोपनीयता नीति' },
      bn: { text: 'গোপনীয়তা নীতি' }
    }
  },
  {
    text: 'Fees and Payment Policy',
    lookup_key: 'fees_and_payment_policy',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'शुल्क और भुगतान नीति' },
      bn: { text: 'ফি এবং পেমেন্ট নীতি' }
    }
  },
  {
    text: 'Shipping and Delivery Policy',
    lookup_key: 'shipping_and_delivery_policy',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'शिपिंग और डिलीवरी नीति' },
      bn: { text: 'শিপিং এবং ডেলিভারি নীতি' }
    }
  },
  {
    text: 'Return, Refund and Cancellation Policy',
    lookup_key: 'return_refund_cancellation_policy',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'रिटर्न, रिफंड और कैंसलेशन नीति' },
      bn: { text: 'রিটার্ন, রিফান্ড এবং বাতিল নীতি' }
    }
  },
  {
    text: 'Editorial Policy',
    lookup_key: 'editorial_policy',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'संपादकीय नीति' },
      bn: { text: 'সম্পাদনা নীতি' }
    }
  },
  {
    text: 'Health Articles',
    lookup_key: 'health_articles',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'स्वास्थ्य लेख' },
      bn: { text: 'স্বাস্থ্য নিবন্ধ' }
    }
  },
  {
    text: 'Offers and Coupons',
    lookup_key: 'offers_and_coupons',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'ऑफर और कूपन' },
      bn: { text: 'অফার এবং কুপন' }
    }
  },
  {
    text: 'FAQs',
    lookup_key: 'faqs',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अक्सर पूछे जाने वाले प्रश्न' },
      bn: { text: 'ঘনঘন জিজ্ঞাসা' }
    }
  },
  {
    text: 'Company',
    lookup_key: 'company',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कंपनी' },
      bn: { text: 'কোম্পানি' }
    }
  },
  {
    text: 'Our Policies',
    lookup_key: 'our_policies',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'हमारी नीतियाँ' },
      bn: { text: 'আমাদের নীতিমালা' }
    }
  },
  {
    text: 'Shopping',
    lookup_key: 'shopping',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'खरीदारी' },
      bn: { text: 'কেনাকাটা' }
    }
  },
  {
    text: 'Download App',
    lookup_key: 'download_app',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'ऐप डाउनलोड करें' },
      bn: { text: 'অ্যাপ ডাউনলোড করুন' }
    }
  },
  {
    text: 'New Arrival',
    lookup_key: 'new_arrival',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'नया आगमन' },
      bn: { text: 'নতুন আগমন' }
    }
  },
  {
    text: 'Super Savings Deals',
    lookup_key: 'super_saving_deals',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सुपर सेविंग डील' },
      bn: { text: 'নতুন আগমন' }
    }
  },
  {
    text: 'In the spot light',
    lookup_key: 'in_the_spot_light',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'स्पॉट लाइट में' },
      bn: { text: 'নতুন আগমন' }
    }
  },
  {
    text: 'Popular Categories',
    lookup_key: 'popular_categories',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'लोकप्रिय श्रेणियां' },
      bn: { text: 'জনপ্রিয় বিভাগ' }
    }
  },
  {
    text: 'Personal Care',
    lookup_key: 'personal_care',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'व्यक्तिगत देखभाल' },
      bn: { text: 'ব্যক্তিগত যত্ন' }
    }
  },
  {
    text: 'Shop by health conditions',
    lookup_key: 'shop_by_health_conditions',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'स्वास्थ्य स्थिति के अनुसार खरीदारी करें' },
      bn: { text: 'স্বাস্থ্য পরিস্থিতি অনুযায়ী কেনাকাটা করুন' }
    }
  },
  {
    text: 'View All',
    lookup_key: 'view_all',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सभी देखें' },
      bn: { text: 'সব দেখুন' }
    }
  },
  {
    text: 'Prescription Needed',
    lookup_key: 'prescription_needed',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'प्रिस्क्रिप्शन आवश्यक' },
      bn: { text: 'প্রেসক্রিপশন প্রয়োজন' }
    }
  },
  {
    text: 'In Stock',
    lookup_key: 'in_stock',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'स्टॉक में उपलब्ध' },
      bn: { text: 'স্টকে আছে' }
    }
  },
  {
    text: 'Inclusive of all taxes',
    lookup_key: 'inclusive_of_all_taxes',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सभी कर शामिल हैं' },
      bn: { text: 'সব ট্যাক্স অন্তর্ভুক্ত' }
    }
  },
  {
    text: 'Quantity',
    lookup_key: 'quantity',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'मात्रा' },
      bn: { text: 'পরিমাণ' }
    }
  },
  {
    text: 'Add to Cart',
    lookup_key: 'add_to_cart',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट में डालें' },
      bn: { text: 'কার্টে যোগ করুন' }
    }
  },
  {
    text: 'Buy Now',
    lookup_key: 'buy_now',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Product not deliverable to this location',
    lookup_key: 'product_not_deliverable_to_this_location',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'This product cannot be returned for a refund or exchange.',
    lookup_key: 'return_desc',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Return policy',
    lookup_key: 'return_policy',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Order is delivering to',
    lookup_key: 'order_is_delivering_to',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Expected delivery date',
    lookup_key: 'expected_delivery_date',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Free Consultation',
    lookup_key: 'free_consultation',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Description',
    lookup_key: 'description',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Suitable For',
    lookup_key: 'suitable_for',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Benefits',
    lookup_key: 'benefits',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Dosage',
    lookup_key: 'dosage',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Caution',
    lookup_key: 'caution',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Side Effects',
    lookup_key: 'side_effects',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Key Ingredients',
    lookup_key: 'key_ingredients',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Seller Information',
    lookup_key: 'seller_info',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Manufactured By',
    lookup_key: 'manufactured_by',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: 'Similar Products',
    lookup_key: 'similar_products',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अभी खरीदें' },
      bn: { text: 'এখনই কিনুন' }
    }
  },
  {
    text: "India's largest private generic pharmacy retail chain",
    lookup_key: 'largest_pharmacy_chain',
    groups: 'Footer',
    referenceType: 'Value',
    translations: {
      hi: { text: 'भारत की सबसे बड़ी निजी जेनेरिक फार्मेसी रिटेल श्रृंखला' },
      bn: { text: 'ভারতের বৃহত্তম বেসরকারি জেনেরিক ফার্মেসি খুচরা শৃঙ্খল' }
    }
  },
  {
    text: 'Choose Location',
    lookup_key: 'choose_location',
    groups: 'LocationManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'स्थान का चयन' },
      bn: { text: 'অবস্থান নির্বাচন করুন' }
    }
  },
  {
    text: 'Enter Pincode',
    lookup_key: 'enter_pincode',
    groups: 'LocationManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'पिनकोड दर्ज करें' },
      bn: { text: 'পিনকোড লিখুন' }
    }
  },
  {
    text: 'Pincode',
    lookup_key: 'pincode',
    groups: 'LocationManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'पिनकोड' },
      bn: { text: 'পিনকোড' }
    }
  },
  {
    text: 'Use My Current Location',
    lookup_key: 'use_my_current_location',
    groups: 'LocationManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'मेरे वर्तमान स्थान का उपयोग करें' },
      bn: { text: 'আমার বর্তমান অবস্থান ব্যবহার করুন' }
    }
  },
  {
    text: 'Sign In',
    lookup_key: 'sign_in',
    groups: 'LocationManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'दाखिल करना' },
      bn: { text: 'সাইন ইন করুন' }
    }
  },
  {
    text: 'Sign in to see and access your location and address',
    lookup_key: 'sign_in_description',
    groups: 'LocationManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अपना स्थान और पता देखने और उस तक पहुंचने के लिए साइन इन करें' },
      bn: { text: 'আপনার অবস্থান এবং ঠিকানা দেখতে এবং অ্যাক্সেস করতে সাইন ইন করুন৷' }
    }
  },
  {
    text: 'Hello',
    lookup_key: 'hello',
    groups: 'SettingsManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'नमस्ते' },
      bn: { text: 'হ্যালো' }
    }
  },
  {
    text: 'My Profile',
    lookup_key: 'my_profile',
    groups: 'SettingsManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'मेरी प्रोफाइल' },
      bn: { text: 'আমার প্রোফাইল' }
    }
  },
  {
    text: 'My Orders',
    lookup_key: 'my_orders',
    groups: 'SettingsManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'मेरे आदेश' },
      bn: { text: 'আমার আদেশ' }
    }
  },
  {
    text: 'Previously Bought',
    lookup_key: 'previously_bought',
    groups: 'SettingsManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'पहले खरीदा गया' },
      bn: { text: 'আগে কেনা' }
    }
  },
  {
    text: 'DavaONE Membership',
    lookup_key: 'dava_membership',
    groups: 'SettingsManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'DavaONE सदस्यता' },
      bn: { text: 'DavaONE সদস্যপদ' }
    }
  },
  {
    text: 'Coupons',
    lookup_key: 'coupons',
    groups: 'SettingsManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कूपन' },
      bn: { text: 'কুপন' }
    }
  },
  {
    text: 'Notifications',
    lookup_key: 'notifications',
    groups: 'SettingsManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सूचनाएं' },
      bn: { text: 'বিজ্ঞপ্তি' }
    }
  },
  {
    text: 'Logout',
    lookup_key: 'logout',
    groups: 'SettingsManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'लॉग आउट' },
      bn: { text: 'লগআউট' }
    }
  },
  {
    text: 'Order our generic medicines',
    lookup_key: 'order_medicine_description',
    groups: 'HomePage',
    referenceType: 'Value',
    translations: {
      hi: { text: 'हमारी जेनेरिक दवाएं ऑर्डर करें' },
      bn: { text: 'আমাদের জেনেরিক ওষুধ অর্ডার করুন' }
    }
  },
  {
    text: 'Get an e-prescription for your Medicine',
    lookup_key: 'consult_doctor_description',
    groups: 'HomePage',
    referenceType: 'Value',
    translations: {
      hi: { text: 'नुस्खे के लिए किसी अनुभवी डॉक्टर से सलाह लें' },
      bn: { text: 'প্রেসক্রিপশনের জন্য একজন অভিজ্ঞ ডাক্তারের পরামর্শ নিন' }
    }
  },
  {
    text: 'Check your previously bought items',
    lookup_key: 'previously_bought_description',
    groups: 'HomePage',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अपनी पहले खरीदी गई वस्तुओं की जाँच करें' },
      bn: { text: 'আপনার পূর্বে কেনা আইটেম চেক করুন' }
    }
  },
  {
    text: 'Check special deals for you',
    lookup_key: 'deals_for_you_description',
    groups: 'HomePage',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अपने लिए विशेष सौदे जांचें' },
      bn: { text: 'আপনার জন্য বিশেষ ডিল চেক করুন' }
    }
  },
  {
    text: 'Popular Categories',
    lookup_key: 'popular_categories',
    groups: 'HomePagePopularCategories',
    referenceType: 'Value',
    translations: {
      hi: { text: 'लोकप्रिय श्रेणियां' },
      bn: { text: 'জনপ্রিয় বিভাগ' }
    }
  },
  {
    text: 'Vitamins',
    lookup_key: 'vitamins',
    groups: 'HomePagePopularCategories',
    referenceType: 'Value',
    translations: {
      hi: { text: 'विटामिन' },
      bn: { text: 'ভিটামিন' }
    }
  },
  {
    text: 'Hair Care',
    lookup_key: 'hair_care',
    groups: 'HomePagePopularCategories',
    referenceType: 'Value',
    translations: {
      hi: { text: 'बालों की देखभाल' },
      bn: { text: 'চুলের যত্ন' }
    }
  },
  {
    text: 'Sexual Wellness',
    lookup_key: 'sexual_wellness',
    groups: 'HomePagePopularCategories',
    referenceType: 'Value',
    translations: {
      hi: { text: 'यौन कल्याण' },
      bn: { text: 'যৌন সুস্থতা' }
    }
  },
  {
    text: 'Skin Care',
    lookup_key: 'skin_care',
    groups: 'HomePagePopularCategories',
    referenceType: 'Value',
    translations: {
      hi: { text: 'त्वचा की देखभाल' },
      bn: { text: 'ত্বকের যত্ন' }
    }
  },
  {
    text: 'Infection Care',
    lookup_key: 'infection_care',
    groups: 'HomePagePopularCategories',
    referenceType: 'Value',
    translations: {
      hi: { text: 'संक्रमण देखभाल' },
      bn: { text: 'সংক্রমণ যত্ন' }
    }
  },
  {
    text: 'Oncology',
    lookup_key: 'oncology',
    groups: 'HomePagePopularCategories',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कैंसर विज्ञान' },
      bn: { text: 'অনকোলজি' }
    }
  },
  {
    text: 'Life Style',
    lookup_key: 'life_style',
    groups: 'HomePagePopularCategories',
    referenceType: 'Value',
    translations: {
      hi: { text: 'जीवन शैली' },
      bn: { text: 'জীবন শৈলী' }
    }
  },
  {
    text: 'Membership',
    lookup_key: 'membership',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सदस्यता' },
      bn: { text: 'সদস্যপদ' }
    }
  },
  {
    text: 'Free Delivery',
    lookup_key: 'free_delivery',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: 'नि: शुल्क डिलिवरी' },
      bn: { text: 'বিনামূল্যে বিতরণ' }
    }
  },
  {
    text: '25 free delivery above order 149',
    lookup_key: 'free_delivery_description',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: '25 (न्यूनतम ऑर्डर 1290 से ऊपर)' },
      bn: { text: '25 (1290 এর উপরে মিনিটের অর্ডার)' }
    }
  },
  {
    text: 'Discount',
    lookup_key: 'discount',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: 'छूट' },
      bn: { text: 'ডিসকাউন্ট' }
    }
  },
  {
    text: 'Discount upto 5%',
    lookup_key: 'discount_description',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: '5% तक की छूट' },
      bn: { text: '5% পর্যন্ত ছাড়' }
    }
  },
  {
    text: 'Dava Coin',
    lookup_key: 'dava_coin',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सिक्का' },
      bn: { text: 'মুদ্রা' }
    }
  },
  {
    text: 'Earn 2% of their purchase value as points',
    lookup_key: 'dava_coin_description',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: '2% तक' },
      bn: { text: '2% পর্যন্ত' }
    }
  },
  {
    text: 'Premium Support',
    lookup_key: 'premium_support',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: 'प्रीमियम सहायता' },
      bn: { text: 'প্রিমিয়াম সমর্থন' }
    }
  },
  {
    text: 'No waiting in call center',
    lookup_key: 'premium_support_description',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कॉल सेंटर में कोई वेटिंग नहीं' },
      bn: { text: 'কল সেন্টারে অপেক্ষা নেই' }
    }
  },
  {
    text: 'Exclusive Deals',
    lookup_key: 'exclusive_deals',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: 'विशेष सौदे' },
      bn: { text: 'এক্সক্লুসিভ ডিল' }
    }
  },
  {
    text: 'On all categories',
    lookup_key: 'exclusive_deals_description',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सभी श्रेणियों पर' },
      bn: { text: 'সব বিভাগে' }
    }
  },
  {
    text: 'e-Consultation',
    lookup_key: 'consultation',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: 'परामर्श' },
      bn: { text: 'পরামর্শ' }
    }
  },
  {
    text: 'Membership @ 99 for 6 months',
    lookup_key: 'dava_one_description',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: 'छह तक' },
      bn: { text: '6 পর্যন্ত' }
    }
  },
  {
    text: '*T & C Applied',
    lookup_key: 't_c_applied',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: 'छह तक' },
      bn: { text: '6 পর্যন্ত' }
    }
  },
  {
    text: 'Six Complementary consultation with doctor',
    lookup_key: 'consultation_description',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: 'छह तक' },
      bn: { text: '6 পর্যন্ত' }
    }
  },
  {
    text: 'Explore',
    lookup_key: 'explore_button',
    groups: 'HomePageMembership',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अन्वेषण करना' },
      bn: { text: 'অন্বেষণ' }
    }
  },
  {
    text: 'Shop By Health Conditions',
    lookup_key: 'shop_by_health_conditions',
    groups: 'HomePageHealthConditions',
    referenceType: 'Value',
    translations: {
      hi: { text: 'स्वास्थ्य स्थिति के अनुसार खरीदारी करें' },
      bn: { text: 'স্বাস্থ্য পরিস্থিতি অনুযায়ী কেনাকাটা করুন' }
    }
  },
  {
    text: 'Cardiac',
    lookup_key: 'cardiac',
    groups: 'HomePageHealthConditions',
    referenceType: 'Value',
    translations: {
      hi: { text: 'दिल का' },
      bn: { text: 'কার্ডিয়াক' }
    }
  },
  {
    text: 'Ortho',
    lookup_key: 'ortho',
    groups: 'HomePageHealthConditions',
    referenceType: 'Value',
    translations: {
      hi: { text: 'ऑर्थो' },
      bn: { text: 'অর্থো' }
    }
  },
  {
    text: 'Gynac',
    lookup_key: 'gynac',
    groups: 'HomePageHealthConditions',
    referenceType: 'Value',
    translations: {
      hi: { text: 'प्रसूतिशास्र' },
      bn: { text: 'স্ত্রীরোগবিদ্যা' }
    }
  },
  {
    text: 'Kidney',
    lookup_key: 'kidney',
    groups: 'HomePageHealthConditions',
    referenceType: 'Value',
    translations: {
      hi: { text: 'किडनी' },
      bn: { text: 'কিডনি' }
    }
  },
  {
    text: 'Asthma',
    lookup_key: 'asthma',
    groups: 'HomePageHealthConditions',
    referenceType: 'Value',
    translations: {
      hi: { text: 'दमा' },
      bn: { text: 'হাঁপানি' }
    }
  },
  {
    text: 'Derma',
    lookup_key: 'derma',
    groups: 'HomePageHealthConditions',
    referenceType: 'Value',
    translations: {
      hi: { text: 'त्वचा' },
      bn: { text: 'ডার্মা' }
    }
  },
  {
    text: 'Thyroid',
    lookup_key: 'thyroid',
    groups: 'HomePageHealthConditions',
    referenceType: 'Value',
    translations: {
      hi: { text: 'थाइरोइड' },
      bn: { text: 'থাইরয়েড' }
    }
  },
  {
    text: 'Cold',
    lookup_key: 'cold',
    groups: 'HomePageHealthConditions',
    referenceType: 'Value',
    translations: {
      hi: { text: 'खांसी और सर्दी' },
      bn: { text: 'কাশি এবং সর্দি' }
    }
  },
  {
    text: 'Diabetes',
    lookup_key: 'diabetes',
    groups: 'HomePageHealthConditions',
    referenceType: 'Value',
    translations: {
      hi: { text: 'मधुमेह' },
      bn: { text: 'ডায়াবেটিস' }
    }
  },
  {
    text: 'ENT',
    lookup_key: 'ent',
    groups: 'HomePageHealthConditions',
    referenceType: 'Value',
    translations: {
      hi: { text: 'ईएनटी' },
      bn: { text: 'ইএনটি' }
    }
  },
  {
    text: 'Generic medicine is a right choice.',
    lookup_key: 'generic_medicines_are_smarter_choice',
    groups: 'HomePageGenericAbout',
    referenceType: 'Value',
    translations: {
      hi: { text: 'जेनेरिक दवाएं बेहतर विकल्प हैं' },
      bn: { text: 'জেনেরিক মেডিসিনগুলি স্মার্ট পছন্দ' }
    }
  },
  {
    text: 'Reliable',
    lookup_key: 'reliable',
    groups: 'HomePageGenericAbout',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सुरक्षित' },
      bn: { text: 'নিরাপদ' }
    }
  },
  {
    text: 'Made with high-quality standards, our generics provide reliable, consistent results you can trust.',
    lookup_key: 'reliable_desc',
    groups: 'HomePageGenericAbout',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सुरक्षित' },
      bn: { text: 'নিরাপদ' }
    }
  },
  {
    text: 'Secure',
    lookup_key: 'secure',
    groups: 'HomePageGenericAbout',
    referenceType: 'Value',
    translations: {
      hi: { text: 'একই' },
      bn: { text: 'वही' }
    }
  },
  {
    text: 'Each medicine meets strict safety standards, ensuring trusted care with every dose.',
    lookup_key: 'secure_desc',
    groups: 'HomePageGenericAbout',
    referenceType: 'Value',
    translations: {
      hi: { text: 'একই' },
      bn: { text: 'वही' }
    }
  },
  {
    text: 'Affordable',
    lookup_key: 'affordable',
    groups: 'HomePageGenericAbout',
    referenceType: 'Value',
    translations: {
      hi: { text: 'बचत' },
      bn: { text: 'সঞ্চয়' }
    }
  },
  {
    text: 'Quality treatments without the high price, making better health accessible for all.',
    lookup_key: 'affordable_desc',
    groups: 'HomePageGenericAbout',
    referenceType: 'Value',
    translations: {
      hi: { text: 'बचत' },
      bn: { text: 'সঞ্চয়' }
    }
  },
  {
    text: 'Effective',
    lookup_key: 'effective',
    groups: 'HomePageGenericAbout',
    referenceType: 'Value',
    translations: {
      hi: { text: 'बचत' },
      bn: { text: 'সঞ্চয়' }
    }
  },
  {
    text: 'Clinically proven to deliver the same benefits as branded alternatives, without compromise.',
    lookup_key: 'effective_desc',
    groups: 'HomePageGenericAbout',
    referenceType: 'Value',
    translations: {
      hi: { text: 'बचत' },
      bn: { text: 'সঞ্চয়' }
    }
  },
  {
    text: 'Know More',
    lookup_key: 'know_more_button',
    groups: 'HomePageGenericAbout',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अधिक जानते हैं' },
      bn: { text: 'আরো জান' }
    }
  },
  {
    text: 'Personal Care',
    lookup_key: 'personal_care',
    groups: 'HomePagePersonalCare',
    referenceType: 'Value',
    translations: {
      hi: { text: 'लोकप्रिय श्रेणियां' },
      bn: { text: 'জনপ্রিয় বিভাগ' }
    }
  },
  {
    text: 'Oral Care',
    lookup_key: 'oral_care',
    groups: 'HomePagePersonalCare',
    referenceType: 'Value',
    translations: {
      hi: { text: 'मौखिक देखभाल' },
      bn: { text: 'মৌখিক যত্ন' }
    }
  },
  {
    text: 'Hair Care',
    lookup_key: 'hair_care',
    groups: 'HomePagePersonalCare',
    referenceType: 'Value',
    translations: {
      hi: { text: 'बालों की देखभाल' },
      bn: { text: 'চুলের যত্ন' }
    }
  },
  {
    text: 'Sexual Wellness',
    lookup_key: 'sexual_wellness',
    groups: 'HomePagePersonalCare',
    referenceType: 'Value',
    translations: {
      hi: { text: 'यौन कल्याण' },
      bn: { text: 'যৌন সুস্থতা' }
    }
  },
  {
    text: 'Skin Care',
    lookup_key: 'skin_care',
    groups: 'HomePagePersonalCare',
    referenceType: 'Value',
    translations: {
      hi: { text: 'त्वचा की देखभाल' },
      bn: { text: 'ত্বকের যত্ন' }
    }
  },
  {
    text: 'Men Grooming',
    lookup_key: 'men_grooming',
    groups: 'HomePagePersonalCare',
    referenceType: 'Value',
    translations: {
      hi: { text: 'पुरुष संवार रहे हैं' },
      bn: { text: 'পুরুষদের সাজসজ্জা' }
    }
  },
  {
    text: 'Women Care',
    lookup_key: 'women_care',
    groups: 'HomePagePersonalCare',
    referenceType: 'Value',
    translations: {
      hi: { text: 'महिलाओं की देखभाल' },
      bn: { text: 'মহিলাদের যত্ন' }
    }
  },
  {
    text: 'Body Care',
    lookup_key: 'body_care',
    groups: 'HomePagePersonalCare',
    referenceType: 'Value',
    translations: {
      hi: { text: 'शरीर की देखभाल' },
      bn: { text: 'শরীরের যত্ন' }
    }
  },
  {
    text: 'Skin Care',
    lookup_key: 'skin_care',
    groups: 'HomePage',
    referenceType: 'Value',
    translations: {
      hi: { text: 'शरीर की देखभाल' },
      bn: { text: 'শরীরের যত্ন' }
    }
  },
  {
    text: 'Super Saving Deals',
    lookup_key: 'super_saving_deals',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सुपर बचत सौदे' },
      bn: { text: 'সুপার সেভিং ডিল' }
    }
  },
  {
    text: 'In The Spotlight',
    lookup_key: 'in_the_spotlight',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सुर्खियों में' },
      bn: { text: 'স্পটলাইটে' }
    }
  },
  {
    text: 'With',
    lookup_key: 'with',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सुर्खियों में' },
      bn: { text: 'স্পটলাইটে' }
    }
  },
  {
    text: 'OFF',
    lookup_key: 'off',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सुर्खियों में' },
      bn: { text: 'স্পটলাইটে' }
    }
  },
  {
    text: 'Price',
    lookup_key: 'price',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सुर्खियों में' },
      bn: { text: 'স্পটলাইটে' }
    }
  },
  {
    text: 'Discount',
    lookup_key: 'discount',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सुर्खियों में' },
      bn: { text: 'স্পটলাইটে' }
    }
  },
  {
    text: 'Sort By',
    lookup_key: 'sort_by',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सुर्खियों में' },
      bn: { text: 'স্পটলাইটে' }
    }
  },
  {
    text: 'Price : Low to High',
    lookup_key: 'sort_low_high',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सुर्खियों में' },
      bn: { text: 'স্পটলাইটে' }
    }
  },
  {
    text: 'Price : High to Low',
    lookup_key: 'sort_high_low',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सुर्खियों में' },
      bn: { text: 'স্পটলাইটে' }
    }
  },
  {
    text: 'What are you looking for?',
    lookup_key: 'what_are_you_looking_for',
    groups: 'Mobile',
    referenceType: 'Value',
    translations: {
      hi: { text: 'आप क्या ढूंढ रहे हैं?' },
      bn: { text: 'আপনি কী খুঁজছেন?' }
    }
  },
  {
    text: 'Order Medicine',
    lookup_key: 'order_medicine',
    groups: 'Mobile',
    referenceType: 'Value',
    translations: {
      hi: { text: 'दवा ऑर्डर करें' },
      bn: { text: 'ওষুধ অর্ডার করুন' }
    }
  },
  {
    text: 'Contact Doctor',
    lookup_key: 'contact_doctor',
    groups: 'Mobile',
    referenceType: 'Value',
    translations: {
      hi: { text: 'डॉक्टर से संपर्क करें' },
      bn: { text: 'ডাক্তারের সাথে যোগাযোগ করুন' }
    }
  },
  {
    text: 'Previously Bought',
    lookup_key: 'previously_bought',
    groups: 'Mobile',
    referenceType: 'Value',
    translations: {
      hi: { text: 'पहले खरीदा गया' },
      bn: { text: 'আগে কেনা হয়েছে' }
    }
  },
  {
    text: 'Deals For You',
    lookup_key: 'deals_for_you',
    groups: 'Mobile',
    referenceType: 'Value',
    translations: {
      hi: { text: 'आपके लिए डील्स' },
      bn: { text: 'আপনার জন্য ডিল' }
    }
  },
  {
    text: 'Description',
    lookup_key: 'description',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'विवरण' },
      bn: { text: 'বিবরণ' }
    }
  },
  {
    text: 'Free delivery',
    lookup_key: 'free_delivery',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'निःशुल्क डिलीवरी' },
      bn: { text: 'ফ্রি ডেলিভারি' }
    }
  },
  {
    text: 'Languages',
    lookup_key: 'languages',
    groups: 'MobileProfile',
    referenceType: 'Value',
    translations: {
      hi: { text: 'भाषाएँ' },
      bn: { text: 'ভাষাসমূহ' }
    }
  },
  {
    text: 'Favorites',
    lookup_key: 'favorites',
    groups: 'MobileProfile',
    referenceType: 'Value',
    translations: {
      hi: { text: 'पसंदीदा' },
      bn: { text: 'প্রিয়' }
    }
  },
  {
    text: 'My Orders',
    lookup_key: 'my_orders',
    groups: 'MobileProfile',
    referenceType: 'Value',
    translations: {
      hi: { text: 'मेरे ऑर्डर' },
      bn: { text: 'আমার অর্ডারগুলি' }
    }
  },
  {
    text: 'Cart',
    lookup_key: 'cart',
    groups: 'MobileProfile',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      bn: { text: 'কার্ট' }
    }
  },
  {
    text: 'Sign In',
    lookup_key: 'sign_in',
    groups: 'MobileProfile',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन इन करें' },
      bn: { text: 'সাইন ইন করুন' }
    }
  },
  {
    text: 'Sign Out',
    lookup_key: 'sign_out',
    groups: 'MobileProfile',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Download Our App',
    lookup_key: 'download_our_app',
    groups: 'ShareApp',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Get the App',
    lookup_key: 'get_the_app',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Scan the following QR code to download the app.',
    lookup_key: 'download_desc',
    groups: 'ShareApp',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'We will send you a link, open it on your phone to download the app',
    lookup_key: 'download_desc_2',
    groups: 'ShareApp',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Share app link',
    lookup_key: 'share_app_button',
    groups: 'ShareApp',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Download the app from:',
    lookup_key: 'download_from_the_app',
    groups: 'ShareApp',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'All',
    lookup_key: 'all',
    groups: 'Notification',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Read',
    lookup_key: 'read',
    groups: 'Notification',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Unread',
    lookup_key: 'unread',
    groups: 'Notification',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Mark all as read',
    lookup_key: 'mark_all_as_read',
    groups: 'Notification',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Notification',
    lookup_key: 'notification',
    groups: 'Notification',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'No Notifications Found',
    lookup_key: 'no_notification_found',
    groups: 'Notification',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'My Orders',
    lookup_key: 'my_orders',
    groups: 'MyOrders',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Recent',
    lookup_key: 'recent',
    groups: 'MyOrders',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Older',
    lookup_key: 'older',
    groups: 'MyOrders',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Product Details',
    lookup_key: 'product_details',
    groups: 'MyOrders',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Quantity',
    lookup_key: 'quantity',
    groups: 'MyOrders',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Status',
    lookup_key: 'status',
    groups: 'MyOrders',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Order ID',
    lookup_key: 'order_id',
    groups: 'MyOrders',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Order Details',
    lookup_key: 'order_details',
    groups: 'MyOrders',
    referenceType: 'Value',
    translations: {
      hi: { text: 'साइन आउट करें' },
      bn: { text: 'সাইন আউট করুন' }
    }
  },
  {
    text: 'Previous',
    lookup_key: 'previous',
    groups: 'Pagination',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Next',
    lookup_key: 'next',
    groups: 'Pagination',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Directions For Use',
    lookup_key: 'directions_for_use',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Packed By',
    lookup_key: 'packaged_by',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Specification',
    lookup_key: 'specification',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Product not available for the selected categories',
    lookup_key: 'product_unavailable_categories',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Product not available for now !',
    lookup_key: 'product-unavailable_now',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Pincode not available',
    lookup_key: 'pincode_not_available',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Out of stock',
    lookup_key: 'out_of_stock',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Not Available for this location',
    lookup_key: 'product_unavailable_location',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'No Image',
    lookup_key: 'no_image',
    groups: 'MyOrders',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Order in progress',
    lookup_key: 'order_in_progress',
    groups: 'MyOrders',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Order is',
    lookup_key: 'order_is',
    groups: 'MyOrders',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Shipping Details',
    lookup_key: 'shipping_details',
    groups: 'MyOrders',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Price Information',
    lookup_key: 'price_information',
    groups: 'MyOrders',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Total Paid',
    lookup_key: 'total_paid',
    groups: 'MyOrders',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Mobile',
    lookup_key: 'mobile',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Coupon Savings',
    lookup_key: 'coupon_savings',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Relevance',
    lookup_key: 'relevance',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्ट' },
      ta: { text: 'வண்டி' },
      te: { text: 'కార్ట్' },
      bn: { text: 'কার্ট' },
      mr: { text: 'कार्ट' },
      gu: { text: 'કાર્ટ' },
      pa: { text: 'ਕਾਰਟ' },
      kn: { text: 'ಕಾರ್ಟ್' },
      ml: { text: 'കാർട്ട്' }
    }
  },
  {
    text: 'Check',
    lookup_key: 'check',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'जांचें' },
      ta: { text: 'சரிபார்க்கவும்' },
      te: { text: 'తనిఖీ చేయండి' },
      bn: { text: 'চেক করুন' },
      mr: { text: 'तपासा' },
      gu: { text: 'તપાસો' },
      pa: { text: 'ਜਾਂਚ ਕਰੋ' },
      kn: { text: 'ಪರಿಶೀಲಿಸಿ' },
      ml: { text: 'പരിശോധിക്കുക' }
    }
  },
  {
    text: 'Coupon Code',
    lookup_key: 'coupon_code',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कूपन कोड' },
      ta: { text: 'கூப்பன் குறியீடு' },
      te: { text: 'కూపన్ కోడ్' },
      bn: { text: 'কুপন কোড' },
      mr: { text: 'कूपन कोड' },
      gu: { text: 'કૂપન કોડ' },
      pa: { text: 'ਕੂਪਨ ਕੋਡ' },
      kn: { text: 'ಕೂಪನ್ ಕೋಡ್' },
      ml: { text: 'കൂപ്പൺ കോഡ്' }
    }
  },
  {
    text: 'Discount on MRP',
    lookup_key: 'discount_on_mrp',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'MRP पर छूट' },
      ta: { text: 'MRP இல் தள்ளுபடி' },
      te: { text: 'MRP పై డిస్కౌంట్' },
      bn: { text: 'MRP ত ডিসকাউন্ট' },
      mr: { text: 'MRP वर सूट' },
      gu: { text: 'MRP પર ડિસ્કાઉન્ટ' },
      pa: { text: 'MRP ਤੇ ਛੂਟ' },
      kn: { text: 'MRP ಮೇಲೆ ಶ್ರೇಣೀಬದ್ಧತೆ' },
      ml: { text: 'MRP ലേക്ക് ഇളവ്' }
    }
  },
  {
    text: 'Free Delivery',
    lookup_key: 'free_delivery',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'मुफ्त डिलीवरी' },
      ta: { text: 'இலவச டெலிவரி' },
      te: { text: 'ఉచిత డెలివరీ' },
      bn: { text: 'মুক্ত ডেলিভারি' },
      mr: { text: 'मोफत डिलिवरी' },
      gu: { text: 'મફત ડિલિવરી' },
      pa: { text: 'ਮੁਫਤ ਡਿਲਿਵਰੀ' },
      kn: { text: 'ಉಚಿತ ವಿತರಣಾ' },
      ml: { text: 'മഫ്ത് ഡെലിവറി' }
    }
  },
  {
    text: 'Handling & Packaging Fee',
    lookup_key: 'handling_packaging_fee',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'हैंडलिंग और पैकेजिंग शुल्क' },
      ta: { text: 'கையாளல் மற்றும் பாக்கேஜிங் கட்டணம்' },
      te: { text: 'హ్యాండ్లింగ్ & ప్యాకేజింగ్ ఫీ' },
      bn: { text: 'হ্যান্ডলিং ও প্যাকেজিং ফি' },
      mr: { text: 'हँडलिंग आणि पॅकेजिंग शुल्क' },
      gu: { text: 'હેન્ડલિંગ અને પેકેજિંગ ફી' },
      pa: { text: 'ਹੈਂਡਲਿੰਗ ਅਤੇ ਪੈਕੇਜਿੰਗ ਫੀਸ' },
      kn: { text: 'ಹ್ಯಾಂಡ್ಲಿಂಗ್ ಮತ್ತು ಪ್ಯಾಕೇಜಿಂಗ್ ಶುಲ್ಕ' },
      ml: { text: 'ഹാൻഡ്ലിംഗ് & പാക്കേജിംഗ് ഫീ' }
    }
  },
  {
    text: 'Platform Fee',
    lookup_key: 'platform_fee',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'प्लेटफ़ॉर्म शुल्क' },
      ta: { text: 'தளம் கட்டணம்' },
      te: { text: 'ప్లాట్‌ఫార్మ్ ఫీ' },
      bn: { text: 'প্ল্যাটফর্ম ফি' },
      mr: { text: 'प्लॅटफॉर्म शुल्क' },
      gu: { text: 'પ્લેટફોર્મ ફી' },
      pa: { text: 'ਪਲੇਟਫਾਰਮ ਫੀਸ' },
      kn: { text: 'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕ' },
      ml: { text: 'പ്ലാറ്റ്ഫോം ഫീ' }
    }
  },
  {
    text: 'Total Paid',
    lookup_key: 'total_paid',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कुल भुगतान' },
      ta: { text: 'மொத்த கட்டணம்' },
      te: { text: 'మొత్తం చెల్లించినది' },
      bn: { text: 'মোট পরিশোধিত' },
      mr: { text: 'एकूण देय' },
      gu: { text: 'કુલ ચૂકવણી' },
      pa: { text: 'ਕੁੱਲ ਭੁਗਤਾਨ' },
      kn: { text: 'ಮೊತ್ತ ವಿತರಣಾ' },
      ml: { text: 'മൊത്തം അടച്ചത്' }
    }
  },
  {
    text: 'Total Coupon Discount',
    lookup_key: 'total_coupon_discount',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कुल कूपन छूट' },
      ta: { text: 'மொத்த கூப்பன் தள்ளுபடி' },
      te: { text: 'మొత్తం కూపన్ డిస్కౌంట్' },
      bn: { text: 'মোট কুপন ডিসকাউন্ট' },
      mr: { text: 'एकूण कूपन सूट' },
      gu: { text: 'કુલ કૂપન ડિસ્કાઉન્ટ' },
      pa: { text: 'ਕੁੱਲ ਕੂਪਨ ਛੂਟ' },
      kn: { text: 'ಮೊತ್ತ ಕೂಪನ್ ಶ್ರೇಣೀಬದ್ಧತೆ' },
      ml: { text: 'മൊത്തം കൂപ്പണ്‍ ഇളവ്' }
    }
  },
  {
    text: 'is selected',
    lookup_key: 'is_selected',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'चुना गया है' },
      ta: { text: 'தேர்ந்தெடுக்கப்பட்டது' },
      te: { text: 'ఎంచుకున్నది' },
      bn: { text: 'নির্বাচিত' },
      mr: { text: 'चयनित आहे' },
      gu: { text: 'ચૂંટવામાં આવ્યું છે' },
      pa: { text: 'ਚੁਣਿਆ ਗਿਆ ਹੈ' },
      kn: { text: 'ತೋರಿಸಲಾಗಿದೆ' },
      ml: { text: 'തിരിച്ചെടുത്തത്' }
    }
  },
  {
    text: 'products',
    lookup_key: 'products',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'उत्पाद' },
      ta: { text: 'தொகுப்புகள்' },
      te: { text: 'ఉత్పత్తులు' },
      bn: { text: 'পণ্য' },
      mr: { text: 'उत्पाद' },
      gu: { text: 'ઉત્પાદનો' },
      pa: { text: 'ਉਤਪਾਦ' },
      kn: { text: 'ಉತ್ಪನ್ನಗಳು' },
      ml: { text: 'ഉത്പന്നങ്ങൾ' }
    }
  },
  {
    text: 'Delivery Estimates',
    lookup_key: 'delivery_estimates',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'डिलीवरी अनुमान' },
      ta: { text: 'டெலிவரி மதிப்பீடுகள்' },
      te: { text: 'డెలివరీ అంచనాలు' },
      bn: { text: 'ডেলিভারি অনুমান' },
      mr: { text: 'डिलिव्हरी अंदाज' },
      gu: { text: 'ડિલિવરી અંદાજ' },
      pa: { text: 'ਡੇਲਿਵਰੀ ਅਨੁਮਾਨ' },
      kn: { text: 'ಡೆಲಿವರಿ ಅಂದಾಜುಗಳು' },
      ml: { text: 'ഡെലിവറി അനുമാനങ്ങൾ' }
    }
  },
  {
    text: 'Quantity',
    lookup_key: 'quantity',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'मात्रा' },
      ta: { text: 'அளவு' },
      te: { text: 'మోతాదు' },
      bn: { text: 'পরিমাণ' },
      mr: { text: 'प्रमाण' },
      gu: { text: 'માત્રા' },
      pa: { text: 'ਮਾਤਰਾ' },
      kn: { text: 'ಮಾತ್ರೆ' },
      ml: { text: 'മാത്ര' }
    }
  },
  {
    text: 'Checkout',
    lookup_key: 'checkout',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'चेकआउट' },
      ta: { text: 'செக்‌அவுட்' },
      te: { text: 'చెక్ అవుట్' },
      bn: { text: 'চেকআউট' },
      mr: { text: 'चेकआउट' },
      gu: { text: 'ચેકઆઉટ' },
      pa: { text: 'ਚੈਕਆਉਟ' },
      kn: { text: 'ಚೆಕ್‌ಆಊಟ್' },
      ml: { text: 'ചെക്ക്ഔട്ട്' }
    }
  },
  {
    text: 'Track your order',
    lookup_key: 'track_your_order',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अपने आदेश को ट्रैक करें' },
      ta: { text: 'உங்கள் ஆர்டரை பின்தொடரவும்' },
      te: { text: 'మీ ఆర్డర్‌ను ట్రాక్ చేయండి' },
      bn: { text: 'আপনার অর্ডার ট্র্যাক করুন' },
      mr: { text: 'आपल्या ऑर्डरचा मागोवा घ्या' },
      gu: { text: 'તમારા ઓર્ડરને ટ્રેક કરો' },
      pa: { text: 'ਤੁਹਾਡਾ ਆਰਡਰ ਟਰੈਕ ਕਰੋ' },
      kn: { text: 'ನಿಮ್ಮ ಆದೇಶವನ್ನು ಪತ್ತೆಹಚ್ಚಿ' },
      ml: { text: 'നിങ്ങളുടെ ഓർഡർ ട്രാക്ക് ചെയ്യുക' }
    }
  },
  {
    text: 'Order',
    lookup_key: 'order',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'आदेश' },
      ta: { text: 'ஆர்டர்' },
      te: { text: 'ఆర్డర్' },
      bn: { text: 'অর্ডার' },
      mr: { text: 'आदेश' },
      gu: { text: 'ઓર્ડર' },
      pa: { text: 'ਆਰਡਰ' },
      kn: { text: 'ಆದೇಶ' },
      ml: { text: 'ഓർഡർ' }
    }
  },
  {
    text: 'Product',
    lookup_key: 'product',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'उत्पाद' },
      ta: { text: 'தொகுப்பு' },
      te: { text: 'ఉత్పత్తి' },
      bn: { text: 'পণ্য' },
      mr: { text: 'उत्पाद' },
      gu: { text: 'ઉત્પાદન' },
      pa: { text: 'ਉਤਪਾਦ' },
      kn: { text: 'ಉತ್ಪನ್ನ' },
      ml: { text: 'ഉത്പന്നം' }
    }
  },
  {
    text: 'Price',
    lookup_key: 'price',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कीमत' },
      ta: { text: 'விலை' },
      te: { text: 'ధర' },
      bn: { text: 'মূল্য' },
      mr: { text: 'किंमत' },
      gu: { text: 'કિંમતો' },
      pa: { text: 'ਕੀਮਤ' },
      kn: { text: 'ದಾಮಿ' },
      ml: { text: 'വില' }
    }
  },
  {
    text: 'Your order is placed successfully !',
    lookup_key: 'your_order_is_placed_successfully',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'आपका आदेश सफलतापूर्वक दिया गया है' },
      ta: { text: 'உங்கள் ஆர்டர் வெற்றிகரமாக இடப்பட்டுள்ளது' },
      te: { text: 'మీ ఆర్డర్ విజయవంతంగా వేయబడింది' },
      bn: { text: 'আপনার অর্ডার সফলভাবে দেওয়া হয়েছে' },
      mr: { text: 'आपला ऑर्डर यशस्वीपणे दिला गेला आहे' },
      gu: { text: 'તમારું ઓર્ડર સફળતાપૂર્વક મૂકવામાં આવ્યું છે' },
      pa: { text: 'ਤੁਹਾਡਾ ਆਰਡਰ ਸਫਲਤਾਪੂਰਕ ਦਿੱਤਾ ਗਿਆ ਹੈ' },
      kn: { text: 'ನಿಮ್ಮ ಆದೇಶ ಯಶಸ್ವಿಯಾಗಿ ಹಾಕಲಾಗಿದೆ' },
      ml: { text: 'നിങ്ങളുടെ ഓർഡർ വിജയകരമായി നൽകിയിട്ടുണ്ട്' }
    }
  },
  {
    text: 'Not available for this location',
    lookup_key: 'not_available_for_this_location',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'इस स्थान के लिए उत्पाद उपलब्ध नहीं हैं' },
      ta: { text: 'இந்த இடத்திற்கு தயாரிப்புகள் கிடையாது' },
      te: { text: 'ఈ ప్రదేశానికి ఉత్పత్తులు అందుబాటులో లేదు' },
      bn: { text: 'এই অবস্থানের জন্য পণ্যগুলি উপলব্ধ নয়' },
      mr: { text: 'या ठिकाणासाठी उत्पादने उपलब्ध नाहीत' },
      gu: { text: 'આ સ્થાન માટે ઉત્પાદનો ઉપલબ્ધ નથી' },
      pa: { text: 'ਇਸ ਸਥਾਨ ਲਈ ਉਤਪਾਦ ਉਪਲਬਧ ਨਹੀਂ ਹਨ' },
      kn: { text: 'ಈ ಸ್ಥಳಕ್ಕೆ ಉತ್ಪನ್ನಗಳು ಲಭ್ಯವಿಲ್ಲ' },
      ml: { text: 'ഈ സ്ഥലത്തേക്ക് ഉത്പന്നങ്ങൾ ലഭ്യമല്ല' }
    }
  },
  {
    text: 'Out of stock',
    lookup_key: 'out_of_stock',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'स्टॉक से बाहर' },
      ta: { text: 'கூட்டத்தில் கிடையாது' },
      te: { text: 'స్టాక్‌లో లేవు' },
      bn: { text: 'স্টকে নেই' },
      mr: { text: 'स्टॉकमध्ये नाही' },
      gu: { text: 'સ્ટોકમાં નથી' },
      pa: { text: 'ਸਟਾਕ ਵਿੱਚ ਨਹੀਂ' },
      kn: { text: 'ಸ್ಟಾಕ್‌ನಲ್ಲಿ ಇಲ್ಲ' },
      ml: { text: 'സ്റ്റോക്കിൽ ഇല്ല' }
    }
  },
  {
    text: 'Expected Delivery',
    lookup_key: 'expected_delivery',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अपेक्षित डिलीवरी' },
      ta: { text: 'எதிர்பார்க்கப்படும் டெலிவரி' },
      te: { text: 'కనుమనేది డెలివరీ' },
      bn: { text: 'অপেক্ষিত ডেলিভারি' },
      mr: { text: 'अपेक्षित डिलिव्हरी' },
      gu: { text: 'અનુમાનિત ડિલિવરી' },
      pa: { text: 'ਉਮੀਦ ਕੀਤੀ ਡੇਲਿਵਰੀ' },
      kn: { text: 'ಕಂಡಿತಾ ವಿತರಣಾ' },
      ml: { text: 'ആശിച്ച ഡെലിവറി' }
    }
  },
  {
    text: 'Save Address as',
    lookup_key: 'save_address_as',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'पता के रूप में सहेजें' },
      ta: { text: 'முகவரியை சேமிக்கவும்' },
      te: { text: 'చిరునామాను సేవ్ చేయండి' },
      bn: { text: 'ঠিকানা হিসেবে সংরক্ষণ করুন' },
      mr: { text: 'पत्ता म्हणून जतन करा' },
      gu: { text: 'સરનામું તરીકે સેવ કરો' },
      pa: { text: 'ਪਤਾ ਵਜੋਂ ਸੇਵ ਕਰੋ' },
      kn: { text: 'ವಿಳಾಸವನ್ನು ಉಳಿಸು' },
      ml: { text: 'വിലാസം സേവ് ചെയ്യുക' }
    }
  },
  {
    text: 'Home',
    lookup_key: 'home',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'घर' },
      ta: { text: 'இளம்' },
      te: { text: 'ఇంటి' },
      bn: { text: 'বাড়ি' },
      mr: { text: 'घर' },
      gu: { text: 'ઘર' },
      pa: { text: 'ਘਰ' },
      kn: { text: 'ಮನೆ' },
      ml: { text: 'മുഴുവൻ' }
    }
  },
  {
    text: 'Office',
    lookup_key: 'office',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'कार्यालय' },
      ta: { text: 'அலுவலகம்' },
      te: { text: 'ఆఫీస్' },
      bn: { text: 'অফিস' },
      mr: { text: 'कार्यालय' },
      gu: { text: 'કાર્યાલય' },
      pa: { text: 'ਕਾਰਜਾਲੇ' },
      kn: { text: 'ಆಫೀಸ್' },
      ml: { text: 'അലുവലക' }
    }
  },
  {
    text: 'Make this as my default address',
    lookup_key: 'make_this_as_my_default_address',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'इसे मेरा डिफ़ॉल्ट पता बनाएं' },
      ta: { text: 'இதை என் இயல்புநிலைப்படுத்தவும்' },
      te: { text: 'ఇది నా డిఫాల్ట్ చిరునామాగా చేయండి' },
      bn: { text: 'এটি আমার ডিফল্ট ঠিকানা করুন' },
      mr: { text: 'हे माझे डिफॉल्ट पत्ता बनवा' },
      gu: { text: 'આને મારું ડિફોલ્ટ સરનામું બનાવો' },
      pa: { text: 'ਇਸਨੂੰ ਮੇਰਾ ਡਿਫਾਲਟ ਪਤਾ ਬਣਾਓ' },
      kn: { text: 'ಈದನ್ನು ನನ್ನ ಡಿಫಾಲ್ಟ್ ವಿಳಾಸವಾಗಿರಿಸಿ' },
      ml: { text: 'ഇതിനെ എന്റെ ഡിഫോൾട്ട് വിലാസമാക്കുക' }
    }
  },
  {
    text: 'Save Address',
    lookup_key: 'save_address',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'पता सहेजें' },
      ta: { text: 'முகவரியை சேமிக்கவும்' },
      te: { text: 'చిరునామా సేవ్ చేయండి' },
      bn: { text: 'ঠিকানা সংরক্ষণ করুন' },
      mr: { text: 'पत्ता जतन करा' },
      gu: { text: 'સરનામું સેવ કરો' },
      pa: { text: 'ਪਤਾ ਸੇਵ ਕਰੋ' },
      kn: { text: 'ವಿಳಾಸವನ್ನು ಉಳಿಸು' },
      ml: { text: 'വിലാസം സേവ് ചെയ്യുക' }
    }
  },
  {
    text: 'Default Address',
    lookup_key: 'default_address',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'डिफ़ॉल्ट पता' },
      ta: { text: 'இயல்புநிலைப்படுத்தல் முகவரி' },
      te: { text: 'డిఫాల్ట్ చిరునామా' },
      bn: { text: 'ডিফল্ট ঠিকানা' },
      mr: { text: 'डिफॉल्ट पत्ता' },
      gu: { text: 'ડિફોલ્ટ સરનામું' },
      pa: { text: 'ਡਿਫਾਲਟ ਪਤਾ' },
      kn: { text: 'ಡಿಫಾಲ್ಟ್ ವಿಳಾಸ' },
      ml: { text: 'ഡിഫോൾട്ട് വിലാസം' }
    }
  },
  {
    text: 'Remove',
    lookup_key: 'remove',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'हटाएं' },
      ta: { text: 'நீக்கவும்' },
      te: { text: 'తీయండి' },
      bn: { text: 'অপসারণ করুন' },
      mr: { text: 'काढा' },
      gu: { text: 'કાઢો' },
      pa: { text: 'ਹਟਾਓ' },
      kn: { text: 'ಕೆಳಗಿನ' },
      ml: { text: 'അപേക്ഷിക്കുക' }
    }
  },
  {
    text: 'Your Cart is Empty!',
    lookup_key: 'your_cart_is_empty',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'आपका कार्ट खाली है' },
      ta: { text: 'உங்கள் கார்ட் காலியாக உள்ளது' },
      te: { text: 'మీ కార్ట్ ఖాళీగా ఉంది' },
      bn: { text: 'আপনার কার্ট খালি' },
      mr: { text: 'तुमचा कार्ट रिकामा आहे' },
      gu: { text: 'તમારું કાર્ટ ખાલી છે' },
      pa: { text: 'ਤੁਹਾਡਾ ਕਾਰਟ ਖਾਲੀ ਹੈ' },
      kn: { text: 'ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿ ಇದೆ' },
      ml: { text: 'നിങ്ങളുടെ കാർട്ട് കാലിയാണ്' }
    }
  },
  {
    text: 'Add Products!',
    lookup_key: 'add_products',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'उत्पाद जोड़ें' },
      ta: { text: 'தொகுப்புகள் சேர்க்கவும்' },
      te: { text: 'ఉత్పత్తులను జోడించండి' },
      bn: { text: 'পণ্য যোগ করুন' },
      mr: { text: 'उत्पाद जोडा' },
      gu: { text: 'ઉત્પાદનો ઉમેરો' },
      pa: { text: 'ਉਤਪਾਦ ਸ਼ਾਮਲ ਕਰੋ' },
      kn: { text: 'ಉತ್ಪನ್ನಗಳನ್ನು ಸೇರಿಸು' },
      ml: { text: 'ഉത്പന്നങ്ങൾ ചേർക്കുക' }
    }
  },
  {
    text: 'Select Delivery Address',
    lookup_key: 'select_delivery_address',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'डिलीवरी का पता चुनें' },
      ta: { text: 'வெளியீட்டு முகவரியை தேர்ந்தெடுக்கவும்' },
      te: { text: 'డెలివరీ చిరునామా ఎంచుకోండి' },
      bn: { text: 'ডেলিভারি ঠিকানা নির্বাচন করুন' },
      mr: { text: 'डिलिव्हरी पत्ता निवडा' },
      gu: { text: 'ડિલિવરી સરનામું પસંદ કરો' },
      pa: { text: 'ਡਿਲਿਵਰੀ ਪਤਾ ਚੁਣੋ' },
      kn: { text: 'ಡೆಲಿವರಿ ವಿಳಾಸ ಆಯ್ಕೆಮಾಡಿ' },
      ml: { text: 'ഡെലിവറി വിലാസം തിരഞ്ഞെടുക്കുക' }
    }
  },
  {
    text: 'Edit',
    lookup_key: 'edit_address',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'संपादित करें' },
      ta: { text: 'திருத்தவும்' },
      te: { text: 'సవరించు' },
      bn: { text: 'সম্পাদনা করুন' },
      mr: { text: 'संपादित करा' },
      gu: { text: 'સંપાદિત કરો' },
      pa: { text: 'ਸੋਧੋ' },
      kn: { text: 'ಸಂಪಾದನೆ' },
      ml: { text: 'തിരുത്തുക' }
    }
  },
  {
    text: 'Add New Address',
    lookup_key: 'add_new_address',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'नया पता जोड़ें' },
      ta: { text: 'புதிய முகவரி சேர்க்கவும்' },
      te: { text: 'కొత్త చిరునామా జోడించండి' },
      bn: { text: 'নতুন ঠিকানা যোগ করুন' },
      mr: { text: 'नवीन पत्ता जोडा' },
      gu: { text: 'નવો સરનામો ઉમેરો' },
      pa: { text: 'ਨਵਾਂ ਪਤਾ ਸ਼ਾਮਲ ਕਰੋ' },
      kn: { text: 'ಹೊಸ ವಿಳಾಸವನ್ನು ಸೇರಿಸು' },
      ml: { text: 'പുതിയ വിലാസം ചേർക്കുക' }
    }
  },
  {
    text: 'Other Addresses',
    lookup_key: 'other_addresses',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'अन्य पते' },
      ta: { text: 'மற்ற முகவறிகள்' },
      te: { text: 'ఇతర చిరునామాలు' },
      bn: { text: 'অন্যান্য ঠিকানা' },
      mr: { text: 'इतर पत्ते' },
      gu: { text: 'અન્ય સરનામા' },
      pa: { text: 'ਹੋਰ ਪਤੇ' },
      kn: { text: 'ಮರು ವಿಳಾಸಗಳು' },
      ml: { text: 'മറ്റു വിലാസങ്ങൾ' }
    }
  },
  {
    text: 'Delivery Address',
    lookup_key: 'delivery_address',
    groups: 'Cart',
    referenceType: 'Value',
    translations: {
      hi: { text: 'डिलीवरी का पता' },
      ta: { text: 'டெலிவரி முகவரி' },
      te: { text: 'డెలివరీ చిరునామా' },
      bn: { text: 'ডেলিভারি ঠিকানা' },
      mr: { text: 'डिलिव्हरीचा पत्ता' },
      gu: { text: 'ડિલિવરીનો સરનામો' },
      pa: { text: 'ਡੇਲਿਵਰੀ ਦਾ ਪਤਾ' },
      kn: { text: 'ಡೆಲಿವರಿ ವಿಳಾಸ' },
      ml: { text: 'ഡെലിവറി വിലാസം' }
    }
  },
  {
    text: 'Buy generic medicines online for the lowest price',
    lookup_key: 'global_search_header',
    groups: 'GlobalSearch',
    referenceType: 'Value',
    translations: {
      hi: { text: 'निम्नतम कीमत पर ऑनलाइन जेनेरिक दवाएँ खरीदें' },
      ta: { text: 'குறைந்த விலையில் ஆன்லைனில் பொதுப் மருந்துகள் வாங்கவும்' },
      te: { text: 'కమిషన్ ధరకు ఆన్‌లైన్‌లో జనరల్ ఔషధాలను కొనండి' },
      bn: { text: 'সর্বনিম্ন দামে অনলাইনে জেনেরিক ওষুধ কিনুন' },
      mr: { text: 'सर्वात कमी किमतीत ऑनलाइन सामान्य औषधे खरेदी करा' },
      gu: { text: 'ઓનલાઇન સૌથી ઓછી કિંમતે સામાન્ય દવાઓ ખરીદો' },
      pa: { text: 'ਸਬ ਤੋਂ ਸਸਤੀ ਕੀਮਤ ਤੇ ਆਨਲਾਈਨ ਜਨਰਿਕ ਦਵਾਈਆਂ ਖਰੀਦੋ' },
      kn: { text: 'ಕಡಿಮೆ ಬೆಲೆಗೆ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಸಾಮಾನ್ಯ ಔಷಧಿಗಳನ್ನು ಖರೀದಿಸಿ' },
      ml: { text: 'കീഴ്പ്പു വിലയിൽ ഓൺലൈൻ ജനറിക് മരുന്നുകൾ വാങ്ങുക' }
    }
  },
  {
    text: 'Search Medicines / Compositions / General Products',
    lookup_key: 'global_search_placeholder',
    groups: 'GlobalSearch',
    referenceType: 'Value',
    translations: {
      hi: { text: 'दवाओं / संयोजनों / सामान्य उत्पादों की खोज करें' },
      ta: { text: 'மருந்துகள் / சேர்க்கைகள் / பொதுவான பொருட்களை தேடவும்' },
      te: { text: 'మరుములు / సమ్మేళనాలు / సాధారణ ఉత్పత్తులు శోధించండి' },
      bn: { text: 'ওষুধ / সংমিশ্রণ / সাধারণ পণ্যের সন্ধান করুন' },
      mr: { text: 'औषधे / संयोजने / सामान्य उत्पादनांची शोध घ्या' },
      gu: { text: 'દવાઓ / સંયોજન / સામાન્ય ઉત્પાદનો શોધો' },
      pa: { text: 'ਦਵਾਈਆਂ / ਸੰਯੋਜਨਾਵਾਂ / ਆਮ ਉਤਪਾਦਾਂ ਦੀ ਖੋਜ ਕਰੋ' },
      kn: { text: 'ಔಷಧಗಳು / ಸಂಯೋಜನೆಗಳು / ಸಾಮಾನ್ಯ ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಿ' },
      ml: { text: 'മരുന്നുകൾ / സംയോജിതങ്ങൾ / പൊതുവായ ഉൽപ്പന്നങ്ങൾ തിരയുക' }
    }
  },
  {
    text: 'Showing results for',
    lookup_key: 'search_for',
    groups: 'GlobalSearch',
    referenceType: 'Value',
    translations: {
      hi: { text: 'परिणाम दिखा रहे हैं' },
      ta: { text: 'முடிவுகளை காண்பிக்கிறது' },
      te: { text: 'ఫలితాలు చూపిస్తున్నాయి' },
      bn: { text: 'ফলাফল দেখাচ্ছে' },
      mr: { text: 'परिणाम दाखवित आहे' },
      gu: { text: 'પરિણામો બતાવવામાં આવી રહ્યા છે' },
      pa: { text: 'ਨਤੀਜੇ ਦਿਖਾਏ ਜਾ ਰਹੇ ਹਨ' },
      kn: { text: 'ಫಲಿತಾಂಶಗಳನ್ನು ತೋರಿಸುತ್ತಿದೆ' },
      ml: { text: 'ഫലങ്ങൾ കാണിക്കുന്നു' }
    }
  },
  {
    text: 'Oops! We dont have any more products that match your search criteria',
    lookup_key: 'search_no_result',
    groups: 'GlobalSearch',
    referenceType: 'Value',
    translations: {
      hi: { text: 'उफ! आपके खोज मानदंड से मेल खाने वाले कोई और उत्पाद नहीं हैं' },
      ta: { text: 'உஃப்! உங்கள் தேடல் அளவுகோலுக்கு ஏற்ப பொருட்கள் கிடைக்கவில்லை' },
      te: { text: 'అయ్యో! మీ శోధన ప్రమాణాలకు సరిపోయే మరిన్ని ఉత్పత్తులు లేవు' },
      bn: { text: 'উফ! আপনার অনুসন্ধান মানদণ্ডের সাথে মিলে এমন কোনও পণ্য নেই' },
      mr: { text: 'उफ! आपल्या शोध निकषांशी जुळणारे अजून उत्पादन नाहीत' },
      gu: { text: 'ઑફ! તમારા શોધ માપદંડ સાથે મેળ ખાતા કોઈ વધુ ઉત્પાદનો નથી' },
      pa: { text: 'ਓਹ! ਤੁਹਾਡੇ ਖੋਜ ਮਾਪਦੰਡਾਂ ਨਾਲ ਮੇਲ ਖਾਂਦੇ ਹੋਰ ਉਤਪਾਦ ਨਹੀਂ ਹਨ' },
      kn: { text: 'ಅಯ್ಯೋ! ನಿಮ್ಮ ಶೋಧ ಮಾನದಂಡಗಳಿಗೆ ಹೊಂದುವ ಇನ್ನಷ್ಟು ಉತ್ಪನ್ನಗಳಿಲ್ಲ' },
      ml: { text: 'ഊഫ്സ്! നിങ്ങളുടെ തിരച്ചിൽ മാനദണ്ഡങ്ങൾക്കു നേരിടുന്ന മറ്റു ഉൽപ്പന്നങ്ങൾ ഇല്ല' }
    }
  },
  {
    text: 'Suggested Generic products',
    lookup_key: 'suggested_generic_products',
    groups: 'GlobalSearch',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सुझाए गए सामान्य उत्पाद' },
      ta: { text: 'பரிந்துரைக்கப்படும் பொதுப் பொருட்கள்' },
      te: { text: 'సిఫార్సు చేసిన జనరల్ ఉత్పత్తులు' },
      bn: { text: 'সুপারিশকৃত জেনেরিক পণ্য' },
      mr: { text: 'सुचवलेले सामान्य उत्पादन' },
      gu: { text: 'સૂચવેલ સામાન્ય ઉત્પાદનો' },
      pa: { text: 'ਸਿਫਾਰਿਸ਼ ਕੀਤੇ ਗਏ ਜਨਰਿਕ ਉਤਪਾਦ' },
      kn: { text: 'ಸುಪಾರಿ ನೀಡಿದ ಸಾಮಾನ್ಯ ಉತ್ಪನ್ನಗಳು' },
      ml: { text: 'ശുപാർശ ചെയ്ത ജനറിക് ഉൽപ്പന്നങ്ങൾ' }
    }
  },
  {
    text: 'Suggested Compositions',
    lookup_key: 'suggested_compositions',
    groups: 'GlobalSearch',
    referenceType: 'Value',
    translations: {
      hi: { text: 'सुझाए गए संयोजन' },
      ta: { text: 'பரிந்துரைக்கப்பட்ட சேர்க்கைகள்' },
      te: { text: 'సిఫారసు చేసిన సమ్మేళనాలు' },
      bn: { text: 'সুপারিশকৃত সংমিশ্রণ' },
      mr: { text: 'सुचवलेले संयोजन' },
      gu: { text: 'સૂચવેલ સંયોજનો' },
      pa: { text: 'ਸਿਫਾਰਿਸ਼ ਕੀਤੇ ਗਏ ਸੰਯੋਜਨ' },
      kn: { text: 'ಸುಪಾರಿ ನೀಡಿದ ಸಂಯೋಜನೆಗಳು' },
      ml: { text: 'ശുപാർശ ചെയ്ത സംയോജിതങ്ങൾ' }
    }
  },
  {
    text: 'My Orders',
    lookup_key: 'my_orders',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'मेरे ऑर्डर' },
      ta: { text: 'என் ஆர்டர்கள்' },
      te: { text: 'నా ఆర్డర్లు' },
      bn: { text: 'আমার অর্ডার' },
      mr: { text: 'माझे ऑर्डर' },
      gu: { text: 'મારા ઓર્ડર' },
      pa: { text: 'ਮੇਰੇ ਆਰਡਰ' },
      kn: { text: 'ನನ್ನ ಆದೇಶಗಳು' },
      ml: { text: 'എന്റെ ഓർഡറുകൾ' }
    }
  },
  {
    text: 'Logout',
    lookup_key: 'logout',
    groups: 'Common',
    referenceType: 'Value',
    translations: {
      hi: { text: 'लॉगआउट' },
      ta: { text: 'வெளியேறு' },
      te: { text: 'లాగ్‌అవుట్' },
      bn: { text: 'লগআউট' },
      mr: { text: 'लॉगआउट' },
      gu: { text: 'લોગઆઉટ' },
      pa: { text: 'ਲਾਗਆਊਟ' },
      kn: { text: 'ಲಾಗ್‌ಔಟ್' },
      ml: { text: 'ലോഗ് ഔട്ട്' }
    }
  },
  {
    text: 'Search',
    lookup_key: 'search',
    groups: 'GlobalSearch',
    referenceType: 'Value',
    translations: {
      hi: { text: 'खोज' },
      ta: { text: 'தேடல்' },
      te: { text: 'శోధన' },
      bn: { text: 'অনুসন্ধান' },
      mr: { text: 'शोध' },
      gu: { text: 'શોધ' },
      pa: { text: 'ਖੋਜ' },
      kn: { text: 'ಹುಡುಕಾಟ' },
      ml: { text: 'തിരയുക' }
    }
  },
  {
    text: 'Medicines / Compositions / General Products',
    lookup_key: 'search_types',
    groups: 'GlobalSearch',
    referenceType: 'Value',
    translations: {
      hi: { text: 'दवाइयाँ / संरचनाएँ / सामान्य उत्पाद' },
      ta: { text: 'மருந்துகள் / கலவைகள் / பொது பொருட்கள்' },
      te: { text: 'మందులు / సమ్మేళనాలు / సాధారణ ఉత్పత్తులు' },
      bn: { text: 'ওষুধ / সংযোজন / সাধারণ পণ্য' },
      mr: { text: 'औषधे / संयुगे / सामान्य उत्पादने' },
      gu: { text: 'દવાઓ / સંયોજનો / સામાન્ય ઉત્પાદનો' },
      pa: { text: 'ਦਵਾਈਆਂ / ਰਚਨਾਵਾਂ / ਆਮ ਉਤਪਾਦ' },
      kn: { text: 'ಔಷಧಗಳು / ಸಂಯೋಜನೆಗಳು / ಸಾಮಾನ್ಯ ಉತ್ಪನ್ನಗಳು' },
      ml: { text: 'മരുന്നുകൾ / സംയോജനങ്ങൾ / സാധാരണ ഉൽപ്പന്നങ്ങൾ' }
    }
  },
  {
    text: 'Need Help?',
    lookup_key: 'need_help',
    groups: 'SettingsManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'मदद चाहिए?' },
      ta: { text: 'உதவி தேவைப்படுகிறதா?' },
      te: { text: 'సహాయం కావాలా?' },
      bn: { text: 'সাহায্য প্রয়োজন?' },
      mr: { text: 'मदतीची गरज आहे?' },
      gu: { text: 'મદદની જરૂર છે?' },
      pa: { text: 'ਮਦਦ ਚਾਹੀਦੀ ਹੈ?' },
      kn: { text: 'ಸಹಾಯ ಬೇಕೇ?' },
      ml: { text: 'സഹായം വേണോ?' }
    }
  },
  {
    text: 'Start Chatting',
    lookup_key: 'start_chatting',
    groups: 'SettingsManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'चैट शुरू करें' },
      ta: { text: 'சாட் தொடங்கவும்' },
      te: { text: 'చాట్ ప్రారంభించండి' },
      bn: { text: 'চ্যাট শুরু করুন' },
      mr: { text: 'चॅट सुरू करा' },
      gu: { text: 'ચેટ શરૂ કરો' },
      pa: { text: 'ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰੋ' },
      kn: { text: 'ಚಾಟ್ ಪ್ರಾರಂಭಿಸಿ' },
      ml: { text: 'സംഭാഷണം ആരംഭിക്കുക' }
    }
  },
  {
    text: 'Start chatting with our customer care',
    lookup_key: 'start_chatting_with_customer_care',
    groups: 'SettingsManager',
    referenceType: 'Value',
    translations: {
      hi: { text: 'हमारे ग्राहक सेवा से चैट शुरू करें' },
      ta: { text: 'எங்கள் வாடிக்கையாளர் சேவையுடன் சாட் தொடங்கவும்' },
      te: { text: 'మా కస్టమర్ కేర్‌తో చాట్ ప్రారంభించండి' },
      bn: { text: 'আমাদের গ্রাহক পরিষেবার সাথে চ্যাট শুরু করুন' },
      mr: { text: 'आमच्या ग्राहक सेवेशी चॅट सुरू करा' },
      gu: { text: 'અમારા ગ્રાહક સંભાળ સાથે ચેટ શરૂ કરો' },
      pa: { text: 'ਸਾਡੀ ਗਾਹਕ ਸੇਵਾ ਨਾਲ ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰੋ' },
      kn: { text: 'ನಮ್ಮ ಗ್ರಾಹಕ ಸೇವೆಯೊಂದಿಗೆ ಚಾಟ್ ಪ್ರಾರಂಭಿಸಿ' },
      ml: { text: 'ഞങ്ങളുടെ ഉപഭോക്തൃ പരിചരണവുമായി സംവാദം ആരംഭിക്കുക' }
    }
  },
  {
    text: 'Returns are accepted within 7 days of delivery if the product is unopened and remains in its original packaging. Refunds will be processed within 5 to 7 business days after the returned product is inspected. Please note that prescription medicines are not eligible for return or refund.',
    lookup_key: 'returnAndRefundPolicy',
    groups: 'Product',
    referenceType: 'Value',
    translations: {
      hi: {
        text: 'अगर उत्पाद बिना खोले और अपनी मूल पैकेजिंग में है, तो डिलीवरी के 7 दिनों के भीतर इसे लौटाया जा सकता है। लौटाए गए उत्पाद का निरीक्षण करने के बाद, रिफंड 5 से 7 कार्यदिवसों के भीतर संसाधित किया जाएगा। कृपया ध्यान दें कि पर्चे वाली दवाइयों पर वापसी या रिफंड नहीं किया जा सकता।'
      },
      ta: {
        text: 'பொருள் திறக்கப்படாததும் அதன் மூல பாக்கெஜில் இருந்தால், விநியோகத்தின் 7 நாட்களுக்குள் திருப்பி அனுப்பலாம். திரும்பிய பொருளின் பரிசோதனைக்குப் பிறகு, பணம் திருப்பி செலுத்துவது 5 முதல் 7 வணிக நாட்களில் முடியும். கவனத்தில் கொள்ளுங்கள், மருந்து சீட்டு தேவையான மருந்துகள் திருப்பி பெற அல்லது பணம் திருப்பி பெற முடியாது.'
      },
      te: {
        text: 'ఉత్పత్తి మూల ప్యాకేజింగ్‌లో మరియు అనుమతించని స్థితిలో ఉంటే, డెలివరీకి 7 రోజుల్లో రిటర్న్‌లను స్వీకరించవచ్చు. రిటర్న్ చేసిన ఉత్పత్తిని పరిశీలించిన తర్వాత, 5 నుండి 7 వ్యాపార రోజుల్లో రీఫండ్ ప్రక్రియ జరగుతుంది. దయచేసి గమనించండి, ప్రిస్క్రిప్షన్ మందులు రిటర్న్ లేదా రీఫండ్‌కు అర్హత కలిగి ఉండవు.'
      },
      bn: {
        text: 'পণ্যটি যদি খোলা না হয় এবং তার আসল প্যাকেজিংয়ে থাকে, তবে ডেলিভারির 7 দিনের মধ্যে ফেরত নেওয়া যেতে পারে। ফেরত দেওয়া পণ্যটি পরিদর্শনের পরে, 5 থেকে 7 কার্যদিবসের মধ্যে রিফান্ড প্রক্রিয়া করা হবে। অনুগ্রহ করে মনে রাখবেন, প্রেসক্রিপশন ওষুধ ফেরত বা রিফান্ডের জন্য যোগ্য নয়।'
      },
      mr: {
        text: 'उत्पादन न उघडता आणि मूळ पॅकेजिंगमध्ये असल्यास, वितरणाच्या 7 दिवसांच्या आत ते परत केले जाऊ शकते. परत आलेल्या उत्पादनाचे निरीक्षण झाल्यानंतर, 5 ते 7 व्यावसायिक दिवसांत रिफंड प्रक्रिया केली जाईल. कृपया लक्षात घ्या की प्रिस्क्रिप्शन औषधे परतविण्यायोग्य नाहीत किंवा रिफंडसाठी पात्र नाहीत.'
      },
      gu: {
        text: 'જો ઉત્પાદન ખોલવામાં આવ્યું નથી અને તે તેની મૂળ પૅકેજિંગમાં છે, તો ડિલિવરીના 7 દિવસની અંદર વાપસી સ્વીકારવામાં આવશે. પરત કરેલા ઉત્પાદનોનું નિરીક્ષણ કર્યા પછી, રિફંડ 5 થી 7 કારોબારી દિવસોમાં પ્રક્રિયા કરવામાં આવશે. કૃપા કરીને નોંધો કે પ્રિસ્ક્રિપ્શન દવાઓ પરત કરવા અથવા રિફંડ માટે પાત્ર નથી.'
      },
      pa: {
        text: 'ਜੇ ਉਤਪਾਦ ਖੁਲਿਆ ਨਹੀਂ ਹੈ ਅਤੇ ਆਪਣੇ ਮੂਲ ਪੈਕੇਜ ਵਿੱਚ ਹੈ, ਤਾਂ ਡਿਲੀਵਰੀ ਦੇ 7 ਦਿਨਾਂ ਵਿੱਚ ਵਾਪਸੀ ਸਵੀਕਾਰ ਕੀਤੀ ਜਾ ਸਕਦੀ ਹੈ। ਵਾਪਸ ਕੀਤੇ ਗਏ ਉਤਪਾਦ ਦੀ ਜਾਂਚ ਤੋਂ ਬਾਅਦ, ਰਿਫੰਡ 5 ਤੋਂ 7 ਕਾਰੋਬਾਰੀ ਦਿਨਾਂ ਵਿੱਚ ਪ੍ਰਕਿਰਿਆ ਕੀਤੀ ਜਾਵੇਗੀ। ਕਿਰਪਾ ਕਰਕੇ ਧਿਆਨ ਦੇਵੋ ਕਿ ਪ੍ਰਿਸਕ੍ਰਿਪਸ਼ਨ ਵਾਲੀਆਂ ਦਵਾਈਆਂ ਦੀ ਵਾਪਸੀ ਜਾਂ ਰਿਫੰਡ ਨਹੀਂ ਕੀਤਾ ਜਾ ਸਕਦਾ।'
      },
      kn: {
        text: 'ಉತ್ಪನ್ನವನ್ನು ತೆರೆದಿಲ್ಲ ಮತ್ತು ಮೂಲ ಪ್ಯಾಕೇಜಿಂಗ್‌ನಲ್ಲಿಯೇ ಇದ್ದರೆ, ವಿತರಣೆಯ 7 ದಿನಗಳ ಒಳಗೆ ವಾಪಸ್ ಮಾಡಬಹುದು. ವಾಪಸ್ ಮಾಡಿದ ಉತ್ಪನ್ನದ ಪರಿಶೀಲನೆಯ ನಂತರ, ಮರುಪಾವತಿಯನ್ನು 5 ರಿಂದ 7 ವ್ಯಾಪಾರ ದಿನಗಳಲ್ಲಿ ಪೂರ್ಣಗೊಳಿಸಲಾಗುತ್ತದೆ. ದಯವಿಟ್ಟು ಗಮನಿಸಿ, ಔಷಧ ಪತ್ರದ ಔಷಧಿಗಳನ್ನು ವಾಪಸ್ ಮಾಡಲು ಅಥವಾ ಮರುಪಾವತಿಗಾಗಿ ಅರ್ಹತೆಯಿಲ್ಲ.'
      },
      ml: {
        text: 'ഉൽപ്പന്നം തുറക്കാതെയും അതിന്റെ ആദി പാക്കേജിംഗിലുമുള്ളതായി കണ്ടെത്തിയാൽ, ഡെലിവറിയുടെ 7 ദിവസത്തിനുള്ളിൽ മടക്കം അനുവദിക്കും. മടക്കിയ ഉൽപ്പന്നം പരിശോധിച്ചതിനുശേഷം, റീഫണ്ട് 5 മുതൽ 7 വ്യാപാര ദിവസങ്ങൾക്കുള്ളിൽ പ്രക്രിയിക്കുന്നു. ദയവായി ശ്രദ്ധിക്കുക, റെസിപി ആവശ്യമുള്ള മരുന്നുകൾ മടക്കത്തിനോ റീഫണ്ടിനോ അർഹമല്ല.'
      }
    }
  },
  {
    text: 'Consultations',
    lookup_key: 'consultations',
    groups: 'SettingsManager',
    referenceType: 'Value',
    translations: {
      hi: {
        text: 'परामर्श'
      },
      ta: {
        text: 'ஆலோசனைகள்'
      },
      te: {
        text: 'సలహాలు'
      },
      bn: {
        text: 'পরামর্শ'
      },
      mr: {
        text: 'सल्लामसलत'
      },
      gu: {
        text: 'સલાહો'
      },
      pa: {
        text: 'ਸਲਾਹ-ਮਸ਼ਵਰਾ'
      },
      kn: {
        text: 'ಸಲಹೆಗಳು'
      },
      ml: {
        text: 'പരാമർശങ്ങൾ'
      }
    }
  }
]

module.exports = { translations }
