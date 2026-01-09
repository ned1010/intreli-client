'use client';

import { Dropzone } from "@/components/DropZone";
import { DocumentChunks } from "@/components/DocumentChunk";
import { ContentRequestsManager } from "@/components/ContentRequestManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, MessageSquareMore } from "lucide-react";
import { Documents } from "@/components/Document";

const KnowledgeBasePage = () => {
    return (
        <div className="flex-1 flex flex-col h-full w-full bg-background text-foreground p-6">

            <Tabs defaultValue="upload" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="upload" className="flex items-center gap-2 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Upload Documents
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2 cursor-pointer">
                        <FileText className="w-4 h-4" />
                        Document
                    </TabsTrigger>

                    <TabsTrigger value="chunks" className="flex items-center gap-2 cursor-pointer">
                        <FileText className="w-4 h-4" />
                        Chunks
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="flex items-center gap-2 cursor-pointer">
                        <MessageSquareMore className="w-4 h-4" />
                        Content Requests
                    </TabsTrigger>


                </TabsList>

                <div className="flex-1 mt-6">
                    <TabsContent value="upload" className="h-full">
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Upload Documents</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Upload documents to make them available for AI chat responses
                                </p>
                            </div>
                            <Dropzone />
                        </div>
                    </TabsContent>

                    <TabsContent value="documents" className="h-full">
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold mb-2"> Documents</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    List of all the documents you have uploaded
                                </p>
                            </div>
                            <Documents />
                        </div>
                    </TabsContent>

                    <TabsContent value="chunks" className="h-full">
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Document Chunks</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    View and manage processed document chunks used by the AI
                                </p>
                            </div>
                            <div className="bg-card rounded-lg border p-6">
                                <DocumentChunks />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="requests" className="h-full">
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Content Requests</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Review and manage content requests from users
                                </p>
                            </div>
                            <ContentRequestsManager />
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

export default KnowledgeBasePage;

