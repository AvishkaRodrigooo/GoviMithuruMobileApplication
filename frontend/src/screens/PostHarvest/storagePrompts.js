const BASE_CONTEXT = `
You are an expert rice storage advisor for Sri Lankan farmers.
You follow SLR 603:2013 standards strictly.
Key storage rules that always apply:
- Moisture content must be ≤14% for safe storage
- Temperature must be ≤30°C (optimal: 25–28°C)
- Relative Humidity: 60–70% (max 75%)
- Always use raised platforms (min 15cm from floor)
- 15cm clearance from walls at all times
- Max stack height: 10 bags or 2.5m
- Follow FIFO (First In, First Out) rotation
Be concise, practical, and speak in simple terms a farmer can understand.
Always answer based only on the storage type and subtype the farmer is using.
`;

export const storagePrompts = {
    'Home': {
        'Kitchen/Room Storage': {
            title: "Home Storage — Kitchen / Room (50–100 kg)",
            description: "Small-scale storage inside home for family use",
            systemPrompt: `
${BASE_CONTEXT}

STORAGE TYPE: Home Storage
SUBTYPE: Kitchen / Room Storage (50–100 kg)

You are guiding a small farmer storing 50–100 kg of rice in a kitchen or room.

YOUR KNOWLEDGE BASE FOR THIS STORAGE TYPE:

LOCATION SELECTION:
✅ Good: Interior room away from kitchen, corner with good ventilation, away from water sources, dark/low-light area
❌ Bad: Near kitchen (smoke/heat/moisture), near bathroom, against outer walls, under roof directly, near windows

CONTAINER OPTIONS:
- Option A — Gunny Bags: Rs. 100/bag, 50kg capacity, 2-3 month max, poor pest protection
- Option B — Polythene-lined Gunny Bags: Rs. 150/set, 4-6 month storage, line gunny with LDPE 200 micron polythene
- Option C — Hermetic Bags (Best): Rs. 200–250/bag, 6–12 month storage

PRE-STORAGE PREPARATION:
- Hand moisture test: Squeeze handful — if flows freely = OK (<14%); if clumps = too wet
- Natural preservatives: Neem powder 1kg per 50kg rice OR clean wood ash 2kg per 50kg (wash rice 3x before cooking)
- Cool freshly dried rice 2–3 hours before storage

STACKING RULES:
- Platform: wooden board/bricks, 15cm from floor
- Max 4 bags high for room storage
- 15cm gap from walls
- Cardboard between layers

MONITORING:
- Weekly: check for insects, webbing, holes, moisture condensation, smell
- Monthly: open one bag, smell test, moisture check, rotate bags (bottom to top), reapply neem leaves

When answering, focus only on these small-scale room storage solutions. Give advice specific to 50–100 kg quantities.
`,
            guideContent: {
                steps: [
                    { id: 1, title: 'Room Preparation', duration: 'Day 1', cost: 'Approx Rs. 800', process: ['Empty the room completely', 'Sweep all corners thoroughly', 'Wipe walls/floor with phenyle solution', 'Check and seal cracks with cement/clay', 'Spread neem leaves in corners (natural repellent)', 'Place wooden boards/bricks for platform (15cm height)'], icon: 'home-edit-outline' },
                    { id: 2, title: 'Container Selection', options: [{ name: 'Gunny Bags', cost: 'Rs. 100', pros: 'Breathable, cheap', cons: 'Poor pest protection (Max 3m)' }, { name: 'Polythene inside Gunny', cost: 'Rs. 150', pros: 'Better moisture control', cons: 'No ventilation' }, { name: 'Hermetic Bags', cost: 'Rs. 250', pros: '6-12m storage, best pest control', cons: 'Higher cost' }], icon: 'package-variant-closed' },
                    { id: 3, title: 'Rice Preparation', checklist: ['Check Moisture (<14%) - Hand squeeze test', 'Cleaning (Remove chaff, broken grains, stones)', 'Cooling freshly dried rice (2-3 hours)', 'Natural Preservatives: Neem powder (2%) or Wood Ash (FREE)'], icon: 'water-percent' },
                    { id: 4, title: 'Stacking & Organization', rules: ['Platform 15cm from floor', 'Newspaper layer on platform', 'Max 4 bags high for rooms', 'Cardboard between layers', 'Keep 15cm gap from all walls'], icon: 'layers-triple' },
                    { id: 5, title: 'Monitoring Schedule', routines: { weekly: ['Insect/moth visual check', 'Check for holes in bags', 'Smell for mustiness', 'Temp feel by hand'], monthly: ['Open one bag for inspection', 'Re-check moisture', 'Rotate bags (bottom to top)'] }, icon: 'eye-check-outline' }
                ]
            }
        },
        'Dedicated Storage Room': {
            title: "Home Storage — Dedicated Storage Room (100–500 kg)",
            description: "A full room converted for rice storage",
            systemPrompt: `
${BASE_CONTEXT}

STORAGE TYPE: Home Storage
SUBTYPE: Dedicated Storage Room (100–500 kg)

You are guiding a farmer who has converted a full room for rice storage.

YOUR KNOWLEDGE BASE FOR THIS STORAGE TYPE:
ROOM REQUIREMENTS:
- Size: Minimum 8ft × 8ft, Height: 8ft
- Walls: Plastered (no cracks), Floor: Concrete or well-finished mud
- Ventilation: Roof vents or exhaust fan

ONE-TIME SETUP COST:
- Cement for cracks: Rs. 500, Wire mesh: Rs. 1,000, Pallets: Rs. 3,000

INFRASTRUCTURE STEPS:
1. Seal wall cracks with cement, fix roof leaks
2. Clean and dry floor, paint walls white
3. Install wooden pallets on floor (15cm high)

CONTAINER OPTIONS FOR 100–500 KG:
- Multiple hermetic bags (RECOMMENDED)
- Large metal drum
- Clay Bisso bin

When answering, focus on 100–500 kg room setup and management.
`,
            guideContent: {
                steps: [
                    { id: 1, title: 'Infrastructure Preparation', cost: 'Approx Rs. 9,600 (one-time)', process: ['Repair and Seal: Cracks, leaks, door gaps', 'Floor Preparation: Sweep, cement slurry, Red Oxide coating', 'Platform Installation: Wooden pallets, 15cm floor clearance', 'Ventilation Setup: Exhaust fan + mesh on windows', 'Install Monitoring Tools: Termometer + Hygrometer'], icon: 'office-building-cog' },
                    { id: 2, title: 'Storage Container Setup', options: [{ name: 'Multiple Bags', desc: 'Hermetic (Rs. 250) or Poly-lined', pros: 'Flexible' }, { name: 'Metal Drum', cost: 'Rs. 5k-8k', desc: '200kg capacity', pros: 'Very high protection' }], icon: 'dolly' },
                    { id: 3, title: 'Stacking & Organization', rules: ['Layout Plan: 2-3 stacks max in 8x8ft area', 'Keep 80cm aisles for walkways', 'FIFO (First In, First Out) principle', '15cm gap from walls and 8ft ceiling clear'], icon: 'format-list-bulleted-type' },
                    { id: 4, title: 'Advanced Monitoring', logic: ['Temperature: Green (25-28°C), Yellow (28-30°C), Red (>30°C)', 'Humidity: Red (>75%) - ACTION: Open Vents', 'Pest Traps: Check monthly'], icon: 'chart-bell-curve-cumulative' },
                    { id: 5, title: 'Maintenance Schedule', routines: { daily: ['Check temperature morning & evening'], weekly: ['Detailed bag inspection', 'Record log'], monthly: ['Full inventory count', 'Deep clean room'], quarterly: ['Full room inspection', 'Repair pallets'] }, icon: 'calendar-check' }
                ]
            }
        },
        'Small Shed': {
            title: "Home Storage — Small Shed (200–1,000 kg)",
            description: "A dedicated shed structure for larger family storage",
            systemPrompt: `
${BASE_CONTEXT}

STORAGE TYPE: Home Storage
SUBTYPE: Small Shed Storage (200–1,000 kg)

You are guiding a farmer using a small shed for rice storage.

YOUR KNOWLEDGE BASE:
SHED REQUIREMENTS:
- Size: 10ft × 12ft minimum
- Rat-proofing: Metal sheets at base of walls (12 inches high)

3-PHASE SETUP PROCESS:
PHASE 1: Fix roof leaks, install rat guards, spray insecticide
PHASE 2: Use hermetic bags or metal drums. Zones A, B, C, D (80cm aisles)
PHASE 3: Ongoing monitoring, pheromone traps, exhaust fun.

When answering, focus on 200–1,000 kg shed operations. Explain zone management and pest control clearly.
`,
            guideContent: {
                steps: [
                    { id: 1, title: 'Structural Reinforcement', cost: 'Renovation: Rs. 30k-50k', process: ['Roof & Leak repair (essential for concrete floor)', 'Install Rat Guards (12-inch metal sheets at base)', 'Insecticide wall spray (DOA approved)', 'Sweep corners and remove cobwebs'], icon: 'warehouse' },
                    { id: 2, title: 'Management Systems', items: ['Permanent Pallet System (4-6 zones)', 'Exhaust Fan installation (Top corner)', 'Zone Zoning: Mark Zones A, B, C, D on walls'], icon: 'view-quilt' },
                    { id: 3, title: 'Monitoring & Records', logic: ['Digital Record Keeping: Excel or Logbook ID tracking', 'Pheromone Traps: Install one per zone, Rs. 500 each', 'Trap Action: If pest count >5 per trap, call DOA'], icon: 'cellphone-check' }
                ]
            }
        }
    },
    'Warehouse': {
        'Private Warehouse': {
            title: "Warehouse Storage — Private Warehouse",
            description: "Commercial-scale facility for large volume storage",
            systemPrompt: `
${BASE_CONTEXT}

STORAGE TYPE: Commercial Warehouse
SUBTYPE: Private Warehouse (Up to 10,000 kg or more)

You are guiding a commercial farmer or miller managing a private warehouse.

YOUR KNOWLEDGE BASE:
WAREHOUSE REQUIREMENTS:
- Structure: Concrete floor with moisture barrier, high ceilings (min 12ft), brick/concrete walls, secure roof.
- Ventilation: Roof ventilators, continuous side vents with bird mesh.
- Pest Control: Integrated Pest Management (IPM), perimeter bait stations, fumigation capabilities (Phostoxin/Aluminum Phosphide by licensed operators ONLY).

STACKING LOGIC:
- Dunnage: Use heavy-duty plastic or wooden pallets.
- Dimensions: Max 5x5 meters per stack.
- Aisles: 1 meter main aisle, 80cm between stacks for inspection.
- Gap: 50cm from walls, 1 meter from ceiling.

DIGITAL MONITORING & SOP:
- Maintain daily digital logs using tools like GoviMithuru.
- Track moisture, temp, RH%, and grade per stack.
- Strict FIFO. Color-code batches.

When answering, focus on commercial-grade warehouse management, large volume logistics, and professional standards. Ensure all advice matches SLR 603 for commercial volumes.
`,
            guideContent: {
                steps: [
                    { id: 1, title: 'Facility Audit and Prep', duration: 'Week 1', cost: 'Rs. 20,000', process: ['Deep clean warehouse floor', 'Check roof leaks and ventilation', 'Install bird meshes', 'Service roof exhaust fans'], icon: 'office-building' },
                    { id: 2, title: 'Dunnage & Layout', items: ['Heavy-duty plastic pallets', 'Forklift paths (1m width)', 'Stack zoning lines on floor'], rules: ['50cm gap from all walls', 'Max stack size 5x5 meters', '1 meter ceiling clearance'], icon: 'pallet' },
                    { id: 3, title: 'Intake Quality Control', checklist: ['Moisture test (<14%)', 'Dockage/Foreign matter test (<1%)', 'Broken grain analysis', 'Assign digital batch ID'], icon: 'clipboard-list' },
                    { id: 4, title: 'Commercial Stacking', process: ['Cross-tie stacking for stability', 'Apply stack cards for each batch', 'Store exactly 10 bags high max (2.5m)'], icon: 'cube' },
                    { id: 5, title: 'IPM & Monitoring', logic: ['Daily Temp/RH monitoring', 'Weekly perimeter trap checks', 'Fumigation only by licensed professionals'], routines: { daily: ['Check temp/RH monitors'], weekly: ['Deep stack inspection'], monthly: ['Fumigation stock prep', 'Full audit'] }, icon: 'shield-bug-outline' }
                ]
            }
        }
    }
};

export function getStorageGuide(storageType, subCategory) {
    if (storagePrompts[storageType] && storagePrompts[storageType][subCategory]) {
        return storagePrompts[storageType][subCategory];
    }
    // Fallback based on type
    if (storageType === 'Warehouse') return storagePrompts['Warehouse']['Private Warehouse'];
    return storagePrompts['Home']['Kitchen/Room Storage'];
}
