'use client';

// Stripe payment will be shown here
const BillingPage = () => {
    return (
        <div className="flex-1 flex flex-col h-full w-full bg-background text-foreground p-6">
            <div className="bg-card rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">Billing & Subscription</h2>
                <p className="text-muted-foreground mb-6">
                    Manage your subscription, billing information, and usage.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-medium mb-2">Current Plan</h3>
                            <p className="text-sm text-muted-foreground mb-2">Free Tier</p>
                            <p className="text-xs text-muted-foreground">Upgrade to unlock more features</p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <h3 className="font-medium mb-2">Usage This Month</h3>
                            <p className="text-sm text-muted-foreground mb-2">API Calls: 0 / 1,000</p>
                            <p className="text-sm text-muted-foreground">Storage: 0 MB / 100 MB</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-medium mb-2">Payment Method</h3>
                            <p className="text-sm text-muted-foreground mb-4">No payment method on file</p>
                            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                                Add Payment Method
                            </button>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <h3 className="font-medium mb-2">Billing History</h3>
                            <p className="text-sm text-muted-foreground">No billing history available</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingPage;
