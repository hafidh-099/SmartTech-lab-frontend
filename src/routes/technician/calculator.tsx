import { useState, type FormEvent } from 'react'
import { Copy, FlaskConical, Pipette } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  calculateDilution,
  calculateMolarity,
  type DilutionResult,
  type MolarityResult,
} from '@/lib/calculator'

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success('Copied to clipboard')
  } catch {
    toast.error('Could not access the clipboard')
  }
}

function readPositive(form: FormData, key: string, label: string) {
  const value = Number(form.get(key))
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than zero.`)
  }
  return value
}

export default function ChemicalCalculator() {
  const [molarityResult, setMolarityResult] = useState<MolarityResult | null>(
    null,
  )
  const [dilutionResult, setDilutionResult] = useState<DilutionResult | null>(
    null,
  )

  function submitMolarity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const form = new FormData(event.currentTarget)
      const result = calculateMolarity({
        molarity: readPositive(form, 'molarity', 'Molarity'),
        volumeL: readPositive(form, 'volumeL', 'Volume'),
        molarMass: readPositive(form, 'molarMass', 'Molar mass'),
      })
      setMolarityResult(result)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not calculate molarity',
      )
    }
  }

  function submitDilution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const form = new FormData(event.currentTarget)
      const result = calculateDilution({
        stockMolarity: readPositive(form, 'stockMolarity', 'Stock molarity'),
        targetMolarity: readPositive(form, 'targetMolarity', 'Target molarity'),
        targetVolumeMl: readPositive(form, 'targetVolumeMl', 'Target volume'),
      })
      setDilutionResult(result)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not calculate dilution',
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solution Calculator"
        description="Calculate reagent mass and dilution volumes locally. No data is sent to the server."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="h-4 w-4 text-primary" />
              Molarity preparation
            </CardTitle>
            <CardDescription>
              Calculate the reagent mass required for a solution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitMolarity} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="molarity">Target molarity (mol/L)</Label>
                  <Input
                    id="molarity"
                    name="molarity"
                    type="number"
                    min="0"
                    step="any"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volumeL">Final volume (L)</Label>
                  <Input
                    id="volumeL"
                    name="volumeL"
                    type="number"
                    min="0"
                    step="any"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="molarMass">Molar mass (g/mol)</Label>
                  <Input
                    id="molarMass"
                    name="molarMass"
                    type="number"
                    min="0"
                    step="any"
                    required
                  />
                </div>
              </div>
              <Button type="submit">Calculate mass</Button>
            </form>
            {molarityResult && (
              <div className="mt-5 space-y-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Reagent mass
                  </p>
                  <p className="font-mono text-lg font-semibold">
                    {molarityResult.massGrams} g
                  </p>
                </div>
                <p className="text-sm">
                  Amount of substance: {molarityResult.moles.toPrecision(4)} mol
                </p>
                <p className="text-sm leading-relaxed">
                  {molarityResult.instructions}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void copyText(
                      `${molarityResult.massGrams} g\n${molarityResult.instructions}`,
                    )
                  }
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy result
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Pipette className="h-4 w-4 text-primary" />
              Dilution
            </CardTitle>
            <CardDescription>
              Calculate stock solution and water volumes using C₁V₁ = C₂V₂.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitDilution} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="stockMolarity">Stock molarity (M)</Label>
                  <Input
                    id="stockMolarity"
                    name="stockMolarity"
                    type="number"
                    min="0"
                    step="any"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetMolarity">Target molarity (M)</Label>
                  <Input
                    id="targetMolarity"
                    name="targetMolarity"
                    type="number"
                    min="0"
                    step="any"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetVolumeMl">Final volume (mL)</Label>
                  <Input
                    id="targetVolumeMl"
                    name="targetVolumeMl"
                    type="number"
                    min="0"
                    step="any"
                    required
                  />
                </div>
              </div>
              <Button type="submit">Calculate dilution</Button>
            </form>
            {dilutionResult && (
              <div className="mt-5 space-y-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Stock solution
                  </p>
                  <p className="font-mono text-lg font-semibold">
                    {dilutionResult.volumeStockMl} mL
                  </p>
                </div>
                <p className="text-sm">
                  Distilled water: {dilutionResult.volumeWaterMl} mL
                </p>
                <p className="text-sm leading-relaxed">
                  {dilutionResult.instructions}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void copyText(
                      `${dilutionResult.volumeStockMl} mL stock solution\n${dilutionResult.volumeWaterMl} mL distilled water\n${dilutionResult.instructions}`,
                    )
                  }
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy result
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">
        Follow your laboratory&apos;s safety procedures and verify calculations
        before preparing solutions.
      </p>
    </div>
  )
}
