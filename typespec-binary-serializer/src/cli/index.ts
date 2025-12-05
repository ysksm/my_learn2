#!/usr/bin/env node

/**
 * TypeSpec Binary Serializer CLI
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Parser } from '../parser/index.js';
import { TypeScriptGenerator } from '../generators/typescript/index.js';
import { CppGenerator } from '../generators/cpp/index.js';
import { RustGenerator } from '../generators/rust/index.js';
import { SchemaIR } from '../ir/index.js';

interface GenerateOptions {
  input: string;
  output: string;
  languages: string[];
  verbose: boolean;
}

function printUsage(): void {
  console.log(`
TypeSpec Binary Serializer - Code Generator

Usage:
  tbs generate [options]
  tbs parse <input-file>     Parse and show IR
  tbs help                   Show this help

Commands:
  generate    Generate code from TypeSpec schema
  parse       Parse TypeSpec and output intermediate representation
  help        Show help information

Generate Options:
  -i, --input <file>     Input TypeSpec file (default: src/schema/commands.tsp)
  -o, --output <dir>     Output directory (default: output)
  -l, --lang <langs>     Languages to generate (comma-separated)
                         Available: typescript,cpp,rust (default: all)
  -v, --verbose          Verbose output

Examples:
  tbs generate
  tbs generate -i schema.tsp -o ./generated -l typescript,rust
  tbs parse schema.tsp
`);
}

function parseArgs(args: string[]): { command: string; options: GenerateOptions } {
  const command = args[0] || 'help';
  const options: GenerateOptions = {
    input: 'src/schema/commands.tsp',
    output: 'output',
    languages: ['typescript', 'cpp', 'rust'],
    verbose: false,
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-i':
      case '--input':
        options.input = args[++i];
        break;
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
      case '-l':
      case '--lang':
        options.languages = args[++i].split(',').map(l => l.trim().toLowerCase());
        break;
      case '-v':
      case '--verbose':
        options.verbose = true;
        break;
    }
  }

  // parseコマンドの場合、次の引数をinputとして扱う
  if (command === 'parse' && args[1] && !args[1].startsWith('-')) {
    options.input = args[1];
  }

  return { command, options };
}

function ensureDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadSchema(inputPath: string): string {
  const fullPath = path.resolve(inputPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Input file not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

function parseSchema(source: string, sourceFile: string): SchemaIR {
  const parser = new Parser();
  return parser.parse(source, sourceFile);
}

function generate(ir: SchemaIR, options: GenerateOptions): void {
  const outputBase = path.resolve(options.output);

  for (const lang of options.languages) {
    const langOutput = path.join(outputBase, lang);
    ensureDirectory(langOutput);

    let generator;
    const generatorOptions = { outputDir: langOutput };

    switch (lang) {
      case 'typescript':
      case 'ts':
        generator = new TypeScriptGenerator(ir, generatorOptions);
        break;
      case 'cpp':
      case 'c++':
        generator = new CppGenerator(ir, generatorOptions);
        break;
      case 'rust':
      case 'rs':
        generator = new RustGenerator(ir, generatorOptions);
        break;
      default:
        console.warn(`Unknown language: ${lang}, skipping...`);
        continue;
    }

    const files = generator.generate();

    for (const file of files) {
      const filePath = path.join(langOutput, file.filename);
      fs.writeFileSync(filePath, file.content, 'utf-8');

      if (options.verbose) {
        console.log(`  Generated: ${filePath}`);
      }
    }

    console.log(`✓ Generated ${lang} code (${files.length} files)`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const { command, options } = parseArgs(args);

  switch (command) {
    case 'generate':
    case 'gen':
    case 'g': {
      console.log('TypeSpec Binary Serializer');
      console.log('==========================');
      console.log(`Input:  ${options.input}`);
      console.log(`Output: ${options.output}`);
      console.log(`Languages: ${options.languages.join(', ')}`);
      console.log('');

      try {
        const source = loadSchema(options.input);
        console.log('Parsing schema...');

        const ir = parseSchema(source, options.input);
        console.log(`  Found ${ir.enums.length} enums`);
        console.log(`  Found ${ir.models.length} models`);

        const commands = ir.models.filter(m => m.commandId !== undefined);
        console.log(`  Found ${commands.length} commands`);
        console.log('');

        console.log('Generating code...');
        generate(ir, options);

        console.log('');
        console.log('Done!');
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
      break;
    }

    case 'parse':
    case 'p': {
      try {
        const source = loadSchema(options.input);
        const ir = parseSchema(source, options.input);
        console.log(JSON.stringify(ir, null, 2));
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
      break;
    }

    case 'help':
    case 'h':
    case '--help':
    case '-h':
    default:
      printUsage();
      break;
  }
}

main().catch(console.error);
