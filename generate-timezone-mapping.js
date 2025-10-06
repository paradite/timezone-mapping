#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Configurable working hours (24-hour format)
const WORKING_HOURS = {
  startHour: 9, // 9 AM
  endHour: 2, // 2 AM (next day, inclusive)
};

function formatTo12Hour(hour) {
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

function isWorkingHours(hour, timezone) {
  // Use configurable working hours for both timezones
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

function isOverlappingWorkingHours(sgtHour, pdtHour, edtHour, cetHour) {
  const sgtWorking = isWorkingHours(sgtHour, "SGT");
  const pdtWorking = isWorkingHours(pdtHour, "PDT");
  const edtWorking = isWorkingHours(edtHour, "EDT");
  const cetWorking = isWorkingHours(cetHour, "CET");
  return sgtWorking && pdtWorking && edtWorking && cetWorking;
}

function generateTimezoneMapping() {
  const mappings = [];
  let prevOverlapping = false;

  // Generate mappings for each hour of the day (SGT)
  for (let sgtHour = 0; sgtHour < 24; sgtHour++) {
    // SGT is UTC+8
    // PST is UTC-8 (16 hours behind SGT)
    // PDT is UTC-7 (15 hours behind SGT)
    // EST is UTC-5 (13 hours behind SGT)
    // EDT is UTC-4 (12 hours behind SGT)
    // CET is UTC+1 (7 hours behind SGT)

    const pstHour = (sgtHour - 16 + 24) % 24;
    const pdtHour = (sgtHour - 15 + 24) % 24;
    const estHour = (sgtHour - 13 + 24) % 24;
    const edtHour = (sgtHour - 12 + 24) % 24;
    const cetHour = (sgtHour - 7 + 24) % 24;

    const sgtTime = formatTo12Hour(sgtHour);
    // const pstTime = formatTo12Hour(pstHour);
    const pdtTime = formatTo12Hour(pdtHour);
    // const estTime = formatTo12Hour(estHour);
    const edtTime = formatTo12Hour(edtHour);
    const cetTime = formatTo12Hour(cetHour);

    const overlapping = isOverlappingWorkingHours(
      sgtHour,
      pdtHour,
      edtHour,
      cetHour
    );

    // Check if we're ending an overlapping working hours block (before adding the line)
    if (!overlapping && prevOverlapping) {
      mappings.push("--- END: Overlapping working hours (SGT & EDT & CET) ---");
      mappings.push(""); // Empty line after END
    }

    // Check if we're starting an overlapping working hours block
    if (overlapping && !prevOverlapping) {
      mappings.push(""); // Empty line before START
      mappings.push(
        "--- START: Overlapping working hours (SGT & EDT & CET) ---"
      );
    }

    // Format with padding and vertical separators for alignment
    const sgtFormatted = (sgtTime + " SGT").padEnd(12);
    const pdtFormatted = (pdtTime + " PDT").padEnd(12);
    // const pstFormatted = (pstTime + " PST").padEnd(12);
    const edtFormatted = (edtTime + " EDT").padEnd(12);
    // const estFormatted = (estTime + " EST").padEnd(12);
    const cetFormatted = (cetTime + " CET").padEnd(12);

    mappings.push(
      `${sgtFormatted} | ${pdtFormatted} | ${edtFormatted} | ${cetFormatted}`
    );

    prevOverlapping = overlapping;
  }

  // Create the markdown content
  const content = `## SGT timezone vs SF timezone (PDT) & New York timezone (EDT) & Central European Time (CET)

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
