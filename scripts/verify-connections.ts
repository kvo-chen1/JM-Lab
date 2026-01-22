import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORT_FILE = path.join(process.cwd(), 'INTEGRATION_TEST_REPORT.md');

let reportContent = `# System Integration Verification Report
Generated at: ${new Date().toISOString()}

## 1. Environment & Configuration
`;

function log(message: string, level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN' = 'INFO') {
    const icon = level === 'SUCCESS' ? '✅' : level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${level}] ${message}`);
    reportContent += `- ${icon} **${level}**: ${message}\n`;
}

async function verifySupabase() {
    reportContent += `\n## 2. Supabase Connection\n`;
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
        log('Supabase credentials missing in .env or .env.local', 'ERROR');
        return false;
    }

    try {
        const supabase = createClient(url, key);
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        
        if (error) {
            log(`Supabase Connection Failed: ${error.message}`, 'ERROR');
            return false;
        }
        
        log(`Supabase Connected. Users count accessible.`, 'SUCCESS');
        return true;
    } catch (e: any) {
        log(`Supabase Exception: ${e.message}`, 'ERROR');
        return false;
    }
}

async function verifyAIProxy() {
    reportContent += `\n## 3. AI Service Integration\n`;
    // Check if API keys are present
    const openAiKey = process.env.CHATGPT_API_KEY;
    const kimiKey = process.env.KIMI_API_KEY;
    
    // Security Check: Warn if keys are prefixed with VITE_
    const viteOpenAiKey = process.env.VITE_CHATGPT_API_KEY;
    const viteKimiKey = process.env.VITE_KIMI_API_KEY;
    const viteQwenKey = process.env.VITE_QWEN_API_KEY;

    if (viteOpenAiKey || viteKimiKey || viteQwenKey) {
        log('Security Warning: API Keys found with VITE_ prefix. This exposes keys to the client browser!', 'WARN');
        reportContent += '> ⚠️ **Security Risk**: Please rename `VITE_KIMI_API_KEY` to `KIMI_API_KEY` (and others) in Vercel to prevent leaking credentials to the public.\n\n';
    }
    
    if (openAiKey || viteOpenAiKey) log('OpenAI API Key configured', 'SUCCESS');
    else log('OpenAI API Key missing', 'WARN');

    if (kimiKey || viteKimiKey) log('Kimi API Key configured', 'SUCCESS');
    else log('Kimi API Key missing', 'WARN');

    // Simulate service check (without actual HTTP call if server is down)
    // In a real scenario, we would fetch('http://localhost:3000/api/health')
    log('AI Service Logic Check: llmService.ts exists', 'INFO');
    if (fs.existsSync(path.join(process.cwd(), 'src/services/llmService.ts'))) {
        log('LLM Service module found', 'SUCCESS');
    } else {
        log('LLM Service module missing', 'ERROR');
    }
}

async function verifyDeploymentConfig() {
    reportContent += `\n## 4. Deployment Configuration\n`;
    
    // Check Vercel
    if (fs.existsSync(path.join(process.cwd(), 'vercel.json'))) {
        log('vercel.json found', 'SUCCESS');
    } else {
        log('vercel.json missing', 'ERROR');
    }

    // Check GitHub Workflows
    const workflowPath = path.join(process.cwd(), '.github/workflows');
    if (fs.existsSync(workflowPath)) {
        const files = fs.readdirSync(workflowPath);
        if (files.includes('deploy.yml') || files.includes('ci.yml')) {
            log(`GitHub Workflows found: ${files.join(', ')}`, 'SUCCESS');
        } else {
            log('No deploy.yml or ci.yml found in .github/workflows', 'WARN');
        }
    } else {
        log('.github/workflows directory missing', 'ERROR');
    }
}

async function verifyDatabaseOptimizations() {
    reportContent += `\n## 5. Database Optimizations\n`;
    const migrationFile = path.join(process.cwd(), 'supabase/migrations/20240122_user_sync.sql');
    if (fs.existsSync(migrationFile)) {
        log('User Sync Trigger migration file created', 'SUCCESS');
    } else {
        log('User Sync Trigger migration file missing', 'ERROR');
    }
}

async function main() {
    log('Starting Integration Verification...', 'INFO');
    
    await verifySupabase();
    await verifyAIProxy();
    await verifyDeploymentConfig();
    await verifyDatabaseOptimizations();
    
    fs.writeFileSync(REPORT_FILE, reportContent);
    console.log(`\nReport saved to ${REPORT_FILE}`);
}

main().catch(console.error);
