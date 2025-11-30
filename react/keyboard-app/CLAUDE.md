# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - TypeScript compilation and Vite production build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Tech Stack

- React 19 with TypeScript
- Vite (using rolldown-vite) for bundling
- ESLint for linting

## Project Structure

Standard Vite React template structure:
- `src/main.tsx` - Application entry point with React 19 StrictMode
- `src/App.tsx` - Root component
- `vite.config.ts` - Vite configuration with React plugin
