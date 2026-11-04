import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
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
import { useChemicals } from "@/hooks/queries/use-chemicals";
import { useEquipment, type Equipment } from "@/hooks/queries/use-equipment";
import type { BookingItem } from "@/hooks/queries/use-bookings";

interface ItemsSelectorProps {
  items: BookingItem[];
  onChange: (items: BookingItem[]) => void;
}

function EquipmentOption({ equipment }: { equipment: Equipment }) {
  return (
    <>
      {equipment.name} ({equipment.status})
    </>
  );
}

export function ItemsSelector({ items, onChange }: ItemsSelectorProps) {
  const [tab, setTab] = useState("chemicals");
  const [chemicalId, setChemicalId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [chemicalSearch, setChemicalSearch] = useState("");
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const chemicalsQuery = useChemicals({
    page: 1,
    limit: 100,
    includeInactive: false,
  });
  const equipmentQuery = useEquipment({ page: 1, limit: 100 });
  const chemicals = chemicalsQuery.data?.data ?? [];
  const operationalEquipment =
    equipmentQuery.data?.data.filter(
      (item) =>
        item.status === "operational" &&
        `${item.name} ${item.category ?? ""} ${item.serialNumber ?? ""}`
          .toLowerCase()
          .includes(equipmentSearch.trim().toLowerCase()),
    ) ?? [];
  const filteredChemicals = chemicals.filter((chemical) =>
    `${chemical.name} ${chemical.formula ?? ""}`
      .toLowerCase()
      .includes(chemicalSearch.trim().toLowerCase()),
  );
  const selectedChemical = chemicals.find((item) => item.id === chemicalId);
  const selectedEquipment = operationalEquipment.find(
    (item) => item.id === equipmentId,
  );
  const numericQuantity = Number(quantity);
  const quantityExceedsStock =
    selectedChemical !== undefined &&
    numericQuantity > Number(selectedChemical.currentQuantity);
  const lowStock =
    selectedChemical?.status === "low" ||
    selectedChemical?.status === "critical";

  useEffect(() => {
    if (chemicalsQuery.error) {
      toast.error(`Could not load chemicals: ${chemicalsQuery.error.message}`);
    }
  }, [chemicalsQuery.error]);

  useEffect(() => {
    if (equipmentQuery.error) {
      toast.error(`Could not load equipment: ${equipmentQuery.error.message}`);
    }
  }, [equipmentQuery.error]);

  function addChemical() {
    if (
      !selectedChemical ||
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      setMessage("Select a chemical and enter a quantity greater than zero.");
      return;
    }
    if (items.length >= 20) {
      setMessage("A booking can include at most 20 items.");
      return;
    }
    if (
      numericQuantity > 999_999_999.999 ||
      Number(numericQuantity.toFixed(3)) !== numericQuantity
    ) {
      setMessage("Chemical quantity must have at most 3 decimal places.");
      return;
    }
    onChange([
      ...items,
      {
        chemicalId: selectedChemical.id,
        quantity: numericQuantity,
        unit: selectedChemical.unit,
        chemical: selectedChemical,
      },
    ]);
    setChemicalId("");
    setQuantity("");
    setMessage("");
  }

  function addEquipment() {
    if (
      !selectedEquipment ||
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      setMessage(
        "Select operational equipment and enter a quantity greater than zero.",
      );
      return;
    }
    if (items.length >= 20) {
      setMessage("A booking can include at most 20 items.");
      return;
    }
    if (!Number.isInteger(numericQuantity)) {
      setMessage("Equipment quantity must be a whole number.");
      return;
    }
    onChange([
      ...items,
      {
        equipmentId: selectedEquipment.id,
        quantity: numericQuantity,
        unit: "pcs",
        equipment: selectedEquipment,
      },
    ]);
    setEquipmentId("");
    setQuantity("");
    setMessage("");
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Specify items to help the technician prepare. Items are optional.
      </p>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value);
          setMessage("");
          setQuantity("");
        }}
      >
        <TabsList className="grid w-full grid-cols-2 sm:w-72">
          <TabsTrigger value="chemicals">Chemicals</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
        </TabsList>
        <TabsContent value="chemicals" className="space-y-3">
          {chemicalsQuery.isError && (
            <p className="text-sm text-destructive" role="alert">
              Could not load chemicals: {chemicalsQuery.error.message}
            </p>
          )}
          {chemicalsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading chemicals…</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
              <div className="space-y-2">
                <label
                  htmlFor="booking-chemical"
                  className="text-sm font-medium"
                >
                  Chemical
                </label>
                <Input
                  aria-label="Search chemicals"
                  placeholder="Search name or formula"
                  value={chemicalSearch}
                  onChange={(event) => setChemicalSearch(event.target.value)}
                />
                <Select
                  value={chemicalId}
                  onValueChange={(value) => setChemicalId(value)}
                >
                  <SelectTrigger id="booking-chemical">
                    <SelectValue placeholder="Select chemical" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredChemicals.map((chemical) => (
                      <SelectItem key={chemical.id} value={chemical.id}>
                        {chemical.name}
                        {chemical.formula
                          ? ` (${chemical.formula})`
                          : ""} -{" "}
                        {Number(chemical.currentQuantity).toLocaleString()}
                        {chemical.unit} available
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="booking-chemical-quantity"
                  className="text-sm font-medium"
                >
                  Quantity{" "}
                  {selectedChemical ? `(${selectedChemical.unit})` : ""}
                </label>
                <Input
                  id="booking-chemical-quantity"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </div>
              <Button type="button" onClick={addChemical}>
                <Plus className="mr-2 h-4 w-4" />
                Add item
              </Button>
            </div>
          )}
          {selectedChemical && lowStock && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
              {selectedChemical.name} is {selectedChemical.status}. The
              technician may need to check stock before approving.
            </p>
          )}
          {selectedChemical && quantityExceedsStock && (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Requested quantity is greater than the current stock; you may
              still submit the request.
            </p>
          )}
        </TabsContent>
        <TabsContent value="equipment" className="space-y-3">
          {equipmentQuery.isError && (
            <p className="text-sm text-destructive" role="alert">
              Could not load equipment: {equipmentQuery.error.message}
            </p>
          )}
          {equipmentQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading equipment…</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
              <div className="space-y-2">
                <label
                  htmlFor="booking-equipment"
                  className="text-sm font-medium"
                >
                  Operational equipment
                </label>
                <Input
                  aria-label="Search equipment"
                  placeholder="Search equipment"
                  value={equipmentSearch}
                  onChange={(event) => setEquipmentSearch(event.target.value)}
                />
                <Select
                  value={equipmentId}
                  onValueChange={(value) => setEquipmentId(value)}
                >
                  <SelectTrigger id="booking-equipment">
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {operationalEquipment.map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        <EquipmentOption equipment={equipment} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {operationalEquipment.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No operational equipment is currently available.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="booking-equipment-quantity"
                  className="text-sm font-medium"
                >
                  Quantity (pcs)
                </label>
                <Input
                  id="booking-equipment-quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </div>
              <Button type="button" onClick={addEquipment}>
                <Plus className="mr-2 h-4 w-4" />
                Add item
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      {message && (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      )}
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, index) => {
            const name =
              item.chemical?.name ?? item.equipment?.name ?? "Unknown item";
            const stockWarning =
              item.chemical &&
              Number(item.quantity) > Number(item.chemical.currentQuantity);
            const chemicalStatus = item.chemical?.status;
            return (
              <li
                key={`${item.chemicalId ?? item.equipmentId}-${index}`}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p
                    className={`text-xs ${
                      stockWarning
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {Number(item.quantity).toLocaleString()} {item.unit}
                    {stockWarning ? " · exceeds current stock" : ""}
                  </p>
                  {chemicalStatus === "low" || chemicalStatus === "critical" ? (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Chemical stock is {chemicalStatus}.
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${name}`}
                  onClick={() =>
                    onChange(
                      items.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
