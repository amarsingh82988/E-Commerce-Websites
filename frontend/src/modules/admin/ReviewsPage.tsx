import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { CheckCircle, Trash2, Star, MessageSquare, Loader2 } from "lucide-react";
import { getPendingReviews, approveReview, replyToReview, deleteReview, type ReviewItem } from "@/api/reviews";

export default function AdminReviewsPage() {
  const [pendingReviews, setPendingReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingReviews();
      setPendingReviews(data || []);
    } catch {
      toast.error("Failed to load pending reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await approveReview(id);
      toast.success("Review approved and published to product page!");
      await fetchPending();
      if (selectedReview?._id === id) setSelectedReview(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to approve review");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete/decline this review?")) return;
    setActionLoading(true);
    try {
      await deleteReview(id);
      toast.success("Review removed.");
      await fetchPending();
      if (selectedReview?._id === id) setSelectedReview(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete review");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply.");
      return;
    }
    setActionLoading(true);
    try {
      await replyToReview(id, replyText);
      toast.success("Reply saved successfully!");
      setReplyText("");
      await fetchPending();
    } catch (err: any) {
      toast.error(err.message || "Failed to save reply");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Moderation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Approve or decline customer reviews submitted by verified buyers. Approved reviews immediately update product ratings.
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1 bg-amber-50 text-amber-800 border-amber-200">
          {pendingReviews.length} Pending Approval
        </Badge>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingReviews.length > 0 ? (
                pendingReviews.map((rev) => {
                  const productObj = typeof rev.product === "object" ? rev.product : null;
                  return (
                    <TableRow key={rev._id}>
                      <TableCell className="font-medium">
                        {productObj ? productObj.name : "Product #" + String(rev.product).slice(-6)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{rev.userName}</div>
                        <div className="text-xs text-muted-foreground">{rev.userEmail}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-accent text-accent" />
                          <span className="font-medium text-sm">{rev.rating}/5</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {rev.title ? <span className="font-semibold">{rev.title} - </span> : null}
                        {rev.comment}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(rev.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={actionLoading}
                          onClick={() => handleApprove(rev._id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReview(rev)}
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1" /> View / Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actionLoading}
                          onClick={() => handleDelete(rev._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No pending reviews to moderate. All clear!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedReview && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center justify-between">
                  <span>Review Moderation</span>
                  <Badge variant="outline" className="bg-amber-100 text-amber-800">
                    Pending Approval
                  </Badge>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6">
                <div className="bg-muted/40 p-4 rounded-xl space-y-2 text-sm">
                  <p><span className="font-semibold">Buyer:</span> {selectedReview.userName} ({selectedReview.userEmail})</p>
                  <p className="flex items-center gap-1">
                    <span className="font-semibold">Rating:</span>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < selectedReview.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                    ))}
                  </p>
                  {selectedReview.title && <p><span className="font-semibold">Title:</span> {selectedReview.title}</p>}
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm">Review Comment:</h4>
                  <p className="p-4 rounded-xl border bg-card text-sm whitespace-pre-wrap">
                    "{selectedReview.comment}"
                  </p>
                </div>

                {selectedReview.images && selectedReview.images.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Attached Photos:</h4>
                    <div className="flex gap-3">
                      {selectedReview.images.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer">
                          <img src={img} alt="Attachment" className="h-20 w-20 object-cover rounded-lg border shadow-sm" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-3 border-t">
                  <h4 className="font-semibold text-sm">Seller Response (Optional):</h4>
                  <Textarea
                    placeholder="Write a response to the buyer (e.g. Thank you for your feedback!)..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                  />
                  <Button size="sm" variant="outline" disabled={actionLoading} onClick={() => handleReply(selectedReview._id)}>
                    Save Seller Reply
                  </Button>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button variant="destructive" disabled={actionLoading} onClick={() => handleDelete(selectedReview._id)}>
                    Reject / Delete
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading} onClick={() => handleApprove(selectedReview._id)}>
                    Approve &amp; Publish Review
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
