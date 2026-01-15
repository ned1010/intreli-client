'use client';

import { useState } from 'react';
import { Document } from '@/types/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DocumentSelectorProps {
  documents: Document[];
  selectedDocuments: Document[];
  onSelectionChange: (documents: Document[]) => void;
  trigger?: React.ReactNode;
}

export function DocumentSelector({
  documents,
  selectedDocuments,
  onSelectionChange,
  trigger
}: DocumentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter documents by completed status and search query
  const availableDocuments = documents.filter(doc => {
    const isCompleted = doc.status === 'completed';
    const matchesSearch = searchQuery === '' || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return isCompleted && matchesSearch;
  });

  const isSelected = (docId: string | number) => {
    return selectedDocuments.some(doc => String(doc.id) === String(docId));
  };

  const handleToggle = (document: Document) => {
    const isCurrentlySelected = isSelected(document.id);
    
    if (isCurrentlySelected) {
      // Remove from selection
      onSelectionChange(selectedDocuments.filter(doc => String(doc.id) !== String(document.id)));
    } else {
      // Add to selection
      onSelectionChange([...selectedDocuments, document]);
    }
  };

  const defaultTrigger = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 relative"
    >
      <FileText className="h-4 w-4" />
      {selectedDocuments.length > 0 && (
        <Badge 
          variant="default" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {selectedDocuments.length}
        </Badge>
      )}
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search documents..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No documents found.</CommandEmpty>
            <CommandGroup heading="Available Documents">
              {availableDocuments.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No documents match your search.' : 'No completed documents available.'}
                </div>
              ) : (
                availableDocuments.map((document) => {
                  const selected = isSelected(document.id);
                  return (
                    <CommandItem
                      key={document.id}
                      onSelect={() => handleToggle(document)}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => handleToggle(document)}
                        className="mr-2"
                      />
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{document.name}</span>
                      {document.status === 'completed' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </CommandItem>
                  );
                })
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

