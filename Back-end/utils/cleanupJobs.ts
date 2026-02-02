import cron from 'node-cron';
import { prisma } from '../prisma/client';
import logger from './logger';

/**
 * Cleanup Job for Expired QR Tokens
 * Runs every hour to delete expired and used tokens
 */
export const startCleanupJobs = () => {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        try {
            const result = await prisma.qRToken.deleteMany({
                where: {
                    OR: [
                        {
                            // Delete expired tokens
                            expires_at: {
                                lt: new Date()
                            }
                        },
                        {
                            // Delete used tokens older than 24 hours
                            AND: [
                                {
                                    used_at: {
                                        not: null
                                    }
                                },
                                {
                                    used_at: {
                                        lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
                                    }
                                }
                            ]
                        }
                    ]
                }
            });

            logger.info(`Cleanup job: Deleted ${result.count} expired/used QR tokens`);
        } catch (error) {
            logger.error('Cleanup job failed', { error });
        }
    });

    logger.info('Cleanup jobs started');
};
