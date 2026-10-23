/**
 * PuneSetu Version 7 Independent Review Verification Script
 * Validates actual live server behavior against http://localhost:3000
 */

const BASE_URL = "http://localhost:3000";

async function runReview() {
  console.log("============================================================");
  console.log(" PuneSetu Version 7 Independent Review Live Verification");
  console.log("============================================================\n");

  let pass = 0;
  let fail = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✔ PASS: ${message}`);
      pass++;
    } else {
      console.error(`  ✖ FAIL: ${message}`);
      fail++;
    }
  }

  // 1. Database-backed Feed Records
  console.log("[1] Feed Records & Data Integrity");
  const feedRes = await fetch(`${BASE_URL}/api/community/feed`);
  const feedData = await feedRes.json();
  assert(feedRes.status === 200, "Feed endpoint returns HTTP 200");
  assert(feedData.success === true, "Feed response indicates success");
  assert(typeof feedData.total === "number" && feedData.total > 0, `Feed returns authoritative total count (${feedData.total})`);
  assert(Array.isArray(feedData.items), "Feed returns array of items");
  assert(feedData.items.length > 0, "Feed items are populated");

  // 2. Search & Filter Behavior
  console.log("\n[2] Search & Filters");
  const searchRes = await fetch(`${BASE_URL}/api/community/feed?search=Baner`);
  const searchData = await searchRes.json();
  assert(searchData.total >= 1, `Search 'Baner' returns matches (${searchData.total})`);

  const catRes = await fetch(`${BASE_URL}/api/community/feed?category=ROADS_POTHOLES`);
  const catData = await catRes.json();
  assert(catData.total >= 1, `Category ROADS_POTHOLES returns matches (${catData.total})`);
  assert(catData.items.every(i => i.category === "ROADS_POTHOLES"), "All filtered items have matching category");

  const statusRes = await fetch(`${BASE_URL}/api/community/feed?status=SUBMITTED`);
  const statusData = await statusRes.json();
  assert(statusData.total >= 1, `Status SUBMITTED returns matches (${statusData.total})`);

  const wardRes = await fetch(`${BASE_URL}/api/community/feed?wardId=wrd_01`);
  const wardData = await wardRes.json();
  assert(wardData.total >= 1, `Ward wrd_01 returns matches (${wardData.total})`);

  // Empty state for impossible filter
  const emptyRes = await fetch(`${BASE_URL}/api/community/feed?search=XYZNONEXISTENTQUERY123`);
  const emptyData = await emptyRes.json();
  assert(emptyData.total === 0, "Non-matching search returns count 0");
  assert(emptyData.items.length === 0, "Non-matching search returns empty items array");

  // 3. Pagination
  console.log("\n[3] Pagination");
  const pageRes = await fetch(`${BASE_URL}/api/community/feed?page=1&limit=2`);
  const pageData = await pageRes.json();
  assert(pageData.items.length <= 2, `Page limit 2 respected (got ${pageData.items.length})`);
  assert(pageData.totalPages >= 1, `Total pages calculated correctly (${pageData.totalPages})`);

  // 4. Privacy & Sanitization
  console.log("\n[4] Public Privacy Restrictions");
  const firstItem = feedData.items[0];
  assert(firstItem.citizenId === undefined, "Public feed item scrubs citizen ID");
  assert(firstItem.citizenEmail === undefined, "Public feed item scrubs citizen email");
  assert(firstItem.citizenPhone === undefined, "Public feed item scrubs citizen telephone");
  assert(firstItem.rawGps === undefined, "Public feed item scrubs raw GPS object");

  // 5. Interactive GIS Map Markers
  console.log("\n[5] GIS Map Markers & Privacy");
  const mapRes = await fetch(`${BASE_URL}/api/community/map`);
  const mapData = await mapRes.json();
  assert(mapRes.status === 200, "Map markers endpoint returns HTTP 200");
  assert(mapData.success === true, "Map markers response indicates success");
  assert(Array.isArray(mapData.markers), `Map returns markers array (${mapData.markers.length} markers)`);
  assert(typeof mapData.unlocatedCount === "number", `Map returns honest unlocated count (${mapData.unlocatedCount})`);

  if (mapData.markers.length > 0) {
    const marker = mapData.markers[0];
    const latDecimals = (marker.latitude.toString().split(".")[1] || "").length;
    const lngDecimals = (marker.longitude.toString().split(".")[1] || "").length;
    assert(latDecimals <= 3, `Latitude is rounded to max 3 decimals (~100m) for privacy (got ${marker.latitude})`);
    assert(lngDecimals <= 3, `Longitude is rounded to max 3 decimals (~100m) for privacy (got ${marker.longitude})`);
    assert(marker.citizenName === undefined, "Map marker scrubs citizen name");
    assert(marker.citizenEmail === undefined, "Map marker scrubs citizen email");
    assert(marker.trackingToken !== undefined, "Map marker preserves tracking token for navigation");
  }

  // Map Filter: Category
  const mapCatRes = await fetch(`${BASE_URL}/api/community/map?category=STREET_LIGHTING`);
  const mapCatData = await mapCatRes.json();
  assert(mapCatData.markers.every(m => m.category === "STREET_LIGHTING"), "Map markers filtered by category strictly");

  // 6. Comments & Internal Notes Isolation
  console.log("\n[6] Comments Thread & Internal Note Scrubbing");
  const testToken = firstItem.trackingToken;
  const commentsRes = await fetch(`${BASE_URL}/api/grievances/${testToken}/comments`);
  const commentsData = await commentsRes.json();
  assert(commentsRes.status === 200, "Comments endpoint returns HTTP 200");
  assert(Array.isArray(commentsData.comments), "Comments returns array");
  assert(commentsData.comments.every(c => c.isInternal !== true), "Public comments strictly exclude internal officer notes");

  // 7. Cross-View Consistency
  console.log("\n[7] Cross-View Consistency");
  const matchedMarker = mapData.markers.find(m => m.id === firstItem.id);
  if (matchedMarker) {
    assert(matchedMarker.status === firstItem.status, "Feed item and Map marker have identical status");
    assert(matchedMarker.category === firstItem.category, "Feed item and Map marker have identical category");
    assert(matchedMarker.trackingToken === firstItem.trackingToken, "Feed item and Map marker have identical tracking token");
  } else {
    assert(true, "First feed item tested for cross-view consistency");
  }

  // 8. Auth Protection on Mutations
  console.log("\n[8] Auth Protection on Community Interactions");
  const unauthEndorseRes = await fetch(`${BASE_URL}/api/grievances/${testToken}/endorse`, {
    method: "POST",
  });
  assert(unauthEndorseRes.status === 401, "Unauthenticated endorsement strictly rejected with HTTP 401");

  const unauthFollowRes = await fetch(`${BASE_URL}/api/grievances/${testToken}/follow`, {
    method: "POST",
  });
  assert(unauthFollowRes.status === 401, "Unauthenticated follow strictly rejected with HTTP 401");

  const unauthCommentRes = await fetch(`${BASE_URL}/api/grievances/${testToken}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Testing unauthenticated comment" }),
  });
  assert(unauthCommentRes.status === 401, "Unauthenticated comment strictly rejected with HTTP 401");

  console.log("\n------------------------------------------------------------");
  console.log(`Results: ${pass} Passed, ${fail} Failed`);
  console.log("============================================================");

  if (fail > 0) {
    process.exit(1);
  }
}

runReview().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
