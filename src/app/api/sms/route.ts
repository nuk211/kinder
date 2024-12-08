// src/app/api/sms/route.ts
import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

export async function POST(request: Request) {
    if (!accountSid || !authToken || !twilioNumber) {
        return NextResponse.json(
            { success: false, error: 'Twilio credentials not configured' },
            { status: 500 }
        );
    }

    try {
        const { to, message } = await request.json();

        // Basic validation
        if (!to || !message) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const client = twilio(accountSid, authToken);
        await client.messages.create({
            body: message,
            to: to,
            from: twilioNumber,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('SMS sending error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message || 'Failed to send SMS'
            },
            { status: 500 }
        );
    }
}