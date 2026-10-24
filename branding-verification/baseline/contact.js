// ---------------------------------- JavaScript ----------------------------------
document.addEventListener("DOMContentLoaded", function () {
  // Initialize the map (Leaflet.js)
  // Coordinates for Damascus, Syria
  const damascusCoordinates = [33.5138, 36.2765];
  const map = L.map("map").setView(damascusCoordinates, 13);

  // Add map tile layer (OpenStreetMap)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Add a marker for the restaurant
  L.marker(damascusCoordinates)
    .addTo(map)
    .bindPopup("<b>Al-Sham Al-Asil Restaurant</b>")
    .openPopup();
});
