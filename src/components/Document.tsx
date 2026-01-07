'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from '@/lib/axios';
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Document } from "@/types/types";
export function Documents() {
    // purely visual — no state, no fetching
    // Fetch documents with React Query
    const { user } = useUser();
    const { data: documents = [], isLoading, error: queryError } = useQuery({
        queryKey: ['documents', user?.id],
        queryFn: async () => {
            console.log('Making API call to fetch documents for user:', user?.id);
            const response = await api.get(`/api/v1/documents?userId=${user?.id}`);
            console.log('API Response:', response.data);
            console.log('Documents from API:', response.data.documents);
            return response.data.documents || [];
        },
        enabled: !!user?.id,
    });

    const [isOpen, setIsOpen] = useState(false); // Start collapsed

    return (
        <div className="mt-4">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 text-xs hover:bg-muted"
                    >
                        {isOpen ? (
                            <ChevronDown className="w-3 h-3 mr-1" />
                        ) : (
                            <ChevronRight className="w-3 h-3 mr-1" />
                        )}
                        {documents.length > 0
                            ? `${documents.length} content document`
                            : "View content"}
                    </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    {
                        true && (
                            <Card >
                                <CardHeader>
                                    <CardTitle className="text-lg">Your Documents</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                        {isLoading ? (
                                            <p className="text-sm text-gray-500">Loading documents...</p>
                                        ) : queryError ? (
                                            <p className="text-sm text-red-500">Error loading documents: {queryError.message}</p>
                                        ) : documents.length === 0 ? (
                                            <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                                        ) : (
                                            documents.map((doc: Document) => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-5 h-5 text-blue-600" />
                                                        <div>
                                                            <p className="font-medium text-sm">{doc.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(doc.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                                                    </Badge>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    }
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}

