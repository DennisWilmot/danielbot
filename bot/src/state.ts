import { Receipt } from "./types.js";

export const pendingReceipts = new Map<number, Receipt>();

export type EditState = { receiptId: string; field: string };
export const editStates = new Map<number, EditState>();

export const pendingTextReceipts = new Map<number, string>();
