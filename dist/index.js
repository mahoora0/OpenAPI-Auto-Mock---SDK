#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const mock_1 = require("./commands/mock");
const generate_1 = require("./commands/generate");
const program = new commander_1.Command();
program
    .name('oam')
    .description('OpenAPI Auto Mock & SDK Generator')
    .version('0.1.0');
program
    .command('mock')
    .description('Start mock server from OpenAPI specification')
    .argument('<filepath>', 'Path to OpenAPI specification file (.yaml or .json)')
    .option('-p, --port <port>', 'Port to run the mock server', '4000')
    .option('--seed <seed>', 'Seed for deterministic mock data generation', '12345')
    .action(mock_1.mockCommand);
program
    .command('generate')
    .description('Generate TypeScript SDK from OpenAPI specification')
    .argument('<filepath>', 'Path to OpenAPI specification file (.yaml or .json)')
    .option('-o, --output <output>', 'Output file path', './sdk.ts')
    .option('--base-url <url>', 'Base URL for the API', 'http://localhost:4000')
    .action(generate_1.generateCommand);
program.parse();
//# sourceMappingURL=index.js.map