import { config } from '../config/env.js';

// Simple in-memory metrics store
class MetricsStore {
    constructor() {
        this.requests = new Map(); // path -> count
        this.statusCodes = new Map(); // statusCode -> count
        this.durations = []; // array of durations
        this.errors = 0;
    }

    recordRequest(path, statusCode, duration) {
        // Count requests by path
        this.requests.set(path, (this.requests.get(path) || 0) + 1);

        // Count by status code
        this.statusCodes.set(statusCode, (this.statusCodes.get(statusCode) || 0) + 1);

        // Record duration
        this.durations.push(duration);

        // Keep only last 1000 durations to prevent memory issues
        if (this.durations.length > 1000) {
            this.durations.shift();
        }

        // Count errors
        if (statusCode >= 500) {
            this.errors++;
        }
    }

    getMetrics() {
        return {
            requests: Object.fromEntries(this.requests),
            statusCodes: Object.fromEntries(this.statusCodes),
            errors: this.errors,
            avgDuration: this.durations.length
                ? this.durations.reduce((a, b) => a + b, 0) / this.durations.length
                : 0,
        };
    }

    // Generate Prometheus-compatible output
    toPrometheus() {
        let output = '';

        // Request count by path
        output += '# HELP http_requests_total Total HTTP requests\n';
        output += '# TYPE http_requests_total counter\n';
        for (const [path, count] of this.requests) {
            output += `http_requests_total{path="${path}"} ${count}\n`;
        }

        // Status code counts
        output += '# HELP http_responses_total Total HTTP responses by status code\n';
        output += '# TYPE http_responses_total counter\n';
        for (const [code, count] of this.statusCodes) {
            output += `http_responses_total{status="${code}"} ${count}\n`;
        }

        // Error count
        output += '# HELP http_errors_total Total HTTP errors (5xx)\n';
        output += '# TYPE http_errors_total counter\n';
        output += `http_errors_total ${this.errors}\n`;

        // Average duration
        const avgDuration = this.durations.length
            ? this.durations.reduce((a, b) => a + b, 0) / this.durations.length
            : 0;
        output += '# HELP http_request_duration_ms Average request duration in milliseconds\n';
        output += '# TYPE http_request_duration_ms gauge\n';
        output += `http_request_duration_ms ${avgDuration.toFixed(2)}\n`;

        return output;
    }
}

const metricsStore = new MetricsStore();

// Middleware to collect metrics
export const metricsMiddleware = (req, res, next) => {
    if (!config.METRICS_ENABLED) {
        return next();
    }

    const startTime = Date.now();

    // Capture response finish event
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        metricsStore.recordRequest(req.path, res.statusCode, duration);
    });

    next();
};

// Endpoint to expose metrics
export const metricsHandler = (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(metricsStore.toPrometheus());
};

export { metricsStore };
