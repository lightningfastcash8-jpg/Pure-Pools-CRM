# Quick Start Guide

## Overview

This CRM is built around **automated email parsing**. Warranty requests arrive via Gmail, OpenAI extracts the data, and everything populates automatically. That's the core workflow.

## Required Setup (2 things)

### 1. OpenAI API Key (REQUIRED)
**Why:** This parses incoming warranty emails automatically
**Cost:** ~$2-5/month for typical usage

**Get your key:**
1. Go to https://platform.openai.com/api-keys
2. Create a new key (starts with `sk-`)
3. Add to `.env`: `OPENAI_API_KEY=sk-your-key-here`

### 2. Google OAuth (REQUIRED)
**Why:** This syncs Gmail to pull in warranty request emails
**Cost:** Free

**Setup instructions:**
1. Run `npm run dev` and log into the app
2. Go to Settings page
3. Click "Connect Google Account"
4. Follow the instructions shown there (walks you through Google Cloud Console)

## That's It!

Once connected:
- Warranty emails arrive → AI parses them → Database populates
- You can also manually add customers, track work orders, schedule appointments
- AI Agent lets you ask questions about your data

## Start Here

1. Add your keys to `.env`
2. Run `npm run dev`
3. Log in
4. Connect Google in Settings
5. Warranty emails will start syncing automatically

The whole point of this system is automation - emails become database records without manual data entry.
