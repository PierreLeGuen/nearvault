export class RateLimiter {
    private tokens: number;
    private lastRefill: number;
    private readonly rate: number;
    private readonly maxTokens: number;
    private queue: Array<() => void> = [];
    private processing = false;

    constructor(rate: number) {
        this.tokens = rate;
        this.lastRefill = Date.now();
        this.rate = rate;
        this.maxTokens = rate;
    }

    async acquire(): Promise<void> {
        // Add request to queue
        return new Promise<void>((resolve) => {
            this.queue.push(resolve);
            if (!this.processing) {
                void this.processQueue();
            }
        });
    }

    private async processQueue(): Promise<void> {
        if (this.processing) return;
        this.processing = true;

        while (this.queue.length > 0) {
            await this.refill();

            if (this.tokens <= 0) {
                const waitTime = Math.ceil(1000 / this.rate);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            this.tokens--;
            const next = this.queue.shift();
            if (next) next();
        }

        this.processing = false;
    }

    private async refill(): Promise<void> {
        const now = Date.now();
        const timePassed = now - this.lastRefill;
        const newTokens = (timePassed / 1000) * this.rate;

        this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
        this.lastRefill = now;
    }
} 