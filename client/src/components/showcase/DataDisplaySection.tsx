import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function DataDisplaySection() {
  const [progress, setProgress] = useState(33);
  const [currentPage, setCurrentPage] = useState(2);

  return (
    <section className="space-y-4">
      <h3 className="text-2xl font-semibold">Data Display</h3>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label>Badges</Label>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Progress</Label>
            <Progress value={progress} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>-10</Button>
              <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>+10</Button>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Skeleton</Label>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Pagination</Label>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={e => { e.preventDefault(); setCurrentPage(Math.max(1, currentPage - 1)); }} />
                </PaginationItem>
                {[1, 2, 3, 4, 5].map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink href="#" isActive={currentPage === page} onClick={e => { e.preventDefault(); setCurrentPage(page); }}>{page}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={e => { e.preventDefault(); setCurrentPage(Math.min(5, currentPage + 1)); }} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <p className="text-sm text-muted-foreground text-center">Current page: {currentPage}</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Table</Label>
            <Table>
              <TableCaption>A list of your recent invoices.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-25">Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">INV001</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Credit Card</TableCell>
                  <TableCell className="text-right">$250.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}