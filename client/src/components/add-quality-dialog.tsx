import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

// Form validation schema
const qualitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  denier: z.coerce.number().min(1, 'Denier must be a positive number'),
  blend: z.string().min(2, 'Blend must be at least 2 characters'),
});

type QualityFormValues = z.infer<typeof qualitySchema>;

interface AddQualityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQualityAdded?: () => void;
}

export function AddQualityDialog({ open, onOpenChange, onQualityAdded }: AddQualityDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<QualityFormValues>({
    resolver: zodResolver(qualitySchema),
    defaultValues: {
      name: '',
      denier: 0,
      blend: '',
    },
  });
  
  async function onSubmit(data: QualityFormValues) {
    try {
      await apiRequest('/api/qualities', 'POST', data);
      
      // Show success toast
      toast({
        title: 'Quality added',
        description: `${data.name} has been added successfully.`,
      });
      
      // Reset form
      form.reset();
      
      // Invalidate the qualities query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/qualities'] });
      
      // Close the dialog
      onOpenChange(false);
      
      // Call the callback if provided
      if (onQualityAdded) {
        onQualityAdded();
      }
    } catch (error) {
      console.error('Error adding quality:', error);
      toast({
        title: 'Error',
        description: 'Failed to add quality. Please try again.',
        variant: 'destructive',
      });
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Quality</DialogTitle>
          <DialogDescription>
            Enter the details of the new quality below.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter quality name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="denier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Denier</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter denier value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="blend"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blend</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter blend value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Adding...' : 'Add Quality'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        
      </DialogContent>
    </Dialog>
  );
}