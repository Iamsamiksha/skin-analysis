export const generateDonutChart = (value) => {
    console.log("Value of the Pie Chart", value)
    const radius = 40;
    const circumference = 2 * Math.PI * radius;

    // Define colors for each segment
    const color1 = "#d8bfe9"; // Light Lavender
    const color2 = "#c3aed6"; // Medium Lavender
    const color3 = "#a29bfe"; // Soft Lavender

    let strokeColor = color1; // Default color
    let strokeDashoffset = circumference; // Default, no fill

    switch (value) {
        case 1:
            strokeColor = color1;
            strokeDashoffset = circumference * (2/3);
            break;
        case 2:
            strokeColor = color2;
            strokeDashoffset = circumference * (1/3);
            break;
        case 3:
            strokeColor = color3;
            strokeDashoffset = 0;
            break;
        default:
            strokeColor = "#eee"; // Grey for unknown
            strokeDashoffset = circumference;
    }

    const svg = `
    <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="${radius}" fill="none" stroke="#eee" stroke-width="8"/>
        <circle
            cx="50"
            cy="50"
            r="${radius}"
            fill="none"
            stroke="${strokeColor}"
            stroke-width="8"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${strokeDashoffset}"
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
        />
    </svg>
    `;

    return svg;
};