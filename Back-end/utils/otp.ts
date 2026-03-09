import crypto from 'crypto';

/**
 * Generates a Time-Based One-Time Password (TOTP).
 *
 * @param secret The secret string to base the OTP on (e.g., session.qr_secret)
 * @param window The time window in seconds (e.g., 30 for standard TOTP)
 * @param time The Unix timestamp in milliseconds to generate the OTP for (defaults to now)
 * @returns A 6-digit OTP string
 */
export function generateTOTP(secret: string, window: number = 30, time: number = Date.now()): string {
    // Calculate the number of time steps since Unix epoch
    const timeStep = Math.floor(time / 1000 / window);

    // Create a buffer for the time step (8 bytes, big-endian)
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigInt64BE(BigInt(timeStep), 0);

    // Use HMAC-SHA256 with the secret
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(timeBuffer);
    const hash = hmac.digest();

    // Dynamic truncation (RFC 4226)
    const offset = hash[hash.length - 1] & 0xf;
    const binary =
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);

    // Generate a 6-digit code
    const otp = binary % 1000000;

    // Pad with leading zeros if necessary
    return otp.toString().padStart(6, '0');
}

/**
 * Verifies a given TOTP against the secret with a tolerance window.
 *
 * @param input The user-provided OTP
 * @param secret The secret string
 * @param window The time window in seconds
 * @param windowTolerance Number of windows to allow before/after (e.g., 1 = ±30 seconds)
 * @returns true if valid, false otherwise
 */
export function verifyTOTP(input: string, secret: string, window: number = 30, windowTolerance: number = 1): boolean {
    const now = Date.now();
    const timeStepDuration = window * 1000;

    // Check current, previous, and next windows based on tolerance
    for (let i = -windowTolerance; i <= windowTolerance; i++) {
        const timeToVerify = now + (i * timeStepDuration);
        const generated = generateTOTP(secret, window, timeToVerify);

        // Constant-time comparison to prevent timing attacks
        if (input.length === generated.length && crypto.timingSafeEqual(Buffer.from(input), Buffer.from(generated))) {
            return true;
        }
    }

    return false;
}
