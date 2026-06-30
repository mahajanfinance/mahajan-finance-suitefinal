export interface Bank {
  name: string;
  category:
    | "government"
    | "private"
    | "small_finance"
    | "payments"
    | "nbfc"
    | "cooperative"
    | "other";
}

export const banks: Bank[] = [
  // ===========================
  // GOVERNMENT / PUBLIC SECTOR
  // ===========================
  { name: "State Bank of India (SBI)", category: "government" },
  { name: "Bank of Baroda", category: "government" },
  { name: "Punjab National Bank", category: "government" },
  { name: "Canara Bank", category: "government" },
  { name: "Union Bank of India", category: "government" },
  { name: "Bank of India", category: "government" },
  { name: "Indian Bank", category: "government" },
  { name: "Central Bank of India", category: "government" },
  { name: "Indian Overseas Bank", category: "government" },
  { name: "Bank of Maharashtra", category: "government" },
  { name: "Punjab & Sind Bank", category: "government" },
  { name: "UCO Bank", category: "government" },

  // ===========================
  // PRIVATE BANKS
  // ===========================
  { name: "HDFC Bank", category: "private" },
  { name: "ICICI Bank", category: "private" },
  { name: "Axis Bank", category: "private" },
  { name: "Kotak Mahindra Bank", category: "private" },
  { name: "IndusInd Bank", category: "private" },
  { name: "Yes Bank", category: "private" },
  { name: "IDFC FIRST Bank", category: "private" },
  { name: "Federal Bank", category: "private" },
  { name: "Bandhan Bank", category: "private" },
  { name: "RBL Bank", category: "private" },
  { name: "South Indian Bank", category: "private" },
  { name: "CSB Bank", category: "private" },
  { name: "City Union Bank", category: "private" },
  { name: "DCB Bank", category: "private" },
  { name: "Tamilnad Mercantile Bank", category: "private" },
  { name: "Karnataka Bank", category: "private" },
  { name: "Karur Vysya Bank", category: "private" },
  { name: "Nainital Bank", category: "private" },
  { name: "Jammu & Kashmir Bank", category: "private" },
  { name: "Dhanlaxmi Bank", category: "private" },
  { name: "Catholic Syrian Bank", category: "private" },

  // ===========================
  // SMALL FINANCE BANKS
  // ===========================
  { name: "AU Small Finance Bank", category: "small_finance" },
  { name: "Ujjivan Small Finance Bank", category: "small_finance" },
  { name: "Equitas Small Finance Bank", category: "small_finance" },
  { name: "Jana Small Finance Bank", category: "small_finance" },
  { name: "ESAF Small Finance Bank", category: "small_finance" },
  { name: "Suryoday Small Finance Bank", category: "small_finance" },
  { name: "Utkarsh Small Finance Bank", category: "small_finance" },
  { name: "North East Small Finance Bank", category: "small_finance" },
  { name: "Capital Small Finance Bank", category: "small_finance" },
  { name: "Shivalik Small Finance Bank", category: "small_finance" },
  { name: "Unity Small Finance Bank", category: "small_finance" },
  { name: "Fincare Small Finance Bank", category: "small_finance" },

  // ===========================
  // PAYMENT BANKS
  // ===========================
  { name: "India Post Payments Bank", category: "payments" },
  { name: "Airtel Payments Bank", category: "payments" },
  { name: "Paytm Payments Bank", category: "payments" },
  { name: "Fino Payments Bank", category: "payments" },
  { name: "NSDL Payments Bank", category: "payments" },

  // ===========================
  // NBFC
  // ===========================
  { name: "Bajaj Finance", category: "nbfc" },
  { name: "Bajaj Finserv", category: "nbfc" },
  { name: "Tata Capital", category: "nbfc" },
  { name: "Aditya Birla Finance", category: "nbfc" },
  { name: "L&T Finance", category: "nbfc" },
  { name: "Mahindra Finance", category: "nbfc" },
  { name: "Hero FinCorp", category: "nbfc" },
  { name: "Poonawalla Fincorp", category: "nbfc" },
  { name: "Muthoot Finance", category: "nbfc" },
  { name: "Manappuram Finance", category: "nbfc" },
  { name: "Shriram Finance", category: "nbfc" },
  { name: "IIFL Finance", category: "nbfc" },
  { name: "SMFG India Credit", category: "nbfc" },
  { name: "HDB Financial Services", category: "nbfc" },
  { name: "Cholamandalam Finance", category: "nbfc" },
  { name: "Sundaram Finance", category: "nbfc" },
  { name: "TVS Credit", category: "nbfc" },
  { name: "Reliance Finance", category: "nbfc" },
  { name: "Magma Finance", category: "nbfc" },
  { name: "Indostar Capital Finance", category: "nbfc" },
  { name: "JM Financial", category: "nbfc" },
  { name: "Aavas Financiers", category: "nbfc" },
  { name: "LIC Housing Finance", category: "nbfc" },
  { name: "PNB Housing Finance", category: "nbfc" },
  { name: "Aadhar Housing Finance", category: "nbfc" },
  { name: "Home First Finance", category: "nbfc" },
  { name: "ICICI Home Finance", category: "nbfc" },
  { name: "Can Fin Homes", category: "nbfc" },
  { name: "Repco Home Finance", category: "nbfc" },
  { name: "LICHFL Financial Services", category: "nbfc" },

  // ===========================
  // CO-OPERATIVE BANKS
  // ===========================
  { name: "Saraswat Co-operative Bank", category: "cooperative" },
  { name: "Cosmos Co-operative Bank", category: "cooperative" },
  { name: "Shamrao Vithal Co-operative Bank", category: "cooperative" },
  { name: "Abhyudaya Co-operative Bank", category: "cooperative" },
  { name: "Bharat Co-operative Bank", category: "cooperative" },
  { name: "Janata Sahakari Bank", category: "cooperative" },
  { name: "Nagpur Nagarik Sahakari Bank", category: "cooperative" },
  { name: "Thane Bharat Sahakari Bank", category: "cooperative" },
  { name: "Apna Sahakari Bank", category: "cooperative" },
  { name: "Kalupur Commercial Co-operative Bank", category: "cooperative" },
  { name: "Mehsana Urban Co-operative Bank", category: "cooperative" },
  { name: "Rajkot Nagarik Sahakari Bank", category: "cooperative" },
  { name: "District Central Co-operative Bank", category: "cooperative" },
  { name: "Urban Co-operative Bank", category: "cooperative" },

  // ===========================
  // OTHER
  // ===========================
  { name: "Other (Enter Bank Name)", category: "other" },
];

export const bankCategoryLabels: Record<string, string> = {
  government: "🏛️ Government Banks",
  private: "🏦 Private Banks",
  small_finance: "🏦 Small Finance Banks",
  payments: "💳 Payment Banks",
  nbfc: "💼 NBFC",
  cooperative: "🤝 Co-operative Banks",
  other: "⚙️ Other",
};