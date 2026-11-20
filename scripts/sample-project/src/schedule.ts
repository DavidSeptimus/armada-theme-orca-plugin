import { addHours, isBefore } from "date-fns";

export type BerthId = 1 | 2 | 3 | 4;

export interface Vessel {
  readonly name: string;
  lengthMeters: number;
  arrival: Date;
  cargo?: "containers" | "bulk" | "passengers";
}

interface Booking {
  vessel: Vessel;
  berth: BerthId;
  until: Date;
}

const TURNAROUND_HOURS = 6;
const MAX_LENGTH: Record<BerthId, number> = { 1: 120, 2: 180, 3: 240, 4: 320 };

/** Assigns each arriving vessel the smallest free berth that fits it. */
export class Schedule {
  private bookings: Booking[] = [];

  constructor(private readonly berths: BerthId[] = [1, 2, 3, 4]) {}

  book(vessel: Vessel): Booking | null {
    const berth = this.berths.find(
      (id) => MAX_LENGTH[id] >= vessel.lengthMeters && this.isFree(id, vessel.arrival),
    );
    if (berth === undefined) return null;

    const booking = { vessel, berth, until: addHours(vessel.arrival, TURNAROUND_HOURS) };
    this.bookings.push(booking);
    return booking;
  }

  private isFree(berth: BerthId, at: Date): boolean {
    return this.bookings.every((b) => b.berth !== berth || isBefore(b.until, at));
  }

  get summary(): string {
    return this.bookings
      .map(({ vessel, berth }) => `${vessel.name} at berth ${berth}`)
      .join(", ");
  }
}

export async function loadVessels(url = "/api/vessels"): Promise<Vessel[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const rows: Array<Omit<Vessel, "arrival"> & { arrival: string }> = await response.json();
  return rows.map((row) => ({ ...row, arrival: new Date(row.arrival) }));
}
