import { nanoid } from 'nanoid';

let caseCounter = 2000;
let eventCounter = 10000;
let customerCounter = 20000;
let paymentCounter = 30000;

export function generateCaseId(): string {
  caseCounter++;
  const rand = Math.floor(10 + Math.random() * 90);
  const time = Date.now().toString().slice(-3);
  return `RC-${caseCounter}${time}${rand}`;
}

export function generateSequentialCaseId(seqNumber: number): string {
  return `RC-${seqNumber}`;
}

export function generateEventId(): string {
  eventCounter++;
  const rand = Math.floor(100 + Math.random() * 900);
  return `EVT-${eventCounter}${rand}`;
}

export function generateCustomerId(): string {
  customerCounter++;
  const rand = Math.floor(100 + Math.random() * 900);
  return `CUS-${customerCounter}${rand}`;
}

export function generatePaymentId(): string {
  paymentCounter++;
  const rand = Math.floor(100 + Math.random() * 900);
  return `PAY-${paymentCounter}${rand}`;
}

export function generateAuditId(): string {
  return `AUD-${nanoid(8)}`;
}

export function generateActivityId(): string {
  return `act-${nanoid(6)}`;
}
