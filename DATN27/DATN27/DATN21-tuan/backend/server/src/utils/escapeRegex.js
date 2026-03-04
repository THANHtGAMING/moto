/**
 * Escape special regex characters to prevent ReDoS attacks
 * @param {string} str - String to escape
 * @returns {string} - Escaped string safe for regex use
 */
function escapeRegex(str) {
    if (!str || typeof str !== 'string') return '';
    // Limit length to prevent DoS
    const limited = str.substring(0, 100);
    return limited.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegex;

