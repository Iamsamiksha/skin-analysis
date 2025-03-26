// chartUtils.js

export const generateDonutChart = (value) => {
    // Normalize the value to a percentage (assuming value is on a scale where higher is better)
    const percentage = normalizeValue(value);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const svg = `
        <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="${radius}" fill="none" stroke="#ddd" stroke-width="8" />
            <circle
                cx="50"
                cy="50"
                r="${radius}"
                fill="none"
                stroke="#c3aed6"
                stroke-width="8"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${strokeDashoffset}"
                stroke-linecap="round"
                transform="rotate(-90 50 50)"
            />
            <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" font-size="16" fill="#7957a8">${percentage}%</text>
        </svg>
    `;

    return svg;
};

// Utility function to normalize values for the donut chart
const normalizeValue = (value) => {
    if (value === "very_low") return 10;
    if (value === "low") return 30;
    if (value === "moderate") return 50;
    if (value === "high") return 75;
    if (value === "very_high") return 90;
    return 50; // Default
};