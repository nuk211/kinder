'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, Send, Loader2 } from 'lucide-react';

const SendSMS: React.FC = () => {
  const [to, setTo] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const router = useRouter();

  const sendSMS = async () => {
    // Basic validation
    if (!to || !message) {
      setResponse({
        type: 'error',
        message: 'Please fill in all fields',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message }),
      });

      const data = await res.json();
      if (data.success) {
        setResponse({
          type: 'success',
          message: 'SMS sent successfully!',
        });

        // Wait for a brief moment before redirecting
        setTimeout(() => {
          router.push('/'); // Redirect to the root
        }, 2000);
      } else {
        setResponse({
          type: 'error',
          message: data.error || 'Failed to send SMS',
        });
      }
    } catch (error) {
      setResponse({
        type: 'error',
        message: 'Failed to send SMS. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Send SMS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="tel"
            placeholder="Recipient Number (e.g., +1234567890)"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Textarea
            placeholder="Type your message here"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            className="min-h-[100px]"
          />
        </div>
        {response && (
          <Alert variant={response.type === 'success' ? 'default' : 'destructive'}>
            <AlertDescription>{response.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={sendSMS} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send SMS
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SendSMS;
