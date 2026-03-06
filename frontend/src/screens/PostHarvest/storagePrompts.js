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
    },
    'Cooperative': {
        'farmer_cooperative': {
            title: "Co-operative Storage — Farmer Co-operative Society",
            description: "Village-level farmer co-op managed storage",
            systemPrompt: `
${BASE_CONTEXT}

STORAGE TYPE: Co-operative Storage
SUBTYPE: Farmer Co-operative Society

You are guiding a farmer using a village-level farmer co-operative storage facility.

YOUR KNOWLEDGE BASE FOR THIS STORAGE TYPE:

OVERVIEW:
- Managed by elected farmer committee
- Annual membership fee: Rs. 500–2,000
- Storage fee: Rs. 50–100 per bag per month
- Typical capacity: 5,000–20,000 kg
- Insurance: Usually included

BECOMING A MEMBER:
Requirements: Registered farmer, land ownership/cultivation proof, National ID, Bank details. Approval takes 1–2 weeks.

BOOKING STORAGE:
- Contact manager 2–3 weeks before harvest.
- Pay 50% advance. Get written zone confirmation.

WAREHOUSE RECEIPT:
- Issued on delivery. Essential for withdrawal. Includes moisture%, weight, zone ID.

WITHDRAWAL:
- Give 7-14 days notice. Settle fees. Bring original receipt.

When answering, focus on member rights, co-op responsibilities, and withdrawal protocols.
`,
            guideContent: {
                steps: [
                    { id: 1, title: "Join as Member", icon: "badge-account-outline", duration: "1–2 weeks", details: "Submit ID, land proof, bank details. Pay Rs.500–2,000 membership fee." },
                    { id: 2, title: "Book Storage Space", icon: "calendar-clock", duration: "2–3 weeks before harvest", details: "Contact manager early. Pay 50% advance. Get zone confirmation." },
                    { id: 3, title: "Deliver Rice", icon: "truck-delivery", duration: "Delivery day", details: "Moisture ≤14%, Grade B or better. Receive official Warehouse Receipt." },
                    { id: 4, title: "Monitor & Pay", icon: "file-check", duration: "During storage", details: "Original receipt required for withdrawal. Pay monthly fees (Rs.50-100/bag)." },
                    { id: 5, title: "Withdrawal", icon: "exit-run", duration: "7–14 days notice", details: "Settle fees. Bring original receipt. Co-op re-inspects and weighs." }
                ],
                quickStats: [
                    { label: "Membership Fee", value: "Rs. 500–2,000" },
                    { label: "Storage Fee", value: "Rs. 50–100/bag/month" },
                    { label: "Withdrawal Notice", value: "7–14 days" }
                ]
            }
        },
        'samurdhi': {
            title: "Co-operative Storage — Samurdhi Co-operative",
            description: "Government-supported Samurdhi co-operative storage",
            systemPrompt: `
${BASE_CONTEXT}

STORAGE TYPE: Co-operative Storage
SUBTYPE: Samurdhi Co-operative

You are guiding a farmer (likely small-scale) using a Samurdhi co-operative storage facility.

YOUR KNOWLEDGE BASE:
- Subsidized storage fee: Rs. 30–80 per bag per month.
- Priority for Samurdhi beneficiaries and small farmers (< 1 acre).
- Linked to government crop insurance and marketing support.

PROCESS:
1. Register at local Samurdhi office (2-4 weeks approval).
2. Deliver rice (Strict ≤14% moisture).
3. Access additional benefits like agricultural loans against stock.

When answering, focus on subsidized eligibility and government-backed safety.
`,
            guideContent: {
                steps: [
                    { id: 1, title: "Check Eligibility", icon: "shield-account", duration: "Day 1", details: "Bring Samurdhi card or eligibility documents to Development Office." },
                    { id: 2, title: "Register & Apply", icon: "file-edit-outline", duration: "2–4 weeks", details: "Submit ID, Samurdhi card, and land proof." },
                    { id: 3, title: "Deliver Rice", icon: "truck-check", duration: "On approved date", details: "Strict ≤14% moisture. Receive Warehouse Receipt." },
                    { id: 4, title: "Access Benefits", icon: "gift-outline", duration: "During storage", details: "Ask about crop insurance and low-interest loans against stock." },
                    { id: 5, title: "Withdrawal", icon: "logout-variant", duration: "7–14 days notice", details: "Settle subsidized fees (Rs.30-80). Bring original receipt." }
                ],
                quickStats: [
                    { label: "Storage Fee", value: "Rs. 30–80/bag/month" },
                    { label: "Priority", value: "Small farmers" },
                    { label: "Insurance", value: "Included" }
                ]
            }
        },
        'agricultural_cooperative': {
            title: "Co-operative Storage — Agricultural Co-operative",
            description: "District-level professional agricultural co-operative with milling and marketing services",
            systemPrompt: `
${BASE_CONTEXT}

STORAGE TYPE: Co-operative Storage
SUBTYPE: Agricultural Co-operative (District-Level)

You are guiding a farmer using a professional district-level agricultural co-operative facility.

YOUR KNOWLEDGE BASE:
- Professional management at Agrarian Service Centers.
- Storage fee: Rs. 80–150 per bag per month.
- Services: Milling (Rs. 8-15/kg), Marketing (2-5% commission), official SLR 603 Grading.

MARKETING:
- Co-op finds bulk buyers/exporters. Negotiates better bulk prices than individual farmers.

When answering, focus on maximizing value through grading certificates and co-op marketing links.
`,
            guideContent: {
                steps: [
                    { id: 1, title: "ASC Registration", icon: "office-building-marker", duration: "1 week", details: "Contact District Agrarian Service Center. Fee Rs.1,000–5,000." },
                    { id: 2, title: "Book & Grade", icon: "certificate-outline", duration: "Before harvest", details: "Request official SLR 603 grading certificate (Rs.5-10/bag)." },
                    { id: 3, title: "Professional Intake", icon: "warehouse", duration: "Delivery day", details: "Strict Grade A/B required. Receive official graded receipt." },
                    { id: 4, title: "Marketing Strategy", icon: "finance", duration: "During storage", details: "Decide whether to sell through co-op buyers or mill first." },
                    { id: 5, title: "Bulk Sale", icon: "cash-multiple", duration: "Market peak", details: "Co-op handles negotiations. Payment minus 2-5% commission." }
                ],
                quickStats: [
                    { label: "Storage Fee", value: "Rs. 80–150/bag" },
                    { label: "Marketing", value: "2-5% commission" },
                    { label: "Grading Fee", value: "Rs. 5-10/bag" }
                ]
            }
        }
    },
    'Government': {
        'pmb': {
            title: "Government Storage — PMB (Paddy Marketing Board)",
            description: "Government guaranteed price purchase program",
            systemPrompt: `
${BASE_CONTEXT}

STORAGE TYPE: Government Storage
SUBTYPE: PMB buying program

CRITICAL: PMB is NOT storage. It is a SALE program. Once delivered, they own it.

HOW IT WORKS:
- PMB buys at a guaranteed price (e.g., Rs.80/kg).
- Use when market price is depressed (below PMB price).
- Moisture must be strictly ≤14%, Grade A or B.
- Payment: Cash or 7-day voucher.

When answering, clarify that this is a SALE and advise on the price comparison.
`,
            guideContent: {
                steps: [
                    { id: 1, title: "Check PMB Price", icon: "bullhorn-variant", duration: "Harvest time", details: "Watch news for guaranteed buying price per kg." },
                    { id: 2, title: "Price Comparison", icon: "scale-balance", duration: "Decision time", details: "If PMB Price > Market Price, sell to PMB. Else, store privately." },
                    { id: 3, title: "Preparation", icon: "shimmer", duration: "Before delivery", details: "Moisture must be ≤14%. No foreign matter. Min 1,000 kg." },
                    { id: 4, title: "Center Delivery", icon: "truck-fast", duration: "Delivery day", details: "Bring Farmer ID. PMB inspects and weighs. Immediate sale." },
                    { id: 5, title: "Final Settlement", icon: "cash-check", duration: "Same day", details: "Cash or bank voucher. Once sold, PMB owns the stock." }
                ],
                quickStats: [
                    { label: "Type", value: "Guaranteed Sale" },
                    { label: "Min Quantity", value: "1,000 kg" },
                    { label: "Payment", value: "7-day max" }
                ]
            }
        },
        'cwe': {
            title: "Government Storage — CWE (Co-operative Wholesale Establishment)",
            description: "Government-owned co-operative storage linked to Lak Sathosa",
            systemPrompt: `
${BASE_CONTEXT}

STORAGE TYPE: Government Storage
SUBTYPE: CWE Storage

YOUR KNOWLEDGE BASE:
- Subsidized storage (Rs. 30–60/bag).
- Linked to Lak Sathosa retail network.
- Official govt receipt can be used as bank collateral.
- Insurance included.

When answering, focus on subsidy advantages and marketing via Lak Sathosa.
`,
            guideContent: {
                steps: [
                    { id: 1, title: "CWE Registration", icon: "bank-outline", duration: "1–2 weeks", details: "Visit CWE district office with farmer ID and co-op proof." },
                    { id: 2, title: "Submit Application", icon: "text-box-search-outline", duration: "Before harvest", details: "Apply early to avoid waiting lists." },
                    { id: 3, title: "Govt Intake", icon: "warehouse-marker", duration: "Delivery day", details: "Moisture ≤14%. Receive govt receipt for bank loan collateral." },
                    { id: 4, title: "Subsidized Fee", icon: "cash-minus", duration: "Monthly", details: "Pay Rs.30-60/bag. Insurance included at no extra cost." },
                    { id: 5, title: "Sathosa Marketing", icon: "store-marker", duration: "Sale time", details: "Optional: Sell through Lak Sathosa retail chain directly." }
                ],
                quickStats: [
                    { label: "Storage Fee", value: "Rs. 30–60/bag" },
                    { label: "Market Link", value: "Lak Sathosa" },
                    { label: "Security", value: "Govt Backed" }
                ]
            }
        },
        'district_agricultural': {
            title: "Government Storage — District Agricultural Office",
            description: "Small-scale storage through Department of Agriculture for selected farmers",
            systemPrompt: `
${BASE_CONTEXT}

STORAGE TYPE: Government Storage
SUBTYPE: DOA District Office (Training/Demo)

YOUR KNOWLEDGE BASE:
- Limited capacity (20-50 tons per facility).
- Primarily for TRAINING and disaster-affected farmers.
- Often FREE or heavily subsidized.
- Entrance via local Farmer Organizations (FO) and DOA programs (GAP).

When answering, clarify this is a training resource, not for large-scale commercial needs.
`,
            guideContent: {
                steps: [
                    { id: 1, title: "Officer Contact", icon: "human-male-board", duration: "First step", details: "Ask your village Agricultural Officer about DOA storage programs." },
                    { id: 2, title: "FO Membership", icon: "handshake-outline", duration: "1–2 weeks", details: "Join your local village Farmer Organization to be eligible." },
                    { id: 3, title: "Program Enrollment", icon: "school-outline", duration: "Ongoing", details: "Attend GAP (Good Agricultural Practices) training workshops." },
                    { id: 4, title: "Storage Access", icon: "cube-send", duration: "Seasonally", details: "Quantity limited (1-5 tons). Focus on demonstration/learning." },
                    { id: 5, title: "Transition Plan", icon: "trending-up", duration: "Exit phase", details: "Move to co-op or private storage once regular needs grow." }
                ],
                quickStats: [
                    { label: "Cost", value: "Free/Subsidized" },
                    { label: "Focus", value: "Training/Disaster" },
                    { label: "Access", value: "Via Local FO" }
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
