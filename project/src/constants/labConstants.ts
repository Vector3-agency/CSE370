export interface LabReference {
  category: string;
  name: string;
  range: string;
  notes?: string;
}

export const LAB_REFERENCE_DATA: LabReference[] = [
  // BLOOD, SERUM, PLASMA
  { category: "Blood, Serum, Plasma", name: "Alanine aminotransferase (ALT)", range: "10-40 U/L" },
  { category: "Blood, Serum, Plasma", name: "Albumin, serum", range: "3.5-5.5 g/dL" },
  { category: "Blood, Serum, Plasma", name: "Alkaline phosphatase", range: "30-120 U/L" },
  { category: "Blood, Serum, Plasma", name: "Amylase, serum", range: "25-125 U/L" },
  { category: "Blood, Serum, Plasma", name: "Aspartate aminotransferase (AST)", range: "10-30 U/L" },
  { category: "Blood, Serum, Plasma", name: "Bilirubin, serum (total)", range: "0.1-1.0 mg/dL" },
  { category: "Blood, Serum, Plasma", name: "Bilirubin, serum (direct)", range: "0.0-0.3 mg/dL" },
  { category: "Blood, Serum, Plasma", name: "Calcium, serum (total)", range: "8.4-10.2 mg/dL" },
  { category: "Blood, Serum, Plasma", name: "Chloride, serum", range: "96-106 mEq/L" },
  { category: "Blood, Serum, Plasma", name: "Cholesterol (total)", range: "<200 mg/dL" },
  { category: "Blood, Serum, Plasma", name: "Creatinine, serum", range: "0.6-1.2 mg/dL" },
  { category: "Blood, Serum, Plasma", name: "Glucose, serum (fasting)", range: "70-100 mg/dL" },
  { category: "Blood, Serum, Plasma", name: "Magnesium, serum", range: "1.5-2.0 mEq/L" },
  { category: "Blood, Serum, Plasma", name: "Phosphate, inorganic, serum", range: "3.0-4.5 mg/dL" },
  { category: "Blood, Serum, Plasma", name: "Potassium, serum", range: "3.5-5.0 mEq/L" },
  { category: "Blood, Serum, Plasma", name: "Protein, total, serum", range: "6.0-7.8 g/dL" },
  { category: "Blood, Serum, Plasma", name: "Sodium, serum", range: "135-145 mEq/L" },
  { category: "Blood, Serum, Plasma", name: "Urea nitrogen, blood (BUN)", range: "7-18 mg/dL" },
  
  // HEMATOLOGIC
  { category: "Hematologic", name: "Hemoglobin, blood (Male)", range: "13.5-17.5 g/dL" },
  { category: "Hematologic", name: "Hemoglobin, blood (Female)", range: "12.0-16.0 g/dL" },
  { category: "Hematologic", name: "Hematocrit (Male)", range: "41%-53%" },
  { category: "Hematologic", name: "Hematocrit (Female)", range: "36%-46%" },
  { category: "Hematologic", name: "Platelet count", range: "150,000-400,000/mm³" },
  { category: "Hematologic", name: "White blood cell (WBC) count", range: "4,500-11,000/mm³" },
  
  // CEREBROSPINAL FLUID
  { category: "Cerebrospinal Fluid", name: "Glucose, CSF", range: "40-70 mg/dL" },
  { category: "Cerebrospinal Fluid", name: "Protein, CSF", range: "15-45 mg/dL" },
  { category: "Cerebrospinal Fluid", name: "Pressure, CSF", range: "70-180 mm H₂O" },
  { category: "Cerebrospinal Fluid", name: "Cell count, CSF", range: "0-5 mononuclear cells/mm³" },
  
  // URINE
  { category: "Urine", name: "Creatinine clearance", range: "90-140 mL/min" },
  { category: "Urine", name: "Protein, urine", range: "<150 mg/24 h" },
];
