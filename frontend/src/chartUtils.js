export const generateDonutChart = (value) => {
    const radius = 40;
    const innerRadius = 25; // Adjust for donut thickness
    const gap = 2; // Gap between sections, adjust as needed

    // Define colors for each segment
    const color1 = "#d8bfe9"; // Light Lavender
    const color2 = "#c3aed6"; // Medium Lavender
    const color3 = "#a29bfe"; // Soft Lavender

    let needleAngle = 0;

    switch (value) {
        case 1:
            needleAngle = 30;
            break;
        case 2:
            needleAngle = 150;
            break;
        case 3:
            needleAngle = 270;
            break;
        default:
            needleAngle = 0;
    }

    // Function to calculate arc coordinates
    const getArcCoords = (angle, radius) => {
        const angleInRadians = (angle - 90) * Math.PI / 180;
        return {
            x: 50 + radius * Math.cos(angleInRadians),
            y: 50 + radius * Math.sin(angleInRadians)
        };
    };

    // Define arc paths for each section
    const startAngle = 0;
    const arc1EndAngle = 120 - gap; // Gap for visual separation
    const arc2StartAngle = 120 + gap;
    const arc2EndAngle = 240 - gap;
    const arc3StartAngle = 240 + gap;
    const arc3EndAngle = 360;

    const arc1Start = getArcCoords(startAngle, radius);
    const arc1End = getArcCoords(arc1EndAngle, radius);
    const arc2Start = getArcCoords(arc2StartAngle, radius);
    const arc2End = getArcCoords(arc2EndAngle, radius);
    const arc3Start = getArcCoords(arc3StartAngle, radius);
    const arc3End = getArcCoords(arc3EndAngle, radius);

    const arc1InnerStart = getArcCoords(startAngle, innerRadius);
    const arc1InnerEnd = getArcCoords(arc1EndAngle, innerRadius);
    const arc2InnerStart = getArcCoords(arc2StartAngle, innerRadius);
    const arc2InnerEnd = getArcCoords(arc2EndAngle, innerRadius);
    const arc3InnerStart = getArcCoords(arc3StartAngle, innerRadius);
    const arc3InnerEnd = getArcCoords(arc3EndAngle, innerRadius);

    // Create arc paths
    const createArcPath = (start, end, innerStart, innerEnd) => {
        const largeArcFlag = (end.angle - start.angle) > 180 ? 1 : 0;
        return `M ${start.x},${start.y} A ${radius},${radius} 0 ${largeArcFlag} 1 ${end.x},${end.y} L ${innerEnd.x},${innerEnd.y} A ${innerRadius},${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x},${innerStart.y} Z`;
    };

      // Create arc paths with modified getArcCoords function
    const createArcPathWithAngles = (startAngle, endAngle, innerRadiusVal, radiusVal) => {
        const start = getArcCoords(startAngle, radiusVal);
        const end = getArcCoords(endAngle, radiusVal);
        const innerStart = getArcCoords(startAngle, innerRadiusVal);
        const innerEnd = getArcCoords(endAngle, innerRadiusVal);
        const largeArcFlag = (endAngle - startAngle) > 180 ? 1 : 0;
        return `M ${start.x},${start.y} A ${radiusVal},${radiusVal} 0 ${largeArcFlag} 1 ${end.x},${end.y} L ${innerEnd.x},${innerEnd.y} A ${innerRadiusVal},${innerRadiusVal} 0 ${largeArcFlag} 0 ${innerStart.x},${innerStart.y} Z`;
    };

    const arcPath1 = createArcPathWithAngles(startAngle, arc1EndAngle, innerRadius, radius);
    const arcPath2 = createArcPathWithAngles(arc2StartAngle, arc2EndAngle, innerRadius, radius);
    const arcPath3 = createArcPathWithAngles(arc3StartAngle, arc3EndAngle, innerRadius, radius);

    // Calculate needle position
    const centerX = 50;
    const centerY = 50;
    const needleLength = 35;
    const needleX = centerX + needleLength * Math.cos((needleAngle - 90) * (Math.PI / 180));
    const needleY = centerY + needleLength * Math.sin((needleAngle - 90) * (Math.PI / 180));

    const svg = `
        <svg width="100" height="100" viewBox="0 0 100 100">
            <!-- Segmented donut -->
            <path d="${arcPath1}" fill="${color1}" stroke="none" />
            <path d="${arcPath2}" fill="${color2}" stroke="none" />
            <path d="${arcPath3}" fill="${color3}" stroke="none" />

            <!-- Needle (Thin line from center to percentage position) -->
            <line x1="${centerX}" y1="${centerY}" x2="${needleX}" y2="${needleY}" stroke="#5a3d7e" stroke-width="2" />

            <!-- Small circle at needle center -->
            <circle cx="50" cy="50" r="3" fill="#5a3d7e" />
        </svg>
    `;

    return svg;
};
