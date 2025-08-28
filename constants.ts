
// All department cards that will be displayed
export const DEFAULT_DEPARTMENT_CARDS: string[] = [
    "Design",
    "Programming",
    "Planning", // Initial state before material ready
    "Products",
    "Material Ready Pending",
    "Material Parting",
    "Milling",
    "Lathe",
    "CNC Milling",
    "CNC Lathe",
    "Welding",
    "Assembly",
    "Final Quality Check",
    "Hold",
    "Completed",
    "Delivered",
    "Urgent"
];

// This serves as the default mapping if one doesn't exist in Firestore.
export const DEFAULT_DEPARTMENT_PROCESS_MAP: { [key: string]: string } = {
    "Material Parting": "Material Parting",
    "Milling": "Milling",
    "Lathe": "Lathe",
    "CNC Milling": "CNC Milling",
    "CNC Lathe": "CNC Lathe",
    "Wire EDM": "CNC Lathe",
    "Surface Grinding": "CNC Lathe",
    "Welding": "Welding",
    "Laser Cutting": "Welding",
    "Assembly": "Assembly",
    "Hardening": "Milling",
    "Bending": "Welding",
    "Shearing": "Welding",
    "Annealing": "Milling",
};

// Default processes and machines for initial Firestore seeding.
export const DEFAULT_PROCESSES = Object.keys(DEFAULT_DEPARTMENT_PROCESS_MAP);

export const DEFAULT_MACHINES: { [key: string]: string[] } = {
    "Material Parting": [],
    "Milling": ["CML01", "CML02 - VF02", "CML03 - Hartford Anniversary", "CML04 - Hartford", "CML05 - VF06", "CML06 - VM03"],
    "Lathe": [],
    "CNC Milling": [],
    "CNC Lathe": ["CLT01 - Mazak", "CLT02 – ACE CNC Lathe", "CLT04 – Hass ST30Y", "CLT03 – Hitachi"],
    "Wire EDM": [],
    "Surface Grinding": [],
    "Welding": [],
    "Laser Cutting": [],
    "Assembly": [],
    "Hardening": [],
    "Bending": [],
    "Shearing": [],
    "Annealing": [],
};