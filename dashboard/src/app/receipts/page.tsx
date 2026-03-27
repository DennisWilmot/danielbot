"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  DollarSign,
  Calendar,
  Package,
  Building2,
  Eye,
  Edit,
  Trash2,
  Plus,
  Check,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Receipt,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

type ReceiptItem = {
  name: string;
  quantity: number | null;
  unitPrice: number | null;
  lineTotal: number | null;
};

type DashboardReceipt = {
  id: string;
  imageUrl: string;
  amount: number;
  purchase: string;
  items: ReceiptItem[];
  location: string;
  date: string;
  time: string;
  vendor: string;
  category: string;
  status: "Approved" | "Pending" | "Rejected";
  submittedBy: string;
  notes?: string;
  tax?: number;
  source: string;
};

const statusColor: Record<string, string> = {
  Approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

const categoryColor: Record<string, string> = {
  Software: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Equipment: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Infrastructure: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Training: "bg-green-500/10 text-green-500 border-green-500/20",
  Marketing: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  Services: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  Other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const CATEGORIES = [
  "Software",
  "Equipment",
  "Infrastructure",
  "Training",
  "Marketing",
  "Services",
  "Other",
];

type SortKey = "date" | "vendor" | "purchase" | "amount" | "category" | "status";
type SortDir = "asc" | "desc";

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<DashboardReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [imageDialog, setImageDialog] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<DashboardReceipt | null>(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Review queue state
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewHistory, setReviewHistory] = useState<string[]>([]);
  const [sessionStats, setSessionStats] = useState({
    approved: 0,
    rejected: 0,
    skipped: 0,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    vendor: "",
    amount: 0,
    category: "Other",
    location: "",
    purchase: "",
    notes: "",
    tax: 0,
    status: "Pending" as "Approved" | "Pending" | "Rejected",
  });

  // Create form state
  const [createForm, setCreateForm] = useState({
    vendor: "",
    amount: 0,
    category: "Other",
    location: "",
    purchase: "",
    notes: "",
    tax: 0,
    date: new Date().toISOString().split("T")[0],
    submittedBy: "Manual Entry",
  });

  const fetchReceipts = useCallback(async () => {
    try {
      const res = await fetch("/api/receipts");
      if (res.ok) {
        const data = await res.json();
        setReceipts(data);
      }
    } catch (err) {
      console.error("Failed to fetch receipts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const filtered = useMemo(() => {
    let result = receipts;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.vendor.toLowerCase().includes(q) ||
          r.purchase.toLowerCase().includes(q) ||
          (r.notes?.toLowerCase().includes(q) ?? false)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter((r) => r.category === categoryFilter);
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortKey === "amount") {
        cmp = a.amount - b.amount;
      } else {
        cmp = (a[sortKey] || "").localeCompare(b[sortKey] || "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [receipts, search, statusFilter, categoryFilter, sortKey, sortDir]);

  const pendingReceipts = useMemo(
    () => receipts.filter((r) => r.status === "Pending"),
    [receipts]
  );

  const totalAmount = useMemo(
    () => receipts.reduce((sum, r) => sum + r.amount, 0),
    [receipts]
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  }

  async function handleDelete(id: string) {
    await fetch(`/api/receipts/${id}`, { method: "DELETE" });
    setDeleteDialog(null);
    fetchReceipts();
  }

  async function handleEdit() {
    if (!editDialog) return;
    await fetch(`/api/receipts/${editDialog.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditDialog(null);
    fetchReceipts();
  }

  async function handleCreate() {
    await fetch("/api/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    setCreateDialog(false);
    setCreateForm({
      vendor: "",
      amount: 0,
      category: "Other",
      location: "",
      purchase: "",
      notes: "",
      tax: 0,
      date: new Date().toISOString().split("T")[0],
      submittedBy: "Manual Entry",
    });
    fetchReceipts();
  }

  function openEditDialog(r: DashboardReceipt) {
    setEditForm({
      vendor: r.vendor,
      amount: r.amount,
      category: r.category,
      location: r.location,
      purchase: r.purchase,
      notes: r.notes || "",
      tax: r.tax || 0,
      status: r.status,
    });
    setEditDialog(r);
  }

  async function handleReviewAction(
    action: "approve" | "reject" | "skip"
  ) {
    const receipt = pendingReceipts[reviewIndex];
    if (!receipt) return;

    if (action === "approve") {
      await fetch(`/api/receipts/${receipt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" }),
      });
      setSessionStats((s) => ({ ...s, approved: s.approved + 1 }));
    } else if (action === "reject") {
      await fetch(`/api/receipts/${receipt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Rejected",
          notes: rejectReason || undefined,
        }),
      });
      setSessionStats((s) => ({ ...s, rejected: s.rejected + 1 }));
      setRejectReason("");
    } else {
      setSessionStats((s) => ({ ...s, skipped: s.skipped + 1 }));
    }

    setReviewHistory((h) => [...h, receipt.id]);
    setReviewIndex((i) => i + 1);
    fetchReceipts();
  }

  function handleUndo() {
    if (reviewHistory.length === 0) return;
    setReviewHistory((h) => h.slice(0, -1));
    setReviewIndex((i) => Math.max(0, i - 1));
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      const receipt = pendingReceipts[reviewIndex];
      if (!receipt) return;

      if (e.key === "a" || e.key === "ArrowRight") {
        handleReviewAction("approve");
      } else if (e.key === "r" || e.key === "ArrowLeft") {
        setRejectDialog(true);
      } else if (e.key === "s" || e.key === "ArrowDown") {
        handleReviewAction("skip");
      } else if (e.key === "u" || e.key === "ArrowUp") {
        handleUndo();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReceipts, reviewIndex]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Receipts
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receipts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Amount
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingReceipts.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {receipts.filter((r) => r.status === "Approved").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="table">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="review">Review Queue</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={() => setCreateDialog(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add Receipt
          </Button>
        </div>

        {/* Table View */}
        <TabsContent value="table" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendor, purchase, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter}
              onValueChange={(v) => v && setCategoryFilter(v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("date")}
                  >
                    Date
                    <SortIcon col="date" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("vendor")}
                  >
                    Vendor
                    <SortIcon col="vendor" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("purchase")}
                  >
                    Purchase
                    <SortIcon col="purchase" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => handleSort("amount")}
                  >
                    Amount
                    <SortIcon col="amount" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("category")}
                  >
                    Category
                    <SortIcon col="category" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("status")}
                  >
                    Status
                    <SortIcon col="status" />
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No receipts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <>
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() =>
                          setExpandedRow(expandedRow === r.id ? null : r.id)
                        }
                      >
                        <TableCell>
                          {expandedRow === r.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {r.date}
                        </TableCell>
                        <TableCell className="font-medium">
                          {r.vendor}
                        </TableCell>
                        <TableCell>{r.purchase}</TableCell>
                        <TableCell className="text-right font-mono">
                          ${r.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={categoryColor[r.category] || categoryColor.Other}
                          >
                            {r.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColor[r.status]}
                          >
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {r.imageUrl && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setImageDialog(r.imageUrl);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Image
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(r);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteDialog(r.id);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {expandedRow === r.id && (
                        <TableRow key={`${r.id}-expanded`}>
                          <TableCell colSpan={8} className="bg-muted/30 p-4">
                            <div className="flex gap-6">
                              <div
                                className="shrink-0 cursor-pointer"
                                onClick={() => r.imageUrl ? setImageDialog(r.imageUrl) : null}
                              >
                                {r.imageUrl ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={r.imageUrl}
                                    alt="Receipt"
                                    className="h-40 w-auto rounded-md border object-cover"
                                  />
                                ) : (
                                  <div className="flex h-40 w-32 flex-col items-center justify-center rounded-md border border-dashed bg-muted/50 text-muted-foreground">
                                    <Receipt className="mb-1 h-8 w-8" />
                                    <span className="text-xs">No image</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Vendor:
                                    </span>
                                    <span className="font-medium">
                                      {r.vendor}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Location:
                                    </span>
                                    <span>{r.location}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Date:
                                    </span>
                                    <span>
                                      {r.date} {r.time}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Source:
                                    </span>
                                    <span className="capitalize">
                                      {r.source}
                                    </span>
                                  </div>
                                  {r.tax !== undefined && (
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-muted-foreground">
                                        Tax:
                                      </span>
                                      <span>${r.tax.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">
                                      Submitted by:
                                    </span>
                                    <span>{r.submittedBy}</span>
                                  </div>
                                </div>
                                {r.items.length > 0 && (
                                  <div>
                                    <p className="mb-1 text-sm font-medium">
                                      Line Items:
                                    </p>
                                    <div className="space-y-1">
                                      {r.items.map((item, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between rounded bg-background px-3 py-1.5 text-sm"
                                        >
                                          <span>{item.name}</span>
                                          <div className="flex gap-4 text-muted-foreground">
                                            {item.quantity !== null && (
                                              <span>
                                                x{item.quantity}
                                              </span>
                                            )}
                                            {item.lineTotal !== null && (
                                              <span className="font-mono">
                                                $
                                                {item.lineTotal.toFixed(
                                                  2
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {r.notes && (
                                  <p className="text-sm text-muted-foreground">
                                    Notes: {r.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Review Queue */}
        <TabsContent value="review" className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Approved: <strong>{sessionStats.approved}</strong>
            </span>
            <span>
              Rejected: <strong>{sessionStats.rejected}</strong>
            </span>
            <span>
              Skipped: <strong>{sessionStats.skipped}</strong>
            </span>
            <span className="ml-auto">
              {Math.min(reviewIndex + 1, pendingReceipts.length)} /{" "}
              {pendingReceipts.length}
            </span>
          </div>

          {reviewIndex < pendingReceipts.length ? (
            (() => {
              const r = pendingReceipts[reviewIndex];
              return (
                <Card className="max-w-2xl mx-auto">
                  <CardContent className="space-y-4 pt-6">
                    <div
                      className={r.imageUrl ? "cursor-pointer" : ""}
                      onClick={() => r.imageUrl ? setImageDialog(r.imageUrl) : null}
                    >
                      {r.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={r.imageUrl}
                          alt="Receipt"
                          className="mx-auto max-h-64 rounded-md border object-contain"
                        />
                      ) : (
                        <div className="mx-auto flex h-48 w-full max-w-xs flex-col items-center justify-center rounded-md border border-dashed bg-muted/50 text-muted-foreground">
                          <Receipt className="mb-2 h-10 w-10" />
                          <span className="text-sm">No receipt image</span>
                          <span className="text-xs mt-0.5">Submitted via {r.source}</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Vendor
                        </span>
                        <p className="font-medium">{r.vendor}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Amount
                        </span>
                        <p className="font-medium font-mono">
                          ${r.amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Date
                        </span>
                        <p>{r.date}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Category
                        </span>
                        <Badge
                          variant="outline"
                          className={categoryColor[r.category] || categoryColor.Other}
                        >
                          {r.category}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Purchase
                        </span>
                        <p>{r.purchase}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Location
                        </span>
                        <p>{r.location}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Submitted by
                        </span>
                        <p>{r.submittedBy}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Source
                        </span>
                        <p className="capitalize">{r.source}</p>
                      </div>
                    </div>
                    {r.items.length > 0 && (
                      <div>
                        <p className="mb-1 text-sm font-medium">Items:</p>
                        {r.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm py-0.5"
                          >
                            <span>{item.name}</span>
                            <span className="font-mono text-muted-foreground">
                              {item.lineTotal !== null
                                ? `$${item.lineTotal.toFixed(2)}`
                                : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {r.notes && (
                      <p className="text-sm text-muted-foreground">
                        Notes: {r.notes}
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUndo}
                        disabled={reviewHistory.length === 0}
                      >
                        <ArrowUp className="mr-1 h-4 w-4" /> Undo (U)
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setRejectDialog(true)}
                      >
                        <ArrowLeft className="mr-1 h-4 w-4" /> Reject
                        (R)
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReviewAction("skip")}
                      >
                        <ArrowDown className="mr-1 h-4 w-4" /> Skip (S)
                      </Button>
                      <Button
                        onClick={() => handleReviewAction("approve")}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <ArrowRight className="mr-1 h-4 w-4" /> Approve
                        (A)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })()
          ) : (
            <Card className="max-w-md mx-auto">
              <CardContent className="py-12 text-center">
                <Check className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-muted-foreground">
                  No more pending receipts to review.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!imageDialog}
        onOpenChange={() => setImageDialog(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Receipt Image</DialogTitle>
          </DialogHeader>
          {imageDialog && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageDialog}
              alt="Receipt"
              className="w-full rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editDialog}
        onOpenChange={() => setEditDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Receipt</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Vendor</Label>
              <Input
                value={editForm.vendor}
                onChange={(e) =>
                  setEditForm({ ...editForm, vendor: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Tax</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.tax}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      tax: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(v) =>
                    v && setEditForm({ ...editForm, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) =>
                    v && setEditForm({
                      ...editForm,
                      status: v as "Approved" | "Pending" | "Rejected",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Purchase</Label>
              <Input
                value={editForm.purchase}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    purchase: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Input
                value={editForm.location}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    location: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Receipt</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Vendor</Label>
              <Input
                value={createForm.vendor}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    vendor: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={createForm.amount}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={createForm.date}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      date: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={createForm.category}
                  onValueChange={(v) =>
                    v && setCreateForm({ ...createForm, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Tax</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={createForm.tax}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      tax: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Purchase</Label>
              <Input
                value={createForm.purchase}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    purchase: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Input
                value={createForm.location}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    location: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    notes: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this receipt? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Receipt</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setRejectDialog(false);
                handleReviewAction("reject");
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
