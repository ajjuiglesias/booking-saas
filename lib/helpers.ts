import bcrypt from 'bcryptjs'

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
}

/**
 * Generate a unique slug from a business name
 * Checks database for uniqueness and adds numeric suffix if needed
 */
export async function generateUniqueSlug(name: string, checkExists: (slug: string) => Promise<boolean>): Promise<string> {
    // Convert to lowercase, replace spaces with hyphens, remove special characters
    let baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')

    let slug = baseSlug
    let counter = 1

    // Check if slug exists and increment counter if needed
    while (await checkExists(slug)) {
        slug = `${baseSlug}-${counter}`
        counter++
    }

    return slug
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(num)
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return phone
}
