import { ESTIMATE_TEMPLATES } from './workbook-data';
import { nonNegative } from './engine';

export type EstimateTemplate = keyof typeof ESTIMATE_TEMPLATES;
export interface EstimateRole { label: string; rate: number; weight: number; discount: number }
export interface EstimateTask { id: string; label: string; hours: number }
export interface EstimatePhase { id: string; label: string; instance: number; tasks: EstimateTask[] }
export interface InstanceExpenses { expert: number; translation: number; court: number; successLumpSum: number }
export interface EstimateInput {
  roles: EstimateRole[];
  phases: EstimatePhase[];
  instances: InstanceExpenses[];
  successPercent: number;
}

export function createEstimate(template: EstimateTemplate): EstimateInput {
  // Eine echte Kopie verhindert Änderungen an der gemeinsamen Referenzvorlage.
  return JSON.parse(JSON.stringify(ESTIMATE_TEMPLATES[template])) as EstimateInput;
}

/**
 * I8 = ROUND(SUM(F*G/100*(100-H)/100), -1). Die Gewichte werden bewusst
 * nicht automatisch normalisiert: 25% und 75% ergeben 387.50, gerundet 390.
 * Die Instanzen werden über Datenfelder aggregiert, nicht über übersetzte „Sum“-Texte.
 */
export function calculateEstimate(input: EstimateInput) {
  nonNegative(input.successPercent, 'Erfolgszuschlag');
  let weightedRate = 0;
  let weightTotal = 0;
  for (const role of input.roles) {
    nonNegative(role.rate, 'Stundensatz');
    nonNegative(role.weight, 'Gewichtung');
    nonNegative(role.discount, 'Nachlass');
    if (role.weight > 100 || role.discount > 100) throw new Error('Gewichtung und Nachlass dürfen maximal 100% sein.');
    weightedRate += role.rate * role.weight / 100 * (100 - role.discount) / 100;
    weightTotal += role.weight;
  }
  const hourlyRate = Math.round(weightedRate / 10) * 10;
  const phases = input.phases.map(phase => {
    if (![1, 2, 3].includes(phase.instance)) throw new Error('Ungültige Instanz.');
    const hours = phase.tasks.reduce((sum, task) => sum + nonNegative(task.hours, 'Stunden'), 0);
    return { ...phase, hours, netTotal: hours * hourlyRate };
  });
  if (input.instances.length !== 3) throw new Error('Die Schätzung benötigt drei Instanzen.');
  const instances = input.instances.map((expenses, index) => {
    for (const amount of Object.values(expenses)) nonNegative(amount, 'Barauslage / Pauschale');
    const hours = phases.filter(phase => phase.instance === index + 1).reduce((sum, phase) => sum + phase.hours, 0);
    const fees = hours * hourlyRate;
    const cash = expenses.expert + expenses.translation + expenses.court;
    const success = fees * input.successPercent / 100 + expenses.successLumpSum;
    return { instance: index + 1, hours, fees, cash, success, total: fees + cash + success };
  });
  const total = instances.reduce((sum, instance) => sum + instance.total, 0);
  if (!Number.isFinite(total)) throw new Error('Die Schätzung ergibt einen zu grossen Betrag.');
  return { hourlyRate, weightTotal, phases, instances, total };
}
