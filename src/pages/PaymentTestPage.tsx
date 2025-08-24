import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const PaymentTestPage = () => {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const testDodoPayments = async () => {
    setLoading(true);
    try {
      console.log('Testing Dodo Payments API...');
      
      const { data, error } = await supabase.functions.invoke('test-dodo-payments');
      
      if (error) {
        console.error('Test error:', error);
        toast({
          title: "Test Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('Test result:', data);
      setTestResult(data);
      
      toast({
        title: "Test Completed",
        description: "Check the results below",
      });
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "Test Failed",
        description: "An error occurred during testing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testPaymentCreation = async () => {
    setLoading(true);
    try {
      console.log('Testing payment creation...');
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          credits: 5,
          amount: 500, // $5.00 in cents
          test_mode: true
        }
      });
      
      if (error) {
        console.error('Payment creation error:', error);
        toast({
          title: "Payment Creation Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('Payment creation result:', data);
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Payment Link Created",
          description: "Opening payment link in new tab",
        });
      } else {
        toast({
          title: "Payment Created",
          description: "Payment response received successfully",
        });
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      toast({
        title: "Payment Creation Failed",
        description: "An error occurred during payment creation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dodo Payments Integration Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Button 
                onClick={testDodoPayments}
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test API Connection
              </Button>

              <Button 
                onClick={testPaymentCreation}
                disabled={loading}
                variant="secondary"
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Payment Creation ($5 - 5 Credits)
              </Button>
            </div>

            {testResult && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentTestPage;