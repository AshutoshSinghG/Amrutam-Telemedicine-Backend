import { logger } from '../config/logger.js';

// Simple in-memory job queue
class JobQueue {
    constructor() {
        this.jobs = [];
        this.processing = false;
    }

    addJob(jobFn, retries = 3) {
        this.jobs.push({ jobFn, retries, attempts: 0 });
        if (!this.processing) {
            this.processJobs();
        }
    }

    async processJobs() {
        if (this.jobs.length === 0) {
            this.processing = false;
            return;
        }

        this.processing = true;
        const job = this.jobs.shift();

        try {
            await job.jobFn();
            logger.info('Job completed successfully');
        } catch (error) {
            job.attempts++;
            logger.error({ error, attempts: job.attempts }, 'Job failed');

            if (job.attempts < job.retries) {
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, job.attempts), 30000);
                logger.info({ delay }, 'Retrying job after delay');

                setTimeout(() => {
                    this.jobs.push(job);
                }, delay);
            } else {
                logger.error('Job failed after max retries');
            }
        }

        // Process next job
        setImmediate(() => this.processJobs());
    }
}

export const jobQueue = new JobQueue();
