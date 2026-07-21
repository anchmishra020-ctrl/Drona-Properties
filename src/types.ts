/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PropertyStatus = 'Available' | 'Sold' | 'Hold';

export interface Property {
  id: string;
  name: string;
  village: string;
  gataNumber: string;
  area: string;
  price: string;
  status: PropertyStatus;
  googleMapLink?: string;
  pdfData?: string; // Base64 data of PDF (optional)
  pdfName?: string; // Name of PDF file (optional)
  notes?: string;
  createdAt: string;
  createdBy?: string; // Username of user who created the property
}

export interface User {
  username: string;
  role: 'admin';
  fullName?: string;
  designation?: string;
}

export interface UserNote {
  id: string;
  content: string;
  createdAt: string;
}
