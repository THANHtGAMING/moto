/**
 * Generate URL-safe slug from name
 * @param {string} name - The name to convert to slug
 * @returns {string} - URL-safe slug
 */
function generateSlug(name) {
    if (!name || typeof name !== 'string') {
        return '';
    }

    // Convert to lowercase, remove accents, replace spaces with hyphens
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate unique slug by appending numeric suffix if slug exists
 * @param {mongoose.Model} Model - Mongoose model to check uniqueness
 * @param {string} name - The name to convert to slug
 * @param {string} excludeId - Optional ID to exclude from uniqueness check (for updates)
 * @returns {Promise<string>} - Unique slug
 */
async function generateUniqueSlug(Model, name, excludeId = null) {
    let baseSlug = generateSlug(name);
    if (!baseSlug) {
        baseSlug = 'slug-' + Date.now();
    }

    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const query = { slug };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        const existing = await Model.findOne(query);
        if (!existing) {
            return slug;
        }

        slug = `${baseSlug}-${counter}`;
        counter++;
    }
}

module.exports = { generateSlug, generateUniqueSlug };

