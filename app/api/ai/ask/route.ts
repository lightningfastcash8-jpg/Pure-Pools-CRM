import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  console.log('AI Ask API GET called')
  return NextResponse.json({
    status: 'ok',
    message: 'AI Ask API is running',
    env: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0
    }
  })
}

async function executeToolCall(toolName: string, args: any, supabase: any) {
  switch (toolName) {
    case 'query_customers':
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, email, phone, address, city, state, zip, tags, created_at')
        .limit(args.limit || 50)
      return customers

    case 'query_work_orders':
      let workOrderQuery = supabase
        .from('work_orders')
        .select('id, customer_id, service_type, status, equipment_type, notes, workflow_stage, created_at')
        .order('created_at', { ascending: false })
        .limit(args.limit || 50)

      if (args.status) workOrderQuery = workOrderQuery.eq('status', args.status)
      if (args.service_type) workOrderQuery = workOrderQuery.eq('service_type', args.service_type)

      const { data: workOrders } = await workOrderQuery
      return workOrders

    case 'query_warranty_claims':
      let warrantyQuery = supabase
        .from('warranty_claims')
        .select('id, customer_id, work_order_id, equipment_type, stage, priority, issue_description, created_at')
        .order('created_at', { ascending: false })
        .limit(args.limit || 50)

      if (args.stage) warrantyQuery = warrantyQuery.eq('stage', args.stage)

      const { data: warranties } = await warrantyQuery
      return warranties

    case 'query_assets':
      let assetsQuery = supabase
        .from('assets')
        .select('id, customer_id, equipment_type, brand, model, serial_number, warranty_expires, install_date')
        .limit(args.limit || 50)

      if (args.equipment_type) assetsQuery = assetsQuery.eq('equipment_type', args.equipment_type)

      const { data: assets } = await assetsQuery
      return assets

    case 'search_customers_by_tags':
      const { data: taggedCustomers } = await supabase
        .from('customers')
        .select('id, name, email, phone, tags')
        .contains('tags', args.tags || [])
        .limit(args.limit || 100)
      return taggedCustomers

    case 'get_customer_details':
      const { data: customer } = await supabase
        .from('customers')
        .select(`
          *,
          assets:assets(*),
          work_orders:work_orders(*),
          warranty_claims:warranty_claims(*),
          program_enrollments:program_enrollments(*)
        `)
        .eq('id', args.customer_id)
        .single()
      return customer

    case 'generate_csv':
      return { csvData: args.data, message: 'CSV data prepared for download' }

    default:
      return { error: 'Unknown tool' }
  }
}

export async function POST(request: Request) {
  console.log('=== AI API Route Called ===')

  try {
    const supabase = createClient()
    console.log('Supabase client created')

    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { question, knowledgeContext, conversationHistory } = body

    console.log('=== AI Request Started ===')
    console.log('Question:', question?.substring(0, 100))
    console.log('Has knowledge context:', !!knowledgeContext)
    console.log('Conversation history length:', conversationHistory?.length || 0)

    const apiKey = process.env.OPENAI_API_KEY
    console.log('Environment check:', {
      hasKey: !!apiKey,
      keyPrefix: apiKey?.substring(0, 10),
      keyLength: apiKey?.length,
      startsWithSk: apiKey?.startsWith('sk-'),
    })

    if (!apiKey) {
      console.error('OPENAI_API_KEY not found in environment')
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Add OPENAI_API_KEY to your .env file to use AI features.' },
        { status: 400 }
      )
    }

    if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
      console.error('Invalid OpenAI API key format. Key length:', apiKey.length)
      return NextResponse.json(
        { error: 'Invalid OpenAI API key format. Please check your OPENAI_API_KEY in .env file.' },
        { status: 400 }
      )
    }

    console.log('OpenAI API key validated successfully')

    const tools = [
      {
        type: 'function',
        function: {
          name: 'query_customers',
          description: 'Query the customer database to find customers, their contact info, and tags',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Maximum number of results' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'query_work_orders',
          description: 'Query work orders by status, service type, or date',
          parameters: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
              service_type: { type: 'string' },
              limit: { type: 'number' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'query_warranty_claims',
          description: 'Query warranty claims by stage or priority',
          parameters: {
            type: 'object',
            properties: {
              stage: { type: 'string', enum: ['intake', 'diagnosis', 'parts_ordered', 'repair', 'follow_up', 'closed'] },
              limit: { type: 'number' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'query_assets',
          description: 'Query customer equipment and assets by type or warranty status',
          parameters: {
            type: 'object',
            properties: {
              equipment_type: { type: 'string', enum: ['heater', 'pump', 'filter', 'chlorinator', 'automation'] },
              limit: { type: 'number' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'search_customers_by_tags',
          description: 'Find customers by specific tags for targeted marketing',
          parameters: {
            type: 'object',
            properties: {
              tags: { type: 'array', items: { type: 'string' } },
              limit: { type: 'number' }
            },
            required: ['tags']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_customer_details',
          description: 'Get full details for a specific customer including all related records',
          parameters: {
            type: 'object',
            properties: {
              customer_id: { type: 'string' }
            },
            required: ['customer_id']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'generate_csv',
          description: 'Generate CSV data from results for download',
          parameters: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object'
                },
                description: 'Array of objects to convert to CSV'
              }
            },
            required: ['data']
          }
        }
      }
    ]

    const hasKnowledge = knowledgeContext && knowledgeContext.trim().length > 0

    const systemPrompt = `You are an AI assistant for Pure Pools CRM with direct database access and report generation capabilities.

CAPABILITIES:
- Access complete customer database with contact info
- Query work orders, warranties, and service history
- Search equipment/assets by type and warranty status
- Find customers by tags for marketing campaigns
- Generate downloadable CSV reports
- Answer questions from uploaded manuals and knowledge documents (when available)

KNOWLEDGE BASE:
${hasKnowledge ? knowledgeContext : 'No knowledge documents have been uploaded yet.'}

CRITICAL INSTRUCTIONS:
- When asked for part numbers, specs, or technical details: ONLY answer if that information is in the KNOWLEDGE BASE above. If no knowledge documents are loaded or the specific information is not found there, say clearly: "I don't have that information yet. You can upload manuals or technical documents in the Settings page under Knowledge Base to teach me about specific parts and equipment."
- NEVER make up or guess part numbers, model numbers, or technical specifications
- When asked for customer lists or reports, use the database tools to query real data
- For marketing requests, identify customers by tags or equipment type
- Always use the database tools to access real customer/work order data rather than making up examples
- If you cannot help with something due to missing knowledge or data, say so honestly and explain what the user can do to fix it

Respond in a professional, helpful tone. Use tools to access real data. Be honest about what you do and don't know.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: question }
    ]

    console.log('Calling OpenAI API...')
    let aiResponse
    try {
      aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          tools,
          tool_choice: 'auto',
          temperature: 0.3,
          max_tokens: 2000
        })
      })
    } catch (fetchError: any) {
      console.error('OpenAI fetch error:', fetchError)
      throw new Error(`Failed to connect to OpenAI API: ${fetchError.message}`)
    }

    console.log('OpenAI API response status:', aiResponse.status)

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('OpenAI API error response:', errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        throw new Error(`OpenAI API error (${aiResponse.status}): ${errorText.substring(0, 200)}`)
      }
      throw new Error(errorData.error?.message || `OpenAI API error: ${aiResponse.status}`)
    }

    let aiData = await aiResponse.json()
    let assistantMessage = aiData.choices?.[0]?.message

    const toolResults = []
    if (assistantMessage.tool_calls) {
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name
        const toolArgs = JSON.parse(toolCall.function.arguments)

        const result = await executeToolCall(toolName, toolArgs, supabase)
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolName,
          content: JSON.stringify(result)
        })
      }

      messages.push(assistantMessage)
      messages.push(...toolResults)

      aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.3,
          max_tokens: 2000
        })
      })

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text()
        console.error('OpenAI API error (second call):', errorText)
        throw new Error('Failed to get final response from OpenAI')
      }

      aiData = await aiResponse.json()
      assistantMessage = aiData.choices?.[0]?.message
    }

    const answer = assistantMessage.content || 'I could not generate a response.'

    return NextResponse.json({
      answer,
      toolResults: toolResults.length > 0 ? toolResults : null
    })

  } catch (error: any) {
    console.error('AI query error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process AI request' },
      { status: 500 }
    )
  }
}
