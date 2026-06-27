const fs = require("fs");

const file = "src/GrowthHubPage.jsx";
let src = fs.readFileSync(file, "utf8");

// Prevent duplicate patch
if (src.includes("❤️ Favorites")) {
  console.log("Favorites filter already exists.");
  process.exit(0);
}

// Add Favorites option
src = src.replace(
  '<option value="all">All Categories</option>',
  `<option value="all">All Categories</option>
              <option value="favorites">❤️ Favorites</option>`
);

// Replace marketplace filter logic
src = src.replace(
  /const q = \(marketSearch \|\| ""\)\.toLowerCase\(\);\s*const f = marketFilter \|\| "all";\s*return \(!q \|\| l\.title\?\.toLowerCase\(\)\.includes\(q\) \|\| l\.description\?\.toLowerCase\(\)\.includes\(q\)\)\s*&& \(f === "all" \|\| l\.industry === f\);/m,
`const q = (marketSearch || "").toLowerCase();
                const f = marketFilter || "all";
                return (
                  (!q ||
                    l.title?.toLowerCase().includes(q) ||
                    l.description?.toLowerCase().includes(q)) &&
                  (f === "all" ||
                    (f === "favorites"
                      ? favoriteListings.includes(l.id)
                      : l.industry === f))
                );`
);

fs.writeFileSync(file, src);

console.log("✅ Favorites marketplace patch applied.");
