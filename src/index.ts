#!/usr/bin/env node

import { Command } from 'commander';
import { mockCommand } from './commands/mock';
import { generateCommand } from './commands/generate';

const program = new Command();

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
  .action(mockCommand);

program
  .command('generate')
  .description('Generate TypeScript SDK from OpenAPI specification')
  .argument('<filepath>', 'Path to OpenAPI specification file (.yaml or .json)')
  .option('-o, --output <output>', 'Output file path', './sdk.ts')
  .option('--base-url <url>', 'Base URL for the API', 'http://localhost:4000')
  .action(generateCommand);


  program.parse();
