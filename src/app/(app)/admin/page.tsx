'use client';

const AdminPage = () => {
    return (
        <div className="flex-1 flex flex-col h-full w-full bg-background text-foreground p-6">
            <div className="bg-card rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">System Administration</h2>
                <p className="text-muted-foreground mb-4">
                    Admin dashboard content will be implemented here.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">User Management</h3>
                        <p className="text-sm text-muted-foreground">Manage user accounts and permissions</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">System Settings</h3>
                        <p className="text-sm text-muted-foreground">Configure system-wide settings</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Analytics</h3>
                        <p className="text-sm text-muted-foreground">View system usage and analytics</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;


