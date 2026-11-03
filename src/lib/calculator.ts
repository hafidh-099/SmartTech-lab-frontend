export interface MolarityResult {
  massGrams: number
  moles: number
  instructions: string
}

export function calculateMolarity(params: {
  molarity: number
  volumeL: number
  molarMass: number
}): MolarityResult {
  const { molarity, volumeL, molarMass } = params
  const moles = molarity * volumeL
  const mass = moles * molarMass
  return {
    moles,
    massGrams: Number(mass.toFixed(3)),
    instructions: `Weigh ${mass.toFixed(3)} g of the reagent, dissolve in a small amount of distilled water, then transfer to a volumetric flask and dilute to exactly ${volumeL} L mark.`,
  }
}

export interface DilutionResult {
  volumeStockMl: number
  volumeWaterMl: number
  instructions: string
}

export function calculateDilution(params: {
  stockMolarity: number
  targetMolarity: number
  targetVolumeMl: number
}): DilutionResult {
  const { stockMolarity, targetMolarity, targetVolumeMl } = params
  if (targetMolarity > stockMolarity) {
    throw new Error(
      'Target molarity cannot be higher than stock molarity for dilution.',
    )
  }
  if (stockMolarity <= 0 || targetMolarity < 0 || targetVolumeMl <= 0) {
    throw new Error('Enter positive molarity and volume values.')
  }
  const volumeStock = (targetMolarity * targetVolumeMl) / stockMolarity
  const volumeWater = targetVolumeMl - volumeStock
  return {
    volumeStockMl: Number(volumeStock.toFixed(2)),
    volumeWaterMl: Number(volumeWater.toFixed(2)),
    instructions: `Pipette ${volumeStock.toFixed(2)} mL of the ${stockMolarity} M stock solution into a ${targetVolumeMl} mL volumetric flask. Add distilled water up to the ${targetVolumeMl} mL mark and mix thoroughly.`,
  }
}
