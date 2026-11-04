import { useEffect, useState } from "react";
import { Pencil, Plus, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateLab,
  useLabs,
  useUpdateLab,
  type Lab,
  type SaveLabBody,
} from "@/hooks/queries/use-bookings";

interface LabFormValues {
  name: string;
  location: string;
  capacity: string;
}

const EMPTY_FORM: LabFormValues = { name: "", location: "", capacity: "" };

export default function ManageLabsPage() {
  const labsQuery = useLabs();
  const createLab = useCreateLab();
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const updateLab = useUpdateLab(editingLab?.id ?? "");
  const mutation = editingLab ? updateLab : createLab;

  useEffect(() => {
    if (labsQuery.error) {
      toast.error(`Could not load labs: ${labsQuery.error.message}`);
    }
  }, [labsQuery.error]);

  function startCreate() {
    setEditingLab(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setOpen(true);
  }

  function startEdit(lab: Lab) {
    setEditingLab(lab);
    setForm({
      name: lab.name,
      location: lab.location ?? "",
      capacity: lab.capacity == null ? "" : String(lab.capacity),
    });
    setFormError("");
    setOpen(true);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    const capacity =
      form.capacity.trim() === "" ? undefined : Number(form.capacity);
    if (!name || name.length > 100) {
      setFormError("Enter a lab name between 1 and 100 characters.");
      return;
    }
    if (
      form.location.length > 150 ||
      (capacity !== undefined &&
        (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000))
    ) {
      setFormError("Check the location and capacity values.");
      return;
    }

    const body: SaveLabBody = {
      name,
      location: form.location.trim() || null,
      ...(capacity === undefined ? {} : { capacity }),
    };
    mutation.mutate(body, {
      onSuccess: () => {
        setOpen(false);
        setEditingLab(null);
        setForm(EMPTY_FORM);
      },
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laboratory Management"
        description="Manage the laboratories available for school bookings."
        action={
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Add New Lab
          </Button>
        }
      />

      {labsQuery.isError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive"
        >
          Could not load labs: {labsQuery.error.message}
          <Button
            variant="outline"
            className="ml-3"
            onClick={() => void labsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : labsQuery.isLoading ? (
        <div className="space-y-3 rounded-lg border p-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : labsQuery.data?.length ? (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labsQuery.data.map((lab) => (
                <TableRow key={lab.id}>
                  <TableCell className="font-medium">{lab.name}</TableCell>
                  <TableCell>{lab.location || "—"}</TableCell>
                  <TableCell>{lab.capacity ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(lab)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No laboratories yet"
          description="Add a lab to make it available for bookings."
          icon={FlaskConical}
          action={<Button onClick={startCreate}>Add New Lab</Button>}
        />
      )}

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!mutation.isPending) setOpen(nextOpen);
        }}
      >
        <DialogContent>
          <form onSubmit={submit} className="space-y-5">
            <DialogHeader>
              <DialogTitle>
                {editingLab ? "Edit laboratory" : "Add new laboratory"}
              </DialogTitle>
              <DialogDescription>
                Enter the laboratory details used by the booking system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="lab-name">Name</Label>
              <Input
                id="lab-name"
                required
                maxLength={100}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="e.g. Chemistry Laboratory"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lab-location">Location (optional)</Label>
              <Input
                id="lab-location"
                maxLength={150}
                value={form.location}
                onChange={(event) =>
                  setForm({ ...form, location: event.target.value })
                }
                placeholder="e.g. Science block, room 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lab-capacity">Capacity (optional)</Label>
              <Input
                id="lab-capacity"
                type="number"
                min={1}
                max={10000}
                step={1}
                value={form.capacity}
                onChange={(event) =>
                  setForm({ ...form, capacity: event.target.value })
                }
                placeholder="Maximum students"
              />
            </div>
            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? "Saving…"
                  : editingLab
                    ? "Save changes"
                    : "Create lab"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
