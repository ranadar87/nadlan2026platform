import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const APIFY_TOKEN = Deno.env.get("APIFY_API_KEY");

const YAD2_ACTOR_ID = "GyQe5auqKZ3YX3Pi6";
const MADLAN_ACTOR_ID = "OdZazcftQ9ouI628C";

async function runApifyActor(actorId, input) {
  // Start actor run
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}&waitForFinish=300`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!runRes.ok) {
    const err = await runRes.text();
    throw new Error(`Apify run failed: ${err}`);
  }

  const runData = await runRes.json();
  const datasetId = runData.data?.defaultDatasetId;

  if (!datasetId) throw new Error("No dataset ID returned from Apify");

  // Fetch results
  const dataRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json&clean=true`
  );

  if (!dataRes.ok) throw new Error("Failed to fetch dataset");

  return await dataRes.json();
}

function mapYad2ToLead(item) {
  return {
    full_name: item.contactName || "לא ידוע",
    phone: item.contactPhone || "",
    city: item.cityHebrew || item.city || "",
    neighbourhood: item.neighbourhood || "",
    address: item.address || "",
    property_type: item.propertyType || "דירה",
    deal_type: item.dealType === "rent" ? "השכרה" : "מכירה",
    price: item.price || 0,
    rooms: item.rooms || 0,
    area_sqm: item.areaSqm || 0,
    floor: item.floor || "",
    has_parking: item.hasParking || false,
    has_elevator: item.hasElevator || false,
    has_balcony: item.hasBalcony || false,
    has_secure_room: item.hasSecureRoom || false,
    has_agent: item.hasAgent || false,
    cover_image: item.coverImage || "",
    source_url: item.url || "",
    source_listing_id: item.listingId || "",
    description: item.listingDescription || "",
    source: "yad2",
    status: "new",
  };
}

function mapMadlanToLead(item) {
  return {
    full_name: item.contactName || "לא ידוע",
    phone: item.contactPhone || "",
    city: item.cityHebrew || item.city || "",
    neighbourhood: item.neighbourhood || "",
    address: item.address || "",
    property_type: "דירה",
    deal_type: item.dealType === "rent" ? "השכרה" : "מכירה",
    price: item.price || 0,
    rooms: item.rooms || 0,
    area_sqm: item.areaSqm || 0,
    floor: item.floor || "",
    has_parking: item.parking > 0,
    has_elevator: item.hasElevator || false,
    has_balcony: item.hasBalcony || false,
    has_secure_room: item.hasSecureRoom || false,
    has_agent: item.hasAgent || false,
    cover_image: (item.images || [])[0] || "",
    source_url: item.url || "",
    source_listing_id: item.id || "",
    source: "madlan",
    status: "new",
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (!APIFY_TOKEN) {
      return Response.json({ error: "APIFY_API_KEY not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { source, batch_id, city, deal_type, max_items, min_price, max_price, min_rooms, max_rooms, neighbourhood, require_parking, require_elevator, require_balcony, require_secure_room, exclude_agents } = body;

    let input;
    let items;

    if (source === "yad2") {
      input = {
        city: city,
        dealType: deal_type || "buy",
        maxItems: Math.min(max_items || 150, 700),
        enrichListings: true,
      };
      if (min_price) input.minPrice = min_price;
      if (max_price) input.maxPrice = max_price;
      if (min_rooms) input.minRooms = min_rooms;
      if (max_rooms) input.maxRooms = max_rooms;
      if (neighbourhood) input.neighbourhood = neighbourhood;
      if (require_parking) input.requireParking = true;
      if (require_elevator) input.requireElevator = true;
      if (require_balcony) input.requireBalcony = true;
      if (require_secure_room) input.requireSecureRoom = true;

      items = await runApifyActor(YAD2_ACTOR_ID, input);
    } else {
      input = {
        city: city,
        dealType: deal_type || "buy",
        maxItems: Math.min(max_items || 150, 500),
      };
      if (min_price) input.minPrice = min_price;
      if (max_price) input.maxPrice = max_price;
      if (min_rooms) input.minRooms = min_rooms;
      if (max_rooms) input.maxRooms = max_rooms;
      if (neighbourhood) input.neighbourhood = neighbourhood;
      if (require_parking) input.requireParking = true;
      if (require_elevator) input.requireElevator = true;
      if (require_balcony) input.requireBalcony = true;
      if (require_secure_room) input.requireSecureRoom = true;
      if (exclude_agents) input.excludeAgents = true;

      items = await runApifyActor(MADLAN_ACTOR_ID, input);
    }

    // Fetch existing leads to detect duplicates
    const existingLeads = await base44.asServiceRole.entities.Lead.filter({ source });
    const existingPhones = new Set(existingLeads.map(l => l.phone).filter(Boolean));
    const existingSourceIds = new Set(existingLeads.map(l => l.source_listing_id).filter(Boolean));

    let newLeads = 0;
    let duplicates = 0;

    for (const item of items) {
      const mapped = source === "yad2" ? mapYad2ToLead(item) : mapMadlanToLead(item);

      if (!mapped.phone && !mapped.source_listing_id) continue;

      const isDuplicate = (mapped.phone && existingPhones.has(mapped.phone)) ||
        (mapped.source_listing_id && existingSourceIds.has(mapped.source_listing_id));

      if (isDuplicate) {
        duplicates++;
        continue;
      }

      mapped.scrape_batch_id = batch_id;
      await base44.asServiceRole.entities.Lead.create(mapped);
      if (mapped.phone) existingPhones.add(mapped.phone);
      if (mapped.source_listing_id) existingSourceIds.add(mapped.source_listing_id);
      newLeads++;
    }

    // Update batch record
    await base44.asServiceRole.entities.ScrapeBatch.update(batch_id, {
      status: "completed",
      total_results: items.length,
      new_leads: newLeads,
      duplicate_leads: duplicates,
      credits_used: newLeads,
    });

    return Response.json({ new_leads: newLeads, duplicates, total: items.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});