export class RateLimiter {
    private tokens: number;
    private lastRefill: number;
    private readonly rate: number;
    private readonly maxTokens: number;
    private processing = false;

    constructor(rate: number) {
        this.tokens = rate;
        this.lastRefill = Date.now();
        this.rate = rate;
        this.maxTokens = rate;
    }

    async acquire(): Promise<void> {
        while (true) {
            await this.refill();

            if (this.tokens > 0) {
                this.tokens--;
                return;
            }

            const waitTime = Math.ceil(1000 / this.rate);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    private async refill(): Promise<void> {
        const now = Date.now();
        const timePassed = now - this.lastRefill;
        const newTokens = (timePassed / 1000) * this.rate;

        this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
        this.lastRefill = now;
    }
} 