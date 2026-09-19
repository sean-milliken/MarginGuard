import type { EvalDatasetItem } from '../schemas/eval';

export const EVAL_DATASET: EvalDatasetItem[] = [
  // ─── LOGISTICS_DISRUPTION ─────────────────────────────────────────────────

  {
    id: 'eval-ld-001',
    articleText: `Dock workers at the Port of Los Angeles and the Port of Long Beach walked off the job early Monday morning, halting container handling at the nation's two busiest cargo gateways. The International Longshore and Warehouse Union, representing approximately 22,000 workers, authorized the work stoppage after contract negotiations collapsed over automation provisions. Industry analysts warn that a two-week stoppage could create backlogs persisting six to eight weeks as vessels divert to East Coast ports. Retailers and manufacturers relying on Asian suppliers for components and finished goods are bracing for significant delays. "We expect the disruption to persist for at least 14 days before a federal mediator can be brought in," said a port authority spokesperson. Shipping rates on trans-Pacific lanes have already begun climbing in response.`,
    groundTruth: {
      eventCategory: 'LOGISTICS_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'Port of Los Angeles', type: 'PORT' },
        { name: 'Port of Long Beach', type: 'PORT' },
        { name: 'ILWU', type: 'ORGANIZATION' },
      ],
      geographies: [
        { name: 'Los Angeles', type: 'CITY' },
        { name: 'Long Beach', type: 'CITY' },
      ],
    },
    businessContext: {
      industry: 'Automotive Parts Manufacturing',
      primaryCommodities: ['steel', 'aluminum', 'electronic components'],
      supplierRegions: ['Asia', 'North America'],
    },
  },

  {
    id: 'eval-ld-002',
    articleText: `A 400-meter container vessel ran aground in the Suez Canal Tuesday morning, blocking one of the world's most critical shipping lanes after suffering a steering failure in high winds. Canal authority officials said they could not estimate how long the blockage would last. "We are working around the clock but the vessel's size makes this an extraordinarily complex salvage operation," said an Egyptian canal official. More than 180 ships are already queued at both ends of the canal. Shippers are being advised to consider routing around the Cape of Good Hope, adding approximately 10 to 14 days to Europe-Asia voyages and raising fuel costs significantly. Several container lines have already announced force majeure declarations.`,
    groundTruth: {
      eventCategory: 'LOGISTICS_DISRUPTION',
      isRelevant: true,
      entities: [],
      geographies: [
        { name: 'Suez Canal', type: 'REGION' },
        { name: 'Egypt', type: 'COUNTRY' },
        { name: 'Cape of Good Hope', type: 'REGION' },
      ],
    },
    businessContext: {
      industry: 'Consumer Electronics Assembly',
      primaryCommodities: ['semiconductors', 'display panels'],
      supplierRegions: ['Southeast Asia', 'East Asia'],
    },
  },

  {
    id: 'eval-ld-003',
    articleText: `Hurricane Ida made landfall near Port Fourchon, Louisiana early Sunday as a Category 4 storm, forcing the closure of the Port of New Orleans and the Port of South Louisiana — two of the largest commodity-shipping hubs in North America. The ports handle roughly 60 percent of U.S. grain exports and are a primary gateway for petrochemical feedstocks. Authorities said both facilities would remain closed until inspection teams could assess structural damage and confirm safe operating conditions, a process expected to take between five and ten days. Several bulk cargo vessels seeking shelter diverted to Mobile, Alabama, adding to congestion there. Barge traffic on the lower Mississippi River also ceased operations as towboat crews sought safe harbor.`,
    groundTruth: {
      eventCategory: 'LOGISTICS_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'Port of New Orleans', type: 'PORT' },
        { name: 'Port of South Louisiana', type: 'PORT' },
      ],
      geographies: [
        { name: 'Louisiana', type: 'REGION' },
        { name: 'New Orleans', type: 'CITY' },
      ],
    },
    businessContext: {
      industry: 'Food & Beverage Manufacturing',
      primaryCommodities: ['wheat', 'corn', 'soybean oil'],
      supplierRegions: ['US Midwest', 'South America'],
    },
  },

  {
    id: 'eval-ld-004',
    articleText: `The Brotherhood of Locomotive Engineers and Trainmen reached an impasse with the nation's major Class I railroads overnight, triggering a nationwide freight rail strike that took effect at 12:01 a.m. Wednesday. The work stoppage immediately halted approximately 30 percent of all U.S. freight volume. Industries most acutely affected include automotive manufacturing, chemical production, and grain transport. The Association of American Railroads warned that a week-long stoppage would cost the economy roughly $2 billion per day and cause months-long cascade delays. "No freight is moving on our lines," a Union Pacific spokesperson confirmed. Congress has begun emergency sessions to consider legislation to impose binding arbitration.`,
    groundTruth: {
      eventCategory: 'LOGISTICS_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'Brotherhood of Locomotive Engineers and Trainmen', type: 'ORGANIZATION' },
        { name: 'Association of American Railroads', type: 'ORGANIZATION' },
        { name: 'Union Pacific', type: 'COMPANY' },
      ],
      geographies: [{ name: 'United States', type: 'COUNTRY' }],
    },
  },

  {
    id: 'eval-ld-005',
    articleText: `A chronic shortage of HGV drivers across the United Kingdom and continental Europe is causing widespread delivery delays and empty shelves at distribution centers, logistics companies warned Thursday. The Road Haulage Association estimates the UK alone is short approximately 100,000 truck drivers, a gap that has widened since post-Brexit changes restricted the free movement of European drivers. Lead times on cross-channel shipments from France and Germany have extended from two days to as many as eight days. Several automotive manufacturers in the Midlands have warned they may need to idle production lines if component deliveries remain unreliable. Retailers in the food and fast-moving consumer goods sector are diverting shipments to air freight at sharply higher cost.`,
    groundTruth: {
      eventCategory: 'LOGISTICS_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'Road Haulage Association', type: 'ORGANIZATION' },
      ],
      geographies: [
        { name: 'United Kingdom', type: 'COUNTRY' },
        { name: 'France', type: 'COUNTRY' },
        { name: 'Germany', type: 'COUNTRY' },
      ],
    },
    businessContext: {
      industry: 'Appliance Manufacturing',
      primaryCommodities: ['steel', 'copper wire', 'plastic resin'],
      supplierRegions: ['Western Europe'],
    },
  },

  {
    id: 'eval-ld-006',
    articleText: `Houthi militant attacks on commercial vessels in the Red Sea have prompted the majority of major container lines to suspend transits through the Bab-el-Mandeb Strait and reroute around the Cape of Good Hope, adding 10 to 14 days to Europe-Asia voyages. Maersk, Hapag-Lloyd, and MSC confirmed the diversions this week. The longer route is consuming additional vessel capacity and driving spot freight rates on key trade lanes to multi-year highs. Port congestion at European terminals has begun building as vessel arrivals bunch up from the extended voyage times. Analysts at Drewry estimate the cumulative impact could rival the 2021 supply chain disruptions if the security situation does not stabilize within six to eight weeks.`,
    groundTruth: {
      eventCategory: 'LOGISTICS_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'Maersk', type: 'COMPANY' },
        { name: 'Hapag-Lloyd', type: 'COMPANY' },
        { name: 'MSC', type: 'COMPANY' },
      ],
      geographies: [
        { name: 'Red Sea', type: 'REGION' },
        { name: 'Bab-el-Mandeb Strait', type: 'REGION' },
        { name: 'Cape of Good Hope', type: 'REGION' },
      ],
    },
    businessContext: {
      industry: 'Furniture Manufacturing',
      primaryCommodities: ['timber', 'foam', 'textiles'],
      supplierRegions: ['Southeast Asia', 'Europe'],
    },
  },

  {
    id: 'eval-ld-007',
    articleText: `The Panama Canal Authority announced it will further reduce the maximum draft allowed for southbound vessels to 44 feet, down from 50 feet, due to critically low water levels at Gatun Lake caused by a prolonged regional drought. The restriction takes effect in two weeks and will reduce the number of daily transits from the current 32 to approximately 18. Vessels carrying bulk commodities, LNG, and oversized containers are most affected. Shipping companies are rerouting some cargo via the Suez Canal, while others are offloading and transshipping at Colombian ports. The Panama Canal Authority said water levels are unlikely to recover to normal operating levels for at least three months absent significant rainfall.`,
    groundTruth: {
      eventCategory: 'LOGISTICS_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'Panama Canal Authority', type: 'ORGANIZATION' },
      ],
      geographies: [
        { name: 'Panama Canal', type: 'REGION' },
        { name: 'Panama', type: 'COUNTRY' },
      ],
    },
  },

  {
    id: 'eval-ld-008',
    articleText: `FedEx Express grounded its entire fleet of Boeing 767 freighters Tuesday after the Federal Aviation Administration issued an emergency airworthiness directive citing an unresolved hydraulic system fault identified during routine maintenance inspections. The grounding affects approximately 120 aircraft and disrupts a significant portion of FedEx's U.S. domestic overnight air cargo capacity. The FAA said the directive would remain in place until an engineering fix is validated, a process that typically takes seven to fourteen days. Competitors UPS and DHL have indicated they cannot absorb the displaced volume, and shippers dependent on overnight delivery for time-sensitive components have been advised to explore ground alternatives.`,
    groundTruth: {
      eventCategory: 'LOGISTICS_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'FedEx Express', type: 'COMPANY' },
        { name: 'Federal Aviation Administration', type: 'ORGANIZATION' },
      ],
      geographies: [{ name: 'United States', type: 'COUNTRY' }],
    },
    businessContext: {
      industry: 'Medical Device Manufacturing',
      primaryCommodities: ['titanium', 'specialty polymers', 'electronic components'],
      supplierRegions: ['North America', 'Europe'],
    },
  },

  {
    id: 'eval-ld-009',
    articleText: `The International Longshore and Warehouse Union Canada began a work-to-rule action at the Port of Vancouver Monday, slowing container throughput by an estimated 40 percent and creating a backlog of vessels anchored in the Georgia Strait. The dispute centers on pension contributions and scheduling flexibility. Vancouver handles roughly $200 billion in annual trade and is the primary western gateway for Canadian exports of potash, grain, and forest products, as well as imports of consumer goods and manufacturing components from Asia. If the slowdown escalates to a full strike, analysts estimate the economic impact at $800 million per day. Talks are ongoing but no resolution is expected before the end of the week.`,
    groundTruth: {
      eventCategory: 'LOGISTICS_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'ILWU Canada', type: 'ORGANIZATION' },
        { name: 'Port of Vancouver', type: 'PORT' },
      ],
      geographies: [
        { name: 'Vancouver', type: 'CITY' },
        { name: 'Canada', type: 'COUNTRY' },
      ],
    },
    businessContext: {
      industry: 'Paper & Packaging Manufacturing',
      primaryCommodities: ['pulp', 'kraft paper'],
      supplierRegions: ['Western Canada', 'Scandinavia'],
    },
  },

  {
    id: 'eval-ld-010',
    articleText: `A historic winter storm stretching from Minnesota to Ohio has forced the closure of the Columbus, Ohio regional distribution hub operated by XPO Logistics, one of the largest freight consolidation centers in the Midwest. Blizzard conditions with snowfall exceeding 30 inches and winds gusting to 60 mph have grounded all outbound truck shipments for at least three days. The facility processes approximately 15,000 pallets daily for retail and industrial customers across the central United States. Several manufacturers have declared force majeure on time-sensitive deliveries. National Weather Service forecasts indicate roads in the region may not be fully passable for five to seven days, depending on plowing and melting conditions.`,
    groundTruth: {
      eventCategory: 'LOGISTICS_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'XPO Logistics', type: 'COMPANY' },
      ],
      geographies: [
        { name: 'Columbus', type: 'CITY' },
        { name: 'Ohio', type: 'REGION' },
        { name: 'Midwest', type: 'REGION' },
      ],
    },
  },

  // ─── SUPPLIER_DISRUPTION ──────────────────────────────────────────────────

  {
    id: 'eval-sd-001',
    articleText: `A fire that broke out Saturday at Taiwan Semiconductor Advanced Packaging's Taichung facility destroyed the company's primary advanced chip-on-wafer bonding production line. The blaze, which required twelve hours to contain, gutted approximately 40 percent of the facility's total floor area. Company officials confirmed all advanced packaging operations have been suspended indefinitely and that a three-to-six-month restoration timeline is their current estimate. TSAP supplies advanced packaging services to multiple fabless semiconductor firms whose chips are used in automotive control units, industrial automation equipment, and high-performance computing. Customers have been advised to activate dual-sourcing contingency plans and qualify alternative packaging subcontractors immediately.`,
    groundTruth: {
      eventCategory: 'SUPPLIER_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'Taiwan Semiconductor Advanced Packaging', type: 'SUPPLIER' },
      ],
      geographies: [
        { name: 'Taichung', type: 'CITY' },
        { name: 'Taiwan', type: 'COUNTRY' },
      ],
    },
    businessContext: {
      industry: 'Automotive Electronics Manufacturing',
      primaryCommodities: ['microcontrollers', 'power semiconductors'],
      supplierRegions: ['East Asia', 'Southeast Asia'],
    },
  },

  {
    id: 'eval-sd-002',
    articleText: `Precision Forge Holdings, a major tier-1 automotive supplier of forged aluminum suspension components, filed for Chapter 11 bankruptcy protection in a Delaware court Thursday, citing insurmountable debt load accumulated during the COVID-19 production shutdowns. The company supplies suspension knuckles and control arms to seven North American vehicle assembly plants operated by Ford, General Motors, and Stellantis. Court filings indicate the company will seek a 60-day extension on customer contracts while exploring asset sales. OEM purchasing teams have been notified and are scrambling to qualify backup suppliers, a process that typically requires six to twelve months for safety-critical suspension parts. Production line stoppages at customer facilities are considered highly likely within 30 days.`,
    groundTruth: {
      eventCategory: 'SUPPLIER_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'Precision Forge Holdings', type: 'SUPPLIER' },
        { name: 'Ford', type: 'COMPANY' },
        { name: 'General Motors', type: 'COMPANY' },
        { name: 'Stellantis', type: 'COMPANY' },
      ],
      geographies: [{ name: 'United States', type: 'COUNTRY' }],
    },
    businessContext: {
      industry: 'Automotive Parts Manufacturing',
      primaryCommodities: ['aluminum forgings', 'steel stampings'],
      supplierRegions: ['North America'],
    },
  },

  {
    id: 'eval-sd-003',
    articleText: `China's Ministry of Commerce announced Thursday that it will impose export controls on seven rare earth elements including dysprosium, terbium, and holmium, effective immediately. The controls require export licenses for all shipments of these materials, and no licenses will be issued until a new review process is established — a timeline officials declined to specify. China accounts for approximately 85 percent of global rare earth processing capacity. The affected elements are essential for high-strength permanent magnets used in electric vehicle motors, wind turbine generators, and precision-guided defense systems. Industry groups in Japan, South Korea, and the European Union called the move an unprecedented use of supply chain leverage and urged their governments to accelerate rare earth diversification strategies.`,
    groundTruth: {
      eventCategory: 'SUPPLIER_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: "China's Ministry of Commerce", type: 'ORGANIZATION' },
      ],
      geographies: [
        { name: 'China', type: 'COUNTRY' },
        { name: 'Japan', type: 'COUNTRY' },
        { name: 'South Korea', type: 'COUNTRY' },
      ],
    },
    businessContext: {
      industry: 'Electric Motor Manufacturing',
      primaryCommodities: ['dysprosium', 'neodymium', 'terbium'],
      supplierRegions: ['East Asia'],
    },
  },

  {
    id: 'eval-sd-004',
    articleText: `An explosion at the BASF Geismar, Louisiana chemical complex early Tuesday destroyed the facility's primary ethylene oxide production unit and ignited secondary fires in adjacent storage areas. Three workers were injured and hospitalized. Plant management declared force majeure on all ethylene oxide and ethylene glycol contracts, citing the total destruction of Unit 3, which represented 60 percent of site production capacity. BASF is a major North American supplier of ethylene oxide to manufacturers of polyester fibers, antifreeze, and surfactants. A company spokesperson said it would take at minimum six months to restore Unit 3 to operational status, assuming permitting and equipment procurement proceed without delays.`,
    groundTruth: {
      eventCategory: 'SUPPLIER_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'BASF', type: 'SUPPLIER' },
      ],
      geographies: [
        { name: 'Geismar', type: 'CITY' },
        { name: 'Louisiana', type: 'REGION' },
      ],
    },
    businessContext: {
      industry: 'Textile & Fiber Manufacturing',
      primaryCommodities: ['ethylene oxide', 'polyester precursors'],
      supplierRegions: ['North America'],
    },
  },

  {
    id: 'eval-sd-005',
    articleText: `Hydro ASA announced Monday it will indefinitely suspend operations at its Slovalco aluminum smelter in Slovakia, citing natural gas prices that have rendered the facility economically unviable. The smelter produces approximately 175,000 metric tons of primary aluminum annually and employs 300 workers. Hydro joins Alcoa, Trimet, and several other European aluminum producers that have shuttered capacity over the past six months as the energy crisis has pushed power and gas costs to levels that make smelting economically impossible. European primary aluminum production has fallen by approximately 30 percent from its pre-crisis peak, tightening supply for automotive, aerospace, and packaging customers that rely on locally sourced metal.`,
    groundTruth: {
      eventCategory: 'SUPPLIER_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'Hydro ASA', type: 'SUPPLIER' },
        { name: 'Slovalco', type: 'SUPPLIER' },
        { name: 'Alcoa', type: 'COMPANY' },
      ],
      geographies: [
        { name: 'Slovakia', type: 'COUNTRY' },
        { name: 'Europe', type: 'REGION' },
      ],
    },
    businessContext: {
      industry: 'Aluminum Sheet & Coil Manufacturing',
      primaryCommodities: ['primary aluminum', 'aluminum scrap'],
      supplierRegions: ['Europe'],
    },
  },

  {
    id: 'eval-sd-006',
    articleText: `Sealed Air Corporation notified customers Wednesday that it is declaring force majeure on all bubble wrap, foam padding, and protective packaging shipments from its Memphis, Tennessee production campus following a steam boiler explosion that destroyed the facility's primary utilities infrastructure. Repairs are expected to take four to six months. Sealed Air supplies protective packaging to more than 1,200 manufacturers and fulfillment centers in the southeastern United States. Customers in the consumer electronics, medical device, and e-commerce sectors are most immediately exposed given their high-volume, recurring packaging needs. Sealed Air said it is diverting some volume to facilities in Pennsylvania and Texas but cannot fully offset the Memphis capacity loss.`,
    groundTruth: {
      eventCategory: 'SUPPLIER_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'Sealed Air Corporation', type: 'SUPPLIER' },
      ],
      geographies: [
        { name: 'Memphis', type: 'CITY' },
        { name: 'Tennessee', type: 'REGION' },
      ],
    },
    businessContext: {
      industry: 'Consumer Electronics Manufacturing',
      primaryCommodities: ['foam packaging', 'corrugated board'],
      supplierRegions: ['North America'],
    },
  },

  {
    id: 'eval-sd-007',
    articleText: `The U.S. Food and Drug Administration issued a Class I recall Thursday covering all lots of citric acid produced at Jungbunzlauer's Port Colborne, Ontario facility after routine testing detected contamination with Aspergillus fumigatus mold. Citric acid is a ubiquitous food additive and preservative used in beverages, dairy products, confectionery, and pharmaceutical formulations. Jungbunzlauer is one of only four major North American citric acid producers, holding an estimated 22 percent market share. The recall affects production from a 90-day window and will force food and beverage manufacturers to urgently source replacement supply. The FDA noted that the contamination was confined to finished product and did not originate from raw materials.`,
    groundTruth: {
      eventCategory: 'SUPPLIER_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'Jungbunzlauer', type: 'SUPPLIER' },
        { name: 'U.S. Food and Drug Administration', type: 'ORGANIZATION' },
      ],
      geographies: [
        { name: 'Port Colborne', type: 'CITY' },
        { name: 'Canada', type: 'COUNTRY' },
      ],
    },
  },

  {
    id: 'eval-sd-008',
    articleText: `Murata Manufacturing announced it will cut production of its MLCC multilayer ceramic capacitors by 40 percent over the next two quarters following a raw materials shortage of barium titanate combined with a fire-suppression system failure that contaminated its Osaka clean-room production environment. MLCCs are used in virtually every category of electronic product, from smartphones and laptops to automotive ECUs and medical devices. Murata holds roughly 35 percent of global MLCC supply. Lead times, already extended to 26 weeks for high-value sizes, are expected to lengthen to 40 weeks or beyond. Electronics contract manufacturers and OEMs have begun emergency allocation requests and broker purchases at significant price premiums.`,
    groundTruth: {
      eventCategory: 'SUPPLIER_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'Murata Manufacturing', type: 'SUPPLIER' },
      ],
      geographies: [
        { name: 'Osaka', type: 'CITY' },
        { name: 'Japan', type: 'COUNTRY' },
      ],
    },
    businessContext: {
      industry: 'Industrial Electronics Manufacturing',
      primaryCommodities: ['MLCCs', 'resistors', 'inductors'],
      supplierRegions: ['East Asia'],
    },
  },

  {
    id: 'eval-sd-009',
    articleText: `A catastrophic fire swept through Amber Apparel's Chittagong dyeing and finishing facility in Bangladesh Sunday night, destroying the building and killing four workers. Amber is a major supplier of finished knit fabrics and garment components to apparel brands sourcing from Bangladesh. The company processes approximately 8 million meters of fabric monthly. Authorities said the facility would be a total loss and that no timeline for rebuilding has been established. Several European and North American fashion retailers confirmed they are sourcing from Amber and have activated alternative supplier protocols. Industry observers noted that Chittagong has experienced a string of factory fires over the past two years, raising concerns about infrastructure safety standards.`,
    groundTruth: {
      eventCategory: 'SUPPLIER_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'Amber Apparel', type: 'SUPPLIER' },
      ],
      geographies: [
        { name: 'Chittagong', type: 'CITY' },
        { name: 'Bangladesh', type: 'COUNTRY' },
      ],
    },
    businessContext: {
      industry: 'Apparel & Textile Manufacturing',
      primaryCommodities: ['knit fabric', 'cotton yarn'],
      supplierRegions: ['South Asia'],
    },
  },

  {
    id: 'eval-sd-010',
    articleText: `Flooding from Tropical Storm Alberto inundated the Monterrey industrial corridor in Nuevo León, Mexico over the weekend, causing severe damage to manufacturing facilities housing over 60 industrial suppliers. Among the most severely impacted is Plásticos del Norte, a sole-source supplier of injection-molded instrument panel components to three major assembly plants in the region. The company confirmed its facility will be closed for at least three months while flood damage to equipment and tooling is assessed and repaired. Customers were advised to invoke supply agreement force majeure clauses. The flooding also damaged road and rail infrastructure connecting Monterrey to the U.S. border, compounding supply chain disruptions for the region's extensive automotive and electronics manufacturing base.`,
    groundTruth: {
      eventCategory: 'SUPPLIER_DISRUPTION',
      isRelevant: true,
      entities: [
        { name: 'Plásticos del Norte', type: 'SUPPLIER' },
      ],
      geographies: [
        { name: 'Monterrey', type: 'CITY' },
        { name: 'Nuevo León', type: 'REGION' },
        { name: 'Mexico', type: 'COUNTRY' },
      ],
    },
    businessContext: {
      industry: 'Automotive Interior Manufacturing',
      primaryCommodities: ['injection-molded plastics', 'foam'],
      supplierRegions: ['Mexico', 'North America'],
    },
  },

  // ─── INPUT_COST_INCREASE ──────────────────────────────────────────────────

  {
    id: 'eval-ic-001',
    articleText: `The Biden administration announced sweeping 25 percent tariffs on all steel mill products imported from Canada and Mexico, effective immediately, invoking Section 232 national security authority. The tariffs apply to flat-rolled steel, structural shapes, steel pipe, and wire rod. The American Iron and Steel Institute welcomed the measures, while the Motor & Equipment Manufacturers Association warned of "severe downstream cost increases across every manufacturing sector." Automotive analysts estimate the tariffs will drive domestic hot-rolled coil spot prices higher by a wide margin. Ford Motor Company issued a statement saying the tariffs would add hundreds of millions of dollars in annual input costs to its North American manufacturing operations.`,
    groundTruth: {
      eventCategory: 'INPUT_COST_INCREASE',
      isRelevant: true,
      entities: [
        { name: 'American Iron and Steel Institute', type: 'ORGANIZATION' },
        { name: 'Ford Motor Company', type: 'COMPANY' },
        { name: 'steel', type: 'COMMODITY' },
      ],
      geographies: [
        { name: 'Canada', type: 'COUNTRY' },
        { name: 'Mexico', type: 'COUNTRY' },
        { name: 'United States', type: 'COUNTRY' },
      ],
    },
    businessContext: {
      industry: 'Metal Fabrication',
      primaryCommodities: ['hot-rolled steel', 'cold-rolled steel'],
      supplierRegions: ['North America'],
    },
  },

  {
    id: 'eval-ic-002',
    articleText: `European benchmark natural gas prices surged to record levels this week as an unseasonably cold snap gripped the continent and Russian pipeline flows fell below contracted volumes for the third consecutive month. TTF hub prices breached €200 per megawatt-hour, more than seven times the five-year seasonal average. Energy-intensive industries including glass, ceramic tiles, fertilizers, and specialty chemicals are facing impossible economics, with several German and Dutch producers announcing temporary production halts. The German Association of Chemical Industry said its members are paying gas prices that make output economically unviable at current product prices. Demand destruction is expected to persist through the heating season, which forecasters expect to last until late March.`,
    groundTruth: {
      eventCategory: 'INPUT_COST_INCREASE',
      isRelevant: true,
      entities: [
        { name: 'German Association of Chemical Industry', type: 'ORGANIZATION' },
        { name: 'natural gas', type: 'COMMODITY' },
      ],
      geographies: [
        { name: 'Europe', type: 'REGION' },
        { name: 'Germany', type: 'COUNTRY' },
        { name: 'Netherlands', type: 'COUNTRY' },
      ],
    },
    businessContext: {
      industry: 'Glass & Ceramic Manufacturing',
      primaryCommodities: ['natural gas', 'silica sand'],
      supplierRegions: ['Western Europe'],
    },
  },

  {
    id: 'eval-ic-003',
    articleText: `Benchmark wheat prices on the Chicago Board of Trade rose for the sixth consecutive session Thursday, reaching their highest level in three years, as severe drought conditions across the key growing regions of Kansas, Oklahoma, and Texas have dramatically cut winter wheat crop yield estimates. The USDA lowered its forecast for domestic soft red winter wheat production by 18 percent from its prior estimate. Food manufacturers and commodity traders warn that flour prices will rise sharply in the coming weeks as mills and bakeries seek to secure available supplies. Pasta and bread producers have already issued price increase notices to their retail customers. Analysts note that global wheat stocks are at their lowest level since 2013 following poor harvests in Australia and the Black Sea region.`,
    groundTruth: {
      eventCategory: 'INPUT_COST_INCREASE',
      isRelevant: true,
      entities: [
        { name: 'USDA', type: 'ORGANIZATION' },
        { name: 'wheat', type: 'COMMODITY' },
      ],
      geographies: [
        { name: 'Kansas', type: 'REGION' },
        { name: 'United States', type: 'COUNTRY' },
      ],
    },
    businessContext: {
      industry: 'Food & Beverage Manufacturing',
      primaryCommodities: ['wheat flour', 'corn starch'],
      supplierRegions: ['US Midwest'],
    },
  },

  {
    id: 'eval-ic-004',
    articleText: `London Metal Exchange copper prices broke through $11,000 per metric ton this week for the first time, driven by surging demand from electric vehicle battery systems, renewable energy infrastructure, and AI data center construction. Analysts at Goldman Sachs noted copper is increasingly a structural beneficiary of the energy transition and forecast supply will fall meaningfully short of demand by 2027. Wire and cable manufacturers, HVAC equipment producers, and electrical contractors are absorbing sharply higher input costs. Several copper rod producers have implemented monthly price adjustment clauses in their supply contracts, shifting price risk to downstream customers. Mining output has not kept pace with demand growth despite elevated prices.`,
    groundTruth: {
      eventCategory: 'INPUT_COST_INCREASE',
      isRelevant: true,
      entities: [
        { name: 'copper', type: 'COMMODITY' },
        { name: 'London Metal Exchange', type: 'ORGANIZATION' },
      ],
      geographies: [{ name: 'United Kingdom', type: 'COUNTRY' }],
    },
    businessContext: {
      industry: 'Electrical Equipment Manufacturing',
      primaryCommodities: ['copper wire', 'copper bar'],
      supplierRegions: ['South America', 'Africa'],
    },
  },

  {
    id: 'eval-ic-005',
    articleText: `Global container shipping spot rates have tripled in the past 90 days, driven by a combination of Red Sea diversions, port congestion at major Asian export hubs, and a surge in front-loading orders ahead of anticipated tariff changes. The Shanghai Containerized Freight Index, a key benchmark, hit its highest level since the peak of the 2021 supply chain crisis. Transpacific rates from China to the U.S. West Coast have reached $7,800 per forty-foot equivalent unit, compared to $1,400 one year ago. Electronics, furniture, and consumer goods importers are facing a dramatic increase in landed costs that is expected to persist through the upcoming peak shipping season. Analysts warn that many small and mid-sized importers may struggle to remain profitable at current freight rates.`,
    groundTruth: {
      eventCategory: 'INPUT_COST_INCREASE',
      isRelevant: true,
      entities: [
        { name: 'Shanghai Containerized Freight Index', type: 'ORGANIZATION' },
      ],
      geographies: [
        { name: 'China', type: 'COUNTRY' },
        { name: 'United States', type: 'COUNTRY' },
      ],
    },
    businessContext: {
      industry: 'Consumer Electronics Distribution',
      primaryCommodities: ['finished electronics', 'display modules'],
      supplierRegions: ['East Asia'],
    },
  },

  {
    id: 'eval-ic-006',
    articleText: `Lithium carbonate spot prices in China rose 28 percent in the past month, reversing a prolonged correction and pushing the battery-grade material back toward $20,000 per metric ton. The price recovery has been driven by a combination of accelerating EV order books in China and Europe, constrained lithium brine production at South American operations due to water rights disputes, and rising demand from the grid-scale energy storage sector. Battery cell manufacturers have issued revised pricing to their OEM customers citing higher raw material costs. Analysts at Wood Mackenzie said the market may be entering a multiyear structural tightening cycle as lithium demand from the energy transition consistently outpaces new mine supply coming online.`,
    groundTruth: {
      eventCategory: 'INPUT_COST_INCREASE',
      isRelevant: true,
      entities: [
        { name: 'lithium carbonate', type: 'COMMODITY' },
        { name: 'Wood Mackenzie', type: 'ORGANIZATION' },
      ],
      geographies: [
        { name: 'China', type: 'COUNTRY' },
        { name: 'South America', type: 'REGION' },
      ],
    },
    businessContext: {
      industry: 'Battery Pack Manufacturing',
      primaryCommodities: ['lithium carbonate', 'nickel sulfate', 'cobalt'],
      supplierRegions: ['South America', 'East Asia'],
    },
  },

  {
    id: 'eval-ic-007',
    articleText: `A fire at ExxonMobil's Baytown, Texas refinery cracker complex has forced a six-to-eight-week shutdown of one of the largest propylene production units in North America. ExxonMobil has declared force majeure on polypropylene resin contracts. The production outage follows maintenance-related cuts at two other Gulf Coast petrochemical complexes and comes at a time of already lean resin inventories. Spot polypropylene prices in North America have risen sharply, with multiple converters citing difficulty securing supply at any price. Packaging converters, automotive interior suppliers, and consumer goods manufacturers relying on polypropylene face significant margin pressure and possible production curtailments if alternative supply cannot be secured.`,
    groundTruth: {
      eventCategory: 'INPUT_COST_INCREASE',
      isRelevant: true,
      entities: [
        { name: 'ExxonMobil', type: 'COMPANY' },
        { name: 'polypropylene', type: 'COMMODITY' },
      ],
      geographies: [
        { name: 'Baytown', type: 'CITY' },
        { name: 'Texas', type: 'REGION' },
      ],
    },
    businessContext: {
      industry: 'Plastic Packaging Manufacturing',
      primaryCommodities: ['polypropylene resin', 'polyethylene'],
      supplierRegions: ['Gulf Coast', 'North America'],
    },
  },

  {
    id: 'eval-ic-008',
    articleText: `Lumber futures on the Chicago Mercantile Exchange climbed 40 percent in six weeks as wildfires in British Columbia and Alberta consumed an estimated 2.3 million hectares of timberland, including a significant portion of productive softwood harvesting zones. Industry groups estimate that effective harvest volumes will be reduced by 15 to 20 percent for the next two to three years as burned areas are assessed and salvage logging is organized. U.S. housing construction contractors, modular building manufacturers, and wood-frame commercial builders are all facing sharply higher framing lumber and plywood costs. The National Association of Home Builders warned that rising lumber prices will add meaningfully to new home costs and further constrain affordability.`,
    groundTruth: {
      eventCategory: 'INPUT_COST_INCREASE',
      isRelevant: true,
      entities: [
        { name: 'lumber', type: 'COMMODITY' },
        { name: 'National Association of Home Builders', type: 'ORGANIZATION' },
      ],
      geographies: [
        { name: 'British Columbia', type: 'REGION' },
        { name: 'Alberta', type: 'REGION' },
        { name: 'Canada', type: 'COUNTRY' },
      ],
    },
    businessContext: {
      industry: 'Prefabricated Building Manufacturing',
      primaryCommodities: ['framing lumber', 'plywood', 'engineered wood'],
      supplierRegions: ['Western Canada', 'U.S. Pacific Northwest'],
    },
  },

  {
    id: 'eval-ic-009',
    articleText: `Nickel prices on the London Metal Exchange have swung violently this month following the expansion of Western sanctions on major Russian mining and smelting operations. Russia supplies approximately 11 percent of global refined nickel and an even larger share of high-grade nickel sulfate used in lithium-ion battery cathodes. Intraday price moves of more than 15 percent have made it impossible for stainless steel mills and battery materials producers to price their products with confidence. Several battery precursor chemical producers in Japan and South Korea issued force majeure notices on cathode material deliveries. The LME briefly suspended nickel trading for four days, the first such action in 35 years, citing disorderly market conditions.`,
    groundTruth: {
      eventCategory: 'INPUT_COST_INCREASE',
      isRelevant: true,
      entities: [
        { name: 'nickel', type: 'COMMODITY' },
        { name: 'London Metal Exchange', type: 'ORGANIZATION' },
      ],
      geographies: [
        { name: 'Russia', type: 'COUNTRY' },
        { name: 'Japan', type: 'COUNTRY' },
        { name: 'South Korea', type: 'COUNTRY' },
      ],
    },
    businessContext: {
      industry: 'Stainless Steel Products Manufacturing',
      primaryCommodities: ['nickel', 'chromium', 'scrap steel'],
      supplierRegions: ['Russia', 'Europe', 'East Asia'],
    },
  },

  {
    id: 'eval-ic-010',
    articleText: `Major truckload and LTL carriers have announced across-the-board diesel fuel surcharge increases averaging 6.2 percent effective the first of next month, citing diesel prices that have risen 22 percent over the past 60 days following OPEC production cuts and refinery maintenance-driven tightening of distillate supplies. The surcharges apply to all domestic freight moving by road. For manufacturers shipping heavy, dense goods with tight frequency requirements, the effective freight cost increase can translate to a 3 to 5 percent rise in total landed cost per unit. Logistics managers are evaluating route optimization, load consolidation, and intermodal shifts to rail as mitigation strategies. Food manufacturers and consumer goods distributors with high freight-intensity are most exposed.`,
    groundTruth: {
      eventCategory: 'INPUT_COST_INCREASE',
      isRelevant: true,
      entities: [
        { name: 'diesel', type: 'COMMODITY' },
        { name: 'OPEC', type: 'ORGANIZATION' },
      ],
      geographies: [{ name: 'United States', type: 'COUNTRY' }],
    },
    businessContext: {
      industry: 'Consumer Packaged Goods Manufacturing',
      primaryCommodities: ['finished goods', 'bulk ingredients'],
      supplierRegions: ['North America'],
    },
  },

  // ─── IRRELEVANT ───────────────────────────────────────────────────────────

  {
    id: 'eval-ir-001',
    articleText: `The Kansas City Chiefs defeated the San Francisco 49ers 25-22 in overtime Sunday night to claim their fourth Super Bowl title in six years before a record crowd of 65,000 fans at Allegiant Stadium in Las Vegas. Patrick Mahomes threw for 333 yards and two touchdowns as the Chiefs overcame a 10-point fourth-quarter deficit. Head coach Andy Reid becomes just the second coach in NFL history to win four Super Bowls. The game drew an estimated 115 million viewers on CBS, making it the most-watched program in U.S. television history. Celebrations are expected across Kansas City Monday, with a potential victory parade in the planning stages.`,
    groundTruth: {
      eventCategory: 'IRRELEVANT',
      isRelevant: false,
      entities: [],
      geographies: [
        { name: 'Las Vegas', type: 'CITY' },
        { name: 'Kansas City', type: 'CITY' },
      ],
    },
  },

  {
    id: 'eval-ir-002',
    articleText: `Hollywood actress Scarlett Monroe filed for divorce from film director Marcus Webb in Los Angeles Superior Court Monday, citing irreconcilable differences after six years of marriage. The couple met on the set of the 2017 thriller "Shattered Glass" and married in a private ceremony in Tuscany. Their prenuptial agreement is expected to simplify asset division proceedings. Monroe's publicist confirmed the filing but declined further comment. Webb's attorney said his client was focused on his upcoming film project and wished Monroe well. The couple have two children and are seeking joint custody. Legal observers expect the proceedings to be resolved within six months.`,
    groundTruth: {
      eventCategory: 'IRRELEVANT',
      isRelevant: false,
      entities: [],
      geographies: [
        { name: 'Los Angeles', type: 'CITY' },
      ],
    },
  },

  {
    id: 'eval-ir-003',
    articleText: `Apple Inc. unveiled its iPhone 17 lineup Monday at its annual September product event at Apple Park in Cupertino, California. The four new models feature a titanium chassis, a new periscope camera system with 5x optical zoom on the base model, and an updated A19 processor chip manufactured by TSMC on a 3-nanometer node. Starting prices are $999 for the standard iPhone 17 and $1,199 for the iPhone 17 Pro. Preorders open Friday with availability beginning September 20. Analysts at Morgan Stanley called the camera upgrade the most significant improvement since the introduction of the telephoto lens and projected record first-weekend sales. Apple shares rose 2.3 percent on the announcement.`,
    groundTruth: {
      eventCategory: 'IRRELEVANT',
      isRelevant: false,
      entities: [],
      geographies: [
        { name: 'Cupertino', type: 'CITY' },
      ],
    },
  },

  {
    id: 'eval-ir-004',
    articleText: `Voters in Denver, Colorado approved Measure 2B Tuesday, extending the city's 0.25 percent sales tax dedicated to affordable housing programs for an additional ten years. The measure passed with 61 percent support. Mayor Michael Johnston called the result "a mandate to continue building the housing our city needs." The extension is expected to generate approximately $40 million per year for affordable unit construction, rehabilitation, and rental assistance programs. Opponents had argued the tax should sunset and be renegotiated in light of changed economic conditions. The Denver City Council will hold its first implementation planning session next month to allocate the funds across the city's housing programs.`,
    groundTruth: {
      eventCategory: 'IRRELEVANT',
      isRelevant: false,
      entities: [],
      geographies: [
        { name: 'Denver', type: 'CITY' },
        { name: 'Colorado', type: 'REGION' },
      ],
    },
  },

  {
    id: 'eval-ir-005',
    articleText: `"Galactic Horizons 3," the third installment in director Zara Okafor's space epic franchise, opened to $287 million domestically and $412 million globally in its first weekend, breaking the previous opening-weekend record for an original science fiction film. The film, starring Marcus Elton and Priya Nair, features groundbreaking visual effects produced by Industrial Light & Magic and a score by Hans Zimmer. Critics gave the film a 94 percent rating on Rotten Tomatoes, calling it "a masterpiece of modern blockbuster filmmaking." Streaming rights are expected to attract a bidding war among major platforms. Studio executives said a fourth installment has been greenlit pending final box office tallies.`,
    groundTruth: {
      eventCategory: 'IRRELEVANT',
      isRelevant: false,
      entities: [],
      geographies: [],
    },
  },

  {
    id: 'eval-ir-006',
    articleText: `Astronomers using the James Webb Space Telescope have detected what they believe is the first direct observational evidence of a black hole actively consuming material in a dwarf galaxy 12 million light-years away. The discovery, published Thursday in the journal Nature, suggests that black holes in small galaxies play a more significant role in galactic evolution than previously understood. Lead researcher Dr. Amara Osei of MIT said the findings challenge current theoretical models of galaxy formation. The telescope's unprecedented infrared sensitivity made the observation possible. Scientists plan to expand the survey to 50 additional dwarf galaxies over the next two years to determine whether the phenomenon is widespread.`,
    groundTruth: {
      eventCategory: 'IRRELEVANT',
      isRelevant: false,
      entities: [],
      geographies: [],
    },
  },

  {
    id: 'eval-ir-007',
    articleText: `Shake Shack announced Monday it will open its 500th global restaurant location in Tokyo's Shibuya district next month, marking a milestone for the fast-casual burger chain founded in New York City in 2004. The Shibuya location will feature a Japan-exclusive menu including a sakura-flavored milkshake and a miso-glazed mushroom burger. CEO Randy Garutti said Japan has become the company's fastest-growing international market, with plans to add 30 locations across Asia in the next fiscal year. The company's stock rose 4.1 percent on the news. The Tokyo opening will include a ticketed preview event featuring celebrity appearances and a DJ set.`,
    groundTruth: {
      eventCategory: 'IRRELEVANT',
      isRelevant: false,
      entities: [],
      geographies: [
        { name: 'Tokyo', type: 'CITY' },
        { name: 'Japan', type: 'COUNTRY' },
      ],
    },
  },

  {
    id: 'eval-ir-008',
    articleText: `The University of Connecticut Huskies women's basketball team claimed their sixth consecutive NCAA national championship Sunday, defeating South Carolina 78-65 in Dallas before a sellout crowd of 20,000 fans. Senior guard Aaliyah Edwards was named the tournament's Most Outstanding Player after averaging 24 points and 9 rebounds across six tournament games. Head coach Geno Auriemma, now with 12 national titles, received a standing ovation from the crowd. The victory completes a perfect 38-0 season for UConn. Commissioner of the Big East Conference called it "the greatest dynasty in the history of college athletics." Several players are expected to be selected in next month's WNBA draft.`,
    groundTruth: {
      eventCategory: 'IRRELEVANT',
      isRelevant: false,
      entities: [],
      geographies: [
        { name: 'Dallas', type: 'CITY' },
      ],
    },
  },

  {
    id: 'eval-ir-009',
    articleText: `Meta Platforms announced Thursday that it will begin labeling all AI-generated content across Facebook, Instagram, and Threads with a prominent watermark and disclosure badge starting next month. The policy change follows pressure from European Union regulators under the Digital Services Act and is designed to help users distinguish AI-generated images, videos, and text from authentic human-created content. Meta said the detection system uses a combination of metadata analysis and computer vision. Civil liberties groups broadly welcomed the move while noting the system will face challenges detecting sophisticated deepfakes. The company said it will expand the policy to cover WhatsApp later in the year.`,
    groundTruth: {
      eventCategory: 'IRRELEVANT',
      isRelevant: false,
      entities: [],
      geographies: [
        { name: 'European Union', type: 'REGION' },
      ],
    },
  },

  {
    id: 'eval-ir-010',
    articleText: `The S&P CoreLogic Case-Shiller National Home Price Index rose 5.8 percent year-over-year in the latest reading, surprising economists who had expected gains to moderate as mortgage rates remained above 7 percent. The strongest price gains were recorded in Miami, Chicago, and New York, where inventory remains critically constrained despite slower demand. The National Association of Realtors reported that existing home sales declined for the third consecutive month, indicating that high prices and high borrowing costs continue to suppress transaction volume. Economists noted the unusual combination of declining sales and rising prices, a dynamic driven by homeowners unwilling to give up low-rate mortgages locked in before 2022.`,
    groundTruth: {
      eventCategory: 'IRRELEVANT',
      isRelevant: false,
      entities: [],
      geographies: [
        { name: 'Miami', type: 'CITY' },
        { name: 'Chicago', type: 'CITY' },
        { name: 'New York', type: 'CITY' },
        { name: 'United States', type: 'COUNTRY' },
      ],
    },
  },
];
