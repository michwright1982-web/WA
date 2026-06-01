import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory store for the active automation config.
// On Vercel, this persists as long as the Lambda instance is warm.
// Multiple API routes in the same deployment share this global.
declare global {
  var __whatsflow_automation_config: {
    workflow: any | null;
    workflows?: any[];
    templates: any[];
    account: any | null;
    accounts?: any[];
    contacts: any[];
  } | undefined;
}

if (!global.__whatsflow_automation_config) {
  global.__whatsflow_automation_config = {
    workflow: null,
    workflows: [],
    templates: [],
    account: null,
    accounts: [],
    contacts: []
  };
}

// POST: Frontend pushes the active workflow + account + templates to the server
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Always update all fields — including null/empty values so deletions are reflected immediately
    global.__whatsflow_automation_config!.workflow = body.workflow ?? null;
    if (body.workflows !== undefined) {
      global.__whatsflow_automation_config!.workflows = body.workflows;
    }
    if (body.templates !== undefined) {
      global.__whatsflow_automation_config!.templates = body.templates;
    }
    if (body.account !== undefined) {
      global.__whatsflow_automation_config!.account = body.account;
    }
    if (body.accounts !== undefined) {
      global.__whatsflow_automation_config!.accounts = body.accounts;
    }
    if (body.contacts !== undefined) {
      global.__whatsflow_automation_config!.contacts = body.contacts;
    }

    console.log('[AutomationConfig] Updated server-side config:', {
      workflowName: global.__whatsflow_automation_config!.workflow?.name,
      workflowStatus: global.__whatsflow_automation_config!.workflow?.status,
      nodesCount: global.__whatsflow_automation_config!.workflow?.nodes?.length,
      templatesCount: global.__whatsflow_automation_config!.templates?.length,
      accountName: global.__whatsflow_automation_config!.account?.name,
      contactsCount: global.__whatsflow_automation_config!.contacts?.length,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[AutomationConfig] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// GET: Retrieve the current automation config (for debugging)
export async function GET() {
  return NextResponse.json({
    hasWorkflow: !!global.__whatsflow_automation_config?.workflow,
    workflowName: global.__whatsflow_automation_config?.workflow?.name || null,
    workflowStatus: global.__whatsflow_automation_config?.workflow?.status || null,
    nodesCount: global.__whatsflow_automation_config?.workflow?.nodes?.length || 0,
    templatesCount: global.__whatsflow_automation_config?.templates?.length || 0,
    hasAccount: !!global.__whatsflow_automation_config?.account,
    contactsCount: global.__whatsflow_automation_config?.contacts?.length || 0,
  }, { status: 200 });
}
