export const departments = [
  { id: "1", department_name: "Radiology", location: "Block A", head_of_department: "Dr. Sarah Nambi", contact: "+256-700-111-001" },
  { id: "2", department_name: "Laboratory", location: "Block B", head_of_department: "Dr. James Wafula", contact: "+256-700-111-002" },
  { id: "3", department_name: "Pharmacy", location: "Block A", head_of_department: "Dr. Grace Auma", contact: "+256-700-111-003" },
  { id: "4", department_name: "Surgery", location: "Block C", head_of_department: "Dr. Peter Okello", contact: "+256-700-111-004" },
  { id: "5", department_name: "Pediatrics", location: "Block D", head_of_department: "Dr. Mary Kato", contact: "+256-700-111-005" },
  { id: "6", department_name: "ICU", location: "Block C", head_of_department: "Dr. Joseph Mwanga", contact: "+256-700-111-006" },
];

export const assetCategories = [
  { id: "1", category_name: "Medical Equipment", description: "Clinical and diagnostic equipment" },
  { id: "2", category_name: "IT Equipment", description: "Computers, servers, and networking" },
  { id: "3", category_name: "Furniture", description: "Hospital beds, chairs, desks" },
  { id: "4", category_name: "Vehicles", description: "Ambulances and transport" },
  { id: "5", category_name: "Lab Equipment", description: "Laboratory instruments" },
];

export const assets = [
  { id: "1", asset_name: "X-Ray Machine", asset_tag: "MRRH-MED-001", serial_number: "XR-2024-001", category_id: "1", purchase_date: "2023-01-15", purchase_cost: 45000, status: "In Use", asset_condition: "Good", department_id: "1", supplier_id: "1" },
  { id: "2", asset_name: "Ultrasound Scanner", asset_tag: "MRRH-MED-002", serial_number: "US-2024-002", category_id: "1", purchase_date: "2023-03-20", purchase_cost: 32000, status: "In Use", asset_condition: "Good", department_id: "1", supplier_id: "1" },
  { id: "3", asset_name: "Desktop Computer", asset_tag: "MRRH-IT-001", serial_number: "PC-2024-001", category_id: "2", purchase_date: "2023-06-10", purchase_cost: 800, status: "In Use", asset_condition: "Fair", department_id: "2", supplier_id: "2" },
  { id: "4", asset_name: "Hospital Bed (Electric)", asset_tag: "MRRH-FUR-001", serial_number: "BED-2024-001", category_id: "3", purchase_date: "2022-11-01", purchase_cost: 3500, status: "In Use", asset_condition: "Good", department_id: "4", supplier_id: "3" },
  { id: "5", asset_name: "Ambulance Toyota LC", asset_tag: "MRRH-VEH-001", serial_number: "AMB-2024-001", category_id: "4", purchase_date: "2022-05-15", purchase_cost: 65000, status: "In Use", asset_condition: "Good", department_id: "6", supplier_id: "4" },
  { id: "6", asset_name: "Centrifuge Machine", asset_tag: "MRRH-LAB-001", serial_number: "CF-2024-001", category_id: "5", purchase_date: "2023-09-01", purchase_cost: 5200, status: "Under Maintenance", asset_condition: "Fair", department_id: "2", supplier_id: "1" },
  { id: "7", asset_name: "Ventilator", asset_tag: "MRRH-MED-003", serial_number: "VT-2024-001", category_id: "1", purchase_date: "2023-02-14", purchase_cost: 28000, status: "In Use", asset_condition: "Good", department_id: "6", supplier_id: "1" },
  { id: "8", asset_name: "ECG Monitor", asset_tag: "MRRH-MED-004", serial_number: "ECG-2024-001", category_id: "1", purchase_date: "2023-04-22", purchase_cost: 12000, status: "Disposed", asset_condition: "Poor", department_id: "4", supplier_id: "1" },
  { id: "9", asset_name: "Printer HP LaserJet", asset_tag: "MRRH-IT-002", serial_number: "PR-2024-001", category_id: "2", purchase_date: "2024-01-10", purchase_cost: 450, status: "In Use", asset_condition: "Good", department_id: "3", supplier_id: "2" },
  { id: "10", asset_name: "Microscope", asset_tag: "MRRH-LAB-002", serial_number: "MS-2024-001", category_id: "5", purchase_date: "2023-07-18", purchase_cost: 3800, status: "In Use", asset_condition: "Good", department_id: "2", supplier_id: "1" },
];

export const faultReports = [
  { id: "1", asset_id: "6", description: "Centrifuge making unusual noise during operation", priority: "High", report_date: "2024-03-15", reported_by: "Lab Tech James", status: "In Progress" },
  { id: "2", asset_id: "3", description: "Computer screen flickering intermittently", priority: "Medium", report_date: "2024-03-18", reported_by: "Nurse Alice", status: "Open" },
  { id: "3", asset_id: "8", description: "ECG monitor display failure - no readings shown", priority: "Critical", report_date: "2024-03-10", reported_by: "Dr. Okello", status: "Resolved" },
  { id: "4", asset_id: "5", description: "Ambulance AC not functioning", priority: "Low", report_date: "2024-03-20", reported_by: "Driver Musa", status: "Open" },
];

export const maintenanceRecords = [
  { id: "1", asset_id: "1", maintenance_date: "2024-02-15", maintenance_type: "Preventive", description: "Annual calibration and inspection", cost: 1200, technician_id: "1", status: "Completed" },
  { id: "2", asset_id: "6", maintenance_date: "2024-03-16", maintenance_type: "Corrective", description: "Bearing replacement and motor check", cost: 800, technician_id: "2", status: "In Progress" },
  { id: "3", asset_id: "5", maintenance_date: "2024-01-20", maintenance_type: "Preventive", description: "Full vehicle service - oil, brakes, tires", cost: 2500, technician_id: "3", status: "Completed" },
];

export const suppliers = [
  { id: "1", supplier_name: "MedEquip East Africa", contact_person: "John Masaba", phone: "+256-700-222-001", email: "info@medequip.co.ug" },
  { id: "2", supplier_name: "CompuTech Uganda", contact_person: "Jane Nalongo", phone: "+256-700-222-002", email: "sales@computech.co.ug" },
  { id: "3", supplier_name: "HospiFurn Ltd", contact_person: "Isaac Wekesa", phone: "+256-700-222-003", email: "orders@hospifurn.co.ug" },
  { id: "4", supplier_name: "AutoMed Motors", contact_person: "David Opio", phone: "+256-700-222-004", email: "fleet@automed.co.ug" },
];

export const dashboardStats = {
  totalAssets: 247,
  activeAssets: 218,
  underMaintenance: 15,
  disposed: 14,
  totalValue: 2450000,
  openFaults: 12,
  departments: 6,
  pendingAssignments: 8,
};
