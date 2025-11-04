'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    MessageSquare,
    MoreVertical,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from "lucide-react";

export function ContentRequestsManager() {
    // Mock data for UI preview
    const mockRequests = [
        {
            id: 1,
            requestedTopic: "Reinforcement Learning Basics",
            status: "pending",
            createdAt: "2025-10-28T08:30:00Z",
            originalMessage:
                "Could you please create a tutorial explaining the key differences between Q-Learning and SARSA?",
            adminNotes: "",
        },
        {
            id: 2,
            requestedTopic: "Blockchain Fundamentals",
            status: "approved",
            createdAt: "2025-10-27T11:45:00Z",
            originalMessage:
                "A short overview video or notes on smart contracts and decentralized applications would be helpful.",
            adminNotes: "Scheduled for recording next week.",
        },
        {
            id: 3,
            requestedTopic: "Python Web Development",
            status: "completed",
            createdAt: "2025-10-25T14:00:00Z",
            originalMessage:
                "Please add a section on integrating FastAPI with MongoDB for backend development.",
            adminNotes: "Published and linked in the course portal.",
        },
    ];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pending":
                return <Clock className="w-4 h-4 text-yellow-600" />;
            case "approved":
                return <CheckCircle className="w-4 h-4 text-blue-600" />;
            case "completed":
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case "rejected":
                return <XCircle className="w-4 h-4 text-red-600" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
            case "approved":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
            case "completed":
                return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
            case "rejected":
                return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Content Requests</h2>
                    <p className="text-muted-foreground">
                        Review and manage content requests from students
                    </p>
                </div>
                <Badge variant="secondary" className="text-sm">
                    {mockRequests.length} request{mockRequests.length !== 1 ? "s" : ""}
                </Badge>
            </div>

            {/* List */}
            <div className="space-y-4">
                {mockRequests.map((request) => (
                    <Card key={request.id} className="p-6">
                        <div className="space-y-4">
                            {/* Header Row */}
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(request.status)}
                                        <h3 className="font-semibold text-foreground">
                                            {request.requestedTopic}
                                        </h3>
                                        <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Requested {new Date(request.createdAt).toLocaleDateString()} at{" "}
                                        {new Date(request.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Approve Request</DropdownMenuItem>
                                        <DropdownMenuItem>Mark Complete</DropdownMenuItem>
                                        <DropdownMenuItem>Reject Request</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Original Message */}
                            <div className="bg-muted/30 rounded-lg p-4">
                                <h4 className="font-medium text-sm text-foreground mb-2">
                                    Original Student Question:
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {request.originalMessage}
                                </p>
                            </div>

                            {/* Admin Notes (if any) */}
                            {request.adminNotes && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                    <h4 className="font-medium text-sm text-blue-800 dark:text-blue-400 mb-2">
                                        Admin Notes:
                                    </h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        {request.adminNotes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
