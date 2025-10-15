#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Configurable working hours (24-hour format)
const WORKING_HOURS = {
  startHour: 9, // 9 AM
  endHour: 1, // 1 AM (next day, inclusive)
};

// Configurable timezones
// Each timezone has:
// - name: Display name for the timezone
// - offset: Hours difference from SGT (negative means behind SGT)
const TIMEZONES = [
  { name: "SGT", offset: 0, description: "Singapore Time" },
  { name: "PDT", offset: -15, description: "Pacific Daylight Time (SF)" },
];

function formatTo12Hour(hour) {
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${String(hour).padStart(2, " ")}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${String(hour - 12).padStart(2, " ")}:00 PM`;
}

function isWorkingHours(hour) {
  // Use configurable working hours for all timezones
  if (WORKING_HOURS.startHour <= WORKING_HOURS.endHour) {
    // Normal case: start and end on same day (e.g., 9 AM to 6 PM)
    return hour >= WORKING_HOURS.startHour && hour <= WORKING_HOURS.endHour;
  } else {
    // Overnight case: spans midnight (e.g., 10 AM to 2 AM next day)
    const endOfDay = 23;
    const startOfDay = 0;
    return (
      (hour >= WORKING_HOURS.startHour && hour <= endOfDay) ||
      (hour >= startOfDay && hour <= WORKING_HOURS.endHour)
    );
  }
}

function isOverlappingWorkingHours(hours) {
  // Check if all timezones are in working hours
  return hours.every((hour) => isWorkingHours(hour));
}

function generateTimezoneMapping() {
  const mappings = [];
  let prevOverlapping = false;

  // Generate mappings for each hour of the day (base timezone)
  for (let baseHour = 0; baseHour < 24; baseHour++) {
    // Calculate hours for all timezones
    const hours = TIMEZONES.map((tz) => {
      const hour = (baseHour + tz.offset + 24) % 24;
      return hour;
    });

    const overlapping = isOverlappingWorkingHours(hours);

    // Generate timezone names for the markers (excluding base timezone)
    const timezoneNames = TIMEZONES.map((tz) => tz.name).join(" & ");

    // Check if we're ending an overlapping working hours block (before adding the line)
    if (!overlapping && prevOverlapping) {
      mappings.push(
        `--- END: Overlapping working hours (${timezoneNames}) ---`
      );
      mappings.push(""); // Empty line after END
    }

    // Check if we're starting an overlapping working hours block
    if (overlapping && !prevOverlapping) {
      mappings.push(""); // Empty line before START
      mappings.push(
        `--- START: Overlapping working hours (${timezoneNames}) ---`
      );
    }

    // Format with padding and vertical separators for alignment
    const formattedTimes = TIMEZONES.map((tz, index) => {
      const time = formatTo12Hour(hours[index]);
      return (time + " " + tz.name).padEnd(12);
    });

    mappings.push(formattedTimes.join(" | "));

    prevOverlapping = overlapping;
  }

  // Generate title from timezone names
  const timezoneTitle = TIMEZONES.map((tz, index) =>
    index === 0 ? `${tz.name} timezone` : `${tz.description} (${tz.name})`
  ).join(" vs ");

  // Create the markdown content
  const content = `## ${timezoneTitle}

\`\`\`
${mappings.join("\n")}
\`\`\`
`;

  // Write to file
  const outputPath = path.join(__dirname, "README.md");
  fs.writeFileSync(outputPath, content);

  console.log(`Timezone mapping generated at: ${outputPath}`);
}

generateTimezoneMapping();
