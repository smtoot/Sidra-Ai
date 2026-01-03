/**
 * Performance Test Script for Sidra API
 * Tests critical endpoints under load
 * 
 * Usage: node scripts/performance-test.js
 */

const http = require('http');
const https = require('https');

const API_URL = process.env.API_URL || 'http://localhost:5050';
const parsedUrl = new URL(API_URL);
const httpModule = parsedUrl.protocol === 'https:' ? https : http;

// Test configuration
const CONFIG = {
    concurrency: 10,       // Concurrent requests
    duration: 10,          // Test duration in seconds
    endpoints: [
        { method: 'GET', path: '/health', name: 'Health Check', auth: false },
        { method: 'GET', path: '/marketplace/teachers', name: 'Teacher Search', auth: false },
        { method: 'GET', path: '/marketplace/curriculum', name: 'Curriculum List', auth: false },
    ]
};

// Results storage
const results = {};

function makeRequest(endpoint, authToken) {
    return new Promise((resolve) => {
        const startTime = Date.now();

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: endpoint.path,
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json',
                ...(endpoint.auth && authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
            }
        };

        const req = httpModule.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const duration = Date.now() - startTime;
                resolve({
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    status: res.statusCode,
                    duration
                });
            });
        });

        req.on('error', () => {
            resolve({
                success: false,
                status: 0,
                duration: Date.now() - startTime
            });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            resolve({
                success: false,
                status: 0,
                duration: 5000
            });
        });

        req.end();
    });
}

async function runLoadTest(endpoint, durationSec, concurrency) {
    const name = endpoint.name;
    results[name] = {
        requests: 0,
        successes: 0,
        failures: 0,
        latencies: [],
        statusCodes: {}
    };

    const endTime = Date.now() + (durationSec * 1000);
    const workers = [];

    for (let i = 0; i < concurrency; i++) {
        workers.push((async () => {
            while (Date.now() < endTime) {
                const result = await makeRequest(endpoint);
                results[name].requests++;
                results[name].latencies.push(result.duration);

                if (result.success) {
                    results[name].successes++;
                } else {
                    results[name].failures++;
                }

                results[name].statusCodes[result.status] =
                    (results[name].statusCodes[result.status] || 0) + 1;
            }
        })());
    }

    await Promise.all(workers);
}

function calculateStats(latencies) {
    if (latencies.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };

    const sorted = [...latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: Math.round(sum / sorted.length),
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
    };
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                 SIDRA API PERFORMANCE TEST');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Target: ${API_URL}`);
    console.log(`Concurrency: ${CONFIG.concurrency} workers`);
    console.log(`Duration: ${CONFIG.duration} seconds per endpoint`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const endpoint of CONFIG.endpoints) {
        console.log(`\n🔥 Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
        console.log('─'.repeat(60));

        await runLoadTest(endpoint, CONFIG.duration, CONFIG.concurrency);

        const r = results[endpoint.name];
        const stats = calculateStats(r.latencies);
        const rps = Math.round(r.requests / CONFIG.duration);
        const successRate = r.requests > 0 ? ((r.successes / r.requests) * 100).toFixed(1) : 0;

        console.log(`  Requests:     ${r.requests.toLocaleString()}`);
        console.log(`  Throughput:   ${rps} req/sec`);
        console.log(`  Success Rate: ${successRate}%`);
        console.log(`  Latency (ms): min=${stats.min}, avg=${stats.avg}, p95=${stats.p95}, max=${stats.max}`);

        if (Object.keys(r.statusCodes).length > 0) {
            console.log(`  Status Codes: ${JSON.stringify(r.statusCodes)}`);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                        SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');

    let totalRequests = 0;
    let totalSuccesses = 0;

    for (const name of Object.keys(results)) {
        const r = results[name];
        const stats = calculateStats(r.latencies);
        const rps = Math.round(r.requests / CONFIG.duration);
        const successRate = r.requests > 0 ? ((r.successes / r.requests) * 100).toFixed(1) : 0;

        totalRequests += r.requests;
        totalSuccesses += r.successes;

        const status = parseFloat(successRate) >= 99 && stats.p95 < 500 ? '✅' :
            parseFloat(successRate) >= 95 && stats.p95 < 1000 ? '⚠️' : '❌';

        console.log(`${status} ${name.padEnd(25)} | ${rps.toString().padStart(5)} req/s | p95: ${stats.p95.toString().padStart(4)}ms | ${successRate}%`);
    }

    console.log('─'.repeat(65));
    console.log(`Total Requests: ${totalRequests.toLocaleString()}`);
    console.log(`Overall Success Rate: ${((totalSuccesses / totalRequests) * 100).toFixed(2)}%`);
    console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
