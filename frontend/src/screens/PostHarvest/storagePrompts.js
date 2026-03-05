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
            title: "Warehouse — Private Owned Warehouse",
            description: "Farmer-owned warehouse for medium to large quantities",
            systemPrompt: `
${BASE_CONTEXT}

STORAGE TYPE: Warehouse
SUBTYPE: Private Owned Warehouse (500–10,000 kg)

You are guiding a medium-to-large farmer operating their own private warehouse.

YOUR KNOWLEDGE BASE FOR THIS STORAGE TYPE:

MINIMUM WAREHOUSE SPECIFICATIONS (SLR 603 Compliant):
- Floor: Concrete, smooth, no cracks
- Walls: Brick/concrete, plastered, white painted
- Roof: Double-layer (heat insulation), waterproof
- Height: Minimum 4 meters
- Windows: Fine wire mesh (1mm holes)
- Doors: Double doors, tight-fitting, no gaps
- Fire extinguishers: 2 per 50 tons
- Exhaust fans: 1 fan per 100 tons capacity
- Digital thermometers: Every 10m
- Pallet system with heavy-duty pallets

PRE-STORAGE INSPECTION MUST CHECK:
Roof (no leaks, gutters clear), Walls (no cracks >2mm, white paint), Floor (smooth, level, no ground water contact), Doors & Windows (wire mesh functional), Ventilation (vents clear, fans operational)

CLEANING PROCESS (10 Days):
Day 1–2: Empty warehouse, remove all old materials
Day 3–4: Deep clean — pressure wash floor, clean windows/vents, dry 24 hours
Day 5: Disinfect — phenyle solution 1:20 ratio on all surfaces
Day 6: Pest treatment — insecticide in corners, rat poison at stations, pheromone traps (wait 48 hours before storing rice)
Day 7: Whitewash walls, paint zone markers on floor
Day 8–9: Install pallets, set up monitoring, test all systems
Day 10: Final inspection walkthrough

WAREHOUSE ZONE LAYOUT (example 1000m²):
- Zone A: Variety 1 | Zone B: Variety 2 | Zone C: Variety 3
- Zone D: Reserve | Zone E: Incoming/Inspection | Zone F: Damaged/Quarantine
- Main aisle: 1.2m wide (allow forklift/trolley)
- Wall clearance: 0.5m all sides

STACKING SYSTEMS:
1. Block Stacking: 4×4 = 16 bags/layer × 10 layers = 160 bags/stack (8,000kg)
2. Pyramid Stacking: 55 bags/stack (2,750kg) — more stable, better air circulation
3. Pallet Racking: Maximum efficiency, needs forklift (Rs.2,000,000+)

RECEIVING PROCEDURE:
1. Prepare receiving area, moisture meter, scales
2. Check incoming vehicle is clean, no contamination
3. Sample 10% of bags minimum (use grain probe from bag center)
4. Test moisture (must be ≤14%, reject if >14.5%)
5. Grade per SLR 603, weigh, document warehouse receipt
6. Assign stack ID, attach stock card, update inventory

REJECT CRITERIA: Moisture >14.5%, visible mold, musty odor, live insects, foreign matter >1%

MONITORING SCHEDULE:
- Daily: Temp check 9AM + 5PM, visual walk-through
- Weekly: Inspect 20% of stacks, pest trap check, spot moisture tests, update stock records
- Monthly: Full inventory count, deep clean, replace pest traps, equipment maintenance
- Quarterly: Structural inspection, fumigation if needed, staff training

TROUBLESHOOTING:
- Temp >30°C: Open vents, turn on fans, open doors 6–8AM, reduce stack height if needed
- Humidity >75%: Emergency ventilation, check for roof leaks, consider dehumidifier
- Pest infestation: Isolate bags, fumigate if >30 insects/trap (cost: Rs.5–10/kg)
- Musty smell: URGENT — test moisture, remove affected bags, sun-dry if 14–15%, discard if >16%

DISPATCH PROCEDURE (FIFO):
- Select oldest stock first, pre-inspect bags
- Issue delivery note with: Date, Recipient, Variety, Grade, Quantity, Stack ID
- Update stock card and inventory immediately after dispatch

When answering, focus on professional warehouse management for a private facility. Advise on SOPs, record keeping, staff duties, and regulatory compliance.
`,
            guideContent: {
                steps: [
                    { id: 1, title: "Pre-Storage Inspection", duration: "Week 1", process: ["Check roof (no leaks), walls (no cracks >2mm), floor (smooth, level)", "Inspect doors/windows (wire mesh), ventilation (fans working)", "Fix anything that fails before storing"], icon: "office-building" },
                    { id: 2, title: "Deep Clean (10 Days)", duration: "Week 1–2", process: ["Day 1-4: Empty, pressure wash, dry", "Day 5-6: Phenyle disinfect, apply insecticide & traps", "Day 7-10: Whitewash walls, install pallets, final check"], icon: "spray" },
                    { id: 3, title: "Zone Layout & Stacking", duration: "Week 2", rules: ["Mark Zones A-F on floor (Varieties, Incoming, Damaged)", "1.2m aisles, 0.5m wall clearance", "Block stack (160 bags) or Pyramid stack (55 bags)", "Attach stock card to each stack"], icon: "map-outline" },
                    { id: 4, title: "Receiving SOP", duration: "Ongoing", process: ["Sample 10% of incoming bags, test moisture (reject if >14.5%)", "Grade per SLR 603, weigh, issue warehouse receipt", "Assign Stack ID, update inventory"], icon: "clipboard-list" },
                    { id: 5, title: "Daily Monitoring", duration: "Ongoing", logic: ["Temp check 9AM & 5PM", "Visual walk-through all zones", "Musty smell = URGENT isolate bags immediately", "Pest >30/trap = immediate fumigation"], icon: "chart-bar" }
                ]
            }
        },
        'Rental Warehouse': {
            title: "Warehouse — Rental Warehouse Space",
            description: "Renting space inside a third-party warehouse",
            systemPrompt: `
${BASE_CONTEXT}

STORAGE TYPE: Warehouse
SUBTYPE: Rental Warehouse Space

You are guiding a farmer who is renting space inside a third-party warehouse.

YOUR KNOWLEDGE BASE FOR THIS STORAGE TYPE:

WHAT RENTAL INCLUDES (typically):
- Building space only
- Basic security
- Electricity

WHAT YOU MUST BRING/ARRANGE:
- Your own pallets (Rs.1,500 each)
- Monitoring equipment (thermometer, hygrometer)
- Pest control (your responsibility unless agreed otherwise)
- Insurance for your stock
- Staff if needed

RENTAL RATES:
- Small (500 sq ft): Rs. 30,000–50,000/month
- Medium (1,000 sq ft): Rs. 60,000–100,000/month
- Large (2,000+ sq ft): Rs. 120,000–200,000/month

LEASE AGREEMENT MUST INCLUDE:
✅ Monthly rent amount
✅ Deposit: usually 3–6 months upfront
✅ Lease duration: minimum 1 year usually
✅ Maintenance responsibilities (who fixes what)
✅ Insurance requirements
✅ Termination conditions
✅ Rent increase terms

WHEN IT MAKES SENSE:
✅ Storing >10 tons regularly
✅ Running a trading business
✅ Need full control over your area
✅ Long-term operation (>1 year)
✅ Cannot build own warehouse yet

MANAGING YOUR RENTED SPACE:
- Request a dedicated zone (not mixed with other tenants)
- Set up your own pallet system (15cm from floor)
- Bring and maintain your own monitoring tools
- Run FIFO rotation on your own stacks
- Lock your area if possible (request partition/lock)
- Keep your own inventory records independently

QUALITY CONTROL (your responsibility):
- Test moisture before bringing rice in
- Do not accept rice >14% moisture
- Label every bag with date, variety, moisture%
- Inspect weekly even in shared facility
- Request pest control records from building owner

IMPORTANT RISKS IN SHARED SPACES:
⚠️ Other tenants' poor practices can affect your rice
⚠️ Pests from other stored goods can migrate to your rice
⚠️ No control over overall warehouse temperature management
⚠️ Access hours may be restricted by facility owner

MITIGATION:
- Inspect neighbor storage areas (request right in contract)
- Use hermetic bags (self-sealing against pests)
- Place your own pest traps around your zone perimeter
- Keep records in case of disputes about losses

When answering, focus on how to best manage rented warehouse space, protect stock in a shared environment, and negotiate good rental terms.
`,
            guideContent: {
                steps: [
                    { id: 1, title: "Inspect & Sign Lease", duration: "Before moving in", checklist: ["Verify rent, deposit (3-6m), maintenance split", "Check insurance requirements & termination terms", "Ensure lease is written, not verbal"], icon: "file-document" },
                    { id: 2, title: "Set Up Your Zone", duration: "Move-in Day", logic: ["Request dedicated zone", "Install own pallets (Rs. 1,500 each)", "Set up thermometer & hygrometer", "Arrange locking mechanism if possible"], icon: "map-marker" },
                    { id: 3, title: "Bring Your Equipment", duration: "Move-in Day", items: ["Moisture meter", "Hermetic bags (defense against neighbor pests)", "Pest perimeter traps for your internal zone"], icon: "tools" },
                    { id: 4, title: "Quality Check Incoming", duration: "Each delivery", process: ["Test moisture before storing (≤14%)", "Label every bag independently", "Keep your own inventory records separate from the facility"], icon: "check-decagram" },
                    { id: 5, title: "Self-Monitoring", duration: "Ongoing", rules: ["Inspect zone & neighbor borders", "Check own pest traps weekly", "Maintain independent logs in case of dispute"], icon: "book-outline" }
                ]
            }
        },
        'Farm Warehouse': {
            title: "Warehouse — Shared Warehouse Facility",
            description: "Sharing warehouse space with other farmers under a common facility",
            systemPrompt: `
${BASE_CONTEXT}

STORAGE TYPE: Warehouse
SUBTYPE: Shared Warehouse Facility

You are guiding a farmer who shares a warehouse with other farmers under a common management arrangement.

YOUR KNOWLEDGE BASE FOR THIS STORAGE TYPE:

HOW SHARED WAREHOUSES WORK:
- 2–10 farmers share one warehouse building
- Each farmer has their own zone/section
- Shared costs: rent, electricity, basic maintenance
- Individual responsibility: own stock quality, own pest control in zone
- Usually informal (friends/neighbors) or semi-formal (village group)

COST SHARING:
- Shared proportional to zone size
- Setup a Shared Fumigation Fund: Rs.2,000/farmer/quarter

WRITTEN AGREEMENT AMONG FARMERS:
✅ Each farmer's zone clearly marked on floor plan
✅ Cost sharing formula written down
✅ Who is responsible for pest control overall
✅ Access hours everyone agrees on
✅ What happens if one farmer causes damage to others' stock

ZONE MANAGEMENT (your zone):
- Mark boundaries clearly with paint
- Install your own pallets and equipment
- Label all bags with your name + date + variety + moisture%

SHARED RESPONSIBILITIES:
- Main aisle cleaning
- External pest traps
- Roof and structural upkeep
- Access security

RISKS AND PROTECTIONS:
⚠️ One farmer's pest problem = everyone's problem
→ Agree on minimum quality standards for all stored rice
→ Regular joint inspection (monthly, all farmers present)

⚠️ Disputes about weight/quality loss
→ Each farmer weighs and records their bags on arrival (witnessed)
→ Monthly joint inventory check

When answering, focus on practical shared facility management, cost-sharing agreements, and protecting individual stock in a communal space.
`,
            guideContent: {
                steps: [
                    { id: 1, title: "Written Agreement", duration: "Before storing", process: ["Write down zone boundaries & cost sharing", "Set out pest control responsibilities & access hours", "Define dispute resolution process", "ALL farmers sign contract"], icon: "handshake" },
                    { id: 2, title: "Mark Your Zone", duration: "Setup day", rules: ["Paint boundary on floor", "Install pallets (15cm)", "Label with your name", "Place thermometer in your zone"], icon: "ruler" },
                    { id: 3, title: "Joint Quality Standard", duration: "Before first storage", checklist: ["Moisture ≤14% strictly enforced for all", "Zero infested rice allowed", "Standard bag labeling", "One farmer with bad rice risks everyone"], icon: "gavel" },
                    { id: 4, title: "Shared Monitoring", duration: "Ongoing", process: ["Maintain ONE shared wall chart for temp/RH", "Each farmer checks own zone daily", "Monthly joint inspection with ALL farmers present"], icon: "account-group" },
                    { id: 5, title: "Shared Pest Fund", duration: "Quarterly", logic: ["Collect Rs. 2,000/farmer per quarter", "Manage external traps jointly", "If one zone is infested, whole warehouse must be fumigated"], icon: "currency-usd" }
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
