import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { LowCreditWarning } from '@/components/credits/LowCreditWarning';
import { MixedContentWarning } from '@/components/alerts/MixedContentWarning';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCredits } from '@/contexts/CreditContext';
import { toast } from 'sonner';
import { sanitizeInput } from '@/utils/formatters';
import { apiService } from '@/services/api';

export default function ReportGeneration() {
  const [sellerName, setSellerName] = useState('');
  const [department, setDepartment] = useState('');
  const [offeredItem, setOfferedItem] = useState('');
  const [days, setDays] = useState(60);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const { credits, deductCredit } = useCredits();

  const handleGenerate = async () => {
    const sanitizedSeller = sanitizeInput(sellerName);
    const sanitizedDept = sanitizeInput(department);
    const sanitizedItem = sanitizeInput(offeredItem);
    
    if (!sanitizedSeller || !sanitizedDept || !sanitizedItem) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (credits.remaining === 0) {
      toast.error('No credits remaining. Credits reset at midnight IST.');
      return;
    }

    setLoading(true);
    
    try {
      await deductCredit();
      
      toast.info('Generating report from backend...');
      
      const reportData = await apiService.generatePDF({
        sellerName: sanitizedSeller,
        department: sanitizedDept,
        offeredItem: sanitizedItem,
        days,
        limit
      });
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sanitizedSeller}_Report_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report generated and downloaded successfully!');
      
    } catch (err: any) {
      console.error('Generation error:', err);
      toast.error(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <MixedContentWarning />
        <LowCreditWarning />

        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Generate Tender Intelligence Report</h1>
            <p className="text-muted-foreground">
              Create a comprehensive PDF report for any government tender participant
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Details
              </CardTitle>
              <CardDescription>
                Each report costs 1 credit. You have {credits.remaining} credits remaining.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sellerName">Seller Name *</Label>
                <Input
                  id="sellerName"
                  placeholder="e.g., RAJHANS IMPEX"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  placeholder="e.g., Department Of Defence"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offeredItem">Offered Item *</Label>
                <Input
                  id="offeredItem"
                  placeholder="e.g., Item Categories : FUSE 6 23X32 MM..."
                  value={offeredItem}
                  onChange={(e) => setOfferedItem(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="days">Days</Label>
                  <Input
                    id="days"
                    type="number"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limit">Limit</Label>
                  <Input
                    id="limit"
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    min="1"
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-semibold mb-2">Report Includes:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ Company profile and performance metrics</li>
                  <li>✓ Win/Loss ratio and bid history</li>
                  <li>✓ Price band analysis</li>
                  <li>✓ Department and category distribution</li>
                  <li>✓ Geographic performance analysis</li>
                  <li>✓ Missed-but-winnable opportunities</li>
                  <li>✓ AI-powered strategic insights</li>
                  <li>✓ Monthly trend analysis</li>
                </ul>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || credits.remaining === 0 || !sellerName || !department || !offeredItem}
                className="w-full gap-2"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Generate Report (1 Credit)
                  </>
                )}
              </Button>

              {credits.remaining === 0 && (
                <p className="text-center text-sm text-destructive">
                  No credits remaining. Credits reset at midnight IST.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Report generation connects to the backend API at {import.meta.env.VITE_API_BASE_URL || 'http://161.118.181.8:80/api'}. 
                Reports are returned as JSON data containing missed-but-winnable opportunities and strategic insights.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
