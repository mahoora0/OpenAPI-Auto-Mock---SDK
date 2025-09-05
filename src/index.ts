#!/usr/bin/env node

import { Command } from 'commander';
import { mockCommand } from './commands/mock';

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


  program.parse();
