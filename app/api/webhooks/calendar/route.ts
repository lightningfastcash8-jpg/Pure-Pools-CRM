import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { customerId, scheduledDate, workOrderId } = await request.json()

    if (!customerId || !scheduledDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: warrantyClaim } = await supabase
      .from('warranty_claims')
      .select('id')
      .eq('customer_id', customerId)
      .in('stage', ['queued'])
      .maybeSingle()

    if (warrantyClaim) {
      await supabase
        .from('warranty_claims')
        .update({
          stage: 'scheduled',
          scheduled_date: scheduledDate
        })
        .eq('id', warrantyClaim.id)

      return NextResponse.json({
        message: 'Warranty claim moved to scheduled',
        claimId: warrantyClaim.id
      })
    }

    return NextResponse.json({
      message: 'No matching warranty claim found'
    })

  } catch (error: any) {
    console.error('Calendar webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    )
  }
}
